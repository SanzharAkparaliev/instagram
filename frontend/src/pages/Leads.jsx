import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all | keyword | no_reply | unprocessed

  useEffect(() => {
    setLoading(true);
    const params = { is_lead: true, limit: 50 };
    if (filter === 'unprocessed') params.is_processed = false;
    api.get('/comments', { params })
      .then(r => {
        let data = r.data.comments || [];
        if (filter === 'keyword') data = data.filter(c => c.lead_reason === 'keyword');
        if (filter === 'no_reply') data = data.filter(c => c.lead_reason === 'no_reply');
        setLeads(data);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  const handleProcess = async (id) => {
    await api.patch(`/comments/${id}/process`);
    setLeads(prev => prev.map(c => c.id === id ? { ...c, is_processed: true } : c));
  };

  const FILTERS = [
    { val: 'all',         label: 'Все' },
    { val: 'unprocessed', label: '◉ Не обработано' },
    { val: 'keyword',     label: '◈ Keyword' },
    { val: 'no_reply',    label: '○ No reply' },
  ];

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">◉ Лиды</h1>
          <p className="page-sub">Потенциальные клиенты</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f.val}
            className={`btn ${filter === f.val ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            onClick={() => setFilter(f.val)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : leads.length === 0 ? (
        <div className="empty"><div className="empty-icon">◎</div><p>Лиды не найдены</p></div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {leads.map(lead => (
            <div key={lead.id} className="card lead-card" style={{
              display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap',
              borderLeft: lead.is_processed ? '2px solid var(--border)' : '2px solid var(--amber)',
              opacity: lead.is_processed ? 0.6 : 1,
              padding: '16px 20px',
            }}>
              {/* Avatar */}
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'var(--bg4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 600, color: 'var(--accent)', flexShrink: 0,
              }}>
                {lead.username?.[0]?.toUpperCase() || '?'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <a
                    href={`https://instagram.com/${lead.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--blue)', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500 }}
                  >
                    @{lead.username}
                  </a>
                  <span className={`badge ${lead.lead_reason === 'keyword' ? 'badge-lead' : 'badge-new'}`}>
                    {lead.lead_reason === 'keyword' ? '◈ Keyword' : '○ No reply'}
                  </span>
                  {lead.is_processed && <span className="badge badge-processed">✓ Обработано</span>}
                </div>

                <p style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.5, margin: '4px 0 8px', wordBreak: 'break-word' }}>
                  "{lead.text}"
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                  <span>{new Date(lead.created_at || lead.parsed_at).toLocaleString('ru-RU')}</span>
                  <span style={{ color: 'var(--border2)' }}>|</span>
                  {lead.post?.target?.username && (
                    <a
                      href={`https://instagram.com/${lead.post.target.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--purple)', textDecoration: 'none' }}
                    >
                      @{lead.post.target.username}
                    </a>
                  )}
                  {lead.post_id && (
                    <a
                      href={`https://instagram.com/reel/${lead.post_id}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--blue)', textDecoration: 'none',
                        background: 'rgba(74,158,255,0.1)', padding: '1px 6px', borderRadius: 4,
                      }}
                    >
                      {lead.post_id.slice(0, 11)}
                    </a>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="lead-actions" style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                {lead.post?.url && (
                  <a href={lead.post.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                    ↗ Пост
                  </a>
                )}
                <a href={`https://instagram.com/${lead.username}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                  Instagram
                </a>
                {!lead.is_processed && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleProcess(lead.id)}>
                    ✓ Обработано
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
