// Shared Layout: Sidebar + Topbar shell
import { NavLink, useNavigate } from 'react-router-dom';

const NAV = [
  { to: '/dashboard',  icon: '📊', label: 'Dashboard' },
  { to: '/products',   icon: '📦', label: 'Products' },
  { to: '/receipts',   icon: '📥', label: 'Receipts' },
  { to: '/deliveries', icon: '🚚', label: 'Deliveries' },
  { to: '/transfers',  icon: '🔄', label: 'Transfers' },
  { to: '/ledger',     icon: '📋', label: 'Move History' },
];

export default function Layout({ children, title }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">S</div>
          <div>
            <div className="logo-text">StockSense</div>
            <div className="logo-sub">Inventory</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Menu</div>
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">{(user.name || 'U')[0].toUpperCase()}</div>
          <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name">{user.name || 'User'}</div>
            <div className="user-role">{user.role || 'Warehouse Staff'}</div>
          </div>
          <button className="btn-icon" onClick={handleLogout} title="Logout">⏻</button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-title">{title}</div>
          <div className="topbar-actions">
            <div className="flex-center gap-8" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              <span>📍</span>
              <span>Warehouse A</span>
            </div>
            <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
              {(user.name || 'U')[0].toUpperCase()}
            </div>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
