// Inventory Adjustments & Stock Reconciliation
import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import API from '../api';

export default function Adjustments() {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // New adjustment modal state
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({
    product_id: '',
    location_id: '',
    counted_qty: '',
  });

  const fetchAdjustments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/adjustments');
      setAdjustments(data);
    } catch (err) {
      console.error('Failed to load adjustments', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdjustments();
  }, [fetchAdjustments]);

  // Load products and locations when opening modal
  async function openNewAdjustment() {
    setForm({ product_id: '', location_id: '', counted_qty: '' });
    setShowModal(true);
    try {
      const [prodRes, whRes] = await Promise.all([
        API.get('/products'),
        API.get('/warehouses'),
      ]);
      setProducts(prodRes.data || []);

      // Fetch locations across warehouses
      const whList = whRes.data || [];
      const allLocPromises = whList.map((w) =>
        API.get(`/warehouses/${w.id}/locations`).then((res) =>
          res.data.map((loc) => ({ ...loc, warehouse_name: w.name }))
        )
      );
      const locResults = await Promise.all(allLocPromises);
      const flatLocs = locResults.flat();
      setLocations(flatLocs);

      // Default selections if available
      if (prodRes.data?.length > 0) {
        setForm((f) => ({ ...f, product_id: prodRes.data[0].id }));
      }
      if (flatLocs.length > 0) {
        setForm((f) => ({ ...f, location_id: flatLocs[0].id }));
      }
    } catch (err) {
      console.error('Failed to load form options', err);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.product_id || !form.location_id || form.counted_qty === '') {
      alert('Please fill out all required fields.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        product_id: parseInt(form.product_id, 10),
        location_id: parseInt(form.location_id, 10),
        counted_qty: parseInt(form.counted_qty, 10),
      };
      const { data } = await API.post('/adjustments', payload);
      alert(data.message || 'Adjustment applied successfully.');
      setShowModal(false);
      fetchAdjustments();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit adjustment.');
    } finally {
      setSaving(false);
    }
  }

  const filtered = adjustments.filter((a) => {
    const term = search.toLowerCase();
    return (
      (a.product_name || '').toLowerCase().includes(term) ||
      (a.sku || '').toLowerCase().includes(term) ||
      (a.location_name || '').toLowerCase().includes(term) ||
      (a.created_by_name || '').toLowerCase().includes(term)
    );
  });

  return (
    <Layout title="Adjustments">
      <div className="page-header">
        <div>
          <div className="page-title">Inventory Adjustments</div>
          <div className="page-sub">Cycle counts, discrepancy reconciliation, and stock corrections</div>
        </div>
        <button id="new-adjustment-btn" className="btn btn-primary" onClick={openNewAdjustment}>
          ＋ Record Adjustment
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-box" style={{ maxWidth: 300 }}>
          <span className="search-icon">🔍</span>
          <input
            id="adjustment-search"
            placeholder="Search product, SKU, or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchAdjustments}>
          ↻ Refresh
        </button>
      </div>

      {loading && <div className="spinner-page" />}

      {!loading && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Location</th>
                <th>Recorded Stock</th>
                <th>Counted Stock</th>
                <th>Discrepancy (Delta)</th>
                <th>Adjusted By</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-state">
                    <div className="empty-icon">⚖️</div>
                    <div className="empty-text">No inventory adjustments found</div>
                  </td>
                </tr>
              )}
              {filtered.map((a) => {
                const delta = (a.counted_qty ?? 0) - (a.system_qty_at_time ?? 0);
                return (
                  <tr key={a.id}>
                    <td className="text-muted" style={{ fontSize: 12 }}>
                      {a.created_at ? new Date(a.created_at).toLocaleString() : '—'}
                    </td>
                    <td className="fw-600 text-head">{a.product_name}</td>
                    <td className="td-mono">{a.sku}</td>
                    <td>
                      <span className="badge badge-draft">📍 {a.location_name}</span>
                    </td>
                    <td className="text-muted">{a.system_qty_at_time ?? 0}</td>
                    <td className="fw-600 text-head">{a.counted_qty}</td>
                    <td>
                      {delta > 0 ? (
                        <span className="badge badge-done" style={{ color: 'var(--green)' }}>
                          +{delta} units (gain)
                        </span>
                      ) : delta < 0 ? (
                        <span className="badge badge-cancelled" style={{ color: 'var(--red)' }}>
                          {delta} units (loss)
                        </span>
                      ) : (
                        <span className="badge badge-draft">0 (matched)</span>
                      )}
                    </td>
                    <td className="text-muted">{a.created_by_name || 'System'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New Adjustment Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Record Physical Stock Adjustment</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Product *</label>
                  <select
                    id="adjustment-product"
                    className="form-control"
                    value={form.product_id}
                    onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}
                    required
                  >
                    <option value="">Select product…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) — Total stock: {p.total_stock ?? p.on_hand_stock ?? 0}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Location *</label>
                  <select
                    id="adjustment-location"
                    className="form-control"
                    value={form.location_id}
                    onChange={(e) => setForm((f) => ({ ...f, location_id: e.target.value }))}
                    required
                  >
                    <option value="">Select location…</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.warehouse_name ? `${loc.warehouse_name} → ` : ''}
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Physical Counted Quantity *</label>
                  <input
                    id="adjustment-counted-qty"
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="Enter actual physical count (e.g. 25)"
                    value={form.counted_qty}
                    onChange={(e) => setForm((f) => ({ ...f, counted_qty: e.target.value }))}
                    required
                  />
                  <div className="text-muted" style={{ fontSize: 11.5, marginTop: 4 }}>
                    Note: An audit record and a corresponding stock ledger movement will be logged automatically.
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  id="adjustment-save-btn"
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner" /> Reconciling…
                    </>
                  ) : (
                    'Apply Adjustment'
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
