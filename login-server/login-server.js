/**
 * Instagram Login Server (серверде иштейт)
 *
 * CRM'ден username/password жөнөтүлөт → Playwright Instagram сайтына кирет → cookie сакталат.
 */

const http = require('http');
const { chromium } = require('playwright');

const PORT = 3100;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const PARSER_SECRET = process.env.PARSER_SECRET || 'parser_internal_secret';

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

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
          res.end(JSON.stringify({ error: 'Бул аккаунт үчүн логин процесси жүрүп жатат' }));
          return;
        }

        activeSessions.add(parserId);
        console.log(`\n[Login] @${login} Instagram сайтына кирүү башталды...`);

        let browser;
        try {
          browser = await chromium.launch({
            headless: true,
            executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
          });

          const context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          });

          const page = await context.newPage();
          await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle', timeout: 30000 });

          // Instagram login формасын толтуруу
          await page.waitForSelector('input[name="username"]', { timeout: 15000 });
          await page.fill('input[name="username"]', login);
          await page.fill('input[name="password"]', password);
          await page.click('button[type="submit"]');

          console.log(`[Login] @${login} форма жөнөтүлдү, sessionid күтүлүүдө...`);

          // sessionid cookie пайда болгонду күтүү
          const deadline = Date.now() + 30000; // 30 секунд
          let found = false;
          while (Date.now() < deadline) {
            const cookies = await context.cookies('https://www.instagram.com');
            const session = cookies.find(c => c.name === 'sessionid');
            if (session) {
              found = true;
              break;
            }
            await new Promise(r => setTimeout(r, 1000));
          }

          if (!found) {
            // Ката билдирүүсүн текшерүү
            const errorText = await page.evaluate(() => {
              const el = document.querySelector('#slfErrorAlert, [data-testid="login-error-message"], p[role="alert"]');
              return el ? el.textContent : null;
            }).catch(() => null);

            await browser.close();
            activeSessions.delete(parserId);

            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: errorText || 'Instagram\'га кирүү ишке ашкан жок. Логин/паролду текшериңиз.' }));
            return;
          }

          await new Promise(r => setTimeout(r, 2000));

          const cookies = await context.cookies('https://www.instagram.com');
          await saveCookies(parserId, cookies);
          await updateStatus(parserId, 'idle');
          console.log(`[Login] @${login} cookie сакталды! (${cookies.length} cookie)`);

          await browser.close();
          activeSessions.delete(parserId);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: `@${login} Instagram\'га ийгиликтүү кирди! Cookie сакталды.` }));

        } catch (err) {
          console.error(`[Login] @${login} ката:`, err.message);
          if (browser) await browser.close().catch(() => {});
          activeSessions.delete(parserId);

          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Ката: ${err.message}` }));
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
  console.log(`\nInstagram Login Server: http://localhost:${PORT}`);
  console.log(`Backend: ${BACKEND_URL}\n`);
});
