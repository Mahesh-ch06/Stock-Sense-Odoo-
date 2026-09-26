// Receipts list — GET /receipts, POST /receipts with Lucide icons
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import API from '../api';
import {
  ArrowDownToLine,
  Plus,
  ArrowRight,
  X,
  Trash2,
  Building,
} from 'lucide-react';

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
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  function addLine() {
    setLines((l) => [...l, { product_id: '', qty: 1 }]);
  }
  function removeLine(i) {
    setLines((l) => l.filter((_, idx) => idx !== i));
  }
  function setLine(i, key, val) {
    setLines((l) =>
      l.map((ln, idx) => (idx === i ? { ...ln, [key]: val } : ln))
    );
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await API.post('/receipts', { ...form, lines });
      setShowModal(false);
      fetchReceipts();
      setForm({ supplier: '', warehouse_id: '1', notes: '' });
      setLines([{ product_id: '', qty: 1 }]);
    } catch (err) {
      alert(err.response?.data?.message || 'Create failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout title="Receipts">
      <div className="page-header">
        <div>
          <div className="page-title">Inbound Receipts</div>
          <div className="page-sub">Receive shipments and restock inventory from suppliers</div>
        </div>
        <button
          id="new-receipt-btn"
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>New Receipt</span>
        </button>
      </div>

      <div className="filter-bar">
        <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Status Filter:</label>
        {STATUS_OPTS.map((s) => (
          <button
            key={s}
            id={`receipt-filter-${s || 'all'}`}
            className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setStatus(s)}
            style={{ textTransform: 'capitalize' }}
          >
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
                <th>Reference</th>
                <th>Supplier</th>
                <th>Status</th>
                <th>Warehouse</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {receipts.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
                        <ArrowDownToLine size={36} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <div className="empty-text">No inbound receipts found</div>
                    </div>
                  </td>
                </tr>
              )}
              {receipts.map((r) => (
                <tr key={r.id}>
                  <td className="td-mono">{r.reference || `REC/${r.id}`}</td>
                  <td className="fw-600 text-head">{r.supplier || '—'}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>{r.warehouse_name || `Warehouse ${r.warehouse_id}`}</td>
                  <td className="text-muted">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <Link
                      to={`/receipts/${r.id}`}
                      className="btn btn-ghost btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <span>View</span>
                      <ArrowRight size={12} />
                    </Link>
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
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">New Inbound Receipt</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-grid" style={{ marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Supplier Name *</label>
                  <input
                    id="receipt-supplier"
                    className="form-control"
                    placeholder="e.g. Acme Supplies Ltd"
                    value={form.supplier}
                    onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Destination Warehouse</label>
                  <select
                    className="form-control"
                    value={form.warehouse_id}
                    onChange={(e) => setForm((f) => ({ ...f, warehouse_id: e.target.value }))}
                  >
                    <option value="1">Central Hub (Warehouse A)</option>
                    <option value="2">Secondary Storage (Warehouse B)</option>
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Notes</label>
                <input
                  className="form-control"
                  placeholder="Optional delivery notes or tracking info"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div className="section-title">Item Lines</div>
              <div className="table-wrap lines-table" style={{ marginBottom: 12 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Product ID</th>
                      <th>Quantity</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((ln, i) => (
                      <tr key={i}>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={ln.product_id}
                            onChange={(e) => setLine(i, 'product_id', e.target.value)}
                            placeholder="Product ID (e.g. 1)"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            className="form-control"
                            value={ln.qty}
                            onChange={(e) => setLine(i, 'qty', e.target.value)}
                            required
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => removeLine(i)}
                            style={{ color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={addLine}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 14 }}
              >
                <Plus size={13} />
                <span>Add Item Line</span>
              </button>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  id="receipt-create-btn"
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner" /> Creating…
                    </>
                  ) : (
                    'Create Receipt'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
