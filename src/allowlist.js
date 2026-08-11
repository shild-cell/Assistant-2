const config = require('./config');

function normalize(number) {
  return (number || '').replace(/[\s()-]/g, '');
}

function isAllowed(fromNumber) {
  if (config.allowedSenders.length === 0) return false;
  const normalized = normalize(fromNumber);
  return config.allowedSenders.some((allowed) => normalize(allowed) === normalized);
}

module.exports = { isAllowed };
