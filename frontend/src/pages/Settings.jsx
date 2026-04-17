import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [saved, setSaved] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data.settings)).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/settings', { settings });
      setSettings(data.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const addKeyword = () => {
    const kw = newKeyword.trim().toLowerCase();
    if (!kw || settings.lead_keywords.includes(kw)) return;
    setSettings(s => ({ ...s, lead_keywords: [...s.lead_keywords, kw] }));
    setNewKeyword('');
  };

  const addKeywordDirect = (kw) => {
    if (settings.lead_keywords.includes(kw)) return;
    setSettings(s => ({ ...s, lead_keywords: [...s.lead_keywords, kw] }));
  };

  const removeKeyword = (kw) => {
    setSettings(s => ({ ...s, lead_keywords: s.lead_keywords.filter(k => k !== kw) }));
  };

  const updateField = (key, value) => {
    setSettings(s => ({ ...s, [key]: value }));
  };

  if (loading) return <div className="page" style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Настройки</h1>
          <p className="page-sub">Параметры парсера и системы</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : saved ? '✓ Сохранено' : 'Сохранить'}
        </button>
      </div>

      {/* Парсер */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>
          Парсер
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Интервал парсинга (минуты)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={settings?.parse_interval || ''}
              onChange={e => updateField('parse_interval', e.target.value)}
            />
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
              Как часто запускать парсинг
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Макс. постов на аккаунт</label>
            <input
              type="number"
              min="1"
              max="20"
              value={settings?.max_posts || ''}
              onChange={e => updateField('max_posts', e.target.value)}
            />
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
              Сколько последних постов/reels проверять
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Макс. комментариев на пост</label>
            <input
              type="number"
              min="10"
              max="200"
              value={settings?.max_comments || ''}
              onChange={e => updateField('max_comments', e.target.value)}
            />
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
              Сколько комментариев собирать с каждого поста
            </div>
          </div>
        </div>
      </div>

      {/* Ключевые слова */}
      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>
          Ключевые слова для лидов
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
          Если комментарий содержит одно из этих слов/фраз, он считается лидом
        </p>

        {/* Добавить */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            placeholder="Введите ключевое слово..."
            value={newKeyword}
            onChange={e => setNewKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={addKeyword} disabled={!newKeyword.trim()}>
            Добавить
          </button>
          <button className="btn btn-ghost" onClick={() => setShowSuggestions(!showSuggestions)}>
            {showSuggestions ? 'Скрыть' : 'Шаблоны'}
          </button>
        </div>

        {/* Шаблоны */}
        {showSuggestions && (
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 16 }}>
            {[
              { title: 'Цена / Стоимость', keywords: ['цена', 'цену', 'прайс', 'стоимость', 'сколько стоит', 'почём', 'почем', 'прайс лист'] },
              { title: 'Директ / Связь', keywords: ['в директ', 'в лс', 'в личку', 'напишите', 'ответьте', 'свяжитесь', 'контакт', 'номер телефона', 'whatsapp', 'telegram'] },
              { title: 'Покупка / Заказ', keywords: ['купить', 'заказать', 'оформить', 'доставка', 'в наличии', 'есть в наличии', 'как заказать', 'как купить', 'скиньте цену', 'скиньте прайс'] },
              { title: 'English', keywords: ['price', 'how much', 'dm me', 'dm', 'order', 'buy', 'cost', 'shipping', 'available'] },
              { title: 'Кыргызча', keywords: ['баасы', 'баасы канча', 'канча сом', 'канча турат', 'директке жаз', 'сатып алам', 'заказ кылам', 'бар беле'] },
              { title: 'Узбекча', keywords: ['нархи', 'нарх', 'нархини', 'канча сум', 'директга ёзинг', 'сотиб олиш'] },
            ].map(cat => (
              <div key={cat.title} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  {cat.title}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {cat.keywords.map(kw => {
                    const active = (settings?.lead_keywords || []).includes(kw);
                    return (
                      <button
                        key={kw}
                        onClick={() => active ? removeKeyword(kw) : addKeywordDirect(kw)}
                        style={{
                          background: active ? 'rgba(62,207,142,0.15)' : 'var(--bg4)',
                          border: `1px solid ${active ? 'var(--green)' : 'var(--border)'}`,
                          borderRadius: 20, padding: '3px 10px',
                          fontSize: 12, color: active ? 'var(--green)' : 'var(--text2)',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        {active ? '✓ ' : '+ '}{kw}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Активные ключевые слова */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(settings?.lead_keywords || []).map(kw => (
            <div key={kw} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '4px 12px',
              fontSize: 13, color: 'var(--text2)',
            }}>
              {kw}
              <button
                onClick={() => removeKeyword(kw)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text3)',
                  cursor: 'pointer', padding: '0 2px', fontSize: 14, lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {(settings?.lead_keywords || []).length === 0 && (
          <div style={{ color: 'var(--text3)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
            Нет ключевых слов
          </div>
        )}
      </div>
    </div>
  );
}
