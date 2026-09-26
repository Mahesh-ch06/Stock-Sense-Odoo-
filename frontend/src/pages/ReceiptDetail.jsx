// Receipt Detail — GET /receipts/:id, POST /receipts/:id/validate
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import API from '../api';

export default function ReceiptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [valResult, setValResult] = useState(null); // { success, message }

  useEffect(() => { fetchReceipt(); }, [id]);

  async function fetchReceipt() {
    setLoading(true);
    try {
      const { data } = await API.get(`/receipts/${id}`);
      setReceipt(data);
    } catch { navigate('/receipts'); }
    finally { setLoading(false); }
  }

  async function handleValidate() {
    setValidating(true); setValResult(null);
    try {
      const { data } = await API.post(`/receipts/${id}/validate`);
      setValResult({ success: true, message: data.message || 'Receipt validated successfully!' });
      fetchReceipt();
    } catch (err) {
      setValResult({ success: false, message: err.response?.data?.message || 'Validation failed.' });
    } finally { setValidating(false); }
  }

  if (loading) return <Layout title="Receipt Detail"><div className="spinner-page" /></Layout>;
  if (!receipt) return null;

  const canValidate = !['done', 'canceled'].includes(receipt.status);

  return (
    <Layout title="Receipt Detail">
      <div className="page-header">
        <div className="flex-center gap-8">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/receipts')}>← Back</button>
          <div>
            <div className="page-title">{receipt.reference || `RCP/${receipt.id}`}</div>
            <div style={{ marginTop: 4 }}><StatusBadge status={receipt.status} /></div>
          </div>
        </div>
        {canValidate && (
          <button id="receipt-validate-btn" className="btn btn-primary"
            onClick={handleValidate} disabled={validating}>
            {validating ? <><span className="spinner" /> Validating…</> : '✔ Validate'}
          </button>
        )}
      </div>

      {valResult && (
        <div className={valResult.success ? 'alert-success' : 'alert-error'} style={{ marginBottom: 16 }}>
          {valResult.message}
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="detail-grid">
          <div className="detail-item">
            <div className="detail-label">Supplier</div>
            <div className="detail-value">{receipt.supplier || '—'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Warehouse</div>
            <div className="detail-value">{receipt.warehouse || '—'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Status</div>
            <div className="detail-value"><StatusBadge status={receipt.status} /></div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Created</div>
            <div className="detail-value">{receipt.created_at ? new Date(receipt.created_at).toLocaleString() : '—'}</div>
          </div>
          <div className="detail-item" style={{ gridColumn: '1/-1' }}>
            <div className="detail-label">Notes</div>
            <div className="detail-value">{receipt.notes || '—'}</div>
          </div>
        </div>
      </div>

      <div className="section-title">Receipt Lines</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Product</th><th>SKU</th><th>Ordered Qty</th><th>Done Qty</th></tr>
          </thead>
          <tbody>
            {(receipt.lines || []).map((ln, i) => (
              <tr key={i}>
                <td className="fw-600 text-head">{ln.product_name || ln.product_id}</td>
                <td className="td-mono">{ln.sku || '—'}</td>
                <td>{ln.qty}</td>
                <td>{ln.done_qty ?? '—'}</td>
              </tr>
            ))}
            {(receipt.lines || []).length === 0 && (
              <tr><td colSpan={4} className="text-muted" style={{ textAlign: 'center', padding: 24 }}>No lines</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
