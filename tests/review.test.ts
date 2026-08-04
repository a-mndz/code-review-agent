import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyzeDiff } from "../src/review/engine.js";
import { parseDiff } from "../src/utils/diffParser.js";
import { shouldIgnoreFinding } from "../src/ignore/loader.js";
import { evaluateHITL } from "../src/hitl/gate.js";
import { verifyGitHubSignature } from "../src/utils/signature.js";
import { loadConfig } from "../src/config/index.js";

describe("diff parser", () => {
  it("parses a simple diff with one file", () => {
    const patch = `diff --git a/src/index.ts b/src/index.ts\n--- a/src/index.ts\n+++ b/src/index.ts\n@@ -1,3 +1,4 @@\n const x = 1;\n+const y = 2;\n return x;\n`;
    const files = parseDiff(patch);
    assert.equal(files.length, 1);
    assert.equal(files[0].filename, "src/index.ts");
    assert.equal(files[0].status, "modified");
  });
});

describe("review engine", () => {
  it("detects eval() as security issue", () => {
    const files = parseDiff(
      `diff --git a/src/index.ts b/src/index.ts\n--- a/src/index.ts\n+++ b/src/index.ts\n@@ -1,3 +1,4 @@\n+eval(userInput);\n return x;\n`
    );
    const findings = analyzeDiff(files);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].category, "security");
  });

  it("detects hardcoded secret as security issue", () => {
    const files = parseDiff(
      `diff --git a/src/config.ts b/src/config.ts\n--- a/src/config.ts\n+++ b/src/config.ts\n@@ -1,3 +1,4 @@\n+const apiKey = "sk-live-12345";\n return config;\n`
    );
    const findings = analyzeDiff(files);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].category, "security");
  });

  it("detects console.log as style issue", () => {
    const files = parseDiff(
      `diff --git a/src/index.ts b/src/index.ts\n--- a/src/index.ts\n+++ b/src/index.ts\n@@ -1,3 +1,4 @@\n+console.log("debug");\n return x;\n`
    );
    const findings = analyzeDiff(files);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].category, "style");
  });

  it("detects == as bug", () => {
    const files = parseDiff(
      `diff --git a/src/index.ts b/src/index.ts\n--- a/src/index.ts\n+++ b/src/index.ts\n@@ -1,3 +1,4 @@\n+if (a == b) {}\n return x;\n`
    );
    const findings = analyzeDiff(files);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].category, "bug");
  });
});

describe("ignore list", () => {
  it("matches ignore rule by path", () => {
    const rules = [{ pattern: "test", paths: ["test/"], categories: ["style"] }];
    assert.equal(shouldIgnoreFinding({ file: "test/foo.ts", category: "style" } as any, rules), true);
    assert.equal(shouldIgnoreFinding({ file: "src/app.ts", category: "style" } as any, rules), false);
  });
});

describe("HITL gate", () => {
  it("requires HITL for critical findings", () => {
    const findings = [
      { id: "1", category: "security", severity: "critical" as const, file: "a.ts", line: 1, message: "", suggestion: "", confidence: 0.9 },
    ];
    const result = evaluateHITL(findings, { hitlConfidenceThreshold: 0.85 } as any);
    assert.equal(result.requiresHITL, true);
  });

  it("does not require HITL for low findings", () => {
    const findings = [
      { id: "1", category: "style", severity: "low" as const, file: "a.ts", line: 1, message: "", suggestion: "", confidence: 0.5 },
    ];
    const result = evaluateHITL(findings, { hitlConfidenceThreshold: 0.85 } as any);
    assert.equal(result.requiresHITL, false);
  });
});

describe("webhook signature", () => {
  it("rejects missing signature", () => {
    assert.equal(verifyGitHubSignature("body", "", "secret"), false);
  });
});

describe("config", () => {
  it("throws on missing required env vars", () => {
    const orig = process.env.GITHUB_APP_ID;
    delete process.env.GITHUB_APP_ID;
    try {
      assert.throws(() => loadConfig(), /Missing required env var/);
    } finally {
      process.env.GITHUB_APP_ID = orig;
    }
  });
});