// Inventory Adjustments & Stock Reconciliation — Shadcn Zinc Overhaul
import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import API from '../api';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import {
  Scale,
  Search,
  RefreshCw,
  Plus,
  MapPin,
  TrendingUp,
  TrendingDown,
  Equal,
  X,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function Adjustments() {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Status message banners
  const [notice, setNotice] = useState(null);

  // New adjustment modal state
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
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
    setModalError('');
    setForm({ product_id: '', location_id: '', counted_qty: '' });
    setShowModal(true);
    try {
      const [prodRes, whRes] = await Promise.all([
        API.get('/products'),
        API.get('/warehouses'),
      ]);
      setProducts(prodRes.data || []);

      const whList = whRes.data || [];
      const allLocPromises = whList.map((w) =>
        API.get(`/warehouses/${w.id}/locations`).then((res) =>
          res.data.map((loc) => ({ ...loc, warehouse_name: w.name }))
        )
      );
      const locResults = await Promise.all(allLocPromises);
      const flatLocs = locResults.flat();
      setLocations(flatLocs);

      if (prodRes.data?.length > 0) {
        setForm((f) => ({ ...f, product_id: prodRes.data[0].id }));
      }
      if (flatLocs.length > 0) {
        setForm((f) => ({ ...f, location_id: flatLocs[0].id }));
      }
    } catch (err) {
      console.error('Failed to load form options', err);
      setModalError('Failed to load products or locations.');
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.product_id || !form.location_id || form.counted_qty === '') {
      setModalError('Please fill out all required fields.');
      return;
    }

    setSaving(true);
    setModalError('');
    try {
      const payload = {
        product_id: parseInt(form.product_id, 10),
        location_id: parseInt(form.location_id, 10),
        counted_qty: parseInt(form.counted_qty, 10),
      };
      const { data } = await API.post('/adjustments', payload);
      setNotice({ type: 'success', message: data.message || 'Inventory adjustment applied successfully.' });
      setShowModal(false);
      fetchAdjustments();
    } catch (err) {
      setModalError(err.response?.data?.error || 'Failed to submit adjustment.');
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
      <div className="space-y-6">
        <PageHeader
          title="Inventory Adjustments"
          description="Cycle counts, physical audit reconciliation, and stock corrections"
          actions={
            <Button
              id="new-adjustment-btn"
              onClick={openNewAdjustment}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium h-9 text-xs transition-colors"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Record Adjustment
            </Button>
          }
        />

        {notice && (
          <div
            className={`flex items-start justify-between gap-3 p-3.5 rounded-lg border text-xs ${
              notice.type === 'success'
                ? 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400'
                : 'border-red-500/20 bg-red-950/20 text-red-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {notice.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              )}
              <span>{notice.message}</span>
            </div>
            <button
              onClick={() => setNotice(null)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              id="adjustment-search"
              placeholder="Search product, SKU, or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-600"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAdjustments}
            className="border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 h-9 text-xs transition-colors self-start sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-zinc-400" />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-zinc-500 animate-spin" />
          </div>
        ) : (
          <Card className="border-zinc-800/80 bg-zinc-900/40 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800/80 bg-zinc-900/60 text-zinc-400 uppercase tracking-wider font-medium text-[11px]">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4 text-right">System Stock</th>
                    <th className="py-3 px-4 text-right">Counted</th>
                    <th className="py-3 px-4 text-right">Variance</th>
                    <th className="py-3 px-4">Reconciled By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-zinc-500">
                        <Scale className="h-8 w-8 mx-auto mb-2 text-zinc-600 stroke-[1.5]" />
                        <p className="text-xs">No inventory adjustments found</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((a) => {
                      const delta = (a.counted_qty ?? 0) - (a.system_qty_at_time ?? 0);
                      return (
                        <tr key={a.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3 px-4 text-zinc-500 font-mono text-[11px] whitespace-nowrap">
                            {a.created_at ? new Date(a.created_at).toLocaleString() : '—'}
                          </td>
                          <td className="py-3 px-4 font-medium text-zinc-100 whitespace-nowrap">
                            {a.product_name}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                            {a.sku}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 text-zinc-300 font-mono text-[11px]">
                              <MapPin className="h-3 w-3 text-zinc-500" />
                              {a.location_name}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-zinc-400">
                            {a.system_qty_at_time ?? 0}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-zinc-100">
                            {a.counted_qty}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {delta > 0 ? (
                              <Badge variant="success" className="font-mono text-[11px]">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                +{delta} gain
                              </Badge>
                            ) : delta < 0 ? (
                              <Badge variant="destructive" className="font-mono text-[11px]">
                                <TrendingDown className="h-3 w-3 mr-1" />
                                {delta} loss
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="font-mono text-[11px]">
                                <Equal className="h-3 w-3 mr-1" />
                                0 match
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                            {a.created_by_name || 'System'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* New Adjustment Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-200">
                  <ClipboardCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">Physical Stock Count</h3>
                  <p className="text-[11px] text-zinc-400">Reconcile variance and sync ledger</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg border border-red-500/20 bg-red-950/20 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Target Product *</label>
                <select
                  id="adjustment-product"
                  className="w-full h-9 rounded-md border border-zinc-800 bg-zinc-950/50 px-3 text-xs text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-zinc-600"
                  value={form.product_id}
                  onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}
                  required
                >
                  <option value="">Select product item…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Available: {p.total_stock ?? p.on_hand_stock ?? 0}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Storage Location / Bin *</label>
                <select
                  id="adjustment-location"
                  className="w-full h-9 rounded-md border border-zinc-800 bg-zinc-950/50 px-3 text-xs text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-zinc-600"
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

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Physical Counted Quantity *</label>
                <Input
                  id="adjustment-counted-qty"
                  type="number"
                  min="0"
                  placeholder="e.g. 75"
                  value={form.counted_qty}
                  onChange={(e) => setForm((f) => ({ ...f, counted_qty: e.target.value }))}
                  className="bg-zinc-950/50 border-zinc-800 text-zinc-100 text-xs h-9 focus-visible:ring-zinc-600"
                  required
                />
                <p className="text-[10.5px] text-zinc-500 leading-tight pt-0.5">
                  An immutable reconciliation entry will be written to the stock ledger and local balance updated atomically.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800/80">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </Button>
                <Button
                  id="adjustment-save-btn"
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs h-9 transition-colors"
                >
                  {saving ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Reconciling…
                    </span>
                  ) : (
                    'Reconcile Stock'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
