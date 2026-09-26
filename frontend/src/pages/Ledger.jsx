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
      <div className="space-y-8">
        <PageHeader
          title="Stock Ledger & Audit Trail"
          description="Immutable, double-entry journal records of every balance change and operational transfer"
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLedger}
              className="border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 h-10 px-4 text-xs transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-zinc-400" />
              Refresh
            </Button>
          }
        />

        {/* Filter Toolbar */}
        <Card className="border-zinc-800 bg-zinc-900/40 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              <Input
                id="ledger-product-filter"
                placeholder="Filter by product name or SKU…"
                value={filters.product_id}
                onChange={(e) => setFilter('product_id', e.target.value)}
                className="pl-10 bg-zinc-950/60 border-zinc-800 text-zinc-100 text-sm h-10 focus-visible:ring-zinc-600"
              />
            </div>

            <select
              id="ledger-type-filter"
              value={filters.type}
              onChange={(e) => setFilter('type', e.target.value)}
              className="h-10 rounded-md border border-zinc-800 bg-zinc-950/60 px-3.5 text-sm text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-zinc-600"
            >
              {TYPE_OPTS.map((t) => (
                <option key={t} value={t}>
                  {t ? `${t.charAt(0).toUpperCase() + t.slice(1)} Operations` : 'All Movement Types'}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
              <span>From:</span>
              <Input
                id="ledger-from"
                type="date"
                value={filters.from}
                onChange={(e) => setFilter('from', e.target.value)}
                className="w-38 bg-zinc-950/60 border-zinc-800 text-zinc-200 text-sm h-10 focus-visible:ring-zinc-600"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
              <span>To:</span>
              <Input
                id="ledger-to"
                type="date"
                value={filters.to}
                onChange={(e) => setFilter('to', e.target.value)}
                className="w-38 bg-zinc-950/60 border-zinc-800 text-zinc-200 text-sm h-10 focus-visible:ring-zinc-600"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-zinc-400 hover:text-zinc-200 h-10 px-3.5 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
          </div>
        </Card>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-zinc-500 animate-spin" />
          </div>
        ) : (
          <Card className="border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-sm p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/70 text-zinc-400 uppercase tracking-wider font-semibold text-xs">
                    <th className="py-3.5 px-5">Timestamp</th>
                    <th className="py-3.5 px-5">Product Name</th>
                    <th className="py-3.5 px-5">SKU</th>
                    <th className="py-3.5 px-5">Location / Zone</th>
                    <th className="py-3.5 px-5 text-right">Delta (Units)</th>
                    <th className="py-3.5 px-5">Operation Type</th>
                    <th className="py-3.5 px-5">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-zinc-500">
                        <ClipboardList className="h-10 w-10 mx-auto mb-3 text-zinc-600 stroke-[1.5]" />
                        <p className="text-sm font-medium">No ledger records matching criteria</p>
                        <p className="text-xs text-zinc-500 mt-1">Adjust filters or validate warehouse movements</p>
                      </td>
                    </tr>
                  ) : (
                    entries.map((e, i) => {
                      const deltaPositive = Number(e.delta) > 0;
                      return (
                        <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-4 px-5 text-zinc-400 font-mono text-xs whitespace-nowrap">
                            {e.date ? new Date(e.date).toLocaleString() : '—'}
                          </td>
                          <td className="py-4 px-5 font-medium text-zinc-100 whitespace-nowrap">
                            {e.product_name || e.product_id}
                          </td>
                          <td className="py-4 px-5 font-mono text-zinc-400 text-xs whitespace-nowrap">
                            {e.sku || '—'}
                          </td>
                          <td className="py-4 px-5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 text-zinc-300 font-mono text-xs">
                              <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                              {e.location || '—'}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right whitespace-nowrap">
                            {deltaPositive ? (
                              <Badge variant="success" className="font-mono text-xs">
                                <TrendingUp className="h-3.5 w-3.5 mr-1" />+{e.delta}
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="font-mono text-xs">
                                <TrendingDown className="h-3.5 w-3.5 mr-1" />
                                {e.delta}
                              </Badge>
                            )}
                          </td>
                          <td className="py-4 px-5 whitespace-nowrap">
                            <Badge variant="secondary" className="capitalize text-xs">
                              {e.type || 'Movement'}
                            </Badge>
                          </td>
                          <td className="py-4 px-5 text-zinc-400 whitespace-nowrap text-xs">
                            {e.done_by || 'System Staff'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="py-3 px-5 border-t border-zinc-800 bg-zinc-900/30 flex justify-between items-center text-xs text-zinc-500">
              <span>Double-entry cryptographic ledger</span>
              <span>{entries.length} immutable records</span>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
