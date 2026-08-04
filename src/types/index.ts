export type ReviewCategory = "bug" | "security" | "style";

export type ReviewSeverity = "low" | "medium" | "high" | "critical";

export type ReviewStatus = "pending" | "approved" | "rejected" | "escalated";

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}

export interface DiffFile {
  filename: string;
  status: "added" | "modified" | "deleted" | "renamed";
  additions: number;
  deletions: number;
  patch: string;
  hunks: DiffHunk[];
}

export interface ReviewFinding {
  id: string;
  category: ReviewCategory;
  severity: ReviewSeverity;
  file: string;
  line: number;
  message: string;
  suggestion: string;
  confidence: number;
}

export interface PRContext {
  id: number;
  number: number;
  title: string;
  body: string;
  repo: string;
  owner: string;
  branch: string;
  baseBranch: string;
  author: string;
  diffFiles: DiffFile[];
}

export interface ReviewResult {
  findings: ReviewFinding[];
  summary: string;
  status: ReviewStatus;
  requiresHITL: boolean;
  costTokens: number;
}

export interface IgnoreRule {
  pattern: string;
  paths?: string[];
  categories?: ReviewCategory[];
}

export interface RepoIgnoreConfig {
  repo: string;
  owner: string;
  rules: IgnoreRule[];
}

export interface WebhookPayload {
  action: string;
  pull_request: PRContext;
  repository: {
    owner: string;
    repo: string;
  };
  sender: {
    login: string;
  };
}

export interface HITLDecision {
  findingId: string;
  action: "approve" | "reject" | "modify";
  reviewer: string;
  reason?: string;
}

export interface AppConfig {
  githubAppId: string;
  webhookSecret: string;
  privateKeyPath: string;
  llmApiKey: string;
  llmProvider: string;
  llmModel: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  databaseUrl: string;
  redisUrl: string;
  port: number;
  frontendUrl: string;
  llmBudgetPerReview: number;
  llmMaxTokens: number;
  hitlConfidenceThreshold: number;
}