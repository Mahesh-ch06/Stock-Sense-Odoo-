// Reusable status badge with Lucide icons
import {
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  XCircle,
  PackageCheck,
  Truck,
} from 'lucide-react';

export default function StatusBadge({ status }) {
  const norm = (status || 'draft').toLowerCase();

  const map = {
    draft:     { cls: 'badge-draft',     icon: FileText },
    waiting:   { cls: 'badge-waiting',   icon: Clock },
    ready:     { cls: 'badge-ready',     icon: PackageCheck },
    done:      { cls: 'badge-done',      icon: CheckCircle2 },
    backorder: { cls: 'badge-backorder', icon: AlertTriangle },
    canceled:  { cls: 'badge-canceled',  icon: XCircle },
    picking:   { cls: 'badge-picking',   icon: PackageCheck },
    packing:   { cls: 'badge-packing',   icon: Truck },
  };

  const item = map[norm] || { cls: 'badge-draft', icon: FileText };
  const Icon = item.icon;

  return (
    <span
      className={`badge ${item.cls}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        textTransform: 'capitalize',
      }}
    >
      <Icon size={12} strokeWidth={2.5} />
      <span>{status || 'Draft'}</span>
    </span>
  );
}
