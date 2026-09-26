// Transfer Detail — GET /transfers/:id, POST /transfers/:id/validate
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import API from '../api';

export default function TransferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => { fetchTransfer(); }, [id]);

  async function fetchTransfer() {
    setLoading(true);
    try {
      const { data } = await API.get(`/transfers/${id}`);
      setTransfer(data);
    } catch { navigate('/transfers'); }
    finally { setLoading(false); }
  }

  async function handleValidate() {
    setValidating(true); setResult(null);
    try {
      const { data } = await API.post(`/transfers/${id}/validate`);
      setResult({ success: true, message: data.message || 'Transfer validated successfully!' });
      fetchTransfer();
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Validation failed.' });
    } finally { setValidating(false); }
  }

  if (loading) return <Layout title="Transfer Detail"><div className="spinner-page" /></Layout>;
  if (!transfer) return null;

  const canValidate = !['done', 'canceled'].includes(transfer.status);

  return (
    <Layout title="Transfer Detail">
      <div className="page-header">
        <div className="flex-center gap-8">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/transfers')}>← Back</button>
          <div>
            <div className="page-title">{transfer.reference || `TRF/${transfer.id}`}</div>
            <div style={{ marginTop: 4 }}><StatusBadge status={transfer.status} /></div>
          </div>
        </div>
        {canValidate && (
          <button id="transfer-validate-btn" className="btn btn-primary"
            onClick={handleValidate} disabled={validating}>
            {validating ? <><span className="spinner" /> Validating…</> : '✔ Validate'}
          </button>
        )}
      </div>

      {result && (
        <div className={result.success ? 'alert-success' : 'alert-error'} style={{ marginBottom: 16 }}>
          {result.message}
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="detail-grid">
          <div className="detail-item"><div className="detail-label">From Location</div><div className="detail-value">{transfer.from_location || '—'}</div></div>
          <div className="detail-item"><div className="detail-label">To Location</div><div className="detail-value">{transfer.to_location || '—'}</div></div>
          <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value"><StatusBadge status={transfer.status} /></div></div>
          <div className="detail-item"><div className="detail-label">Created</div><div className="detail-value">{transfer.created_at ? new Date(transfer.created_at).toLocaleString() : '—'}</div></div>
          {transfer.notes && (
            <div className="detail-item" style={{ gridColumn: '1/-1' }}>
              <div className="detail-label">Notes</div>
              <div className="detail-value">{transfer.notes}</div>
            </div>
          )}
        </div>
      </div>

      <div className="section-title">Transfer Lines</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Product</th><th>SKU</th><th>Qty</th><th>Done Qty</th></tr>
          </thead>
          <tbody>
            {(transfer.lines || []).map((ln, i) => (
              <tr key={i}>
                <td className="fw-600 text-head">{ln.product_name || ln.product_id}</td>
                <td className="td-mono">{ln.sku || '—'}</td>
                <td>{ln.qty}</td>
                <td>{ln.done_qty ?? '—'}</td>
              </tr>
            ))}
            {(transfer.lines || []).length === 0 && (
              <tr><td colSpan={4} className="text-muted" style={{ textAlign: 'center', padding: 24 }}>No lines</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
