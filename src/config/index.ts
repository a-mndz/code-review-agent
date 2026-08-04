import dotenv from "dotenv";
import { AppConfig } from "../types/index.js";

dotenv.config();

function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return val;
}

export function loadConfig(): AppConfig {
  return {
    githubAppId: getEnv("GITHUB_APP_ID"),
    webhookSecret: getEnv("GITHUB_WEBHOOK_SECRET"),
    privateKeyPath: getEnv("GITHUB_PRIVATE_KEY_PATH"),
    llmApiKey: getEnv("LLM_API_KEY"),
    llmProvider: process.env.LLM_PROVIDER ?? "anthropic",
    llmModel: process.env.LLM_MODEL ?? "claude-3-5-sonnet-20241022",
    stripeSecretKey: getEnv("STRIPE_SECRET_KEY"),
    stripeWebhookSecret: getEnv("STRIPE_WEBHOOK_SECRET"),
    databaseUrl: getEnv("DATABASE_URL"),
    redisUrl: getEnv("REDIS_URL"),
    port: parseInt(process.env.PORT ?? "3000", 10),
    frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
    llmBudgetPerReview: parseFloat(process.env.LLM_BUDGET_PER_REVIEW ?? "0.05"),
    llmMaxTokens: parseInt(process.env.LLM_MAX_TOKENS ?? "4096", 10),
    hitlConfidenceThreshold: parseFloat(
      process.env.HITL_CONFIDENCE_THRESHOLD ?? "0.85"
    ),
  };
}