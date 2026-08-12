const config = require('./config');

const CATEGORY_COLORS = {
  task: '#3b82f6',
  reminder: '#a855f7',
  call: '#10b981',
  shopping: '#f59e0b',
  appointment: '#ef4444',
  idea: '#06b6d4',
  other: '#6b7280',
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function todayInTz() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: config.timezone }).format(new Date());
}

function dueDateInfo(dueDate) {
  if (!dueDate) return { label: '—', className: '' };

  const today = todayInTz();
  const datePart = dueDate.slice(0, 10);
  const label = new Date(dueDate.length > 10 ? dueDate : `${dueDate}T00:00`).toLocaleString(
    undefined,
    dueDate.length > 10
      ? { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
      : { month: 'short', day: 'numeric' }
  );

  if (datePart < today) return { label, className: 'overdue' };
  if (datePart === today) return { label, className: 'due-today' };
  return { label, className: 'due-future' };
}

function orderForDisplay(tasks) {
  const open = tasks.filter((t) => t.status !== 'done');
  const done = tasks.filter((t) => t.status === 'done');

  const openWithDue = open.filter((t) => t.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const openWithoutDue = open
    .filter((t) => !t.dueDate)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const doneSorted = done.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return [...openWithDue, ...openWithoutDue, ...doneSorted];
}

function renderDashboard(tasks) {
  const openCount = tasks.filter((t) => t.status !== 'done').length;
  const ordered = orderForDisplay(tasks);

  const rows = ordered
    .map((t) => {
      const done = t.status === 'done';
      const category = t.category || 'other';
      const due = dueDateInfo(t.dueDate);
      return `
      <tr class="${done ? 'done' : ''}">
        <td>
          <form method="post" action="/dashboard/tasks/${t.id}/${done ? 'reopen' : 'complete'}">
            <button type="submit" class="check" title="${done ? 'Mark open' : 'Mark done'}">${done ? '☑' : '☐'}</button>
          </form>
        </td>
        <td>${escapeHtml(new Date(t.createdAt).toLocaleString())}</td>
        <td>${escapeHtml(t.title)}</td>
        <td><span class="badge" style="background:${CATEGORY_COLORS[category] || CATEGORY_COLORS.other}">${escapeHtml(category)}</span></td>
        <td class="${due.className}">${escapeHtml(due.label)}</td>
        <td>${escapeHtml(t.source)}</td>
        <td>${escapeHtml(t.from)}</td>
        <td>${escapeHtml(t.transcript)}</td>
        <td>
          <form method="post" action="/dashboard/tasks/${t.id}/delete" onsubmit="return confirm('Delete this task?');">
            <button type="submit" class="delete" title="Delete">✕</button>
          </form>
        </td>
      </tr>`;
    })
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
    tr.done td { color: #5b6370; text-decoration: line-through; }
    tr.done .check, tr.done .delete, tr.done .badge { text-decoration: none; }
    form { margin: 0; display: inline; }
    button.check, button.delete {
      background: none; border: none; cursor: pointer; font-size: 1.1rem; color: inherit; padding: 0;
    }
    button.delete { color: #c0524a; }
    .badge {
      display: inline-block; padding: 0.15rem 0.5rem; border-radius: 999px;
      font-size: 0.75rem; color: #0b0e14; font-weight: 600;
    }
    .overdue { color: #f87171; font-weight: 600; }
    .due-today { color: #fbbf24; font-weight: 600; }
    .due-future { color: #9aa4b2; }
  </style>
</head>
<body>
  <h1>TaskFlow — ${openCount} open, ${tasks.length} total</h1>
  <table>
    <thead><tr><th></th><th>When</th><th>Title</th><th>Category</th><th>Due</th><th>Source</th><th>From</th><th>Transcript</th><th></th></tr></thead>
    <tbody>${rows || '<tr><td colspan="9">No notes yet — call or text your number.</td></tr>'}</tbody>
  </table>
</body>
</html>`;
}

module.exports = { renderDashboard };
