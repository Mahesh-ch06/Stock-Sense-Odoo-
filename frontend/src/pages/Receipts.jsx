// Receipts list — GET /receipts, POST /receipts
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import API from '../api';

const STATUS_OPTS = ['', 'draft', 'waiting', 'ready', 'done', 'backorder', 'canceled'];

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [status, setStatus]     = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ supplier: '', warehouse_id: '1', notes: '' });
  const [lines, setLines]       = useState([{ product_id: '', qty: 1 }]);

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const params = status ? { status } : {};
      const { data } = await API.get('/receipts', { params });
      setReceipts(data);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { fetchReceipts(); }, [fetchReceipts]);

  function addLine() { setLines(l => [...l, { product_id: '', qty: 1 }]); }
  function removeLine(i) { setLines(l => l.filter((_, idx) => idx !== i)); }
  function setLine(i, key, val) { setLines(l => l.map((ln, idx) => idx === i ? { ...ln, [key]: val } : ln)); }

  async function handleCreate(e) {
    e.preventDefault(); setSaving(true);
    try {
      await API.post('/receipts', { ...form, lines });
      setShowModal(false);
      fetchReceipts();
      setForm({ supplier: '', warehouse_id: '1', notes: '' });
      setLines([{ product_id: '', qty: 1 }]);
    } catch (err) { alert(err.response?.data?.message || 'Create failed.'); }
    finally { setSaving(false); }
  }

  return (
    <Layout title="Receipts">
      <div className="page-header">
        <div>
          <div className="page-title">Receipts</div>
          <div className="page-sub">Incoming stock operations</div>
        </div>
        <button id="new-receipt-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>＋ New Receipt</button>
      </div>

      <div className="filter-bar">
        <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Status:</label>
        {STATUS_OPTS.map(s => (
          <button key={s} id={`receipt-filter-${s || 'all'}`}
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
                <th>Reference</th><th>Supplier</th><th>Status</th>
                <th>Warehouse</th><th>Created</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {receipts.length === 0 && (
                <tr><td colSpan={6}>
                  <div className="empty-state"><div className="empty-icon">📥</div><div className="empty-text">No receipts found</div></div>
                </td></tr>
              )}
              {receipts.map(r => (
                <tr key={r.id}>
                  <td className="td-mono">{r.reference || `RCP/${r.id}`}</td>
                  <td className="fw-600 text-head">{r.supplier || '—'}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{r.warehouse || '—'}</td>
                  <td className="text-muted">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                  <td>
                    <Link to={`/receipts/${r.id}`} className="btn btn-ghost btn-sm">View →</Link>
                  </td>
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
              <div className="modal-title">New Receipt</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-grid" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Supplier</label>
                  <input id="receipt-supplier" className="form-control" placeholder="Supplier name"
                    value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Warehouse ID</label>
                  <input id="receipt-warehouse" className="form-control" value={form.warehouse_id}
                    onChange={e => setForm(f => ({ ...f, warehouse_id: e.target.value }))} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
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
                <button id="receipt-create-btn" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Creating…</> : 'Create Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
