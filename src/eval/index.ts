import { ReviewFinding } from "../types/index.js";
import { parseDiff } from "../utils/diffParser.js";

export interface GoldenCase {
  id: string;
  prNumber: number;
  repo: string;
  diff: string;
  expectedFindings: Array<{
    category: string;
    severity: string;
    file: string;
    line: number;
  }>;
}

export function loadGoldenCases(): GoldenCase[] {
  const cases: GoldenCase[] = [
    {
      id: "golden-001",
      prNumber: 1,
      repo: "test/repo",
      diff: `diff --git a/src/auth.ts b/src/auth.ts\n--- a/src/auth.ts\n+++ b/src/auth.ts\n@@ -1,3 +1,4 @@\n+eval(userInput);\n module.exports = {};\n`,
      expectedFindings: [
        { category: "security", severity: "critical", file: "src/auth.ts", line: 2 },
      ],
    },
    {
      id: "golden-002",
      prNumber: 2,
      repo: "test/repo",
      diff: `diff --git a/src/utils.ts b/src/utils.ts\n--- a/src/utils.ts\n+++ b/src/utils.ts\n@@ -1,3 +1,4 @@\n+console.log("debug");\n return helper;\n`,
      expectedFindings: [
        { category: "style", severity: "low", file: "src/utils.ts", line: 2 },
      ],
    },
    {
      id: "golden-003",
      prNumber: 3,
      repo: "test/repo",
      diff: `diff --git a/src/config.ts b/src/config.ts\n--- a/src/config.ts\n+++ b/src/config.ts\n@@ -1,3 +1,4 @@\n+const apiKey = "sk-live-12345";\n export const config = {};\n`,
      expectedFindings: [
        { category: "security", severity: "critical", file: "src/config.ts", line: 2 },
      ],
    },
  ];
  return cases;
}

export function runEval(
  reviewFn: (diffFiles: { filename: string; status: string; additions: number; deletions: number; patch: string; hunks: Array<{ oldStart: number; oldLines: number; newStart: number; newLines: number; lines: string[] }> }[]) => ReviewFinding[]
): { passRate: number; falsePositiveRate: number; totalCases: number } {
  const cases = loadGoldenCases();
  let passed = 0;
  let falsePositives = 0;
  let totalFindings = 0;

  for (const testCase of cases) {
    const files = parseDiff(testCase.diff);
    const findings = reviewFn(files);
    totalFindings += findings.length;

    const hasExpected = testCase.expectedFindings.every((expected) =>
      findings.some(
        (f) =>
          f.category === expected.category &&
          f.file === expected.file &&
          f.line === expected.line
      )
    );

    if (hasExpected) {
      passed++;
    }

    const extraFindings = findings.filter(
      (f) =>
        !testCase.expectedFindings.some(
          (e) => e.category === f.category && e.file === f.file && e.line === f.line
        )
    );
    falsePositives += extraFindings.length;
  }

  return {
    passRate: cases.length > 0 ? passed / cases.length : 0,
    falsePositiveRate: totalFindings > 0 ? falsePositives / totalFindings : 0,
    totalCases: cases.length,
  };
}