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
      <div className="space-y-6">
        <PageHeader
          title="Internal Transfers"
          description="Move stock between internal bins, picking stations, and warehouse hubs"
          actions={
            <Button
              id="new-transfer-btn"
              onClick={() => {
                setModalError('');
                setShowModal(true);
              }}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium h-9 text-xs transition-colors"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Transfer
            </Button>
          }
        />

        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTransfers}
            className="border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 h-8 text-xs transition-colors"
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
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Source Location</th>
                    <th className="py-3 px-4">Destination Location</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {transfers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500">
                        <ArrowLeftRight className="h-8 w-8 mx-auto mb-2 text-zinc-600 stroke-[1.5]" />
                        <p className="text-xs">No internal transfers found</p>
                      </td>
                    </tr>
                  ) : (
                    transfers.map((t) => (
                      <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-zinc-200">
                          {t.reference || `TRF/${t.id}`}
                        </td>
                        <td className="py-3 px-4 text-zinc-300 font-mono text-[11px]">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-zinc-500" />
                            {t.from_location || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-300 font-mono text-[11px]">
                          <span className="inline-flex items-center gap-1 text-zinc-200">
                            <ArrowRight className="h-3 w-3 text-zinc-500" />
                            {t.to_location || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                          {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link to={`/transfers/${t.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2.5 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60"
                            >
                              View
                              <ArrowRight className="h-3 w-3 ml-1" />
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
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-200">
                  <ArrowLeftRight className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">Create Stock Transfer</h3>
                  <p className="text-[11px] text-zinc-400">Rebalance inventory across internal locations</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Source Location *</label>
                  <Input
                    id="transfer-from"
                    placeholder="e.g. WH/Stock"
                    value={form.from_location}
                    onChange={(e) => setForm((f) => ({ ...f, from_location: e.target.value }))}
                    className="bg-zinc-950/50 border-zinc-800 text-zinc-100 text-xs h-9 focus-visible:ring-zinc-600"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Destination Location *</label>
                  <Input
                    id="transfer-to"
                    placeholder="e.g. WH/Packing Zone"
                    value={form.to_location}
                    onChange={(e) => setForm((f) => ({ ...f, to_location: e.target.value }))}
                    className="bg-zinc-950/50 border-zinc-800 text-zinc-100 text-xs h-9 focus-visible:ring-zinc-600"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Transfer Reason / Notes</label>
                <Input
                  placeholder="Relocation reason or internal request #"
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
                  id="transfer-create-btn"
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
