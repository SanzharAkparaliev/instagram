#!/usr/bin/env node
/**
 * Instagram Cookie Login Script
 *
 * Браузер ачылат → Instagram'га кирсеңиз → Cookie автоматтык CRM'ге сакталат
 *
 * Колдонуу: node login.js
 */

const { chromium } = require('playwright');
const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const PARSER_SECRET = process.env.PARSER_SECRET || 'parser_internal_secret';

async function getParserAccounts() {
  return new Promise((resolve, reject) => {
    const url = new URL('/api/parser/parsers', BACKEND_URL);
    http.get(url, { headers: { 'X-Parser-Token': PARSER_SECRET } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.accounts || []);
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function saveCookiesToBackend(parserId, cookies) {
  return new Promise((resolve, reject) => {
    const url = new URL(`/api/accounts/parsers/${parserId}/cookies`, BACKEND_URL);
    const body = JSON.stringify({ cookies });
    const req = http.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Parser-Token': PARSER_SECRET,
      },
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

async function main() {
  console.log('\n🔐 Instagram CRM — Cookie Login\n');

  // 1. Parser аккаунттарды алуу
  let accounts;
  try {
    accounts = await getParserAccounts();
  } catch (e) {
    console.error('❌ Backend\'ке туташа алган жок. Docker иштеп жатканын текшериңиз.');
    console.error('   docker compose up -d');
    process.exit(1);
  }

  if (accounts.length === 0) {
    console.error('❌ Parser аккаунт жок. Алгач CRM\'де Parser аккаунт кошуңуз.');
    process.exit(1);
  }

  // Аккаунтту тандоо
  const account = accounts[0];
  console.log(`📱 Аккаунт: ${account.login}`);
  console.log('🌐 Браузер ачылып жатат...\n');

  // 2. Браузер ачуу (көрүнүүчү)
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({
    viewport: null,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();
  await page.goto('https://www.instagram.com/accounts/login/');

  console.log('═══════════════════════════════════════════');
  console.log('  Instagram\'га кириңиз (каалаган жол менен):');
  console.log('  • Login + Password');
  console.log('  • QR код (телефондон)');
  console.log('  • Facebook аркылуу');
  console.log('');
  console.log('  Киргенден кийин терезе автоматтык жабылат');
  console.log('═══════════════════════════════════════════\n');

  // 3. Кирүүнү күтүү — URL instagram.com/ болгонго чейин
  try {
    await page.waitForURL((url) => {
      const path = url.pathname;
      return path === '/' || path === '/explore/' || path.startsWith('/direct/');
    }, { timeout: 300000 }); // 5 мүнөт күтөт
  } catch (e) {
    console.error('❌ Убактысы бүттү (5 мүнөт). Кайра аракет кылыңыз: node login.js');
    await browser.close();
    process.exit(1);
  }

  console.log('✅ Кирүү ийгиликтүү!\n');

  // 4. Cookie'лерди алуу
  const cookies = await context.cookies('https://www.instagram.com');
  const sessionCookie = cookies.find(c => c.name === 'sessionid');

  if (!sessionCookie) {
    console.error('❌ sessionid cookie табылган жок. Кайра аракет кылыңыз.');
    await browser.close();
    process.exit(1);
  }

  console.log(`🍪 ${cookies.length} cookie алынды (sessionid: ...${sessionCookie.value.slice(-8)})`);

  // 5. Backend'ке сактоо
  try {
    await saveCookiesToBackend(account.id, cookies);
    console.log(`\n✅ Cookie "${account.login}" аккаунтуна сакталды!`);
    console.log('🚀 Парсер эми автоматтык иштей баштайт.\n');
  } catch (e) {
    console.error('❌ Cookie сактоодо ката:', e.message);
  }

  await browser.close();
}

main().catch(console.error);
