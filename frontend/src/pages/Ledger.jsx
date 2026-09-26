// Ledger / Move History — Shadcn Zinc Overhaul
import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import API from '../api';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import {
  ClipboardList,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Search,
  RotateCcw,
  Calendar,
  MapPin,
  Loader2,
} from 'lucide-react';

const TYPE_OPTS = ['', 'receipt', 'delivery', 'transfer', 'adjustment'];

export default function Ledger() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    product_id: '',
    location_id: '',
    warehouse_id: '',
    type: '',
    from: '',
    to: '',
  });

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '')
      );
      const { data } = await API.get('/ledger', { params });
      setEntries(data);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  function setFilter(key, val) {
    setFilters((f) => ({ ...f, [key]: val }));
  }

  function handleReset() {
    setFilters({
      product_id: '',
      location_id: '',
      warehouse_id: '',
      type: '',
      from: '',
      to: '',
    });
  }

  return (
    <Layout title="Move History">
      <div className="space-y-6">
        <PageHeader
          title="Stock Ledger & Audit Trail"
          description="Immutable, double-entry journal records of every balance change and operational transfer"
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLedger}
              className="border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 h-9 text-xs transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-zinc-400" />
              Refresh
            </Button>
          }
        />

        {/* Filter Toolbar */}
        <Card className="border-zinc-800/80 bg-zinc-900/40 p-3 sm:p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                id="ledger-product-filter"
                placeholder="Filter by product name or SKU…"
                value={filters.product_id}
                onChange={(e) => setFilter('product_id', e.target.value)}
                className="pl-9 bg-zinc-950/50 border-zinc-800 text-zinc-100 text-xs h-9 focus-visible:ring-zinc-600"
              />
            </div>

            <select
              id="ledger-type-filter"
              value={filters.type}
              onChange={(e) => setFilter('type', e.target.value)}
              className="h-9 rounded-md border border-zinc-800 bg-zinc-950/50 px-3 text-xs text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-zinc-600"
            >
              {TYPE_OPTS.map((t) => (
                <option key={t} value={t}>
                  {t ? `${t.charAt(0).toUpperCase() + t.slice(1)} Operations` : 'All Movement Types'}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span>From:</span>
              <Input
                id="ledger-from"
                type="date"
                value={filters.from}
                onChange={(e) => setFilter('from', e.target.value)}
                className="w-36 bg-zinc-950/50 border-zinc-800 text-zinc-200 text-xs h-9 focus-visible:ring-zinc-600"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span>To:</span>
              <Input
                id="ledger-to"
                type="date"
                value={filters.to}
                onChange={(e) => setFilter('to', e.target.value)}
                className="w-36 bg-zinc-950/50 border-zinc-800 text-zinc-200 text-xs h-9 focus-visible:ring-zinc-600"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-zinc-400 hover:text-zinc-200 h-9 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
          </div>
        </Card>

        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-zinc-500 animate-spin" />
          </div>
        ) : (
          <Card className="border-zinc-800/80 bg-zinc-900/40 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800/80 bg-zinc-900/60 text-zinc-400 uppercase tracking-wider font-medium text-[11px]">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Location / Zone</th>
                    <th className="py-3 px-4 text-right">Delta (Units)</th>
                    <th className="py-3 px-4">Operation Type</th>
                    <th className="py-3 px-4">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-500">
                        <ClipboardList className="h-8 w-8 mx-auto mb-2 text-zinc-600 stroke-[1.5]" />
                        <p className="text-xs">No ledger records matching criteria</p>
                      </td>
                    </tr>
                  ) : (
                    entries.map((e, i) => {
                      const deltaPositive = Number(e.delta) > 0;
                      return (
                        <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3 px-4 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                            {e.date ? new Date(e.date).toLocaleString() : '—'}
                          </td>
                          <td className="py-3 px-4 font-medium text-zinc-100 whitespace-nowrap">
                            {e.product_name || e.product_id}
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-400 text-[11px] whitespace-nowrap">
                            {e.sku || '—'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 text-zinc-300 font-mono text-[11px]">
                              <MapPin className="h-3 w-3 text-zinc-500" />
                              {e.location || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {deltaPositive ? (
                              <Badge variant="success" className="font-mono text-[11px]">
                                <TrendingUp className="h-3 w-3 mr-1" />+{e.delta}
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="font-mono text-[11px]">
                                <TrendingDown className="h-3 w-3 mr-1" />
                                {e.delta}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge variant="secondary" className="capitalize text-[11px]">
                              {e.type || 'Movement'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                            {e.done_by || 'System Staff'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="py-2.5 px-4 border-t border-zinc-800/80 bg-zinc-900/30 flex justify-between items-center text-[11px] text-zinc-500">
              <span>Double-entry cryptographic ledger</span>
              <span>{entries.length} immutable records</span>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
