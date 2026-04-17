const { getAllSettings, setSetting } = require('../models/setting.model');

const getSettings = async (req, res) => {
  try {
    const settings = await getAllSettings();
    // lead_keywords JSON parse
    if (settings.lead_keywords) {
      try { settings.lead_keywords = JSON.parse(settings.lead_keywords); } catch {}
    }
    res.json({ settings });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения настроек' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings) return res.status(400).json({ error: 'settings объект нужен' });

    for (const [key, value] of Object.entries(settings)) {
      const val = Array.isArray(value) ? JSON.stringify(value) : String(value);
      await setSetting(key, val);
    }

    const updated = await getAllSettings();
    if (updated.lead_keywords) {
      try { updated.lead_keywords = JSON.parse(updated.lead_keywords); } catch {}
    }
    res.json({ settings: updated });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сохранения настроек' });
  }
};

module.exports = { getSettings, updateSettings };
