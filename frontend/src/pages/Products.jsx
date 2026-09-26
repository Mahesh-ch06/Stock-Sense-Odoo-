// Products — CRUD: GET/POST/PATCH/DELETE /products
import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import API from '../api';

const EMPTY = { name: '', sku: '', category: '', unit: '', unit_cost: '', reorder_point: '' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null); // null = add, else product obj
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/products', { params: { search, category } });
      setProducts(data);
    } catch { setError('Failed to load products.'); }
    finally  { setLoading(false); }
  }, [search, category]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  function openAdd() { setEditing(null); setForm(EMPTY); setShowModal(true); }
  function openEdit(p) {
    setEditing(p);
    setForm({ name: p.name, sku: p.sku, category: p.category, unit: p.unit,
              unit_cost: p.unit_cost, reorder_point: p.reorder_point });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await API.patch(`/products/${editing.id}`, form);
      else         await API.post('/products', form);
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this product?')) return;
    try {
      await API.delete(`/products/${id}`);
      fetchProducts();
    } catch { alert('Delete failed.'); }
  }

  return (
    <Layout title="Products">
      <div className="page-header">
        <div>
          <div className="page-title">Products</div>
          <div className="page-sub">Manage your product catalog</div>
        </div>
        <button id="add-product-btn" className="btn btn-primary" onClick={openAdd}>＋ Add Product</button>
      </div>

      <div className="filter-bar">
        <div className="search-box" style={{ maxWidth: 280 }}>
          <span className="search-icon">🔍</span>
          <input id="product-search" placeholder="Search name or SKU…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select id="product-category-filter" value={category} onChange={e => setCategory(e.target.value)}
          style={{ padding: '7px 10px', background: 'var(--bg-hover)', border: '1px solid var(--border)',
                   borderRadius: 'var(--radius-sm)', color: 'var(--text-head)', fontSize: 12.5 }}>
          <option value="">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="furniture">Furniture</option>
          <option value="consumables">Consumables</option>
          <option value="raw_materials">Raw Materials</option>
        </select>
        <button className="btn btn-ghost btn-sm" onClick={fetchProducts}>↻ Refresh</button>
      </div>

      {loading && <div className="spinner-page" />}
      {!loading && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th><th>Name</th><th>Category</th>
                <th>Unit</th><th>Unit Cost</th><th>On-Hand Stock</th>
                <th>Reorder Point</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr><td colSpan={8} className="empty-state">
                  <div className="empty-icon">📦</div>
                  <div className="empty-text">No products found</div>
                </td></tr>
              )}
              {products.map(p => (
                <tr key={p.id}>
                  <td className="td-mono">{p.sku}</td>
                  <td className="fw-600 text-head">{p.name}</td>
                  <td>{p.category}</td>
                  <td>{p.unit}</td>
                  <td>${Number(p.unit_cost).toFixed(2)}</td>
                  <td>
                    <span className={p.on_hand_stock === 0 ? 'text-red fw-600'
                      : p.on_hand_stock <= p.reorder_point ? 'text-yellow fw-600' : ''}>
                      {p.on_hand_stock}
                    </span>
                  </td>
                  <td>{p.reorder_point}</td>
                  <td>
                    <div className="td-actions">
                      <button className="btn-icon" onClick={() => openEdit(p)} title="Edit">✏️</button>
                      <button className="btn-icon" onClick={() => handleDelete(p.id)} title="Delete"
                        style={{ color: 'var(--red)' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Edit Product' : 'Add Product'}</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-grid" style={{ marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input id="product-name" className="form-control" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU *</label>
                  <input id="product-sku" className="form-control" value={form.sku}
                    onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input id="product-category" className="form-control" value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <input id="product-unit" className="form-control" value={form.unit}
                    onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="pcs / kg / L" />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Cost</label>
                  <input id="product-unit-cost" type="number" step="0.01" min="0" className="form-control"
                    value={form.unit_cost} onChange={e => setForm(f => ({ ...f, unit_cost: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Reorder Point</label>
                  <input id="product-reorder" type="number" min="0" className="form-control"
                    value={form.reorder_point} onChange={e => setForm(f => ({ ...f, reorder_point: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="product-save-btn" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Saving…</> : (editing ? 'Update' : 'Add Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
