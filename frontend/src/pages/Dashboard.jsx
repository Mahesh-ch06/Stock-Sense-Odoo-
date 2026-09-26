// Dashboard — GET /dashboard/kpis
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import API from '../api';

const KPI_CONFIG = [
  { key: 'total_products',      label: 'Total Products',     icon: '📦', color: 'blue',   badge: null },
  { key: 'low_stock',           label: 'Low Stock',          icon: '⚠️',  color: 'yellow', badge: 'Low Stock' },
  { key: 'out_of_stock',        label: 'Out of Stock',       icon: '🚫', color: 'red',    badge: 'Critical' },
  { key: 'pending_receipts',    label: 'Pending Receipts',   icon: '📥', color: 'green',  badge: null },
  { key: 'pending_deliveries',  label: 'Pending Deliveries', icon: '🚚', color: 'orange', badge: null },
  { key: 'pending_transfers',   label: 'Pending Transfers',  icon: '🔄', color: 'blue',   badge: null },
  { key: 'backorders',          label: 'Backorders',         icon: '⏳', color: 'yellow', badge: 'Attention' },
];

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [warehouse, setWarehouse] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchKpis(); }, [warehouse]);

  async function fetchKpis() {
    setLoading(true);
    try {
      const params = warehouse ? { warehouse_id: warehouse } : {};
      const { data } = await API.get('/dashboard/kpis', { params });
      setKpis(data);
    } catch {
      setError('Failed to load KPIs.');
    } finally { setLoading(false); }
  }

  return (
    <Layout title="Dashboard">
      <div className="page-header">
        <div>
          <div className="page-title">Overview</div>
          <div className="page-sub">Real-time stock & operations summary</div>
        </div>
        <select
          id="dashboard-warehouse-filter"
          className="form-control"
          style={{ width: 'auto', minWidth: 180 }}
          value={warehouse}
          onChange={e => setWarehouse(e.target.value)}
        >
          <option value="">All Warehouses</option>
          <option value="1">Warehouse A</option>
          <option value="2">Warehouse B</option>
        </select>
      </div>

      {loading && <div className="spinner-page" />}
      {error   && <div className="alert-error">{error}</div>}

      {kpis && (
        <>
          <div className="kpi-grid">
            {KPI_CONFIG.map(({ key, label, color, badge }) => (
              <div key={key} className={`kpi-card ${color}`}>
                <div className="kpi-label">{label}</div>
                <div className="kpi-value">{kpis[key] ?? '—'}</div>
                {badge && (
                  <span className={`kpi-badge ${color}`}>{badge}</span>
                )}
              </div>
            ))}
          </div>

          {/* Quick-action cards */}
          <div className="section-title">Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
            {[
              { label: 'New Receipt',   icon: '📥', href: '/receipts',   desc: 'Record incoming stock' },
              { label: 'New Delivery',  icon: '🚚', href: '/deliveries', desc: 'Schedule an outgoing order' },
              { label: 'New Transfer',  icon: '🔄', href: '/transfers',  desc: 'Move stock between locations' },
              { label: 'View Products', icon: '📦', href: '/products',   desc: 'Manage your catalog' },
            ].map(q => (
              <a key={q.href} href={q.href} className="card" style={{ display: 'block', transition: 'border-color 0.2s', cursor: 'pointer', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--red)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{q.icon}</div>
                <div className="fw-600 text-head">{q.label}</div>
                <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>{q.desc}</div>
              </a>
            ))}
          </div>
        </>
      )}
    </Layout>
  );
}
