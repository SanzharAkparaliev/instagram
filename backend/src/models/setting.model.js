const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Setting = sequelize.define('Setting', {
  key: {
    type: DataTypes.STRING(100),
    primaryKey: true,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: 'settings',
  timestamps: false,
});

// Дефолт настройкалар
const DEFAULTS = {
  parse_interval: '8',          // мүнөт
  max_posts: '5',               // target аккаунтка
  max_comments: '40',           // постко
  lead_keywords: JSON.stringify([
    'цена', 'цену', 'сколько стоит', 'почём', 'почем',
    'в директ', 'в лс',
    'напишите цену', 'скиньте цену', 'скиньте прайс',
    'dm me', 'how much', 'price',
    'баасы канча', 'канча сом', 'канча турат',
    'директке жаз',
  ]),
};

async function getSetting(key) {
  const row = await Setting.findByPk(key);
  return row ? row.value : (DEFAULTS[key] || null);
}

async function getAllSettings() {
  const rows = await Setting.findAll();
  const result = { ...DEFAULTS };
  rows.forEach(r => { result[r.key] = r.value; });
  return result;
}

async function setSetting(key, value) {
  await Setting.upsert({ key, value: String(value) });
}

async function initDefaults() {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    const exists = await Setting.findByPk(key);
    if (!exists) await Setting.create({ key, value });
  }
}

module.exports = { Setting, getSetting, getAllSettings, setSetting, initDefaults, DEFAULTS };
