import { useEffect, useState } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import { ParserStatusBadge } from '../components/StatusBadge';

export default function AccountsPage() {
  const [targets, setTargets] = useState([]);
  const [parsers, setParsers] = useState([]);
  const [tab, setTab] = useState('targets');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [cookieModal, setCookieModal] = useState(null);
  const [cookieText, setCookieText] = useState('');
  const [loginLoading, setLoginLoading] = useState(null);

  const fetchAll = async () => {
    const [t, p] = await Promise.all([
      api.get('/accounts/targets').then(r => r.data.accounts),
      api.get('/accounts/parsers').then(r => r.data.accounts).catch(() => []),
    ]);
    setTargets(t);
    setParsers(p);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'targets') {
        await api.post('/accounts/targets', form);
      } else {
        await api.post('/accounts/parsers', form);
      }
      await fetchAll();
      setShowModal(false);
      setForm({});
    } catch (err) {
      alert(err.response?.data?.error || 'Ката');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    await api.patch(`/accounts/targets/${id}/toggle`);
    await fetchAll();
  };

  const handleInstagramLogin = async (parserId, login) => {
    setLoginLoading(parserId);
    try {
      const res = await fetch('http://localhost:3100/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parserId, login }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Ката');
      } else {
        alert('Браузер ачылды! Instagram\'га кириңиз. Cookie автоматтык сакталат.');
      }
    } catch {
      alert('Login сервер иштебей жатат.\n\nКомпьютериңизде запуск кылыңыз: node login-server.js');
    } finally {
      setLoginLoading(null);
    }
  };

  const handleCookieUpload = async () => {
    try {
      const cookies = JSON.parse(cookieText);
      await api.post(`/accounts/parsers/${cookieModal}/cookies`, { cookies });
      alert('Cookie успешно сохранён!');
      setCookieModal(null);
      setCookieText('');
    } catch (err) {
      alert(err.message?.includes('JSON') ? 'Неверный формат JSON' : (err.response?.data?.error || 'Ката'));
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm('Вы уверены, что хотите удалить?')) return;
    await api.delete(`/accounts/${type}/${id}`);
    await fetchAll();
  };

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">⬢ Аккаунты</h1>
          <p className="page-sub">Управление Target и Parser аккаунтами</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Добавить
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[['targets', '⬡ Target аккаунты'], ['parsers', '◈ Parser аккаунты']].map(([val, label]) => (
          <button key={val} className={`btn ${tab === val ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setTab(val)}>
            {label}
          </button>
        ))}
      </div>

      {/* Target Accounts */}
      {tab === 'targets' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Статус</th>
                  <th>Добавлен</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                {targets.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Нет аккаунтов</td></tr>
                ) : targets.map(t => (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--blue)', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 500 }}>@{t.username}</td>
                    <td>
                      <span className={`badge ${t.is_active ? 'badge-parsing' : 'badge-idle'}`}>
                        {t.is_active ? '● Активный' : '○ Выключен'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>
                      {new Date(t.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(t.id)}>
                          {t.is_active ? 'Стоп' : 'Вкл'}
                        </button>
                        <button className="btn-icon" style={{ color: 'var(--red)' }} onClick={() => handleDelete('targets', t.id)}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Parser Accounts */}
      {tab === 'parsers' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Login</th>
                  <th>Авторизация</th>
                  <th>Статус</th>
                  <th>Последний парсинг</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                {parsers.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Нет parser аккаунтов</td></tr>
                ) : parsers.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{p.login}</td>
                    <td>
                      {p.has_cookies ? (
                        <span className="badge badge-processed">✓ Авторизован</span>
                      ) : (
                        <span className="badge badge-banned">✕ Не авторизован</span>
                      )}
                    </td>
                    <td><ParserStatusBadge status={p.status} /></td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>
                      {p.last_used ? new Date(p.last_used).toLocaleString('ru-RU') : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleInstagramLogin(p.id, p.login)}
                          disabled={loginLoading === p.id}
                        >
                          {loginLoading === p.id ? 'Ачылууда...' : 'Войти'}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setCookieModal(p.id); setCookieText(''); }}>
                          Cookie
                        </button>
                        <button className="btn-icon" style={{ color: 'var(--red)' }} onClick={() => handleDelete('parsers', p.id)}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal title={tab === 'targets' ? 'Добавить Target аккаунт' : 'Добавить Parser аккаунт'} onClose={() => { setShowModal(false); setForm({}); }}>
          <form onSubmit={handleSubmit}>
            {tab === 'targets' ? (
              <>
                <div className="form-group">
                  <label className="form-label">Instagram Username</label>
                  <input placeholder="example_account" value={form.username || ''} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Instagram Login</label>
                  <input placeholder="parser_login" value={form.login || ''} onChange={e => setForm(f => ({ ...f, login: e.target.value }))} required />
                </div>
              </>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setShowModal(false); setForm({}); }}>Отмена</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Добавить'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {/* Cookie Modal */}
      {cookieModal && (
        <Modal title="Загрузить Cookie" onClose={() => { setCookieModal(null); setCookieText(''); }}>
          <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            <p style={{ marginBottom: 8 }}>Экспортируйте Instagram cookie из браузера:</p>
            <ol style={{ paddingLeft: 18, margin: 0 }}>
              <li>Войдите в Instagram в браузере</li>
              <li>Установите расширение <strong>Cookie-Editor</strong></li>
              <li>Откройте Cookie-Editor на instagram.com</li>
              <li>Нажмите <strong>Export → JSON</strong></li>
              <li>Вставьте скопированный JSON сюда</li>
            </ol>
          </div>
          <textarea
            rows={10}
            placeholder='[{"name":"sessionid","value":"...","domain":".instagram.com",...}]'
            value={cookieText}
            onChange={e => setCookieText(e.target.value)}
            style={{ width: '100%', fontFamily: 'var(--mono)', fontSize: 11, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setCookieModal(null); setCookieText(''); }}>Закрыть</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCookieUpload} disabled={!cookieText.trim()}>Сохранить</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
