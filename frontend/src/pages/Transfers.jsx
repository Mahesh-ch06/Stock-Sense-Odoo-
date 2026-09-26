// Internal Transfers list — Shadcn Zinc Overhaul
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
  ArrowLeftRight,
  Plus,
  ArrowRight,
  X,
  Trash2,
  RefreshCw,
  MapPin,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [form, setForm] = useState({ from_location: '', to_location: '', notes: '' });
  const [lines, setLines] = useState([{ product_id: '', qty: 1 }]);

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/transfers');
      setTransfers(data);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

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
      await API.post('/transfers', { ...form, lines });
      setShowModal(false);
      fetchTransfers();
      setForm({ from_location: '', to_location: '', notes: '' });
      setLines([{ product_id: '', qty: 1 }]);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create internal transfer.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout title="Transfers">
      <div className="space-y-8">
        <PageHeader
          title="Internal Transfers"
          description="Move stock between internal bins, picking stations, and warehouse hubs"
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchTransfers}
                className="border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 h-10 px-3.5 text-xs transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-zinc-400" />
                Refresh
              </Button>
              <Button
                id="new-transfer-btn"
                onClick={() => {
                  setModalError('');
                  setShowModal(true);
                }}
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium h-10 px-4 text-xs transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                New Transfer
              </Button>
            </div>
          }
        />

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-zinc-500 animate-spin" />
          </div>
        ) : (
          <Card className="border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-sm p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/70 text-zinc-400 uppercase tracking-wider font-semibold text-xs">
                    <th className="py-3.5 px-5">Reference</th>
                    <th className="py-3.5 px-5">Source Location</th>
                    <th className="py-3.5 px-5">Destination Location</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5">Created Date</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {transfers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-zinc-500">
                        <ArrowLeftRight className="h-10 w-10 mx-auto mb-3 text-zinc-600 stroke-[1.5]" />
                        <p className="text-sm font-medium">No internal transfers found</p>
                        <p className="text-xs text-zinc-500 mt-1">Create your first stock relocation to get started</p>
                      </td>
                    </tr>
                  ) : (
                    transfers.map((t) => (
                      <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-4 px-5 font-mono font-medium text-zinc-200">
                          {t.reference || `TRF/${t.id}`}
                        </td>
                        <td className="py-4 px-5 text-zinc-300 font-mono text-xs">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                            {t.from_location || '—'}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-zinc-300 font-mono text-xs">
                          <span className="inline-flex items-center gap-1.5 text-zinc-200">
                            <ArrowRight className="h-3.5 w-3.5 text-zinc-500" />
                            {t.to_location || '—'}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="py-4 px-5 text-zinc-400 font-mono text-xs">
                          {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <Link to={`/transfers/${t.id}`}>
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

      {/* New Transfer Modal */}
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
                  <ArrowLeftRight className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-100">Create Stock Transfer</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Rebalance inventory across internal locations</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg border border-red-500/20 bg-red-950/20 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <span className="leading-relaxed">{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-300">Source Location *</label>
                  <Input
                    id="transfer-from"
                    placeholder="e.g. WH/Stock"
                    value={form.from_location}
                    onChange={(e) => setForm((f) => ({ ...f, from_location: e.target.value }))}
                    className="bg-zinc-950/60 border-zinc-800 text-zinc-100 text-sm h-10 focus-visible:ring-zinc-600"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-300">Destination Location *</label>
                  <Input
                    id="transfer-to"
                    placeholder="e.g. WH/Packing Zone"
                    value={form.to_location}
                    onChange={(e) => setForm((f) => ({ ...f, to_location: e.target.value }))}
                    className="bg-zinc-950/60 border-zinc-800 text-zinc-100 text-sm h-10 focus-visible:ring-zinc-600"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-300">Transfer Reason / Notes</label>
                <Input
                  placeholder="Relocation reason or internal request #"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="bg-zinc-950/60 border-zinc-800 text-zinc-100 text-sm h-10 focus-visible:ring-zinc-600"
                />
              </div>

              {/* Item Lines */}
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300">Item Lines</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addLine}
                    className="h-8 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Line
                  </Button>
                </div>

                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                  {lines.map((ln, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <Input
                        type="number"
                        placeholder="Product ID (e.g. 1)"
                        value={ln.product_id}
                        onChange={(e) => setLine(i, 'product_id', e.target.value)}
                        className="bg-zinc-950/60 border-zinc-800 text-zinc-100 text-sm h-9 focus-visible:ring-zinc-600"
                        required
                      />
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={ln.qty}
                        onChange={(e) => setLine(i, 'qty', e.target.value)}
                        className="w-28 bg-zinc-950/60 border-zinc-800 text-zinc-100 text-sm h-9 focus-visible:ring-zinc-600"
                        required
                      />
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(i)}
                          className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
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
                  id="transfer-create-btn"
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs h-10 px-5 transition-colors shadow-sm"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating…
                    </span>
                  ) : (
                    'Create Transfer'
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
