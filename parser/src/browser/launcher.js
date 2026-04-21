const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COOKIES_DIR = path.join(__dirname, '../../data/cookies');

if (!fs.existsSync(COOKIES_DIR)) {
  fs.mkdirSync(COOKIES_DIR, { recursive: true });
}

function getCookiePath(login) {
  return path.join(COOKIES_DIR, `${login.replace(/[^a-z0-9]/gi, '_')}.json`);
}

async function launchBrowser(proxy = null) {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--dns-prefetch-disable',
    '--single-process',
  ];

  const launchOptions = {
    headless: true,
    args,
  };

  if (proxy) {
    // proxy format: ip:port:user:pass
    const parts = proxy.split(':');
    if (parts.length >= 2) {
      launchOptions.proxy = {
        server: `http://${parts[0]}:${parts[1]}`,
        username: parts[2] || undefined,
        password: parts[3] || undefined,
      };
    }
  }

  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined;
  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }
  const browser = await chromium.launch(launchOptions);
  return browser;
}

async function getContextWithCookies(browser, login) {
  const cookiePath = getCookiePath(login);
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'ru-RU',
  });

  if (fs.existsSync(cookiePath)) {
    const cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf-8'));
    await context.addCookies(cookies);
    console.log(`[Cookie] ${login} үчүн cookie жүктөлдү`);
  }

  return context;
}

async function saveCookies(context, login) {
  const cookies = await context.cookies();
  const cookiePath = getCookiePath(login);
  fs.writeFileSync(cookiePath, JSON.stringify(cookies, null, 2));
  console.log(`[Cookie] ${login} үчүн cookie сакталды`);
}

async function loginToInstagram(page, login, password) {
  await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Cookie banner
  try {
    await page.click('text=Allow all cookies', { timeout: 3000 });
  } catch {}
  try {
    await page.click('text=Accept all', { timeout: 2000 });
  } catch {}

  // Random delay
  await randomDelay(1000, 2500);

  await page.fill('input[name="username"]', login);
  await randomDelay(400, 800);
  await page.fill('input[name="password"]', password);
  await randomDelay(500, 1000);
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ timeout: 15000 });

  const url = page.url();
  if (url.includes('/challenge') || url.includes('/checkpoint')) {
    throw new Error('Instagram challenge/checkpoint талап кылды');
  }

  console.log(`[Login] ${login} кирди ✓`);
}

async function randomDelay(min = 500, max = 2000) {
  const ms = Math.floor(Math.random() * (max - min)) + min;
  await new Promise((r) => setTimeout(r, ms));
}

module.exports = {
  launchBrowser,
  getContextWithCookies,
  saveCookies,
  loginToInstagram,
  randomDelay,
};
