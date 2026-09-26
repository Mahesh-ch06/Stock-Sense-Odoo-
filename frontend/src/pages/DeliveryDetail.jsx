// Delivery Detail — with multi-step stepper, status advance, and validate
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import API from '../api';

const STEPS = ['draft', 'picking', 'packing', 'ready', 'done'];

function Stepper({ current }) {
  const ci = STEPS.indexOf(current);
  return (
    <div className="stepper">
      {STEPS.map((s, i) => (
        <>
          <div key={s} className={`step ${i < ci ? 'done' : i === ci ? 'active' : ''}`}>
            <div className="step-dot">{i < ci ? '✓' : i + 1}</div>
            <div className="step-label" style={{ textTransform: 'capitalize' }}>{s}</div>
          </div>
          {i < STEPS.length - 1 && (
            <div key={`line-${i}`} className={`step-line ${i < ci ? 'done' : ''}`} />
          )}
        </>
      ))}
    </div>
  );
}

export default function DeliveryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [advancing, setAdvancing]   = useState(false);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => { fetchDelivery(); }, [id]);

  async function fetchDelivery() {
    setLoading(true);
    try {
      const { data } = await API.get(`/deliveries/${id}`);
      setDelivery(data);
    } catch { navigate('/deliveries'); }
    finally { setLoading(false); }
  }

  async function handleAdvance() {
    setAdvancing(true); setResult(null);
    try {
      const { data } = await API.patch(`/deliveries/${id}/status`);
      setResult({ success: true, message: data.message || 'Status advanced.' });
      fetchDelivery();
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Failed to advance status.' });
    } finally { setAdvancing(false); }
  }

  async function handleValidate() {
    setValidating(true); setResult(null);
    try {
      const { data } = await API.post(`/deliveries/${id}/validate`);
      setResult({ success: true, message: data.message || 'Delivery validated!' });
      fetchDelivery();
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Validation failed.' });
    } finally { setValidating(false); }
  }

  if (loading) return <Layout title="Delivery Detail"><div className="spinner-page" /></Layout>;
  if (!delivery) return null;

  const isTerminal = ['done', 'canceled'].includes(delivery.status);
  const isReady    = delivery.status === 'ready';

  return (
    <Layout title="Delivery Detail">
      <div className="page-header">
        <div className="flex-center gap-8">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/deliveries')}>← Back</button>
          <div>
            <div className="page-title">{delivery.reference || `DEL/${delivery.id}`}</div>
            <div style={{ marginTop: 4 }}><StatusBadge status={delivery.status} /></div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!isTerminal && !isReady && (
            <button id="delivery-advance-btn" className="btn btn-secondary"
              onClick={handleAdvance} disabled={advancing}>
              {advancing ? <><span className="spinner" style={{ borderColor: 'var(--text-muted)', borderTopColor: 'var(--text-head)' }} /> Advancing…</> : '→ Advance Status'}
            </button>
          )}
          {isReady && (
            <button id="delivery-validate-btn" className="btn btn-primary"
              onClick={handleValidate} disabled={validating}>
              {validating ? <><span className="spinner" /> Validating…</> : '✔ Validate'}
            </button>
          )}
        </div>
      </div>

      {result && (
        <div className={result.success ? 'alert-success' : 'alert-error'} style={{ marginBottom: 16 }}>
          {result.message}
        </div>
      )}

      <Stepper current={delivery.status} />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="detail-grid">
          <div className="detail-item"><div className="detail-label">Customer</div><div className="detail-value">{delivery.customer || '—'}</div></div>
          <div className="detail-item"><div className="detail-label">Warehouse</div><div className="detail-value">{delivery.warehouse || '—'}</div></div>
          <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><StatusBadge status={delivery.status} /></div></div>
          <div className="detail-item"><div className="detail-label">Created</div><div className="detail-value">{delivery.created_at ? new Date(delivery.created_at).toLocaleString() : '—'}</div></div>
        </div>
      </div>

      <div className="section-title">Delivery Lines</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Product</th><th>SKU</th><th>Requested Qty</th><th>Available Stock</th><th>Done Qty</th></tr>
          </thead>
          <tbody>
            {(delivery.lines || []).map((ln, i) => {
              const insufficient = ln.available_stock !== undefined && ln.available_stock < ln.qty;
              return (
                <tr key={i}>
                  <td className="fw-600 text-head">{ln.product_name || ln.product_id}</td>
                  <td className="td-mono">{ln.sku || '—'}</td>
                  <td>{ln.qty}</td>
                  <td>
                    <span className={insufficient ? 'text-red fw-600' : ''}>
                      {ln.available_stock ?? '—'}
                    </span>
                    {insufficient && <div className="stock-warn">⚠ Insufficient stock</div>}
                  </td>
                  <td>{ln.done_qty ?? '—'}</td>
                </tr>
              );
            })}
            {(delivery.lines || []).length === 0 && (
              <tr><td colSpan={5} className="text-muted" style={{ textAlign: 'center', padding: 24 }}>No lines</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
