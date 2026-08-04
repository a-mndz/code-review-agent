import { DiffFile, ReviewFinding, ReviewCategory, ReviewSeverity, PRContext } from "../types/index.js";

const SEVERITY_MAP: Record<string, ReviewSeverity> = {
  security: "critical",
  bug: "high",
  style: "low",
};

function classifyLine(line: string): { category: ReviewCategory; message: string } | null {
  const trimmed = line.trim();

  if (trimmed.match(/eval\s*\(/i) && !trimmed.match(/===/)) {
    return { category: "security", message: "Use of eval() introduces code injection risk" };
  }
  if (trimmed.match(/innerHTML\s*=/i)) {
    return { category: "security", message: "innerHTML assignment is vulnerable to XSS" };
  }
  if (trimmed.match(/document\.write\s*\(/i)) {
    return { category: "security", message: "document.write() is a XSS vector" };
  }
  if (trimmed.match(/(password|secret|token|api[_-]?key|apikey)\s*[:=]\s*['"]/i)) {
    return { category: "security", message: "Hardcoded secret detected" };
  }
  if (trimmed.match(/console\.(log|debug|info)\s*\(/i)) {
    return { category: "style", message: "Remove console.log before merging" };
  }
  if (trimmed.match(/TODO|FIXME|HACK|XXX/i)) {
    return { category: "style", message: "Unresolved TODO/FIXME marker found" };
  }
  if (trimmed.match(/var\s+/i)) {
    return { category: "style", message: "Use let/const instead of var" };
  }
  if (trimmed.match(/==\s*[^=]|!=\s*[^=]/)) {
    return { category: "bug", message: "Use ===/!== for strict equality comparison" };
  }
  if (trimmed.match(/catch\s*\(\s*\)/) || trimmed.match(/catch\s*\(\s*\w+\s*\)\s*\{\s*$/)) {
    return { category: "bug", message: "Empty catch block silently swallows errors" };
  }

  return null;
}

export function analyzeDiff(diffFiles: DiffFile[]): ReviewFinding[] {
  const findings: ReviewFinding[] = [];
  let findingId = 0;

  for (const file of diffFiles) {
    for (const line of file.patch.split("\n")) {
      if (!line.startsWith("+") || line.startsWith("+++")) continue;

      const classification = classifyLine(line);
      if (!classification) continue;

      const lineNumber = extractLineFromPatch(line, file.patch);
      findings.push({
        id: `finding-${findingId++}`,
        category: classification.category,
        severity: SEVERITY_MAP[classification.category],
        file: file.filename,
        line: lineNumber,
        message: classification.message,
        suggestion: generateSuggestion(classification.category, classification.message),
        confidence: 0.9,
      });
    }
  }

  return findings;
}

function extractLineFromPatch(line: string, fullPatch: string): number {
  const match = line.match(/^\+@@\s*-\d+(?:,\d+)?\s*\+(\d+)/);
  if (match) return parseInt(match[1], 10);
  return 0;
}

function generateSuggestion(category: ReviewCategory, message: string): string {
  const suggestions: Record<ReviewCategory, string> = {
    security: "Replace with a safe alternative or add input validation/sanitization.",
    bug: "Fix the logic error and add a test case covering this scenario.",
    style: "Refactor to follow the project's style guide and conventions.",
  };
  return suggestions[category];
}