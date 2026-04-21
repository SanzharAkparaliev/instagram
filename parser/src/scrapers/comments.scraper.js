const { randomDelay } = require('../browser/launcher');

/**
 * Target аккаунттун акыркы постторун алат
 */
async function scrapeRecentPosts(page, targetUsername, maxPosts = 6) {
  console.log(`[Scraper] @${targetUsername} постторун алуу...`);

  const allLinks = new Set();

  // 1. Негизги профил барагы (посттор)
  await page.goto(`https://www.instagram.com/${targetUsername}/`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await randomDelay(1500, 3000);

  const notFound = await page.$('text=Sorry, this page');
  if (notFound) throw new Error(`@${targetUsername} профили табылган жок`);

  const postsFromGrid = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]'));
    return links.map((a) => a.href);
  });
  postsFromGrid.forEach((l) => allLinks.add(l));

  // 2. Reels табы
  try {
    await page.goto(`https://www.instagram.com/${targetUsername}/reels/`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await randomDelay(1500, 3000);

    const reelLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/reel/"]'));
      return links.map((a) => a.href);
    });
    reelLinks.forEach((l) => allLinks.add(l));
  } catch (e) {
    console.log(`[Scraper] @${targetUsername} reels табы жүктөлбөдү`);
  }

  const result = [...allLinks].slice(0, maxPosts);
  console.log(`[Scraper] ${result.length} пост/видео табылды`);
  return result;
}

/**
 * Бир посттун комментарийлерин алат
 */
async function scrapePostComments(page, postUrl, maxComments = 50) {
  await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await randomDelay(4000, 6000);

  // Post metadata
  const postData = await page.evaluate(() => {
    const metaDesc = document.querySelector('meta[name="description"]');
    const timeEl = document.querySelector('time');
    return {
      text: metaDesc?.content || '',
      posted_at: timeEl?.dateTime || null,
    };
  });

  // Extract post/reel ID from URL
  const postIdMatch = postUrl.match(/\/(?:p|reel)\/([^/?]+)/);
  const postId = postIdMatch ? postIdMatch[1] : null;
  if (!postId) return { postId: null, postData, comments: [] };

  // Login confirmation / popup жабуу
  for (const dismiss of ['button:has-text("Continue")', 'button:has-text("Продолжить")', 'button:has-text("Not Now")', 'button:has-text("Not now")', 'button:has-text("Не сейчас")', '[aria-label="Close"]', '[aria-label="Dismiss"]']) {
    const btn = await page.$(dismiss).catch(() => null);
    if (btn) { await btn.click().catch(() => {}); await randomDelay(500, 1000); }
  }

  // Load more comments if possible
  let loadMoreAttempts = 0;
  while (loadMoreAttempts < 3) {
    const loadMore = await page.$('button:has-text("Load more comments")').catch(() => null)
      || await page.$('button:has-text("Загрузить ещё комментарии")').catch(() => null)
      || await page.$('button:has-text("View more comments")').catch(() => null);
    if (!loadMore) break;
    await loadMore.click().catch(() => {});
    await randomDelay(1500, 2500);
    loadMoreAttempts++;
  }

  // Scrape comments — innerText парсинг
  const comments = await page.evaluate(({ postId, max }) => {
    const bodyText = document.body.innerText;
    const results = [];

    // Комментарий паттерни: username\n\ntime\ntext\nLike\nReply
    const lines = bodyText.split('\n').map(l => l.trim()).filter(Boolean);

    const timePatterns = /^\d+\s*[smhdw]\.?$|^\d+\s*(second|minute|hour|day|week|month|year|сек|мин|ч|дн|нед|мес|г|лет)\.?$/;
    const skipUsers = new Set(['Log In', 'Sign Up', 'About', 'Blog', 'Jobs', 'Help', 'API', 'Privacy', 'Terms', 'Meta', 'Threads', 'Meta AI', 'Instagram Lite', 'Create new account', 'Войти', 'Зарегистрироваться', 'Подписаться', 'Отредактировано']);

    for (let i = 0; i < lines.length - 2 && results.length < max; i++) {
      const possibleUser = lines[i];
      const possibleTime = lines[i + 1];
      const possibleText = lines[i + 2];

      if (
        timePatterns.test(possibleTime) &&
        possibleUser.length > 1 &&
        possibleUser.length < 40 &&
        !skipUsers.has(possibleUser) &&
        !possibleUser.includes(' ') &&
        possibleText &&
        possibleText !== 'Like' &&
        possibleText !== 'Reply' &&
        possibleText !== 'Нравится' &&
        possibleText !== 'Ответить'
      ) {
        // "Like" жана "Reply" жок текстти алуу
        let text = possibleText;
        if (text === 'Like' || text === 'Reply') continue;

        // Детерминисттик ID — ошол эле комментарий кайра кошулбайт
        const hash = text.slice(0, 40).replace(/[^a-zA-Z0-9а-яА-ЯёЁ]/g, '').slice(0, 16);
        const id = `${postId}_${possibleUser}_${hash}`;

        // Дубликат текшерүү
        if (results.some(r => r.id === id)) continue;

        results.push({
          id,
          post_id: postId,
          username: possibleUser,
          text,
          created_at: new Date().toISOString(),
        });
      }
    }

    return results;
  }, { postId, max: maxComments });

  console.log(`[Scraper] ${postUrl} → ${comments.length} комментарий`);
  return { postId, postData, postUrl, comments };
}

module.exports = { scrapeRecentPosts, scrapePostComments };
