// Deliveries list — GET /deliveries, POST /deliveries
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import API from '../api';

const STATUS_OPTS = ['', 'draft', 'picking', 'packing', 'ready', 'done', 'canceled'];

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [status, setStatus]         = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState({ customer: '', warehouse_id: '1', notes: '' });
  const [lines, setLines]           = useState([{ product_id: '', qty: 1 }]);

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const params = status ? { status } : {};
      const { data } = await API.get('/deliveries', { params });
      setDeliveries(data);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  function addLine() { setLines(l => [...l, { product_id: '', qty: 1 }]); }
  function removeLine(i) { setLines(l => l.filter((_, idx) => idx !== i)); }
  function setLine(i, key, val) { setLines(l => l.map((ln, idx) => idx === i ? { ...ln, [key]: val } : ln)); }

  async function handleCreate(e) {
    e.preventDefault(); setSaving(true);
    try {
      await API.post('/deliveries', { ...form, lines });
      setShowModal(false); fetchDeliveries();
      setForm({ customer: '', warehouse_id: '1', notes: '' });
      setLines([{ product_id: '', qty: 1 }]);
    } catch (err) { alert(err.response?.data?.message || 'Create failed.'); }
    finally { setSaving(false); }
  }

  return (
    <Layout title="Deliveries">
      <div className="page-header">
        <div>
          <div className="page-title">Deliveries</div>
          <div className="page-sub">Outgoing stock operations</div>
        </div>
        <button id="new-delivery-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>＋ New Delivery</button>
      </div>

      <div className="filter-bar">
        <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Status:</label>
        {STATUS_OPTS.map(s => (
          <button key={s} id={`delivery-filter-${s || 'all'}`}
            className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setStatus(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading && <div className="spinner-page" />}
      {!loading && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reference</th><th>Customer</th><th>Status</th>
                <th>Warehouse</th><th>Created</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.length === 0 && (
                <tr><td colSpan={6}>
                  <div className="empty-state"><div className="empty-icon">🚚</div><div className="empty-text">No deliveries found</div></div>
                </td></tr>
              )}
              {deliveries.map(d => (
                <tr key={d.id}>
                  <td className="td-mono">{d.reference || `DEL/${d.id}`}</td>
                  <td className="fw-600 text-head">{d.customer || '—'}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>{d.warehouse || '—'}</td>
                  <td className="text-muted">{d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}</td>
                  <td><Link to={`/deliveries/${d.id}`} className="btn btn-ghost btn-sm">View →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">New Delivery</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-grid" style={{ marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Customer</label>
                  <input id="delivery-customer" className="form-control" placeholder="Customer name"
                    value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Warehouse ID</label>
                  <input className="form-control" value={form.warehouse_id}
                    onChange={e => setForm(f => ({ ...f, warehouse_id: e.target.value }))} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Notes</label>
                <input className="form-control" value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="section-title">Lines</div>
              <div className="table-wrap lines-table" style={{ marginBottom: 12 }}>
                <table>
                  <thead><tr><th>Product ID</th><th>Qty</th><th></th></tr></thead>
                  <tbody>
                    {lines.map((ln, i) => (
                      <tr key={i}>
                        <td><input type="number" value={ln.product_id}
                          onChange={e => setLine(i, 'product_id', e.target.value)} placeholder="Product ID" /></td>
                        <td><input type="number" min="1" value={ln.qty}
                          onChange={e => setLine(i, 'qty', e.target.value)} /></td>
                        <td><button type="button" className="btn-icon" onClick={() => removeLine(i)}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addLine}>＋ Add Line</button>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="delivery-create-btn" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Creating…</> : 'Create Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
