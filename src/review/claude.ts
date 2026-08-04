import { DiffFile, PRContext, ReviewFinding, ReviewResult, AppConfig } from "../types/index.js";
import { analyzeDiff } from "./engine.js";
import { shouldIgnoreFinding } from "../ignore/loader.js";

export async function reviewWithLLM(
  prContext: PRContext,
  config: AppConfig
): Promise<ReviewResult> {
  const findings = analyzeDiff(prContext.diffFiles);
  const filtered = findings.filter(
    (f) => !shouldIgnoreFinding(f, [])
  );

  const prompt = buildReviewPrompt(prContext, filtered);

  let response: string;
  try {
    response = await callLLM(prompt, config);
  } catch {
    return {
      findings: filtered,
      summary: "Review completed with partial results (LLM call failed).",
      status: "escalated",
      requiresHITL: true,
      costTokens: 0,
    };
  }

  const parsed = parseLLMResponse(response, filtered);
  const hitl = evaluateHITL(parsed.findings, config);

  return {
    findings: parsed.findings,
    summary: parsed.summary,
    status: hitl.requiresHITL ? "escalated" : "approved",
    requiresHITL: hitl.requiresHITL,
    costTokens: estimateTokens(prompt + response),
  };
}

function buildReviewPrompt(pr: PRContext, findings: ReviewFinding[]): string {
  const files = pr.diffFiles
    .map((f) => `File: ${f.filename}\nPatch:\n${f.patch}`)
    .join("\n---\n");

  return `Review the following GitHub PR diff. Categorize each issue as bug, security, or style. Provide actionable suggestions only. Do not produce nitpicks.

Repository: ${pr.repo}
PR #${pr.number}: ${pr.title}
Author: ${pr.author}

Diff:
${files}

Existing findings for context:
${findings.map((f) => `[${f.severity}] ${f.file}:${f.line} — ${f.message}`).join("\n")}

Respond with a JSON object: {"summary": "...", "findings": [{"file": "...", "line": N, "category": "bug|security|style", "severity": "low|medium|high|critical", "message": "...", "suggestion": "..."}]}`;
}

async function callLLM(prompt: string, config: AppConfig): Promise<string> {
  const apiKey = config.llmApiKey;
  const provider = config.llmProvider;
  const model = config.llmModel;

  let url: string;
  let headers: Record<string, string>;
  let body: unknown;

  if (provider === "anthropic") {
    url = "https://api.anthropic.com/v1/messages";
    headers = {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    };
    body = {
      model,
      max_tokens: config.llmMaxTokens,
      messages: [{ role: "user", content: prompt }],
    };
  } else if (provider === "openai") {
    url = "https://api.openai.com/v1/chat/completions";
    headers = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    body = {
      model,
      max_tokens: config.llmMaxTokens,
      messages: [{ role: "user", content: prompt }],
    };
  } else {
    throw new Error(`Unsupported LLM provider: ${provider}`);
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = (await response.json()) as Record<string, unknown>;

  if (provider === "anthropic") {
    return (data.content as Array<{ text: string } | undefined>)?.[0]?.text ?? "";
  }
  return (data.choices as Array<{ message: { content: string } } | undefined>)?.[0]?.message?.content ?? "";
}

function parseLLMResponse(
  response: string,
  fallbackFindings: ReviewFinding[]
): { findings: ReviewFinding[]; summary: string } {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}$/);
    if (!jsonMatch) return { findings: fallbackFindings, summary: response };

    const parsed = JSON.parse(jsonMatch[0]);
    const findings: ReviewFinding[] = (parsed.findings ?? []).map(
      (f: any, i: number) => ({
        id: `llm-${i}`,
        category: f.category ?? "style",
        severity: f.severity ?? "low",
        file: f.file ?? "",
        line: f.line ?? 0,
        message: f.message ?? "",
        suggestion: f.suggestion ?? "",
        confidence: 0.85,
      })
    );

    return { findings, summary: parsed.summary ?? "" };
  } catch {
    return { findings: fallbackFindings, summary: response };
  }
}

function evaluateHITL(
  findings: ReviewFinding[],
  config: AppConfig
): { requiresHITL: boolean; highImpactFindings: ReviewFinding[] } {
  const highImpact = findings.filter(
    (f) =>
      f.severity === "critical" ||
      (f.severity === "high" && f.confidence >= config.hitlConfidenceThreshold)
  );
  return {
    requiresHITL: highImpact.length > 0,
    highImpactFindings: highImpact,
  };
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}