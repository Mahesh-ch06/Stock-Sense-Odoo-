// Products — CRUD: GET/POST/PATCH/DELETE /products with Lucide icons
import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import API from '../api';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Package,
  X,
  AlertCircle,
  Tag,
} from 'lucide-react';

const EMPTY = { name: '', sku: '', category: '', unit: '', unit_cost: '', reorder_point: '' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/products', { params: { search, category } });
      setProducts(data);
    } catch {
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY);
    setShowModal(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku,
      category: p.category_name || p.category || '',
      unit: p.unit_of_measure || p.unit || '',
      unit_cost: p.unit_cost,
      reorder_point: p.reorder_point,
    });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await API.patch(`/products/${editing.id}`, form);
      else         await API.post('/products', form);
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await API.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed.');
    }
  }

  return (
    <Layout title="Products">
      <div className="page-header">
        <div>
          <div className="page-title">Products Catalog</div>
          <div className="page-sub">Track stock units, categories, reorder thresholds, and valuations</div>
        </div>
        <button id="add-product-btn" className="btn btn-primary" onClick={openAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} strokeWidth={2.5} />
          <span>Add Product</span>
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-box" style={{ maxWidth: 300, display: 'flex', alignItems: 'center' }}>
          <span className="search-icon" style={{ display: 'flex', alignItems: 'center' }}>
            <Search size={15} strokeWidth={2} style={{ color: 'var(--text-muted)' }} />
          </span>
          <input
            id="product-search"
            placeholder="Search SKU or product name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          id="product-category-filter"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="form-control"
          style={{ width: 'auto', minWidth: 160 }}
        >
          <option value="">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="furniture">Furniture</option>
          <option value="consumables">Consumables</option>
          <option value="raw_materials">Raw Materials</option>
        </select>
        <button className="btn btn-ghost btn-sm" onClick={fetchProducts} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={13} />
          <span>Refresh</span>
        </button>
      </div>

      {loading && <div className="spinner-page" />}

      {!loading && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Unit Cost</th>
                <th>On-Hand Stock</th>
                <th>Reorder Threshold</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-state">
                    <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
                      <Package size={36} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div className="empty-text">No products found matching query</div>
                  </td>
                </tr>
              )}
              {products.map((p) => {
                const stock = Number(p.total_stock ?? p.on_hand_stock ?? 0);
                const reorder = Number(p.reorder_point ?? 0);
                const isOutOfStock = stock <= 0;
                const isLowStock = stock > 0 && stock <= reorder;

                return (
                  <tr key={p.id}>
                    <td className="td-mono">{p.sku}</td>
                    <td className="fw-600 text-head">{p.name}</td>
                    <td>
                      <span className="badge badge-draft" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Tag size={11} />
                        {p.category_name || p.category || 'General'}
                      </span>
                    </td>
                    <td>{p.unit_of_measure || p.unit || 'unit'}</td>
                    <td>${Number(p.unit_cost || 0).toFixed(2)}</td>
                    <td>
                      <span
                        className={
                          isOutOfStock
                            ? 'text-red fw-600'
                            : isLowStock
                            ? 'text-yellow fw-600'
                            : 'text-head fw-600'
                        }
                      >
                        {stock}
                      </span>
                    </td>
                    <td>{reorder}</td>
                    <td>
                      <div className="td-actions">
                        <button
                          className="btn-icon"
                          onClick={() => openEdit(p)}
                          title="Edit Product"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleDelete(p.id)}
                          title="Delete Product"
                          style={{ color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Edit Product' : 'Add New Product'}</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-grid" style={{ marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input
                    id="product-name"
                    className="form-control"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Ergonomic Office Chair"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU *</label>
                  <input
                    id="product-sku"
                    className="form-control"
                    value={form.sku}
                    onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                    placeholder="e.g. CHR-ERG-001"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    id="product-category"
                    className="form-control"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    placeholder="e.g. furniture"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit of Measure</label>
                  <input
                    id="product-unit"
                    className="form-control"
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    placeholder="pcs / kg / box"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Cost ($)</label>
                  <input
                    id="product-unit-cost"
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    value={form.unit_cost}
                    onChange={(e) => setForm((f) => ({ ...f, unit_cost: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reorder Point</label>
                  <input
                    id="product-reorder"
                    type="number"
                    min="0"
                    className="form-control"
                    value={form.reorder_point}
                    onChange={(e) => setForm((f) => ({ ...f, reorder_point: e.target.value }))}
                    placeholder="10"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button id="product-save-btn" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner" /> Saving…
                    </>
                  ) : editing ? (
                    'Update Product'
                  ) : (
                    'Save Product'
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
