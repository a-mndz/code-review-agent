import { Octokit } from "@octokit/rest";
import { ReviewResult, AppConfig } from "../types/index.js";

export async function postReviewComment(
  owner: string,
  repo: string,
  prNumber: number,
  result: ReviewResult,
  config: AppConfig
): Promise<void> {
  const token = config.githubAppId;
  const octokit = new Octokit({ auth: token });

  const body = formatReviewBody(result);

  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body,
  });
}

function formatReviewBody(result: ReviewResult): string {
  const findings = result.findings
    .map(
      (f) =>
        `### [${f.severity.toUpperCase()}] ${f.category}: \`${f.file}:${f.line}\`\n\n${f.message}\n\n**Suggestion:** ${f.suggestion}`
    )
    .join("\n\n---\n\n");

  return `## AI Code Review\n\n${result.summary}\n\n${findings}\n\n---\n_Automated review by 5-ai-code-review-agent_`;
}