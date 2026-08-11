function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderDashboard(tasks) {
  const rows = tasks
    .map(
      (t) => `
      <tr>
        <td>${escapeHtml(new Date(t.createdAt).toLocaleString())}</td>
        <td>${escapeHtml(t.title)}</td>
        <td>${escapeHtml(t.source)}</td>
        <td>${escapeHtml(t.from)}</td>
        <td>${escapeHtml(t.transcript)}</td>
      </tr>`
    )
    .join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>TaskFlow Dashboard</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; background: #0b0e14; color: #e6e6e6; }
    h1 { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #2a2f3a; vertical-align: top; }
    th { color: #9aa4b2; font-weight: 500; }
    tr:hover { background: #131722; }
  </style>
</head>
<body>
  <h1>TaskFlow — ${tasks.length} note${tasks.length === 1 ? '' : 's'}</h1>
  <table>
    <thead><tr><th>When</th><th>Title</th><th>Source</th><th>From</th><th>Transcript</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5">No notes yet — call or text your number.</td></tr>'}</tbody>
  </table>
</body>
</html>`;
}

module.exports = { renderDashboard };
