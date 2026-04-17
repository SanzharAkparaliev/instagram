const cron = require('node-cron');
const {
  launchBrowser,
  getContextWithCookies,
  saveCookies,
  loginToInstagram,
  randomDelay,
} = require('../browser/launcher');
const { scrapeRecentPosts, scrapePostComments } = require('../scrapers/comments.scraper');
const { sendComments, getActiveTargets, getAllIdleParsers, getIdleParser, updateParserStatus, getParserCookies, getSettings } = require('../api/client');

let isRunning = false;

/**
 * Бир parser менен берилген target'терди парсинг кылуу
 */
async function parseWithAccount(parser, targets, settings = {}) {
  const maxPosts = parseInt(settings.max_posts) || 5;
  const maxComments = parseInt(settings.max_comments) || 40;
  let browser = null;

  try {
    console.log(`\n[Parser:${parser.login}] ${targets.length} target баштайт`);
    await updateParserStatus(parser.id, 'parsing');

    browser = await launchBrowser(parser.proxy);
    const context = await getContextWithCookies(browser, parser.login);
    const page = await context.newPage();

    // Cookie менен кирүү
    const dbCookies = await getParserCookies(parser.id);
    if (dbCookies) {
      const cookiesArray = Array.isArray(dbCookies) ? dbCookies : JSON.parse(dbCookies);
      await context.addCookies(cookiesArray);
      await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle', timeout: 30000 });
      await randomDelay(3000, 5000);

      const url = page.url();
      if (url.includes('/accounts/login')) {
        console.log(`[Parser:${parser.login}] Cookie мөөнөтү бүткөн`);
        if (parser.password) {
          try {
            await loginToInstagram(page, parser.login, parser.password);
            await saveCookies(context, parser.login);
          } catch (loginErr) {
            await updateParserStatus(parser.id, loginErr.message.includes('challenge') ? 'banned' : 'error');
            return { comments: 0, leads: 0 };
          }
        } else {
          await updateParserStatus(parser.id, 'error');
          console.log(`[Parser:${parser.login}] Cookie бүткөн, кайра кириңиз`);
          return { comments: 0, leads: 0 };
        }
      } else {
        // "Continue" баскычын басуу
        const continueBtn = await page.$('button:has-text("Continue")').catch(() => null)
          || await page.$('button:has-text("Продолжить")').catch(() => null);
        if (continueBtn) {
          await continueBtn.click().catch(() => {});
          await randomDelay(1500, 3000);
        }
        console.log(`[Parser:${parser.login}] Cookie менен кирүү ✓`);
      }
    } else {
      console.log(`[Parser:${parser.login}] Cookie жок, кириңиз`);
      await updateParserStatus(parser.id, 'error');
      return { comments: 0, leads: 0 };
    }

    // Target'терди парсинг
    let totalComments = 0;
    let totalLeads = 0;

    for (const target of targets) {
      try {
        console.log(`[Parser:${parser.login}] @${target.username} парсинг...`);
        await randomDelay(2000, 5000);

        const postUrls = await scrapeRecentPosts(page, target.username, maxPosts);

        for (const postUrl of postUrls) {
          await randomDelay(3000, 7000);

          const { postId, postData, comments } = await scrapePostComments(page, postUrl, maxComments);
          if (!postId || comments.length === 0) continue;

          // Target жана пост маалыматын кошуу
          const enriched = comments.map(c => ({
            ...c,
            target_id: target.id,
            target_username: target.username,
            post_url: postUrl,
          }));

          const result = await sendComments(enriched);
          if (result) {
            totalComments += result.created || 0;
            totalLeads += result.leads_detected || 0;
          }
        }
      } catch (targetErr) {
        console.error(`[Parser:${parser.login}] @${target.username} ката:`, targetErr.message);
      }
    }

    await updateParserStatus(parser.id, 'idle');
    await saveCookies(context, parser.login);

    console.log(`[Parser:${parser.login}] ✅ ${totalComments} комментарий, ${totalLeads} лид`);
    return { comments: totalComments, leads: totalLeads };

  } catch (err) {
    console.error(`[Parser:${parser.login}] Критикалык ката:`, err.message);
    await updateParserStatus(parser.id, 'idle').catch(() => {});
    return { comments: 0, leads: 0 };
  } finally {
    if (browser) await browser.close();
    await updateParserStatus(parser.id, 'idle').catch(() => {});
  }
}

async function runParseJob() {
  if (isRunning) {
    console.log('[Job] Мурунку парсинг аяктаган жок, өткөрүп жиберилди');
    return;
  }

  isRunning = true;
  console.log('\n[Job] ====== Парсинг башталды:', new Date().toLocaleString('ru-RU'), '======');

  try {
    // 0. Settings алуу
    let settings = {};
    try { settings = await getSettings(); } catch {}
    console.log(`[Job] Настройки: интервал=${settings.parse_interval || 8}мин, посты=${settings.max_posts || 5}, комменты=${settings.max_comments || 40}`);

    // 1. Active targets
    const targets = await getActiveTargets();
    if (targets.length === 0) {
      console.log('[Job] Активдүү target аккаунт жок');
      return;
    }

    // 2. Idle parser'лер (cookie бар)
    let parsers = await getAllIdleParsers();

    // Эгер cookie бар parser жок болсо, кадимки idle parser алуу
    if (parsers.length === 0) {
      const single = await getIdleParser();
      if (!single) {
        console.log('[Job] Idle parser аккаунт жок');
        return;
      }
      parsers = [single];
    }

    console.log(`[Job] ${parsers.length} parser, ${targets.length} target`);

    if (parsers.length === 1) {
      // 1 parser — бардык target'терди ирети менен
      const result = await parseWithAccount(parsers[0], targets, settings);
      console.log(`\n[Job] ✅ Жалпы: ${result.comments} комментарий, ${result.leads} лид`);
    } else {
      // Бир нече parser — target'терди бөлүштүрүү
      const assignments = parsers.map(() => []);
      targets.forEach((target, i) => {
        assignments[i % parsers.length].push(target);
      });

      // Параллель иштетүү
      console.log('[Job] Параллель парсинг:');
      assignments.forEach((assigned, i) => {
        if (assigned.length > 0) {
          console.log(`  ${parsers[i].login} → ${assigned.map(t => '@' + t.username).join(', ')}`);
        }
      });

      const results = await Promise.all(
        parsers.map((parser, i) => {
          if (assignments[i].length === 0) return Promise.resolve({ comments: 0, leads: 0 });
          return parseWithAccount(parser, assignments[i], settings);
        })
      );

      const totalComments = results.reduce((s, r) => s + r.comments, 0);
      const totalLeads = results.reduce((s, r) => s + r.leads, 0);
      console.log(`\n[Job] ✅ Жалпы: ${totalComments} комментарий, ${totalLeads} лид (${parsers.length} parser параллель)`);
    }

  } catch (err) {
    console.error('[Job] Критикалык ката:', err.message);
  } finally {
    isRunning = false;
    console.log('[Job] ====== Аяктады ======\n');
  }
}

function startScheduler() {
  console.log('⏰ Scheduler башталды (ар 8 мүнөт сайын)');

  cron.schedule('*/8 * * * *', () => {
    runParseJob().catch(console.error);
  });

  setTimeout(() => {
    console.log('[Scheduler] Биринчи парсинг башталып жатат...');
    runParseJob().catch(console.error);
  }, 30000);
}

module.exports = { runParseJob, startScheduler };
