export function renderDashboard(prs: Array<{ number: number; title: string; status: string; findings: number; requiresHITL: boolean }>): string {
  const rows = prs
    .map(
      (pr) =>
        `<tr>
          <td>${pr.number}</td>
          <td>${escapeHtml(pr.title)}</td>
          <td>${pr.status}</td>
          <td>${pr.findings}</td>
          <td>${pr.requiresHITL ? "HITL" : "auto"}</td>
          <td><button data-action="approve" data-pr="${pr.number}">Approve</button> <button data-action="reject" data-pr="${pr.number}">Reject</button></td>
        </tr>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>5-ai-code-review-agent</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; background: #f5f5f5; }
    h1 { color: #1a1a1a; }
    table { border-collapse: collapse; width: 100%; background: white; border-radius: 8px; overflow: hidden; }
    th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e0e0e0; }
    th { background: #1a1a1a; color: white; }
    button { padding: 0.25rem 0.75rem; border: none; border-radius: 4px; cursor: pointer; margin-right: 0.25rem; }
    button[data-action="approve"] { background: #22c55e; color: white; }
    button[data-action="reject"] { background: #ef4444; color: white; }
  </style>
</head>
<body>
  <h1>PR Review Queue</h1>
  <table>
    <thead><tr><th>#</th><th>Title</th><th>Status</th><th>Findings</th><th>Gate</th><th>Actions</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <script>
    document.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", async () => {
        const pr = btn.dataset.pr;
        const action = btn.dataset.action;
        await fetch("/api/pr/" + pr + "/" + action, { method: "POST" });
        location.reload();
      });
    });
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}