// Reusable status badge
export default function StatusBadge({ status }) {
  const map = {
    draft:     'badge-draft',
    waiting:   'badge-waiting',
    ready:     'badge-ready',
    done:      'badge-done',
    backorder: 'badge-backorder',
    canceled:  'badge-canceled',
    picking:   'badge-picking',
    packing:   'badge-packing',
  };
  const cls = map[status?.toLowerCase()] || 'badge-draft';
  return <span className={`badge ${cls}`}>{status}</span>;
}
