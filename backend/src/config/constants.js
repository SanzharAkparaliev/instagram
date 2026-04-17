// Так дал келүүчү фразалар (includes менен)
const LEAD_KEYWORDS = [
  'цена', 'цену', 'сколько стоит', 'почём', 'почем',
  'в директ', 'в дирек', 'в лс',
  'напишите цену', 'скиньте цену', 'скиньте прайс',
  'dm me', 'how much', 'price',
  'баасы канча', 'канча сом', 'канча турат',
  'директке жаз',
];

// Regex паттерндер — так контекст текшерүү
const LEAD_PATTERNS = [
  /\bцена\s*\??$/i,             // "Цена?" — жалгыз сөз
  /\bсколько\b/i,               // "сколько" кайсы жерде болсо да
  /\bканча\s*(сом|турат|бол)/i, // "канча сом", "канча турат"
  /\bбаасы\b/i,                 // "баасы"
  /\bдирект/i,                  // "директ", "директке"
  /\bdm\b/i,                    // "DM" жалгыз сөз
  /\bprice\b/i,                 // "price"
];

const COMMENT_STATUSES = {
  NEW: 'new',
  LEAD: 'lead',
  PROCESSED: 'processed',
};

const LEAD_REASONS = {
  KEYWORD: 'keyword',
  NO_REPLY: 'no_reply',
};

const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
};

module.exports = {
  LEAD_KEYWORDS,
  LEAD_PATTERNS,
  COMMENT_STATUSES,
  LEAD_REASONS,
  USER_ROLES,
};
