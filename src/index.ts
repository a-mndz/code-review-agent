import express from "express";
import cors from "cors";
import { loadConfig } from "./config/index.js";
import { createWebhookHandler } from "./webhook/handler.js";
import { renderDashboard } from "./dashboard/index.js";

const config = loadConfig();
const app = express();

app.use(cors());
app.use(express.json({ verify: (_req, _res, buf) => {
  (_req as any).rawBody = buf;
}}));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (_req, res) => {
  res.send(renderDashboard([]));
});

app.post("/webhook", createWebhookHandler(config));

app.listen(config.port, () => {
  console.log(`5-ai-code-review-agent listening on port ${config.port}`);
});