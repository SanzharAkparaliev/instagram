import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useAuthStore from '../../store/auth.store';

const NAV = [
  { to: '/',          icon: '⬡', label: 'Главная' },
  { to: '/comments',  icon: '◈', label: 'Комментарии' },
  { to: '/leads',     icon: '◉', label: 'Лиды' },
  { to: '/accounts',  icon: '⬢', label: 'Аккаунты' },
];

const ADMIN_NAV = [
  { to: '/users',     icon: '◎', label: 'Пользователи' },
  { to: '/settings',  icon: '⚙', label: 'Настройки' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Барак өзгөргөндө меню жабылсын
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 10px', borderRadius: 'var(--radius)',
    color: isActive ? 'var(--text)' : 'var(--text3)',
    background: isActive ? 'var(--bg3)' : 'transparent',
    fontSize: 13, fontWeight: isActive ? 500 : 400,
    transition: 'all 0.1s', marginBottom: 2,
    borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
  });

  const sidebar = (
    <>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: 'var(--accent)', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>⬡</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>Instagram CRM</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Lead Manager</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        <div style={{ marginBottom: 4 }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => navLinkStyle(isActive)}>
              <span style={{ fontSize: 15 }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </div>

        {user?.role === 'admin' && (
          <>
            <div style={{ fontSize: 10, color: 'var(--text3)', padding: '10px 10px 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Администрирование
            </div>
            {ADMIN_NAV.map(({ to, icon, label }) => (
              <NavLink key={to} to={to} style={({ isActive }) => navLinkStyle(isActive)}>
                <span style={{ fontSize: 15 }}>{icon}</span>
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', background: 'var(--bg4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, color: 'var(--accent)',
          }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{user?.role}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
          Выйти
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Desktop sidebar */}
      <aside className="sidebar-desktop" style={{
        width: 220, background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'fixed', top: 0, left: 0, bottom: 0,
      }}>
        {sidebar}
      </aside>

      {/* Mobile header */}
      <div className="mobile-header" style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 56,
        background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        display: 'none', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', zIndex: 90,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, background: 'var(--accent)', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
          }}>⬡</div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Instagram CRM</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            background: 'transparent', border: 'none', color: 'var(--text)',
            fontSize: 24, padding: '4px 8px', cursor: 'pointer',
          }}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="mobile-overlay"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 95 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside className="sidebar-mobile" style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 260,
        background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        display: 'none', flexDirection: 'column', zIndex: 99,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.2s ease',
      }}>
        {sidebar}
      </aside>

      {/* Main */}
      <main className="main-content" style={{ flex: 1, marginLeft: 220, overflowY: 'auto', minHeight: '100%' }}>
        {children}
      </main>
    </div>
  );
}
