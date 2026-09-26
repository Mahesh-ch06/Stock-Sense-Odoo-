// Transfers list — GET /transfers, POST /transfers
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import API from '../api';

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({ from_location: '', to_location: '', notes: '' });
  const [lines, setLines]         = useState([{ product_id: '', qty: 1 }]);

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/transfers');
      setTransfers(data);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTransfers(); }, [fetchTransfers]);

  function addLine() { setLines(l => [...l, { product_id: '', qty: 1 }]); }
  function removeLine(i) { setLines(l => l.filter((_, idx) => idx !== i)); }
  function setLine(i, key, val) { setLines(l => l.map((ln, idx) => idx === i ? { ...ln, [key]: val } : ln)); }

  async function handleCreate(e) {
    e.preventDefault(); setSaving(true);
    try {
      await API.post('/transfers', { ...form, lines });
      setShowModal(false); fetchTransfers();
      setForm({ from_location: '', to_location: '', notes: '' });
      setLines([{ product_id: '', qty: 1 }]);
    } catch (err) { alert(err.response?.data?.message || 'Create failed.'); }
    finally { setSaving(false); }
  }

  return (
    <Layout title="Transfers">
      <div className="page-header">
        <div>
          <div className="page-title">Transfers</div>
          <div className="page-sub">Internal stock movements between locations</div>
        </div>
        <button id="new-transfer-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>＋ New Transfer</button>
      </div>

      {loading && <div className="spinner-page" />}
      {!loading && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reference</th><th>From</th><th>To</th><th>Status</th><th>Created</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transfers.length === 0 && (
                <tr><td colSpan={6}>
                  <div className="empty-state"><div className="empty-icon">🔄</div><div className="empty-text">No transfers found</div></div>
                </td></tr>
              )}
              {transfers.map(t => (
                <tr key={t.id}>
                  <td className="td-mono">{t.reference || `TRF/${t.id}`}</td>
                  <td>{t.from_location || '—'}</td>
                  <td>{t.to_location   || '—'}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td className="text-muted">{t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</td>
                  <td><Link to={`/transfers/${t.id}`} className="btn btn-ghost btn-sm">View →</Link></td>
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
              <div className="modal-title">New Transfer</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-grid" style={{ marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">From Location</label>
                  <input id="transfer-from" className="form-control" placeholder="e.g. WH/Stock"
                    value={form.from_location} onChange={e => setForm(f => ({ ...f, from_location: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">To Location</label>
                  <input id="transfer-to" className="form-control" placeholder="e.g. WH/Packing Zone"
                    value={form.to_location} onChange={e => setForm(f => ({ ...f, to_location: e.target.value }))} required />
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
                <button id="transfer-create-btn" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Creating…</> : 'Create Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
