// Products Catalog — with Shadcn design system, SKU copy micro-interaction, and ConfirmDialog
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
  Copy,
  Check,
  Tag,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PageHeader } from '../components/ui/PageHeader';

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
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
  const [copiedSku, setCopiedSku] = useState(null);

  // Confirm delete dialog
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, productId: null, loading: false });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/products', { params: { search, category } });
      setProducts(data);
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load catalog products.' });
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function handleCopySku(sku) {
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 1500);
  }

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
      if (editing) {
        await API.patch(`/products/${editing.id}`, form);
        setFeedback({ type: 'success', message: 'Product SKU updated successfully.' });
      } else {
        await API.post('/products', form);
        setFeedback({ type: 'success', message: 'New SKU added to catalog.' });
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || err.response?.data?.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  }

  async function executeDeleteProduct() {
    if (!deleteDialog.productId) return;
    setDeleteDialog((d) => ({ ...d, loading: true }));
    try {
      await API.delete(`/products/${deleteDialog.productId}`);
      setFeedback({ type: 'success', message: 'Product SKU removed from catalog.' });
      setDeleteDialog({ isOpen: false, productId: null, loading: false });
      fetchProducts();
    } catch (err) {
      setDeleteDialog((d) => ({ ...d, loading: false }));
      setFeedback({ type: 'error', message: err.response?.data?.error || 'Failed to delete SKU.' });
    }
  }

  return (
    <Layout title="Products">
      <PageHeader
        title="Products & Master Catalog"
        description="Maintain unified SKU definitions, standard valuations, and minimum replenishment points"
      >
        <Button id="add-product-btn" onClick={openAdd}>
          <Plus size={14} strokeWidth={2.5} />
          <span>Add Product</span>
        </Button>
      </PageHeader>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`mb-4 flex items-center justify-between p-3 rounded-lg border text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-zinc-200">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Search & Category Filter Toolbar */}
      <div className="filter-bar">
        <div className="search-box" style={{ maxWidth: 280 }}>
          <span className="search-icon">
            <Search size={14} />
          </span>
          <input
            id="product-search"
            placeholder="Search SKU or item name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          id="product-category-filter"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-8 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 cursor-pointer"
        >
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Furniture">Furniture</option>
          <option value="Raw Materials">Raw Materials</option>
          <option value="Industrial Equipment">Industrial Equipment</option>
          <option value="Packaging & Consumables">Packaging & Consumables</option>
        </select>

        <Button variant="ghost" size="sm" onClick={fetchProducts}>
          <RefreshCw size={12} />
          <span>Refresh</span>
        </Button>
      </div>

      {loading && <div className="spinner-page" />}

      {!loading && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>UoM</th>
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
                    <div className="empty-icon flex justify-center">
                      <Package size={32} className="text-zinc-600" />
                    </div>
                    <div className="empty-text">No products match your criteria</div>
                  </td>
                </tr>
              )}
              {products.map((p) => {
                const stock = Number(p.total_stock ?? p.on_hand_stock ?? 0);
                const reorder = Number(p.reorder_point ?? 0);
                const isOutOfStock = stock <= 0;
                const isLowStock = stock > 0 && stock <= reorder;

                return (
                  <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td>
                      <div className="flex items-center gap-1.5 group">
                        <span className="td-mono">{p.sku}</span>
                        <button
                          type="button"
                          onClick={() => handleCopySku(p.sku)}
                          title="Copy SKU to clipboard"
                          className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-200 transition-opacity"
                        >
                          {copiedSku === p.sku ? (
                            <Check size={11} className="text-emerald-400" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="fw-600 text-head">{p.name}</td>
                    <td>
                      <span className="badge badge-draft text-[10.5px]">
                        <Tag size={10} className="mr-1" />
                        {p.category_name || p.category || 'General'}
                      </span>
                    </td>
                    <td className="text-muted text-xs">{p.unit_of_measure || p.unit || 'unit'}</td>
                    <td className="font-mono text-xs text-zinc-200">${Number(p.unit_cost || 0).toFixed(2)}</td>
                    <td>
                      <span
                        className={`font-mono text-xs font-semibold ${
                          isOutOfStock
                            ? 'text-rose-400'
                            : isLowStock
                            ? 'text-amber-400'
                            : 'text-zinc-100'
                        }`}
                      >
                        {stock}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-zinc-400">{reorder}</td>
                    <td>
                      <div className="td-actions">
                        <button
                          className="btn-icon"
                          onClick={() => openEdit(p)}
                          title="Edit Product"
                          style={{ width: 26, height: 26 }}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => setDeleteDialog({ isOpen: true, productId: p.id, loading: false })}
                          title="Delete Product"
                          style={{ width: 26, height: 26, color: 'var(--rose)' }}
                        >
                          <Trash2 size={12} />
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {editing ? 'Edit Product Item' : 'New Catalog Item'}
              </div>
              <button className="btn-icon" onClick={() => setShowModal(false)} style={{ width: 26, height: 26 }}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
                <div className="form-group sm:col-span-2">
                  <label className="form-label">Product Name *</label>
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
                  <label className="form-label">SKU Code *</label>
                  <input
                    id="product-sku"
                    className="form-control"
                    value={form.sku}
                    onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                    placeholder="e.g. FURN-CHR-001"
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
                    placeholder="e.g. Furniture"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit of Measure</label>
                  <input
                    id="product-unit"
                    className="form-control"
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    placeholder="pcs / roll / unit"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Standard Cost ($)</label>
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
                <div className="form-group sm:col-span-2">
                  <label className="form-label">Minimum Reorder Point</label>
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
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button id="product-save-btn" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Update Item' : 'Create Item'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Catalog Item?"
        description="Are you sure you want to delete this product SKU? This will remove the catalog definition."
        confirmLabel="Delete SKU"
        loading={deleteDialog.loading}
        onConfirm={executeDeleteProduct}
        onCancel={() => setDeleteDialog({ isOpen: false, productId: null, loading: false })}
      />
    </Layout>
  );
}
