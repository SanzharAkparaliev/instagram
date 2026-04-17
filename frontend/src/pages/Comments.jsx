import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';

const COPY_TEMPLATES = [
  'Саламатсызбы! Баасы жөнүндө директке жазыңыз 📩',
  'Привет! Напишите нам в директ, ответим на все вопросы 💬',
  'Здравствуйте! Цену скинем в директ, пишите 👋',
];

export default function CommentsPage() {
  const [comments, setComments] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', is_lead: '', is_processed: '' });
  const [copied, setCopied] = useState(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 25, ...filters };
      Object.keys(params).forEach(k => !params[k] && params[k] !== false && delete params[k]);
      const { data } = await api.get('/comments', { params });
      setComments(data.comments || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleProcess = async (id) => {
    try {
      await api.patch(`/comments/${id}/process`);
      setComments(prev => prev.map(c => c.id === id ? { ...c, is_processed: true } : c));
    } catch (e) { alert('Ката болду'); }
  };

  const handleCopy = (id) => {
    const text = COPY_TEMPLATES[Math.floor(Math.random() * COPY_TEMPLATES.length)];
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const setFilter = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(1);
  };

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">◈ Комментарии</h1>
          <p className="page-sub">Всего: {total} комментариев</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Поиск по тексту..."
          value={filters.search}
          onChange={e => setFilter('search', e.target.value)}
        />
        <select value={filters.is_lead} onChange={e => setFilter('is_lead', e.target.value)}>
          <option value="">Все</option>
          <option value="true">Только лиды</option>
          <option value="false">Не лиды</option>
        </select>
        <select value={filters.is_processed} onChange={e => setFilter('is_processed', e.target.value)}>
          <option value="">Все статусы</option>
          <option value="false">Не обработано</option>
          <option value="true">Обработано</option>
        </select>
        <button className="btn btn-ghost btn-sm" onClick={fetchComments}>⟳ Обновить</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <div className="spinner" />
            </div>
          ) : comments.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">◈</div>
              <p>Комментарии не найдены</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Комментарий</th>
                  <th>Пост</th>
                  <th>Статус</th>
                  <th>Время</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                {comments.map(c => (
                  <tr key={c.id}>
                    <td>
                      <a
                        href={`https://instagram.com/${c.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--blue)', fontFamily: 'var(--mono)', fontSize: 12 }}
                      >
                        @{c.username}
                      </a>
                    </td>
                    <td style={{ maxWidth: 300 }}>
                      <div style={{
                        color: c.is_lead ? 'var(--text)' : 'var(--text2)',
                        fontSize: 13,
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {c.is_lead && <span style={{ color: 'var(--amber)', marginRight: 4 }}>◉</span>}
                        {c.text}
                      </div>
                    </td>
                    <td>
                      {c.post?.url && (
                        <a
                          href={c.post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm"
                        >
                          ↗ Instagram
                        </a>
                      )}
                    </td>
                    <td><StatusBadge isLead={c.is_lead} isProcessed={c.is_processed} /></td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                      {new Date(c.created_at || c.parsed_at).toLocaleString('ru-RU')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn-icon"
                          title="Скопировать шаблон ответа"
                          onClick={() => handleCopy(c.id)}
                          style={{ fontSize: 13, color: copied === c.id ? 'var(--green)' : undefined }}
                        >
                          {copied === c.id ? '✓' : '⎘'}
                        </button>
                        {!c.is_processed && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleProcess(c.id)}
                            style={{ fontSize: 11 }}
                          >
                            Обработано
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination" style={{ padding: '16px 0' }}>
            <button className="page-num" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-num ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-num" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
          </div>
        )}
      </div>
    </div>
  );
}
