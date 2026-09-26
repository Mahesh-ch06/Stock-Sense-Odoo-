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
import { Card } from '../components/ui/Card';
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
      <div className="space-y-8">
        <PageHeader
          title="Products & Master Catalog"
          description="Maintain unified SKU definitions, standard valuations, and minimum replenishment points"
          actions={
            <Button
              id="add-product-btn"
              onClick={openAdd}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium h-10 px-4 text-xs transition-colors shadow-sm"
            >
              <Plus size={15} strokeWidth={2.5} className="mr-1.5" />
              <span>Add Product</span>
            </Button>
          }
        />

        {/* Feedback banner */}
        {feedback && (
          <div
            className={`flex items-center justify-between p-4 rounded-xl border text-xs sm:text-sm ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-zinc-200">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Search & Category Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              <input
                id="product-search"
                placeholder="Search SKU or item name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 h-10 text-xs sm:text-sm bg-zinc-900/60 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              />
            </div>

            <select
              id="product-category-filter"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 text-xs sm:text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-600 cursor-pointer"
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Furniture">Furniture</option>
              <option value="Raw Materials">Raw Materials</option>
              <option value="Industrial Equipment">Industrial Equipment</option>
              <option value="Packaging & Consumables">Packaging & Consumables</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchProducts}
            className="border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 h-10 px-4 text-xs transition-colors self-start sm:self-auto rounded-lg"
          >
            <RefreshCw size={13} className="mr-1.5 text-zinc-400" />
            <span>Refresh</span>
          </Button>
        </div>

        {loading && <div className="spinner-page" />}

        {!loading && (
          <Card className="border-zinc-800/80 bg-zinc-900/40 overflow-hidden shadow-sm p-0">
            <div className="overflow-x-auto">
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
          </Card>
        )}

        {/* Add / Edit Modal */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setShowModal(false)}
          >
            <div
              className="w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl p-7 space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-200">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-100">
                      {editing ? 'Edit Catalog Item' : 'New Catalog Item'}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Define product SKU specifications, valuation cost, and inventory limits
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-medium text-zinc-300">Product Name *</label>
                    <input
                      id="product-name"
                      className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg px-3.5 text-zinc-100 text-sm h-10 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Ergonomic Office Chair"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300">SKU Code *</label>
                    <input
                      id="product-sku"
                      className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg px-3.5 text-zinc-100 text-sm h-10 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-600"
                      value={form.sku}
                      onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                      placeholder="e.g. FURN-CHR-001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300">Category</label>
                    <input
                      id="product-category"
                      className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg px-3.5 text-zinc-100 text-sm h-10 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      placeholder="e.g. Furniture"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300">Unit of Measure</label>
                    <input
                      id="product-unit"
                      className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg px-3.5 text-zinc-100 text-sm h-10 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                      value={form.unit}
                      onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                      placeholder="pcs / roll / unit"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300">Unit Standard Cost ($)</label>
                    <input
                      id="product-unit-cost"
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg px-3.5 text-zinc-100 text-sm h-10 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-600"
                      value={form.unit_cost}
                      onChange={(e) => setForm((f) => ({ ...f, unit_cost: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-medium text-zinc-300">Minimum Reorder Point</label>
                    <input
                      id="product-reorder"
                      type="number"
                      min="0"
                      className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg px-3.5 text-zinc-100 text-sm h-10 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-600"
                      value={form.reorder_point}
                      onChange={(e) => setForm((f) => ({ ...f, reorder_point: e.target.value }))}
                      placeholder="10"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowModal(false)}
                    className="text-zinc-400 hover:text-zinc-200 h-10 px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    id="product-save-btn"
                    type="submit"
                    size="sm"
                    disabled={saving}
                    className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs h-10 px-5 transition-colors shadow-sm"
                  >
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
      </div>
    </Layout>
  );
}
