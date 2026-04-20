/**
 * Instagram Login Server
 *
 * CRM frontend'деги "Instagram'га кирүү" баскычы бул серверге кайрылат.
 * Playwright браузер терезеси ачылат → колдонуучу кирет → cookie сакталат.
 *
 * Колдонуу: node login-server.js
 */

const http = require('http');
const { chromium } = require('playwright');

const PORT = 3100;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const PARSER_SECRET = process.env.PARSER_SECRET || 'parser_internal_secret';

// Backend'ке cookie сактоо
function saveCookies(parserId, cookies) {
  return new Promise((resolve, reject) => {
    const url = new URL(`/api/parser/parsers/${parserId}/cookies`, BACKEND_URL);
    const body = JSON.stringify({ cookies });
    const req = http.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Parser-Token': PARSER_SECRET },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Parser статусун жаңыртуу
function updateStatus(parserId, status) {
  return new Promise((resolve, reject) => {
    const url = new URL(`/api/parser/parsers/${parserId}/status`, BACKEND_URL);
    const body = JSON.stringify({ status });
    const req = http.request(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Parser-Token': PARSER_SECRET },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

let activeSessions = new Set();

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /status — сервер иштеп жатканын текшерүү
  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // POST /login — браузер ачуу
  if (req.method === 'POST' && req.url === '/login') {
    let body = '';
    req.on('data', (chunk) => body += chunk);
    req.on('end', async () => {
      try {
        const { parserId, login, password } = JSON.parse(body);

        if (!parserId || !login || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'parserId, login жана password керек' }));
          return;
        }

        if (activeSessions.has(parserId)) {
          res.writeHead(409, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Бул аккаунт үчүн браузер ачык турат' }));
          return;
        }

        // Дароо жооп кайтаруу
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Браузер ачылып жатат...' }));

        // Фонго Playwright иштетүү
        activeSessions.add(parserId);
        console.log(`\n[Login] @${login} үчүн браузер ачылып жатат...`);

        let browser;
        try {
          browser = await chromium.launch({
            headless: true,
            executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
          });

          const context = await browser.newContext({
            viewport: null,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          });

          const page = await context.newPage();
          await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle' });

          console.log(`[Login] @${login} автоматтык кирүү...`);

          // Username жана password жазуу
          await page.waitForSelector('input[name="username"]', { timeout: 15000 });
          await page.fill('input[name="username"]', login);
          await page.fill('input[name="password"]', password);
          await page.click('button[type="submit"]');

          // sessionid cookie пайда болгонду күтүү
          const deadline = Date.now() + 60000; // 1 мүнөт
          let found = false;
          while (Date.now() < deadline) {
            const cookies = await context.cookies('https://www.instagram.com');
            const session = cookies.find(c => c.name === 'sessionid');
            if (session) {
              found = true;
              console.log('[Login] sessionid cookie табылды!');
              break;
            }
            await new Promise(r => setTimeout(r, 2000));
          }
          if (!found) throw new Error('Кирүү ишке ашкан жок — sessionid табылган жок');

          await new Promise(r => setTimeout(r, 3000));

          // Cookie алуу
          const cookies = await context.cookies('https://www.instagram.com');
          const sessionCookie = cookies.find(c => c.name === 'sessionid');

          if (sessionCookie) {
            await saveCookies(parserId, cookies);
            await updateStatus(parserId, 'idle');
            console.log(`[Login] @${login} cookie сакталды! (${cookies.length} cookie)`);
          } else {
            console.log(`[Login] @${login} sessionid табылган жок`);
          }

          await browser.close();
        } catch (err) {
          console.error(`[Login] @${login} ката:`, err.message);
          if (browser) await browser.close().catch(() => {});
        } finally {
          activeSessions.delete(parserId);
        }

      } catch (e) {
        if (!res.writableEnded) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'JSON формат катасы' }));
        }
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\n🔐 Instagram Login Server: http://localhost:${PORT}`);
  console.log('   CRM\'деги "Instagram\'га кирүү" баскычы ушул серверге кайрылат.\n');
});
