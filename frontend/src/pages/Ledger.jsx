// Ledger / Move History — GET /ledger?filters with Lucide icons
import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import API from '../api';
import {
  ClipboardList,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Search,
  RotateCcw,
} from 'lucide-react';

const TYPE_OPTS = ['', 'receipt', 'delivery', 'transfer', 'adjustment'];

export default function Ledger() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    product_id: '',
    location_id: '',
    warehouse_id: '',
    type: '',
    from: '',
    to: '',
  });

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '')
      );
      const { data } = await API.get('/ledger', { params });
      setEntries(data);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  function setFilter(key, val) {
    setFilters((f) => ({ ...f, [key]: val }));
  }

  return (
    <Layout title="Move History">
      <div className="page-header">
        <div>
          <div className="page-title">Stock Ledger & Audit Trail</div>
          <div className="page-sub">Immutable, double-entry tracking of every inventory movement</div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={fetchLedger}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={13} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-box" style={{ maxWidth: 220, display: 'flex', alignItems: 'center' }}>
          <span className="search-icon" style={{ display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
          </span>
          <input
            id="ledger-product-filter"
            placeholder="Search product…"
            value={filters.product_id}
            onChange={(e) => setFilter('product_id', e.target.value)}
          />
        </div>

        <select
          id="ledger-type-filter"
          className="form-control"
          style={{ width: 'auto', minWidth: 140 }}
          value={filters.type}
          onChange={(e) => setFilter('type', e.target.value)}
        >
          {TYPE_OPTS.map((t) => (
            <option key={t} value={t}>
              {t ? `${t.charAt(0).toUpperCase() + t.slice(1)} Movements` : 'All Movement Types'}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>From:</span>
          <input
            id="ledger-from"
            type="date"
            className="form-control"
            style={{ width: 'auto' }}
            value={filters.from}
            onChange={(e) => setFilter('from', e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>To:</span>
          <input
            id="ledger-to"
            type="date"
            className="form-control"
            style={{ width: 'auto' }}
            value={filters.to}
            onChange={(e) => setFilter('to', e.target.value)}
          />
        </div>

        <button
          className="btn btn-ghost btn-sm"
          onClick={() =>
            setFilters({
              product_id: '',
              location_id: '',
              warehouse_id: '',
              type: '',
              from: '',
              to: '',
            })
          }
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>
      </div>

      {loading && <div className="spinner-page" />}

      {!loading && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Location / Bin</th>
                <th>Stock Delta</th>
                <th>Operation Type</th>
                <th>Operator</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
                        <ClipboardList size={36} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <div className="empty-text">No ledger entries matching criteria</div>
                    </div>
                  </td>
                </tr>
              )}
              {entries.map((e, i) => {
                const deltaPositive = Number(e.delta) > 0;
                return (
                  <tr key={i}>
                    <td className="text-muted" style={{ fontSize: 12 }}>
                      {e.date ? new Date(e.date).toLocaleString() : '—'}
                    </td>
                    <td className="fw-600 text-head">{e.product_name || e.product_id}</td>
                    <td className="td-mono">{e.sku || '—'}</td>
                    <td>{e.location || '—'}</td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: deltaPositive ? 'var(--green)' : 'var(--red)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {deltaPositive ? (
                          <TrendingUp size={13} strokeWidth={2.5} />
                        ) : (
                          <TrendingDown size={13} strokeWidth={2.5} />
                        )}
                        {deltaPositive ? '+' : ''}
                        {e.delta}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-draft" style={{ textTransform: 'capitalize' }}>
                        {e.type || 'Movement'}
                      </span>
                    </td>
                    <td className="text-muted">{e.done_by || 'System Staff'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 12, textAlign: 'right' }}>
        {entries.length} immutable ledger record{entries.length !== 1 ? 's' : ''} logged
      </div>
    </Layout>
  );
}
