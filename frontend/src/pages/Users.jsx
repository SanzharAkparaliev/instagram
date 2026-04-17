import { useEffect, useState } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import useAuthStore from '../store/auth.store';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ role: 'manager' });
  const [loading, setLoading] = useState(false);
  const { user: me } = useAuthStore();

  const fetchUsers = () => api.get('/users').then(r => setUsers(r.data.users));
  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/users', form);
      await fetchUsers();
      setShowModal(false);
      setForm({ role: 'manager' });
    } catch (err) {
      alert(err.response?.data?.error || 'Ката');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить?')) return;
    await api.delete(`/users/${id}`);
    fetchUsers();
  };

  const ROLE_COLORS = { admin: 'badge-lead', manager: 'badge-new' };

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">◎ Пользователи</h1>
          <p className="page-sub">Управление пользователями системы</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Добавить</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Имя</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Добавлен</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: 'var(--bg4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 600, color: u.id === me?.id ? 'var(--accent)' : 'var(--blue)',
                      }}>{u.name?.[0]?.toUpperCase()}</div>
                      <span style={{ color: 'var(--text)', fontWeight: u.id === me?.id ? 500 : 400 }}>
                        {u.name} {u.id === me?.id && <span style={{ color: 'var(--text3)', fontSize: 11 }}>(вы)</span>}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{u.email}</td>
                  <td><span className={`badge ${ROLE_COLORS[u.role]}`}>{u.role}</span></td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>
                    {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td>
                    {u.id !== me?.id && (
                      <button className="btn-icon" style={{ color: 'var(--red)' }} onClick={() => handleDelete(u.id)}>✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title="Новый пользователь" onClose={() => { setShowModal(false); setForm({ role: 'manager' }); }}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">ФИО</label>
              <input placeholder="Иван Иванов" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" placeholder="user@crm.com" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Пароль</label>
              <input type="password" placeholder="••••••••" value={form.password || ''} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Роль</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Отмена</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Создать'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
