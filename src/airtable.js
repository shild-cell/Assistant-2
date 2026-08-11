const Airtable = require('airtable');
const config = require('./config');

let table = null;
if (config.airtable.enabled) {
  const base = new Airtable({ apiKey: config.airtable.apiKey }).base(config.airtable.baseId);
  table = base(config.airtable.tableName);
}

async function logTask(task) {
  if (!table) return;
  await table.create([
    {
      fields: {
        Title: task.title,
        Transcript: task.transcript,
        Source: task.source,
        From: task.from,
        CreatedAt: task.createdAt,
      },
    },
  ]);
}

module.exports = { logTask };
