// Dashboard — GET /dashboard/kpis with Shadcn design system & Tailwind v4
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import API from '../api';
import {
  Package,
  AlertTriangle,
  Ban,
  ArrowDownToLine,
  Truck,
  ArrowLeftRight,
  Clock,
  Scale,
  Building2,
  RefreshCw,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

const KPI_CONFIG = [
  { key: 'total_products',     label: 'Active SKUs',        icon: Package,         badge: 'Catalog',    variant: 'secondary' },
  { key: 'low_stock',          label: 'Low Stock Alert',    icon: AlertTriangle,   badge: 'Action Needed', variant: 'warning' },
  { key: 'out_of_stock',       label: 'Depleted Stock',     icon: Ban,             badge: 'Critical',   variant: 'destructive' },
  { key: 'pending_receipts',   label: 'Inbound Orders',     icon: ArrowDownToLine, badge: 'Awaiting Recv', variant: 'info' },
  { key: 'pending_deliveries', label: 'Outbound Dispatches',icon: Truck,           badge: 'Fulfillment', variant: 'warning' },
  { key: 'pending_transfers',  label: 'Internal Relocations',icon: ArrowLeftRight, badge: 'In Transit', variant: 'secondary' },
  { key: 'backorders',         label: 'Active Backorders',  icon: Clock,           badge: 'Delayed',    variant: 'warning' },
];

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [warehouse, setWarehouse] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchKpis();
  }, [warehouse]);

  async function fetchKpis() {
    setLoading(true);
    try {
      const params = warehouse ? { warehouse_id: warehouse } : {};
      const { data } = await API.get('/dashboard/kpis', { params });
      setKpis(data);
    } catch {
      setError('Failed to load operational metrics.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout title="Dashboard">
      {/* Top Banner / Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="text-xl font-semibold tracking-tight text-zinc-100">
            Operational Overview
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time multi-warehouse inventory levels, ledger velocity, and pending movements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            id="dashboard-warehouse-filter"
            className="h-8 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 cursor-pointer"
            value={warehouse}
            onChange={(e) => setWarehouse(e.target.value)}
          >
            <option value="">All Warehouses</option>
            <option value="1">Central Logistics Hub</option>
            <option value="2">West Coast Fulfillment</option>
          </select>
          <button
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
            onClick={fetchKpis}
            title="Refresh metrics"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {loading && <div className="spinner-page" />}
      {error && <div className="alert-error mb-4">{error}</div>}

      {kpis && (
        <>
          {/* KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
            {KPI_CONFIG.map(({ key, label, icon: Icon, badge, variant }) => {
              const val = kpis[key] ?? 0;
              const isAlert = (key === 'low_stock' || key === 'out_of_stock') && Number(val) > 0;

              return (
                <div
                  key={key}
                  className={`rounded-xl border p-4.5 transition-all duration-150 relative overflow-hidden backdrop-blur-xs ${
                    isAlert
                      ? 'border-rose-950/80 bg-rose-950/15 shadow-sm'
                      : 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700/80 hover:bg-zinc-900/70 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-400">{label}</span>
                    <div
                      className={`h-7 w-7 rounded-md flex items-center justify-center border ${
                        isAlert
                          ? 'border-rose-800/40 bg-rose-900/30 text-rose-300'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      <Icon size={14} strokeWidth={2} />
                    </div>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div className="text-2xl font-bold tracking-tight text-zinc-50 font-mono">
                      {val}
                    </div>
                    {badge && (
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          variant === 'destructive' && isAlert
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : variant === 'warning' && isAlert
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50'
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Operations Section */}
          <div className="mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Operational Workflows
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[
              {
                title: 'Inbound Shipments',
                desc: 'Receive PO inventory, check receipts, and validate supplier consignments',
                icon: ArrowDownToLine,
                href: '/receipts',
                badge: 'Stock In',
              },
              {
                title: 'Delivery Orders',
                desc: 'Pick, pack, and validate customer orders with real-time stock allocation',
                icon: Truck,
                href: '/deliveries',
                badge: 'Stock Out',
              },
              {
                title: 'Internal Relocations',
                desc: 'Move stock between storage zones, warehouse racks, and dispatch bays',
                icon: ArrowLeftRight,
                href: '/transfers',
                badge: 'Internal',
              },
              {
                title: 'Cycle Count Audit',
                desc: 'Reconcile physical inventory counts against recorded system ledger balances',
                icon: Scale,
                href: '/adjustments',
                badge: 'Auditing',
              },
              {
                title: 'Storage Facilities',
                desc: 'Configure warehouses, storage zones, aisle bins, and capacity limits',
                icon: Building2,
                href: '/warehouses',
                badge: 'Locations',
              },
              {
                title: 'Master Catalog',
                desc: 'Manage SKUs, categories, supplier costs, and minimum reorder triggers',
                icon: Package,
                href: '/products',
                badge: 'Inventory',
              },
            ].map((q) => {
              const Icon = q.icon;
              return (
                <Link
                  key={q.href}
                  to={q.href}
                  className="group rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 transition-all duration-150 hover:border-zinc-700 hover:bg-zinc-900/80 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-8 w-8 rounded-lg bg-zinc-800/70 border border-zinc-700/60 flex items-center justify-center text-zinc-200 group-hover:text-zinc-50 group-hover:bg-zinc-800 transition-colors">
                        <Icon size={16} strokeWidth={2} />
                      </div>
                      <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider group-hover:text-zinc-400 transition-colors">
                        {q.badge}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">
                      {q.title}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {q.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/50 flex items-center justify-between text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">
                    <span className="text-[11px] font-medium">Open Workflow</span>
                    <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </Layout>
  );
}
