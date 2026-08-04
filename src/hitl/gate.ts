import { ReviewFinding, ReviewStatus, HITLDecision, AppConfig } from "../types/index.js";

export function evaluateHITL(
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

export function applyHITLDecision(
  findings: ReviewFinding[],
  decision: HITLDecision
): ReviewFinding[] {
  return findings.map((f) => {
    if (f.id !== decision.findingId) return f;

    if (decision.action === "approve") {
      return { ...f, severity: "low" as const };
    }
    if (decision.action === "reject") {
      return { ...f, severity: "critical" as const };
    }
    return f;
  });
}