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
  const record = { id: tasks.length + 1, status: 'open', ...task };
  tasks.push(record);
  fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2));
  return record;
}

function listTasks() {
  return readAll().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function setTaskStatus(id, status) {
  const tasks = readAll();
  const task = tasks.find((t) => t.id === Number(id));
  if (!task) return null;
  task.status = status;
  fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2));
  return task;
}

function deleteTask(id) {
  const tasks = readAll();
  const remaining = tasks.filter((t) => t.id !== Number(id));
  if (remaining.length === tasks.length) return false;
  fs.writeFileSync(filePath, JSON.stringify(remaining, null, 2));
  return true;
}

module.exports = { addTask, listTasks, setTaskStatus, deleteTask };
