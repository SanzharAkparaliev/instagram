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

// Instagram login via HTTP
const instagramLogin = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const account = await ParserAccount.findByPk(id);
    if (!account) return res.status(404).json({ error: 'Аккаунт табылган жок' });
    if (!password) return res.status(400).json({ error: 'Пароль керек' });

    const username = account.login;

    // 1. Instagram'дан csrftoken алуу
    const initRes = await fetch('https://www.instagram.com/accounts/login/', {
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    const initSetCookies = initRes.headers.getSetCookie() || [];
    let csrftoken = '';
    let mid = '';
    const initCookieParts = [];

    // Set-Cookie header'лерден csrftoken алуу
    initSetCookies.forEach(c => {
      const m1 = c.match(/csrftoken=([^;]+)/);
      const m2 = c.match(/mid=([^;]+)/);
      if (m1) csrftoken = m1[1];
      if (m2) mid = m2[1];
      const nameVal = c.split(';')[0];
      initCookieParts.push(nameVal);
    });

    // Эгер cookie'лерден табылбаса, HTML'ден csrftoken издөө
    if (!csrftoken) {
      const html = await initRes.text();
      const csrfMatch = html.match(/"csrf_token":"([^"]+)"/);
      if (csrfMatch) csrftoken = csrfMatch[1];
    }

    if (!csrftoken) {
      console.error('Instagram init response:', initRes.status, 'set-cookie count:', initSetCookies.length);
      return res.status(500).json({ error: 'Instagram\'га туташуу ишке ашкан жок' });
    }

    // 2. Login сурам
    const cookieHeader = `csrftoken=${csrftoken}; mid=${mid}`;
    const ts = Math.floor(Date.now() / 1000);

    const loginRes = await fetch('https://www.instagram.com/accounts/login/ajax/', {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'X-CSRFToken': csrftoken,
        'X-Requested-With': 'XMLHttpRequest',
        'X-Instagram-AJAX': '1',
        'Referer': 'https://www.instagram.com/accounts/login/',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookieHeader,
      },
      body: `username=${encodeURIComponent(username)}&enc_password=#PWD_INSTAGRAM_BROWSER:0:${ts}:${password}&queryParams={}&optIntoOneTap=false`,
    });

    const loginData = await loginRes.json();

    if (!loginData.authenticated) {
      return res.status(401).json({ error: loginData.message || 'Логин же пароль туура эмес' });
    }

    // 3. Cookie'лерди алуу
    const loginSetCookies = loginRes.headers.getSetCookie() || [];
    const cookies = [];

    [...initSetCookies, ...loginSetCookies].forEach(cookieStr => {
      const mainPart = cookieStr.split(';')[0];
      const eqIdx = mainPart.indexOf('=');
      if (eqIdx === -1) return;
      const name = mainPart.substring(0, eqIdx).trim();
      const value = mainPart.substring(eqIdx + 1).trim();
      if (!name || !value || value === '""') return;

      const existing = cookies.findIndex(c => c.name === name);
      const cookie = {
        name,
        value,
        domain: '.instagram.com',
        path: '/',
        secure: true,
        httpOnly: ['sessionid', 'mid', 'ig_did'].includes(name),
      };
      if (existing >= 0) cookies[existing] = cookie;
      else cookies.push(cookie);
    });

    const sessionid = cookies.find(c => c.name === 'sessionid');
    if (!sessionid) return res.status(500).json({ error: 'Cookie алуу ишке ашкан жок' });

    // 4. Cookie сактоо
    await account.update({
      cookies: JSON.stringify(cookies),
      status: 'idle',
    });

    res.json({ message: `@${username} Instagram'га ийгиликтүү кирди!` });
  } catch (err) {
    console.error('Instagram login error:', err);
    res.status(500).json({ error: 'Instagram\'га кирүүдө ката: ' + err.message });
  }
};

module.exports = {
  getTargets, createTarget, toggleTarget, deleteTarget,
  getParsers, createParser, deleteParser, updateParserStatus,
  uploadCookies, getParserWithCookies, instagramLogin,
};
