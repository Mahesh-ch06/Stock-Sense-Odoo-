// Dashboard — Real-Time Inventory Valuation, Critical Stock Replenishment & KPIs
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import API from '../api';
import {
  DollarSign,
  Package,
  Layers,
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
  Plus,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Activity,
} from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [warehouse, setWarehouse] = useState('');
  const [warehousesList, setWarehousesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch dynamic warehouses for dropdown
  useEffect(() => {
    async function loadWarehouses() {
      try {
        const res = await API.get('/warehouses');
        setWarehousesList(res.data || []);
      } catch (err) {
        console.error('Failed to load warehouses list', err);
      }
    }
    loadWarehouses();
  }, []);

  const fetchKpis = useCallback(async () => {
    setLoading(true);
    try {
      const params = warehouse ? { warehouse_id: warehouse } : {};
      const res = await API.get('/dashboard/kpis', { params });
      setData(res.data);
    } catch {
      setError('Failed to load operational metrics.');
    } finally {
      setLoading(false);
    }
  }, [warehouse]);

  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);

  return (
    <Layout title="Dashboard">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-800/80 mb-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Operational Overview
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Real-time capital valuation, threshold deficit alerts, and movement velocity
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            id="dashboard-warehouse-filter"
            className="h-9 rounded-md border border-zinc-800 bg-zinc-900 px-3.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 cursor-pointer"
            value={warehouse}
            onChange={(e) => setWarehouse(e.target.value)}
          >
            <option value="">All Warehouses</option>
            {warehousesList.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name}
              </option>
            ))}
          </select>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
            onClick={fetchKpis}
            title="Refresh metrics"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {loading && <div className="spinner-page" />}
      {error && <div className="alert-error mb-6">{error}</div>}

      {data && (
        <div className="space-y-8">
          {/* ── 1. Top Executive Asset Valuation Banner ──────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Valuation */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-6 backdrop-blur-xs shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Total Inventory Asset Value</span>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <DollarSign size={16} strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50 font-mono">
                  ${Number(data.total_valuation || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                  <span>Liquid asset valuation at cost</span>
                </div>
              </div>
            </div>

            {/* Total Physical Units */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-6 backdrop-blur-xs shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Total Units On Hand</span>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center border border-sky-500/20 bg-sky-500/10 text-sky-400">
                  <Layers size={16} strokeWidth={2} />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50 font-mono">
                  {Number(data.total_units || 0).toLocaleString()} <span className="text-sm font-normal text-zinc-500">units</span>
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  Across all active bin storage zones
                </div>
              </div>
            </div>

            {/* Low & Out-of-Stock Deficit */}
            <div className={`rounded-xl border p-6 backdrop-blur-xs shadow-xs space-y-3 ${
              (data.low_stock > 0 || data.out_of_stock > 0)
                ? 'border-rose-950/80 bg-rose-950/15'
                : 'border-zinc-800/80 bg-zinc-900/50'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Stock Deficit Alerts</span>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${
                  (data.low_stock > 0 || data.out_of_stock > 0)
                    ? 'border-rose-500/30 bg-rose-500/15 text-rose-400'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                }`}>
                  <AlertTriangle size={16} strokeWidth={2} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50 font-mono">
                  {(data.low_stock || 0) + (data.out_of_stock || 0)}
                </div>
                <div className="text-xs text-rose-400 font-medium">
                  {data.out_of_stock > 0 ? `${data.out_of_stock} depleted` : ''}
                  {data.out_of_stock > 0 && data.low_stock > 0 ? ', ' : ''}
                  {data.low_stock > 0 ? `${data.low_stock} below threshold` : ''}
                  {data.low_stock === 0 && data.out_of_stock === 0 ? 'Healthy' : ''}
                </div>
              </div>
            </div>

            {/* Active SKUs */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-6 backdrop-blur-xs shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Managed SKU Catalog</span>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center border border-zinc-800 bg-zinc-900 text-zinc-400">
                  <Package size={16} strokeWidth={2} />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50 font-mono">
                  {data.total_products || 0} <span className="text-sm font-normal text-zinc-500">SKUs</span>
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  Categorized products catalog
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. Critical Stock Attention Table ──────────────── */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-400" />
                  <h2 className="text-base font-semibold text-zinc-100">
                    Critical Stock & Reorder Attention
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Products currently at or below minimum reorder point requiring vendor replenishment
                </p>
              </div>

              <Link
                to="/receipts"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 px-3.5 py-2 rounded-md border border-zinc-700/60 transition-colors w-fit"
              >
                <Plus size={14} />
                <span>Create Inbound Restock</span>
              </Link>
            </div>

            {(!data.critical_items || data.critical_items.length === 0) ? (
              <div className="flex items-center gap-3 p-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm font-medium">
                <CheckCircle2 size={18} />
                <span>All stock levels are currently healthy! No products are below reorder threshold.</span>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Current On-Hand</th>
                      <th>Reorder Point</th>
                      <th>Suggested Order</th>
                      <th>Unit Cost</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.critical_items.map((item) => {
                      const isZero = item.current_stock === 0;
                      return (
                        <tr key={item.id} className="hover:bg-zinc-800/50 transition-colors">
                          <td className="td-mono font-medium">{item.sku}</td>
                          <td className="fw-600 text-head">{item.name}</td>
                          <td>
                            <span className="badge badge-draft text-[11px]">
                              {item.category_name || 'General'}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`inline-flex items-center gap-1.5 font-mono font-semibold ${
                                isZero ? 'text-rose-400' : 'text-amber-400'
                              }`}
                            >
                              {isZero ? <Ban size={13} /> : <AlertTriangle size={13} />}
                              {item.current_stock} {item.unit_of_measure}
                            </span>
                          </td>
                          <td className="font-mono text-zinc-400">{item.reorder_point}</td>
                          <td className="font-mono text-zinc-200">
                            +{item.reorder_qty || (item.reorder_point * 2)} {item.unit_of_measure}
                          </td>
                          <td className="font-mono text-zinc-300">
                            ${Number(item.unit_cost || 0).toFixed(2)}
                          </td>
                          <td className="text-right">
                            <Link
                              to="/receipts"
                              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-100 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1.5 rounded border border-zinc-700/60 transition-colors"
                            >
                              <span>Restock</span>
                              <ArrowUpRight size={12} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── 3. Operational Workflow Queues & Recent Ledger Activity ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Operational Pipeline Status */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
                  Active Operational Queues
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                      <ArrowDownToLine size={14} className="text-sky-400" />
                      <span>Receipts</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-zinc-100 pt-1">
                      {data.pending_receipts || 0}
                    </div>
                    <span className="text-[11px] text-zinc-500 block">Awaiting check-in</span>
                  </div>

                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                      <Truck size={14} className="text-amber-400" />
                      <span>Deliveries</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-zinc-100 pt-1">
                      {data.pending_deliveries || 0}
                    </div>
                    <span className="text-[11px] text-zinc-500 block">Pick / pack queue</span>
                  </div>

                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                      <ArrowLeftRight size={14} className="text-purple-400" />
                      <span>Transfers</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-zinc-100 pt-1">
                      {data.pending_transfers || 0}
                    </div>
                    <span className="text-[11px] text-zinc-500 block">In relocation</span>
                  </div>

                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                      <Clock size={14} className="text-rose-400" />
                      <span>Backorders</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-zinc-100 pt-1">
                      {data.backorders || 0}
                    </div>
                    <span className="text-[11px] text-zinc-500 block">Delayed items</span>
                  </div>
                </div>
              </div>

              {/* Quick links to workflows */}
              <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                <Link to="/deliveries" className="hover:text-zinc-100 inline-flex items-center gap-1 transition-colors">
                  <span>Go to Delivery Dispatch Queue</span>
                  <ArrowUpRight size={13} />
                </Link>
                <Link to="/transfers" className="hover:text-zinc-100 inline-flex items-center gap-1 transition-colors">
                  <span>Transfer Orders</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>
            </div>

            {/* Live Audit Activity Stream */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity size={15} className="text-zinc-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Live Stock Ledger Feed
                  </span>
                </div>
                <Link to="/ledger" className="text-xs text-zinc-400 hover:text-zinc-100 inline-flex items-center gap-1 transition-colors">
                  <span>Full Ledger</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>

              {(!data.recent_activity || data.recent_activity.length === 0) ? (
                <div className="text-xs text-zinc-500 py-8 text-center">No recent stock activity logged</div>
              ) : (
                <div className="space-y-3">
                  {data.recent_activity.map((act) => {
                    const isPositive = Number(act.delta) > 0;
                    return (
                      <div
                        key={act.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60 text-xs hover:border-zinc-700/80 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${
                              isPositive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-zinc-200 truncate">
                              {act.product_name}
                            </div>
                            <div className="text-[11px] text-zinc-500">
                              {act.location_name} • {act.operator_name || 'System Staff'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-3">
                          <div
                            className={`font-mono font-semibold ${
                              isPositive ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isPositive ? '+' : ''}{act.delta}
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            {act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── 4. Quick Workflow Navigation Grid ─────────────── */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
              Operations Hub
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
              {[
                { title: 'Inbound Receipts', desc: 'Process vendor shipments & restock catalog', icon: ArrowDownToLine, href: '/receipts' },
                { title: 'Delivery Dispatches', desc: 'Picking, packing & customer fulfillment', icon: Truck, href: '/deliveries' },
                { title: 'Internal Relocations', desc: 'Move inventory between storage zones & bins', icon: ArrowLeftRight, href: '/transfers' },
                { title: 'Cycle Count Audit', desc: 'Reconcile physical stock against system ledger', icon: Scale, href: '/adjustments' },
                { title: 'Storage Facilities', desc: 'Manage warehouses, zones, and rack limits', icon: Building2, href: '/warehouses' },
                { title: 'Catalog & SKUs', desc: 'Set pricing, units of measure, and reorder levels', icon: Package, href: '/products' },
              ].map((q) => {
                const Icon = q.icon;
                return (
                  <Link
                    key={q.href}
                    to={q.href}
                    className="group rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 transition-all duration-150 hover:border-zinc-700 hover:bg-zinc-900/80 shadow-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-9 w-9 rounded-lg bg-zinc-800/70 border border-zinc-700/60 flex items-center justify-center text-zinc-200 group-hover:text-zinc-50 group-hover:bg-zinc-800 transition-colors">
                        <Icon size={18} strokeWidth={2} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">
                          {q.title}
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {q.desc}
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight size={14} className="text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-3" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
