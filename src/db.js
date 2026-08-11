const fs = require('fs');
const path = require('path');
const config = require('./config');

const filePath = path.join(config.dataDir, 'tasks.json');

function ensureStore() {
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]');
  }
}

function readAll() {
  ensureStore();
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function addTask(task) {
  ensureStore();
  const tasks = readAll();
  const record = { id: tasks.length + 1, ...task };
  tasks.push(record);
  fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2));
  return record;
}

function listTasks() {
  return readAll().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

module.exports = { addTask, listTasks };
