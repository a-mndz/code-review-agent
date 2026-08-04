import { DiffFile } from "../types/index.js";

export function parseDiff(patch: string): DiffFile[] {
  const files: DiffFile[] = [];
  let currentFile: DiffFile | null = null;
  let currentHunk: { oldStart: number; oldLines: number; newStart: number; newLines: number; lines: string[] } | null = null;

  const lines = patch.split("\n");

  for (const line of lines) {
    const fileMatch = line.match(/^diff --git a\/(.+) b\/(.+)/);
    if (fileMatch) {
      if (currentFile) {
        files.push(currentFile);
      }
      currentFile = {
        filename: fileMatch[2],
        status: "modified",
        additions: 0,
        deletions: 0,
        patch: "",
        hunks: [],
      };
      currentHunk = null;
      continue;
    }

    const statusMatch = line.match(/^new file mode/);
    if (statusMatch && currentFile) {
      currentFile.status = "added";
      continue;
    }
    const delMatch = line.match(/^deleted file mode/);
    if (delMatch && currentFile) {
      currentFile.status = "deleted";
      continue;
    }
    const renameMatch = line.match(/^rename from (.+)/);
    if (renameMatch && currentFile) {
      currentFile.status = "renamed";
      continue;
    }

    if (!currentFile) continue;

    currentFile.patch += line + "\n";

    const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    if (hunkMatch) {
      if (currentHunk && currentFile) {
        currentFile.hunks.push(currentHunk);
      }
      currentHunk = {
        oldStart: parseInt(hunkMatch[1], 10),
        oldLines: parseInt(hunkMatch[2] ?? "1", 10),
        newStart: parseInt(hunkMatch[3], 10),
        newLines: parseInt(hunkMatch[4] ?? "1", 10),
        lines: [],
      };
      continue;
    }

    if (currentHunk) {
      currentHunk.lines.push(line);
      if (line.startsWith("+")) currentFile.additions++;
      if (line.startsWith("-")) currentFile.deletions++;
    }
  }

  if (currentHunk && currentFile) {
    currentFile.hunks.push(currentHunk);
  }
  if (currentFile) {
    files.push(currentFile);
  }

  return files;
}