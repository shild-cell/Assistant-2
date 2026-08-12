const express = require('express');
const config = require('./src/config');
const webhooks = require('./src/routes/webhooks');
const { listTasks, setTaskStatus, deleteTask } = require('./src/db');
const { renderDashboard } = require('./src/dashboard');

const app = express();
app.set('trust proxy', true);
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => res.send('TaskFlow is running.'));

app.use('/webhooks', webhooks);

function requireDashboardAuth(req, res, next) {
  if (!config.dashboard.password) return next();

  const authHeader = req.header('Authorization') || '';
  const [, encoded] = authHeader.split(' ');
  const decoded = encoded ? Buffer.from(encoded, 'base64').toString('utf8') : '';
  const [user, pass] = decoded.split(':');

  if (user === config.dashboard.user && pass === config.dashboard.password) {
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="TaskFlow Dashboard"');
  res.status(401).send('Authentication required');
}

app.get('/dashboard', requireDashboardAuth, (req, res) => {
  res.send(renderDashboard(listTasks()));
});

app.post('/dashboard/tasks/:id/complete', requireDashboardAuth, (req, res) => {
  setTaskStatus(req.params.id, 'done');
  res.redirect('/dashboard');
});

app.post('/dashboard/tasks/:id/reopen', requireDashboardAuth, (req, res) => {
  setTaskStatus(req.params.id, 'open');
  res.redirect('/dashboard');
});

app.post('/dashboard/tasks/:id/delete', requireDashboardAuth, (req, res) => {
  deleteTask(req.params.id);
  res.redirect('/dashboard');
});

app.listen(config.port, () => {
  console.log(`TaskFlow listening on port ${config.port}`);
});
