// Shared Layout: Sidebar + Topbar shell with Lucide icons
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
        <div className="sidebar-logo">
          <div className="logo-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Boxes size={18} strokeWidth={2.5} />
          </div>
          <div>
            <div className="logo-text">StockSense</div>
            <div className="logo-sub">Inventory ERP</div>
          </div>
        </div>

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
                <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} strokeWidth={2} />
                </span>
                <span>{n.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">{(user.name || 'U')[0].toUpperCase()}</div>
          <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name">{user.name || 'User'}</div>
            <div className="user-role">{user.role || 'Warehouse Staff'}</div>
          </div>
          <button
            className="btn-icon"
            onClick={handleLogout}
            title="Sign Out"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <LogOut size={16} strokeWidth={2} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-title">{title}</div>
          <div className="topbar-actions">
            <div className="flex-center gap-8" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              <MapPin size={15} strokeWidth={2} style={{ color: 'var(--primary)' }} />
              <span>Main Logistics Hub</span>
            </div>
            <div className="avatar" style={{ width: 30, height: 30, fontSize: 12, fontWeight: 600 }}>
              {(user.name || 'U')[0].toUpperCase()}
            </div>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
