// Shared Layout: Modern Shadcn-styled Sidebar + Shell
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  Truck,
  ArrowLeftRight,
  Scale,
  Building2,
  ClipboardList,
  LogOut,
  MapPin,
  Boxes,
  ChevronRight,
  ChevronsUpDown,
  Search,
} from 'lucide-react';

const NAV = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products',    icon: Package,         label: 'Products' },
  { to: '/receipts',    icon: ArrowDownToLine, label: 'Receipts' },
  { to: '/deliveries',  icon: Truck,           label: 'Deliveries' },
  { to: '/transfers',   icon: ArrowLeftRight,  label: 'Transfers' },
  { to: '/adjustments', icon: Scale,           label: 'Adjustments' },
  { to: '/warehouses',  icon: Building2,       label: 'Warehouses' },
  { to: '/ledger',      icon: ClipboardList,   label: 'Move History' },
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
        {/* Workspace Switcher Header */}
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              className="logo-icon"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: '#18181b',
                border: '1px solid #27272a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fafafa',
              }}
            >
              <Boxes size={15} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-head)', lineHeight: 1.2 }}>StockSense</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Enterprise ERP</div>
            </div>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>
            <ChevronsUpDown size={14} />
          </span>
        </div>

        {/* Navigation list */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Operations</div>
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">
                  <Icon size={16} strokeWidth={2} />
                </span>
                <span>{n.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User profile footer */}
        <div className="sidebar-footer">
          <div className="avatar" style={{ background: '#27272a', borderColor: '#3f3f46' }}>
            {(user.name || 'U')[0].toUpperCase()}
          </div>
          <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name || 'User'}
            </div>
            <div className="user-role">{user.role || 'Staff'}</div>
          </div>
          <button
            className="btn-icon"
            onClick={handleLogout}
            title="Sign Out"
            style={{ width: 28, height: 28 }}
          >
            <LogOut size={14} strokeWidth={2} />
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="main-area">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)' }}>Operations</span>
            <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
            <span className="topbar-title">{title}</span>
          </div>

          <div className="topbar-actions">
            {/* Search command bar badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 10px',
                borderRadius: 6,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                fontSize: 12,
              }}
            >
              <Search size={13} />
              <span>Search...</span>
              <kbd
                style={{
                  fontSize: 10,
                  padding: '1px 4px',
                  borderRadius: 4,
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                ⌘K
              </kbd>
            </div>

            {/* Warehouse Status Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 9999,
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                color: 'var(--emerald)',
                fontSize: 11.5,
                fontWeight: 500,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--emerald)',
                  display: 'inline-block',
                }}
              />
              <span>Chicago Central Hub</span>
            </div>

            {/* User Avatar */}
            <div
              className="avatar"
              style={{
                width: 28,
                height: 28,
                fontSize: 11,
                background: '#27272a',
                borderColor: '#3f3f46',
              }}
            >
              {(user.name || 'U')[0].toUpperCase()}
            </div>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
