// Receipt Detail — GET /receipts/:id, POST /receipts/:id/validate with Lucide icons
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import API from '../api';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Building,
  Calendar,
  FileText,
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
      setValResult({ success: true, message: data.message || 'Receipt validated successfully! Stock updated.' });
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

  if (loading)
    return (
      <Layout title="Receipt Detail">
        <div className="spinner-page" />
      </Layout>
    );
  if (!receipt) return null;

  const canValidate = !['done', 'canceled'].includes(receipt.status);

  return (
    <Layout title="Receipt Detail">
      <div className="page-header">
        <div className="flex-center gap-8">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/receipts')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
          <div>
            <div className="page-title">{receipt.reference || `RCP/${receipt.id}`}</div>
            <div style={{ marginTop: 4 }}>
              <StatusBadge status={receipt.status} />
            </div>
          </div>
        </div>
        {canValidate && (
          <button
            id="receipt-validate-btn"
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
                <span>Validate & Restock</span>
              </>
            )}
          </button>
        )}
      </div>

      {valResult && (
        <div
          className={valResult.success ? 'alert-success' : 'alert-error'}
          style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {valResult.success ? (
            <CheckCircle2 size={16} style={{ color: 'var(--green)' }} />
          ) : (
            <AlertCircle size={16} style={{ color: 'var(--red)' }} />
          )}
          <span>{valResult.message}</span>
        </div>
      )}

      {/* Info card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">Supplier</div>
            <div className="info-val">{receipt.supplier || '—'}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Warehouse</div>
            <div className="info-val">{receipt.warehouse_name || `Warehouse ${receipt.warehouse_id}`}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Created Date</div>
            <div className="info-val">
              {receipt.created_at ? new Date(receipt.created_at).toLocaleString() : '—'}
            </div>
          </div>
          <div className="info-item">
            <div className="info-label">Notes</div>
            <div className="info-val">{receipt.notes || '—'}</div>
          </div>
        </div>
      </div>

      {/* Lines table */}
      <div className="section-title">Received Line Items</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product SKU</th>
              <th>Product Name</th>
              <th>Expected Qty</th>
              <th>Received Qty</th>
            </tr>
          </thead>
          <tbody>
            {(receipt.lines || []).map((ln) => (
              <tr key={ln.id}>
                <td className="td-mono">{ln.sku || `PRD-${ln.product_id}`}</td>
                <td className="fw-600 text-head">{ln.product_name || `Product #${ln.product_id}`}</td>
                <td>{ln.qty}</td>
                <td className="fw-600" style={{ color: 'var(--green)' }}>
                  {receipt.status === 'done' ? ln.qty : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
