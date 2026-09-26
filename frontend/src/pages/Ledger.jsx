// Ledger / Move History — GET /ledger?filters
import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import API from '../api';

const TYPE_OPTS = ['', 'receipt', 'delivery', 'transfer', 'adjustment'];

export default function Ledger() {
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filters, setFilters]   = useState({
    product_id: '', location_id: '', warehouse_id: '', type: '', from: '', to: '',
  });

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '')
      );
      const { data } = await API.get('/ledger', { params });
      setEntries(data);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchLedger(); }, [fetchLedger]);

  function setFilter(key, val) { setFilters(f => ({ ...f, [key]: val })); }

  return (
    <Layout title="Move History">
      <div className="page-header">
        <div>
          <div className="page-title">Move History</div>
          <div className="page-sub">Full stock movement ledger</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchLedger}>↻ Refresh</button>
      </div>

      <div className="filter-bar">
        <input
          id="ledger-product-filter"
          placeholder="Product search…"
          style={{ padding: '7px 10px', background: 'var(--bg-hover)', border: '1px solid var(--border)',
                   borderRadius: 'var(--radius-sm)', color: 'var(--text-head)', fontSize: 12.5 }}
          value={filters.product_id}
          onChange={e => setFilter('product_id', e.target.value)}
        />
        <select
          id="ledger-type-filter"
          style={{ padding: '7px 10px', background: 'var(--bg-hover)', border: '1px solid var(--border)',
                   borderRadius: 'var(--radius-sm)', color: 'var(--text-head)', fontSize: 12.5 }}
          value={filters.type}
          onChange={e => setFilter('type', e.target.value)}
        >
          {TYPE_OPTS.map(t => (
            <option key={t} value={t}>{t || 'All Types'}</option>
          ))}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>From</span>
          <input
            id="ledger-from"
            type="date"
            style={{ padding: '7px 10px', background: 'var(--bg-hover)', border: '1px solid var(--border)',
                     borderRadius: 'var(--radius-sm)', color: 'var(--text-head)', fontSize: 12.5 }}
            value={filters.from}
            onChange={e => setFilter('from', e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>To</span>
          <input
            id="ledger-to"
            type="date"
            style={{ padding: '7px 10px', background: 'var(--bg-hover)', border: '1px solid var(--border)',
                     borderRadius: 'var(--radius-sm)', color: 'var(--text-head)', fontSize: 12.5 }}
            value={filters.to}
            onChange={e => setFilter('to', e.target.value)}
          />
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setFilters({ product_id: '', location_id: '', warehouse_id: '', type: '', from: '', to: '' })}
        >
          Clear
        </button>
      </div>

      {loading && <div className="spinner-page" />}
      {!loading && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Product</th><th>SKU</th>
                <th>Location</th><th>Delta</th><th>Type</th><th>Done By</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr><td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <div className="empty-text">No movements found for these filters</div>
                  </div>
                </td></tr>
              )}
              {entries.map((e, i) => {
                const deltaPositive = e.delta > 0;
                return (
                  <tr key={i}>
                    <td className="text-muted">{e.date ? new Date(e.date).toLocaleString() : '—'}</td>
                    <td className="fw-600 text-head">{e.product_name || e.product_id}</td>
                    <td className="td-mono">{e.sku || '—'}</td>
                    <td>{e.location || '—'}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: deltaPositive ? 'var(--green)' : 'var(--red)' }}>
                        {deltaPositive ? '+' : ''}{e.delta}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-draft" style={{ textTransform: 'capitalize' }}>
                        {e.type || '—'}
                      </span>
                    </td>
                    <td className="text-muted">{e.done_by || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 12, textAlign: 'right' }}>
        {entries.length} record{entries.length !== 1 ? 's' : ''} found
      </div>
    </Layout>
  );
}
