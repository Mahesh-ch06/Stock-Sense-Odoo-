// Receipt Detail — Shadcn Zinc Overhaul
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import API from '../api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  FileText,
  Boxes,
  Loader2,
} from 'lucide-react';

export default function ReceiptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [valResult, setValResult] = useState(null);

  useEffect(() => {
    fetchReceipt();
  }, [id]);

  async function fetchReceipt() {
    setLoading(true);
    try {
      const { data } = await API.get(`/receipts/${id}`);
      setReceipt(data);
    } catch {
      navigate('/receipts');
    } finally {
      setLoading(false);
    }
  }

  async function handleValidate() {
    setValidating(true);
    setValResult(null);
    try {
      const { data } = await API.post(`/receipts/${id}/validate`);
      setValResult({
        success: true,
        message: data.message || 'Receipt validated successfully! Stock ledger and on-hand balances updated.',
      });
      fetchReceipt();
    } catch (err) {
      setValResult({
        success: false,
        message: err.response?.data?.message || err.response?.data?.error || 'Validation failed.',
      });
    } finally {
      setValidating(false);
    }
  }

  if (loading) {
    return (
      <Layout title="Receipt Detail">
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-zinc-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!receipt) return null;

  const canValidate = !['done', 'canceled'].includes(receipt.status);

  return (
    <Layout title="Receipt Detail">
      <div className="space-y-8">
        {/* Navigation & Actions Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5 mb-8">
          <div className="flex items-center gap-3.5">
            <Link to="/receipts">
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
                  {receipt.reference || `RCP/${receipt.id}`}
                </h1>
                <StatusBadge status={receipt.status} />
              </div>
              <p className="text-sm text-zinc-400 mt-1">Inbound Purchase Order & Warehouse Reception</p>
            </div>
          </div>

          {canValidate && (
            <Button
              id="receipt-validate-btn"
              onClick={handleValidate}
              disabled={validating}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium h-10 px-5 text-sm transition-colors self-start sm:self-auto shadow-sm"
            >
              {validating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validating…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Validate & Restock
                </span>
              )}
            </Button>
          )}
        </div>

        {/* Feedback Banner */}
        {valResult && (
          <div
            className={`flex items-start gap-3 p-4 rounded-lg border text-sm ${
              valResult.success
                ? 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400'
                : 'border-red-500/20 bg-red-950/20 text-red-400'
            }`}
          >
            {valResult.success ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
            )}
            <span className="leading-relaxed">{valResult.message}</span>
          </div>
        )}

        {/* Metadata Card */}
        <Card className="border-zinc-800 bg-zinc-900/40 shadow-sm p-6 sm:p-7">
          <CardHeader className="p-0 pb-4 border-b border-zinc-800/80 mb-5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Receipt Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
              <div>
                <span className="text-zinc-500 block text-xs uppercase tracking-wider mb-1.5 font-medium">
                  Supplier / Vendor
                </span>
                <span className="font-semibold text-zinc-100 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-zinc-400" />
                  {receipt.supplier || '—'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-xs uppercase tracking-wider mb-1.5 font-medium">
                  Destination Warehouse
                </span>
                <span className="text-zinc-200 font-medium">
                  {receipt.warehouse_name || `Warehouse ${receipt.warehouse_id}`}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-xs uppercase tracking-wider mb-1.5 font-medium">
                  Created Date
                </span>
                <span className="text-zinc-200 font-mono text-xs flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  {receipt.created_at ? new Date(receipt.created_at).toLocaleString() : '—'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-xs uppercase tracking-wider mb-1.5 font-medium">
                  Notes / BOL
                </span>
                <span className="text-zinc-300 italic flex items-center gap-2">
                  <FileText className="h-4 w-4 text-zinc-400 not-italic" />
                  {receipt.notes || 'No notes specified'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lines Table */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-zinc-400" />
            <h2 className="text-base font-semibold text-zinc-200">Received Line Items</h2>
          </div>

          <Card className="border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-sm p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/70 text-zinc-400 uppercase tracking-wider font-semibold text-xs">
                    <th className="py-3.5 px-5">SKU Code</th>
                    <th className="py-3.5 px-5">Item Name</th>
                    <th className="py-3.5 px-5 text-right">Expected Qty</th>
                    <th className="py-3.5 px-5 text-right">Received / Restocked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {(receipt.lines || []).map((ln) => (
                    <tr key={ln.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-4 px-5 font-mono text-zinc-300 font-medium">
                        {ln.sku || `PRD-${ln.product_id}`}
                      </td>
                      <td className="py-4 px-5 font-medium text-zinc-100">
                        {ln.product_name || `Product #${ln.product_id}`}
                      </td>
                      <td className="py-4 px-5 text-right font-mono text-zinc-300 font-medium">
                        {ln.qty}
                      </td>
                      <td className="py-4 px-5 text-right font-mono font-medium">
                        {receipt.status === 'done' ? (
                          <span className="text-emerald-400">+{ln.qty}</span>
                        ) : (
                          <span className="text-zinc-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
