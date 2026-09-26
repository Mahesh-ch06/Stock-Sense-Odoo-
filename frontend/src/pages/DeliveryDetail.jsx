// Delivery Detail — Shadcn Zinc Overhaul
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
  Check,
  CheckCircle2,
  AlertCircle,
  Truck,
  Building2,
  Calendar,
  FileText,
  Boxes,
  Loader2,
} from 'lucide-react';

const STEPS = ['draft', 'picking', 'packing', 'ready', 'done'];

function Stepper({ current }) {
  const ci = STEPS.indexOf(current);
  return (
    <div className="w-full flex items-center justify-between py-2 px-1 sm:px-4">
      {STEPS.map((s, i) => {
        const isDone = i < ci;
        const isActive = i === ci;
        return (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 relative">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  isDone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : isActive
                    ? 'bg-zinc-100 text-zinc-950 shadow-xs ring-4 ring-zinc-800'
                    : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : i + 1}
              </div>
              <span
                className={`text-[11px] font-medium capitalize tracking-tight ${
                  isActive
                    ? 'text-zinc-100 font-semibold'
                    : isDone
                    ? 'text-emerald-400'
                    : 'text-zinc-500'
                }`}
              >
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-[2px] flex-1 mx-2 transition-colors ${
                  i < ci ? 'bg-emerald-500/40' : 'bg-zinc-800'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function DeliveryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchDelivery();
  }, [id]);

  async function fetchDelivery() {
    setLoading(true);
    try {
      const { data } = await API.get(`/deliveries/${id}`);
      setDelivery(data);
    } catch {
      navigate('/deliveries');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdvance() {
    setAdvancing(true);
    setResult(null);
    try {
      const { data } = await API.patch(`/deliveries/${id}/status`);
      setResult({ success: true, message: data.message || 'Fulfillment status advanced successfully.' });
      fetchDelivery();
    } catch (err) {
      setResult({
        success: false,
        message: err.response?.data?.message || err.response?.data?.error || 'Failed to advance status.',
      });
    } finally {
      setAdvancing(false);
    }
  }

  async function handleValidate() {
    setValidating(true);
    setResult(null);
    try {
      const { data } = await API.post(`/deliveries/${id}/validate`);
      setResult({ success: true, message: data.message || 'Delivery validated, deducted from inventory & dispatched!' });
      fetchDelivery();
    } catch (err) {
      setResult({
        success: false,
        message: err.response?.data?.message || err.response?.data?.error || 'Validation failed. Check available stock balance.',
      });
    } finally {
      setValidating(false);
    }
  }

  if (loading) {
    return (
      <Layout title="Delivery Detail">
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-zinc-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!delivery) return null;

  const canAdvance = ['draft', 'picking', 'packing'].includes(delivery.status);
  const canValidate = delivery.status === 'ready';

  return (
    <Layout title="Delivery Detail">
      <div className="space-y-8">
        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5 mb-8">
          <div className="flex items-center gap-3.5">
            <Link to="/deliveries">
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0 border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-zinc-100 rounded-lg"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold tracking-tight text-zinc-100 font-mono">
                  {delivery.reference || `OUT/${delivery.id}`}
                </h1>
                <StatusBadge status={delivery.status} />
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">Outbound Customer Dispatch & Order Fulfillment</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {canAdvance && (
              <Button
                id="delivery-advance-btn"
                variant="outline"
                size="sm"
                onClick={handleAdvance}
                disabled={advancing}
                className="border-zinc-800 bg-zinc-900/60 text-zinc-200 hover:bg-zinc-800 h-9 px-4 text-xs transition-colors rounded-lg"
              >
                {advancing ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Advancing…
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span>Advance Status</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </Button>
            )}

            {canValidate && (
              <Button
                id="delivery-validate-btn"
                size="sm"
                onClick={handleValidate}
                disabled={validating}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium h-9 px-4 text-xs transition-colors rounded-lg"
              >
                {validating ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Dispatching…
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Validate & Dispatch</span>
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Feedback Banner */}
        {result && (
          <div
            className={`flex items-start gap-2.5 p-4 rounded-xl border text-xs sm:text-sm ${
              result.success
                ? 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400'
                : 'border-red-500/20 bg-red-950/20 text-red-400'
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-400 mt-0.5" />
            )}
            <span className="leading-relaxed">{result.message}</span>
          </div>
        )}

        {/* Fulfillment Pipeline Stepper Card */}
        <Card className="border-zinc-800/80 bg-zinc-900/40 shadow-sm p-6 sm:p-8">
          <Stepper current={delivery.status} />
        </Card>

        {/* Metadata Card */}
        <Card className="border-zinc-800/80 bg-zinc-900/40 shadow-sm p-6 sm:p-7">
          <div className="pb-4 border-b border-zinc-800/80 mb-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Delivery Information
            </h3>
          </div>
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs sm:text-sm">
              <div>
                <span className="text-zinc-500 block text-[11px] uppercase tracking-wider mb-1.5">
                  Customer / Destination
                </span>
                <span className="font-semibold text-zinc-100 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-zinc-400" />
                  {delivery.customer || '—'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px] uppercase tracking-wider mb-1.5">
                  Fulfillment Warehouse
                </span>
                <span className="text-zinc-200 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-zinc-400" />
                  {delivery.warehouse_name || `Warehouse ${delivery.warehouse_id}`}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px] uppercase tracking-wider mb-1.5">
                  Order Date
                </span>
                <span className="text-zinc-200 font-mono text-xs flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  {delivery.created_at ? new Date(delivery.created_at).toLocaleString() : '—'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px] uppercase tracking-wider mb-1.5">
                  Shipping Notes
                </span>
                <span className="text-zinc-300 italic flex items-center gap-2">
                  <FileText className="h-4 w-4 text-zinc-400 not-italic" />
                  {delivery.notes || 'No instructions provided'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Lines Table */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-200">Dispatched Line Items</h2>
          </div>

          <Card className="border-zinc-800/80 bg-zinc-900/40 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800/80 bg-zinc-900/60 text-zinc-400 uppercase tracking-wider font-medium text-[11px]">
                    <th className="py-3 px-4">SKU Code</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4 text-right">Required Qty</th>
                    <th className="py-3 px-4 text-right">Fulfillment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {(delivery.lines || []).map((ln) => (
                    <tr key={ln.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-zinc-300 font-medium">
                        {ln.sku || `PRD-${ln.product_id}`}
                      </td>
                      <td className="py-3 px-4 font-medium text-zinc-100">
                        {ln.product_name || `Product #${ln.product_id}`}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-zinc-300">
                        {ln.qty}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {delivery.status === 'done' ? (
                          <Badge variant="success" className="font-mono text-[11px]">
                            Dispatched
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="font-mono text-[11px] text-zinc-400">
                            Pending Allocation
                          </Badge>
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
