// Transfer Detail — Shadcn Zinc Overhaul
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import API from '../api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  FileText,
  Boxes,
  Loader2,
} from 'lucide-react';

export default function TransferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchTransfer();
  }, [id]);

  async function fetchTransfer() {
    setLoading(true);
    try {
      const { data } = await API.get(`/transfers/${id}`);
      setTransfer(data);
    } catch {
      navigate('/transfers');
    } finally {
      setLoading(false);
    }
  }

  async function handleValidate() {
    setValidating(true);
    setResult(null);
    try {
      const { data } = await API.post(`/transfers/${id}/validate`);
      setResult({
        success: true,
        message: data.message || 'Transfer completed & inventory relocated successfully!',
      });
      fetchTransfer();
    } catch (err) {
      setResult({
        success: false,
        message: err.response?.data?.message || err.response?.data?.error || 'Validation failed.',
      });
    } finally {
      setValidating(false);
    }
  }

  if (loading) {
    return (
      <Layout title="Transfer Detail">
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-zinc-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!transfer) return null;

  const canValidate = !['done', 'canceled'].includes(transfer.status);

  return (
    <Layout title="Transfer Detail">
      <div className="space-y-8">
        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5 mb-8">
          <div className="flex items-center gap-3.5">
            <Link to="/transfers">
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0 border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-zinc-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-100 font-mono">
                  {transfer.reference || `TRF/${transfer.id}`}
                </h1>
                <StatusBadge status={transfer.status} />
              </div>
              <p className="text-sm text-zinc-400 mt-1">Internal Facility Inventory Relocation</p>
            </div>
          </div>

          {canValidate && (
            <Button
              id="transfer-validate-btn"
              size="sm"
              onClick={handleValidate}
              disabled={validating}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium h-10 px-5 text-sm transition-colors self-start sm:self-auto shadow-sm"
            >
              {validating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Relocating…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Validate & Relocate
                </span>
              )}
            </Button>
          )}
        </div>

        {/* Feedback Banner */}
        {result && (
          <div
            className={`flex items-start gap-3 p-4 rounded-lg border text-sm ${
              result.success
                ? 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400'
                : 'border-red-500/20 bg-red-950/20 text-red-400'
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
            )}
            <span className="leading-relaxed">{result.message}</span>
          </div>
        )}

        {/* Route Card */}
        <Card className="border-zinc-800 bg-zinc-900/40 shadow-sm p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                <MapPin className="h-6 w-6 text-zinc-400" />
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  Origin Source
                </span>
                <span className="font-mono text-base font-semibold text-zinc-100">
                  {transfer.from_location || '—'}
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center px-4 text-zinc-500">
              <ArrowRight className="h-6 w-6" />
            </div>

            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                <MapPin className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  Target Destination
                </span>
                <span className="font-mono text-base font-semibold text-zinc-100">
                  {transfer.to_location || '—'}
                </span>
              </div>
            </div>

            <div className="sm:border-l sm:border-zinc-800 sm:pl-8 pt-3 sm:pt-0">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Created
              </span>
              <span className="font-mono text-xs text-zinc-300 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-500" />
                {transfer.created_at ? new Date(transfer.created_at).toLocaleString() : '—'}
              </span>
            </div>
          </div>

          {transfer.notes && (
            <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center gap-2 text-sm text-zinc-400">
              <FileText className="h-4 w-4 text-zinc-500 shrink-0" />
              <span>{transfer.notes}</span>
            </div>
          )}
        </Card>

        {/* Line Items Table */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-zinc-400" />
            <h2 className="text-base font-semibold text-zinc-200">Relocated Line Items</h2>
          </div>

          <Card className="border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-sm p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/70 text-zinc-400 uppercase tracking-wider font-semibold text-xs">
                    <th className="py-3.5 px-5">Item Name</th>
                    <th className="py-3.5 px-5">SKU</th>
                    <th className="py-3.5 px-5 text-right">Transfer Qty</th>
                    <th className="py-3.5 px-5 text-right">Relocation State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {(transfer.lines || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-zinc-500">
                        No item lines found in this transfer record
                      </td>
                    </tr>
                  ) : (
                    (transfer.lines || []).map((ln, i) => (
                      <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-4 px-5 font-medium text-zinc-100">
                          {ln.product_name || `Product #${ln.product_id}`}
                        </td>
                        <td className="py-4 px-5 font-mono text-zinc-400 text-xs">
                          {ln.sku || '—'}
                        </td>
                        <td className="py-4 px-5 text-right font-mono text-zinc-300 font-medium">
                          {ln.qty}
                        </td>
                        <td className="py-4 px-5 text-right">
                          {transfer.status === 'done' ? (
                            <Badge variant="success" className="font-mono text-xs">
                              Relocated
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="font-mono text-xs text-zinc-400">
                              Pending Validation
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
