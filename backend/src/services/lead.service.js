const { LEAD_PATTERNS, LEAD_REASONS } = require('../config/constants');
const { getSetting } = require('../models/setting.model');

let cachedKeywords = null;
let cacheTime = 0;

async function getKeywords() {
  // 60 сек кэш
  if (cachedKeywords && Date.now() - cacheTime < 60000) return cachedKeywords;
  try {
    const raw = await getSetting('lead_keywords');
    cachedKeywords = JSON.parse(raw);
    cacheTime = Date.now();
  } catch {
    cachedKeywords = [];
  }
  return cachedKeywords;
}

/**
 * Комментарий лид болуп саналабы деп текшерет
 */
function detectLead(commentText, keywords) {
  if (!commentText) return { isLead: false, reason: null };

  const lower = commentText.toLowerCase().trim();

  // 1. DB keyword'тер менен текшерүү
  const matchedKeyword = keywords.find((kw) => lower.includes(kw.toLowerCase()));
  if (matchedKeyword) {
    return { isLead: true, reason: LEAD_REASONS.KEYWORD, matchedKeyword };
  }

  // 2. Regex паттерндер менен текшерүү
  const matchedPattern = LEAD_PATTERNS.find((pattern) => pattern.test(commentText));
  if (matchedPattern) {
    return { isLead: true, reason: LEAD_REASONS.KEYWORD, matchedKeyword: matchedPattern.source };
  }

  return { isLead: false, reason: null };
}

/**
 * Batch: комментарийлер массивин текшерет
 */
async function detectLeadsInBatch(comments) {
  const keywords = await getKeywords();
  return comments.map((comment) => {
    const result = detectLead(comment.text, keywords);
    return {
      ...comment,
      is_lead: result.isLead,
      lead_reason: result.reason,
    };
  });
}

module.exports = { detectLead, detectLeadsInBatch };
