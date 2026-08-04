import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { RepoIgnoreConfig, IgnoreRule } from "../types/index.js";

export function loadIgnoreConfig(repoPath: string): RepoIgnoreConfig | null {
  const configPath = path.join(repoPath, ".codereview.yml");
  if (!fs.existsSync(configPath)) return null;

  const raw = fs.readFileSync(configPath, "utf-8");
  const parsed = yaml.load(raw) as { ignore?: IgnoreRule[] };

  if (!parsed.ignore || !Array.isArray(parsed.ignore)) {
    return null;
  }

  return {
    repo: path.basename(repoPath),
    owner: "",
    rules: parsed.ignore,
  };
}

export function shouldIgnoreFinding(
  finding: { file: string; category: string },
  rules: IgnoreRule[]
): boolean {
  return rules.some((rule) => {
    const pathMatch = !rule.paths || rule.paths.some((p) =>
      finding.file.includes(p)
    );
    const categoryMatch =
      !rule.categories || rule.categories.includes(finding.category as any);
    const patternMatch = rule.pattern
      ? new RegExp(rule.pattern).test(finding.file)
      : true;

    return pathMatch && categoryMatch && patternMatch;
  });
}