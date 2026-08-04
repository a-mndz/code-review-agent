import crypto from "crypto";
import { Request, Response } from "express";
import { AppConfig } from "../types/index.js";
import { verifyGitHubSignature } from "../utils/signature.js";
import { parseDiff } from "../utils/diffParser.js";
import { reviewWithLLM } from "../review/claude.js";
import { postReviewComment } from "./postComment.js";

export function createWebhookHandler(config: AppConfig) {
  return async function handleWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers["x-hub-signature-256"] as string | undefined;
    const payload = JSON.stringify(req.body);

    if (!signature) {
      res.status(401).json({ error: "Missing signature" });
      return;
    }

    const verified = verifyGitHubSignature(payload, signature, config.webhookSecret);
    if (!verified) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    const eventType = req.headers["x-github-event"] as string | undefined;

    if (eventType === "pull_request") {
      const action = (req.body as { action?: string }).action;
      if (action === "opened" || action === "synchronize") {
        const pr = (req.body as { pull_request?: any }).pull_request;
        const repo = (req.body as { repository?: any }).repository;
        const diffFiles = parseDiff("");
        const prContext = {
          id: pr?.id ?? 0,
          number: pr?.number ?? 0,
          title: pr?.title ?? "",
          body: pr?.body ?? "",
          repo: repo?.name ?? "",
          owner: repo?.owner?.login ?? "",
          branch: pr?.head?.ref ?? "",
          baseBranch: pr?.base?.ref ?? "",
          author: pr?.user?.login ?? "",
          diffFiles,
        };

        res.status(202).json({ received: true, event: eventType, processing: true });

        try {
          const result = await reviewWithLLM(prContext, config);
          await postReviewComment(prContext.owner, prContext.repo, prContext.number, result, config);
        } catch {
          console.error(`Review failed for PR #${prContext.number}`);
        }
        return;
      }
    }

    res.status(200).json({ received: true, event: eventType ?? "unknown" });
  };
}