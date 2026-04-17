const { TargetAccount, ParserAccount } = require('../models/account.model');

// ===== TARGET ACCOUNTS =====
const getTargets = async (req, res) => {
  const accounts = await TargetAccount.findAll({ order: [['createdAt', 'DESC']] });
  res.json({ accounts });
};

const createTarget = async (req, res) => {
  try {
    const { username, url } = req.body;
    if (!username) return res.status(400).json({ error: 'Username керек' });
    const account = await TargetAccount.create({ username, url });
    res.status(201).json({ account });
  } catch (error) {
    res.status(500).json({ error: 'Аккаунт түзүүдө ката' });
  }
};

const toggleTarget = async (req, res) => {
  try {
    const account = await TargetAccount.findByPk(req.params.id);
    if (!account) return res.status(404).json({ error: 'Табылган жок' });
    await account.update({ is_active: !account.is_active });
    res.json({ account });
  } catch (error) {
    res.status(500).json({ error: 'Ката' });
  }
};

const deleteTarget = async (req, res) => {
  try {
    const account = await TargetAccount.findByPk(req.params.id);
    if (!account) return res.status(404).json({ error: 'Табылган жок' });
    await account.destroy();
    res.json({ message: 'Өчүрүлдү' });
  } catch (error) {
    res.status(500).json({ error: 'Ката' });
  }
};

// ===== PARSER ACCOUNTS =====
const getParsers = async (req, res) => {
  const accounts = await ParserAccount.findAll({
    attributes: { exclude: ['password'] },
    order: [['createdAt', 'DESC']],
  });
  const result = accounts.map(a => {
    const json = a.toJSON();
    json.has_cookies = !!json.cookies;
    delete json.cookies;
    return json;
  });
  res.json({ accounts: result });
};

const createParser = async (req, res) => {
  try {
    const { login, password, proxy } = req.body;
    if (!login) return res.status(400).json({ error: 'Login керек' });
    const account = await ParserAccount.create({ login, password: password || '', proxy });
    const safe = account.toJSON();
    delete safe.password;
    res.status(201).json({ account: safe });
  } catch (error) {
    res.status(500).json({ error: 'Parser аккаунт түзүүдө ката' });
  }
};

const deleteParser = async (req, res) => {
  try {
    const account = await ParserAccount.findByPk(req.params.id);
    if (!account) return res.status(404).json({ error: 'Табылган жок' });
    await account.destroy();
    res.json({ message: 'Өчүрүлдү' });
  } catch (error) {
    res.status(500).json({ error: 'Ката' });
  }
};

const updateParserStatus = async (req, res) => {
  try {
    const account = await ParserAccount.findByPk(req.params.id);
    if (!account) return res.status(404).json({ error: 'Табылган жок' });
    await account.update({ status: req.body.status, last_used: new Date() });
    res.json({ account });
  } catch (error) {
    res.status(500).json({ error: 'Ката' });
  }
};

const uploadCookies = async (req, res) => {
  try {
    const account = await ParserAccount.findByPk(req.params.id);
    if (!account) return res.status(404).json({ error: 'Табылган жок' });
    const { cookies } = req.body;
    if (!cookies) return res.status(400).json({ error: 'Cookies керек' });
    await account.update({ cookies: typeof cookies === 'string' ? cookies : JSON.stringify(cookies) });
    res.json({ message: 'Cookie сакталды' });
  } catch (error) {
    res.status(500).json({ error: 'Cookie сактоодо ката' });
  }
};

const getParserWithCookies = async (req, res) => {
  try {
    const account = await ParserAccount.findByPk(req.params.id);
    if (!account) return res.status(404).json({ error: 'Табылган жок' });
    res.json({ cookies: account.cookies ? JSON.parse(account.cookies) : null });
  } catch (error) {
    res.status(500).json({ error: 'Ката' });
  }
};

module.exports = {
  getTargets, createTarget, toggleTarget, deleteTarget,
  getParsers, createParser, deleteParser, updateParserStatus,
  uploadCookies, getParserWithCookies,
};
