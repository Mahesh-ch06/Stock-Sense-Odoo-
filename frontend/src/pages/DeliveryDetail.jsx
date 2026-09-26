// Delivery Detail — with multi-step stepper, status advance, and validate with Lucide icons
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import API from '../api';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  AlertCircle,
  Truck,
} from 'lucide-react';

const STEPS = ['draft', 'picking', 'packing', 'ready', 'done'];

function Stepper({ current }) {
  const ci = STEPS.indexOf(current);
  return (
    <div className="stepper">
      {STEPS.map((s, i) => (
        <span key={s} style={{ display: 'contents' }}>
          <div className={`step ${i < ci ? 'done' : i === ci ? 'active' : ''}`}>
            <div
              className="step-dot"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
              }}
            >
              {i < ci ? <Check size={12} strokeWidth={3} /> : i + 1}
            </div>
            <div className="step-label" style={{ textTransform: 'capitalize' }}>
              {s}
            </div>
          </div>
          {i < STEPS.length - 1 && (
            <div key={`line-${i}`} className={`step-line ${i < ci ? 'done' : ''}`} />
          )}
        </span>
      ))}
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
      setResult({ success: true, message: data.message || 'Status advanced successfully.' });
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
      setResult({ success: true, message: data.message || 'Delivery validated & dispatched!' });
      fetchDelivery();
    } catch (err) {
      setResult({
        success: false,
        message: err.response?.data?.message || err.response?.data?.error || 'Validation failed. Check stock availability.',
      });
    } finally {
      setValidating(false);
    }
  }

  if (loading)
    return (
      <Layout title="Delivery Detail">
        <div className="spinner-page" />
      </Layout>
    );
  if (!delivery) return null;

  const canAdvance = ['draft', 'picking', 'packing'].includes(delivery.status);
  const canValidate = delivery.status === 'ready';

  return (
    <Layout title="Delivery Detail">
      <div className="page-header">
        <div className="flex-center gap-8">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/deliveries')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
          <div>
            <div className="page-title">{delivery.reference || `OUT/${delivery.id}`}</div>
            <div style={{ marginTop: 4 }}>
              <StatusBadge status={delivery.status} />
            </div>
          </div>
        </div>

        <div className="flex-center gap-8">
          {canAdvance && (
            <button
              id="delivery-advance-btn"
              className="btn btn-ghost"
              onClick={handleAdvance}
              disabled={advancing}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {advancing ? (
                <>
                  <span className="spinner" /> Advancing…
                </>
              ) : (
                <>
                  <span>Advance Status</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          )}

          {canValidate && (
            <button
              id="delivery-validate-btn"
              className="btn btn-primary"
              onClick={handleValidate}
              disabled={validating}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {validating ? (
                <>
                  <span className="spinner" /> Validating…
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} strokeWidth={2.5} />
                  <span>Validate & Dispatch</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {result && (
        <div
          className={result.success ? 'alert-success' : 'alert-error'}
          style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {result.success ? (
            <CheckCircle2 size={16} style={{ color: 'var(--green)' }} />
          ) : (
            <AlertCircle size={16} style={{ color: 'var(--red)' }} />
          )}
          <span>{result.message}</span>
        </div>
      )}

      {/* Stepper */}
      <div className="card" style={{ marginBottom: 20 }}>
        <Stepper current={delivery.status} />
      </div>

      {/* Info */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">Customer</div>
            <div className="info-val">{delivery.customer || '—'}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Fulfillment Warehouse</div>
            <div className="info-val">{delivery.warehouse_name || `Warehouse ${delivery.warehouse_id}`}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Order Created</div>
            <div className="info-val">
              {delivery.created_at ? new Date(delivery.created_at).toLocaleString() : '—'}
            </div>
          </div>
          <div className="info-item">
            <div className="info-label">Notes</div>
            <div className="info-val">{delivery.notes || '—'}</div>
          </div>
        </div>
      </div>

      {/* Lines */}
      <div className="section-title">Dispatched Line Items</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Required Qty</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(delivery.lines || []).map((ln) => (
              <tr key={ln.id}>
                <td className="td-mono">{ln.sku || `PRD-${ln.product_id}`}</td>
                <td className="fw-600 text-head">{ln.product_name || `Product #${ln.product_id}`}</td>
                <td>{ln.qty}</td>
                <td>
                  <span
                    className={
                      delivery.status === 'done'
                        ? 'text-green fw-600'
                        : 'text-muted'
                    }
                  >
                    {delivery.status === 'done' ? 'Dispatched' : 'Pending Allocation'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
