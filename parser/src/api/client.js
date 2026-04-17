const axios = require('axios');

const client = axios.create({
  baseURL: process.env.BACKEND_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    // Internal parser token (backend .env да коюлат)
    'X-Parser-Token': process.env.PARSER_SECRET || 'parser_internal_secret',
  },
});

async function sendPosts(posts) {
  // Posts batch send (backend POST /api/posts уландысы)
}

async function sendComments(comments) {
  if (!comments || comments.length === 0) return;
  const { data } = await client.post('/comments/bulk', { comments });
  return data;
}

async function getActiveTargets() {
  const { data } = await client.get('/parser/targets');
  return (data.accounts || []).filter((a) => a.is_active);
}

async function getIdleParser() {
  const { data } = await client.get('/parser/parsers');
  return (data.accounts || []).find((a) => a.status === 'idle');
}

async function getAllIdleParsers() {
  const { data } = await client.get('/parser/parsers');
  return (data.accounts || []).filter((a) => a.status === 'idle' && a.cookies);
}

async function updateParserStatus(id, status) {
  await client.patch(`/parser/parsers/${id}/status`, { status }).catch(() => {});
}

async function getSettings() {
  const { data } = await client.get('/parser/settings');
  return data.settings || {};
}

async function getParserCookies(parserId) {
  const { data } = await client.get(`/parser/parsers/${parserId}/cookies`);
  return data.cookies || null;
}

module.exports = {
  sendComments,
  getActiveTargets,
  getIdleParser,
  getAllIdleParsers,
  updateParserStatus,
  getParserCookies,
  getSettings,
};
