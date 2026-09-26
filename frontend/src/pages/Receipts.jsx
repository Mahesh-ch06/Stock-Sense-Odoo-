// Inbound Receipts list — Shadcn Zinc Overhaul
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import API from '../api';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import {
  ArrowDownToLine,
  Plus,
  ArrowRight,
  X,
  Trash2,
  RefreshCw,
  Building2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const STATUS_OPTS = ['', 'draft', 'waiting', 'ready', 'done', 'backorder', 'canceled'];

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [form, setForm] = useState({ supplier: '', warehouse_id: '1', notes: '' });
  const [lines, setLines] = useState([{ product_id: '', qty: 1 }]);

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
    setModalError('');
    try {
      await API.post('/receipts', { ...form, lines });
      setShowModal(false);
      fetchReceipts();
      setForm({ supplier: '', warehouse_id: '1', notes: '' });
      setLines([{ product_id: '', qty: 1 }]);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create receipt order.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout title="Receipts">
      <div className="space-y-8">
        <PageHeader
          title="Inbound Receipts"
          description="Receive shipments, log vendor deliveries, and replenish inventory"
          actions={
            <Button
              id="new-receipt-btn"
              onClick={() => {
                setModalError('');
                setShowModal(true);
              }}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium h-9 px-4 text-xs transition-colors"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Receipt
            </Button>
          }
        />

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider mr-1.5">Status:</span>
            {STATUS_OPTS.map((s) => (
              <button
                key={s}
                id={`receipt-filter-${s || 'all'}`}
                onClick={() => setStatus(s)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors capitalize ${
                  status === s
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchReceipts}
            className="border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 h-9 px-3.5 text-xs transition-colors rounded-lg"
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
          <Card className="border-zinc-800/80 bg-zinc-900/40 overflow-hidden shadow-sm p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-zinc-800/80 bg-zinc-900/60 text-zinc-400 uppercase tracking-wider font-medium text-[11px]">
                    <th className="py-3.5 px-5">Reference</th>
                    <th className="py-3.5 px-5">Supplier</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5">Destination Warehouse</th>
                    <th className="py-3.5 px-5">Created Date</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {receipts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-zinc-500">
                        <ArrowDownToLine className="h-9 w-9 mx-auto mb-2 text-zinc-600 stroke-[1.5]" />
                        <p className="text-sm">No inbound receipts found</p>
                      </td>
                    </tr>
                  ) : (
                    receipts.map((r) => (
                      <tr key={r.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-4 px-5 font-mono font-medium text-zinc-200">
                          {r.reference || `REC/${r.id}`}
                        </td>
                        <td className="py-4 px-5 font-medium text-zinc-100">
                          {r.supplier || '—'}
                        </td>
                        <td className="py-4 px-5">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="py-4 px-5 text-zinc-300">
                          <span className="inline-flex items-center gap-2 text-zinc-300">
                            <Building2 className="h-4 w-4 text-zinc-500" />
                            {r.warehouse_name || `Warehouse ${r.warehouse_id}`}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-zinc-400 font-mono text-xs">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <Link to={`/receipts/${r.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60"
                            >
                              View
                              <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* New Receipt Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl p-7 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-200">
                  <ArrowDownToLine className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-100">Create Inbound Receipt</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Log incoming purchase order from supplier</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {modalError && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg border border-red-500/20 bg-red-950/20 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-zinc-300">Supplier Name *</label>
                  <Input
                    id="receipt-supplier"
                    placeholder="e.g. Acme Supplies Ltd"
                    value={form.supplier}
                    onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
                    className="bg-zinc-950/50 border-zinc-800 text-zinc-100 text-xs sm:text-sm h-10 rounded-lg focus-visible:ring-zinc-600"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-zinc-300">Destination Warehouse</label>
                  <select
                    className="w-full h-10 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3.5 text-xs sm:text-sm text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-zinc-600"
                    value={form.warehouse_id}
                    onChange={(e) => setForm((f) => ({ ...f, warehouse_id: e.target.value }))}
                  >
                    <option value="1">Central Hub (Warehouse A)</option>
                    <option value="2">Secondary Storage (Warehouse B)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Notes / BOL</label>
                <Input
                  placeholder="Optional delivery notes or tracking info"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="bg-zinc-950/50 border-zinc-800 text-zinc-100 text-xs h-9 focus-visible:ring-zinc-600"
                />
              </div>

              {/* Item Lines */}
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300">Item Lines</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addLine}
                    className="h-7 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Line
                  </Button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {lines.map((ln, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Product ID (e.g. 1)"
                        value={ln.product_id}
                        onChange={(e) => setLine(i, 'product_id', e.target.value)}
                        className="bg-zinc-950/50 border-zinc-800 text-zinc-100 text-xs h-8 focus-visible:ring-zinc-600"
                        required
                      />
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={ln.qty}
                        onChange={(e) => setLine(i, 'qty', e.target.value)}
                        className="w-24 bg-zinc-950/50 border-zinc-800 text-zinc-100 text-xs h-8 focus-visible:ring-zinc-600"
                        required
                      />
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(i)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
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
                  id="receipt-create-btn"
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs h-9 transition-colors"
                >
                  {saving ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Creating…
                    </span>
                  ) : (
                    'Create Receipt'
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
