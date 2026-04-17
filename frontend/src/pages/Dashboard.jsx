import { useEffect, useState } from 'react';
import api from '../api/axios';
import useAuthStore from '../store/auth.store';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    api.get('/comments/stats').then(r => setStats(r.data)).catch(() => {});
    api.get('/comments?is_lead=true&is_processed=false&limit=5').then(r => setRecent(r.data.comments || [])).catch(() => {});
  }, []);

  const cards = [
    { label: 'Всего комментариев', value: stats?.total ?? '—', cls: '' },
    { label: 'Лиды', value: stats?.leads ?? '—', cls: 'stat-amber' },
    { label: 'Новые лиды', value: stats?.new_leads ?? '—', cls: 'stat-accent' },
    { label: 'Обработано', value: stats?.processed ?? '—', cls: 'stat-green' },
  ];

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Главная</h1>
          <p className="page-sub">Здравствуйте, {user?.name}</p>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
          {new Date().toLocaleDateString('ru-RU', { dateStyle: 'long' })}
        </div>
      </div>

      <div className="stats-grid">
        {cards.map(c => (
          <div key={c.label} className="stat-card">
            <div className="stat-label">{c.label}</div>
            <div className={`stat-value ${c.cls}`}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--text)' }}>
          ◉ Последние необработанные лиды
        </div>
        {recent.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">◎</div>
            <p>Нет необработанных лидов</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Комментарий</th>
                  <th>Причина</th>
                  <th>Время</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(c => (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--blue)', fontFamily: 'var(--mono)', fontSize: 12 }}>@{c.username}</td>
                    <td style={{ maxWidth: 280 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                        {c.text}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${c.lead_reason === 'keyword' ? 'badge-lead' : 'badge-new'}`}>
                        {c.lead_reason === 'keyword' ? 'Keyword' : 'No reply'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>
                      {new Date(c.created_at || c.parsed_at).toLocaleString('ru-RU')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
