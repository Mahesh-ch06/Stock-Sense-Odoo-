// Dashboard — GET /dashboard/kpis with Lucide icons & enhanced UI
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import API from '../api';
import {
  Package,
  AlertTriangle,
  Ban,
  ArrowDownToLine,
  Truck,
  ArrowLeftRight,
  Clock,
  Scale,
  Building2,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

const KPI_CONFIG = [
  { key: 'total_products',     label: 'Total Products',     icon: Package,         color: 'blue',   badge: null },
  { key: 'low_stock',          label: 'Low Stock',          icon: AlertTriangle,   color: 'yellow', badge: 'Warning' },
  { key: 'out_of_stock',       label: 'Out of Stock',       icon: Ban,             color: 'red',    badge: 'Critical' },
  { key: 'pending_receipts',   label: 'Pending Receipts',   icon: ArrowDownToLine, color: 'green',  badge: null },
  { key: 'pending_deliveries', label: 'Pending Deliveries', icon: Truck,           color: 'orange', badge: null },
  { key: 'pending_transfers',  label: 'Pending Transfers',  icon: ArrowLeftRight,  color: 'blue',   badge: null },
  { key: 'backorders',         label: 'Backorders',         icon: Clock,           color: 'yellow', badge: 'Attention' },
];

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [warehouse, setWarehouse] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchKpis();
  }, [warehouse]);

  async function fetchKpis() {
    setLoading(true);
    try {
      const params = warehouse ? { warehouse_id: warehouse } : {};
      const { data } = await API.get('/dashboard/kpis', { params });
      setKpis(data);
    } catch {
      setError('Failed to load KPIs.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout title="Dashboard">
      <div className="page-header">
        <div>
          <div className="page-title">Operational Overview</div>
          <div className="page-sub">Real-time inventory levels, pending workflows, and velocity</div>
        </div>
        <div className="flex-center" style={{ gap: 10 }}>
          <select
            id="dashboard-warehouse-filter"
            className="form-control"
            style={{ width: 'auto', minWidth: 180 }}
            value={warehouse}
            onChange={(e) => setWarehouse(e.target.value)}
          >
            <option value="">All Warehouses</option>
            <option value="1">Central Hub (Warehouse A)</option>
            <option value="2">Secondary Storage (Warehouse B)</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={fetchKpis} title="Refresh metrics">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {loading && <div className="spinner-page" />}
      {error && <div className="alert-error">{error}</div>}

      {kpis && (
        <>
          <div className="kpi-grid">
            {KPI_CONFIG.map(({ key, label, icon: Icon, color, badge }) => (
              <div key={key} className={`kpi-card ${color}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="kpi-label">{label}</div>
                  <div style={{ opacity: 0.8 }}>
                    <Icon size={18} strokeWidth={2} />
                  </div>
                </div>
                <div className="kpi-value">{kpis[key] ?? '—'}</div>
                {badge && <span className={`kpi-badge ${color}`}>{badge}</span>}
              </div>
            ))}
          </div>

          {/* Quick-action cards */}
          <div className="section-title" style={{ marginTop: 28, marginBottom: 14 }}>
            Quick Operations
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { label: 'New Inbound Receipt',   icon: ArrowDownToLine, href: '/receipts',    desc: 'Receive stock from vendors' },
              { label: 'New Delivery Order',    icon: Truck,           href: '/deliveries',  desc: 'Dispatch goods to customers' },
              { label: 'Internal Stock Transfer',icon: ArrowLeftRight,  href: '/transfers',   desc: 'Relocate between storage bins' },
              { label: 'Cycle Count Adjustment',icon: Scale,           href: '/adjustments', desc: 'Audit & reconcile physical counts' },
              { label: 'Manage Warehouses',     icon: Building2,       href: '/warehouses',  desc: 'Configure locations and zones' },
              { label: 'Product Catalog',       icon: Package,         href: '/products',    desc: 'Manage SKUs, units & costs' },
            ].map((q) => {
              const Icon = q.icon;
              return (
                <Link
                  key={q.href}
                  to={q.href}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-hover)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)',
                    }}
                  >
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <div className="fw-600 text-head" style={{ fontSize: 14 }}>{q.label}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{q.desc}</div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </Layout>
  );
}
