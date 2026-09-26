import React, { useMemo, useState } from 'react';
import { TrendingUp, ShoppingBag, Receipt, Package, RefreshCw, XCircle } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { Order } from '../types';

type Range = 'today' | '7d' | '30d' | 'all';

const RANGES: { value: Range; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: 'all', label: 'All Time' }
];

const SERVICE_LABELS: Record<string, string> = {
  'dine-in': 'Dine-In',
  pickup: 'Pickup',
  delivery: 'Delivery'
};

const peso = (n: number) =>
  `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const rangeStart = (range: Range): Date | null => {
  const today = startOfDay(new Date());
  if (range === 'today') return today;
  if (range === '7d') return new Date(today.getTime() - 6 * 86400000);
  if (range === '30d') return new Date(today.getTime() - 29 * 86400000);
  return null;
};

interface Bucket {
  key: string;
  label: string;
  tooltip: string;
  revenue: number;
  orders: number;
}

// Hourly buckets for "today", daily buckets otherwise (all-time is capped to the
// span between the first order and today).
const buildBuckets = (orders: Order[], range: Range): Bucket[] => {
  const buckets: Bucket[] = [];
  if (range === 'today') {
    for (let h = 0; h < 24; h++) {
      const label = new Date(2000, 0, 1, h).toLocaleTimeString('en-PH', { hour: 'numeric' });
      buckets.push({ key: String(h), label, tooltip: label, revenue: 0, orders: 0 });
    }
    orders.forEach(o => {
      const b = buckets[new Date(o.created_at).getHours()];
      b.revenue += Number(o.total_price) || 0;
      b.orders += 1;
    });
    return buckets;
  }

  const today = startOfDay(new Date());
  let start = rangeStart(range);
  if (!start) {
    const first = orders.reduce<Date>((min, o) => {
      const d = startOfDay(new Date(o.created_at));
      return d < min ? d : min;
    }, today);
    start = first;
  }
  const index = new Map<string, Bucket>();
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const b: Bucket = {
      key: dayKey(d),
      label: d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
      tooltip: d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' }),
      revenue: 0,
      orders: 0
    };
    buckets.push(b);
    index.set(b.key, b);
  }
  orders.forEach(o => {
    const b = index.get(dayKey(new Date(o.created_at)));
    if (b) {
      b.revenue += Number(o.total_price) || 0;
      b.orders += 1;
    }
  });
  return buckets;
};

const tally = <T,>(rows: T[], keyOf: (r: T) => string, valueOf: (r: T) => number) => {
  const map = new Map<string, number>();
  rows.forEach(r => map.set(keyOf(r), (map.get(keyOf(r)) || 0) + valueOf(r)));
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
};

const StatTile: React.FC<{ icon: React.ReactNode; label: string; value: string; sub?: string }> = ({ icon, label, value, sub }) => (
  <div className="mission-card p-5">
    <div className="flex items-center gap-2 text-teamax-secondary mb-3">
      {icon}
      <p className="text-[10px] font-bold uppercase tracking-widest">{label}</p>
    </div>
    <p className="text-2xl md:text-3xl font-bold text-teamax-primary tabular-nums">{value}</p>
    {sub && <p className="text-[11px] text-teamax-secondary mt-1">{sub}</p>}
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-sm font-display font-bold text-teamax-gold mb-5 flex items-center gap-3 tracking-[0.12em] uppercase">
    <div className="w-1 h-5 bg-teamax-gold"></div>
    {children}
  </h3>
);

const BarList: React.FC<{ rows: { name: string; value: number }[]; format: (n: number) => string; empty: string }> = ({ rows, format, empty }) => {
  if (rows.length === 0) return <p className="text-xs text-teamax-secondary italic">{empty}</p>;
  const max = Math.max(...rows.map(r => r.value), 1);
  return (
    <ul className="space-y-3">
      {rows.map(r => (
        <li key={r.name} title={`${r.name}: ${format(r.value)}`}>
          <div className="flex justify-between gap-3 text-xs mb-1">
            <span className="text-teamax-primary truncate">{r.name}</span>
            <span className="text-teamax-secondary tabular-nums flex-shrink-0">{format(r.value)}</span>
          </div>
          <div className="h-2 bg-black">
            <div className="h-full bg-teamax-gold rounded-r" style={{ width: `${Math.max((r.value / max) * 100, 1)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
};

const RevenueChart: React.FC<{ buckets: Bucket[] }> = ({ buckets }) => {
  const [hover, setHover] = useState<number | null>(null);
  const peak = Math.max(0, ...buckets.map(b => b.revenue));
  const max = peak || 1;
  // Label roughly 6 ticks along the axis so dense ranges stay readable
  const every = Math.max(1, Math.ceil(buckets.length / 6));
  const active = hover !== null ? buckets[hover] : null;

  return (
    <div>
      <div className="h-6 text-xs text-teamax-secondary mb-2">
        {active ? (
          <span>
            <span className="text-teamax-primary font-bold">{active.tooltip}</span> · {peso(active.revenue)} · {active.orders} order{active.orders === 1 ? '' : 's'}
          </span>
        ) : (
          <span>Peak: {peso(peak)} · hover a bar for details</span>
        )}
      </div>
      <div className="relative h-48 flex items-end gap-[2px] border-b border-teamax-gold/30" onMouseLeave={() => setHover(null)}>
        {/* recessive gridlines */}
        {[0.25, 0.5, 0.75].map(f => (
          <div key={f} className="absolute left-0 right-0 border-t border-teamax-gold/10 pointer-events-none" style={{ bottom: `${f * 100}%` }} />
        ))}
        {buckets.map((b, i) => (
          <div
            key={b.key}
            className="relative flex-1 h-full flex items-end cursor-default"
            onMouseEnter={() => setHover(i)}
            onClick={() => setHover(i)}
            title={`${b.tooltip}: ${peso(b.revenue)} (${b.orders} orders)`}
          >
            <div
              className={`w-full rounded-t transition-colors ${hover === i ? 'bg-teamax-primary' : 'bg-teamax-gold'}`}
              style={{ height: b.revenue > 0 ? `${Math.max((b.revenue / max) * 100, 2)}%` : '0' }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-[2px] mt-2">
        {buckets.map((b, i) => (
          <div key={b.key} className="flex-1 text-center text-[9px] text-teamax-secondary whitespace-nowrap overflow-visible">
            {i % every === 0 ? b.label : ''}
          </div>
        ))}
      </div>
    </div>
  );
};

const SalesAnalytics: React.FC = () => {
  const { orders, loading, error, refreshOrders } = useOrders();
  const [range, setRange] = useState<Range>('7d');

  const data = useMemo(() => {
    const start = rangeStart(range);
    const inRange = orders.filter(o => !start || new Date(o.created_at) >= start);
    const cancelled = inRange.filter(o => o.status === 'cancelled');
    const valid = inRange.filter(o => o.status !== 'cancelled');
    const revenue = valid.reduce((s, o) => s + (Number(o.total_price) || 0), 0);
    const items = valid.flatMap(o => o.order_items || []);
    const itemsSold = items.reduce((s, i) => s + (i.quantity || 0), 0);

    return {
      revenue,
      orderCount: valid.length,
      cancelledCount: cancelled.length,
      avg: valid.length ? revenue / valid.length : 0,
      itemsSold,
      pending: valid.filter(o => o.status === 'pending' || o.status === 'preparing').length,
      buckets: buildBuckets(valid, range),
      topByQty: tally(items, i => i.name, i => i.quantity || 0).slice(0, 8),
      topByRevenue: tally(items, i => i.name, i => Number(i.total_item_price) || 0).slice(0, 8),
      byService: tally(valid, o => SERVICE_LABELS[o.service_type] || o.service_type, o => Number(o.total_price) || 0),
      byPayment: tally(valid, o => o.payment_method || 'Unspecified', o => Number(o.total_price) || 0),
      byStatus: tally(inRange, o => o.status.charAt(0).toUpperCase() + o.status.slice(1), () => 1)
    };
  }, [orders, range]);

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teamax-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors ${range === r.value
                ? 'bg-teamax-gold text-black border-teamax-gold'
                : 'border-teamax-gold/30 text-teamax-gold hover:bg-teamax-gold/10'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => refreshOrders()}
          className="flex items-center gap-2 self-start sm:self-auto px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-teamax-gold/30 text-teamax-secondary hover:text-teamax-gold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && <p className="text-sm text-red-400">Failed to load orders: {error}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon={<TrendingUp className="h-4 w-4" />} label="Revenue" value={peso(data.revenue)} sub="Excludes cancelled orders" />
        <StatTile icon={<ShoppingBag className="h-4 w-4" />} label="Orders" value={String(data.orderCount)} sub={`${data.pending} still open`} />
        <StatTile icon={<Receipt className="h-4 w-4" />} label="Avg. Order" value={peso(data.avg)} />
        <StatTile icon={<Package className="h-4 w-4" />} label="Items Sold" value={String(data.itemsSold)} sub={
          data.cancelledCount ? `${data.cancelledCount} cancelled order${data.cancelledCount === 1 ? '' : 's'}` : undefined
        } />
      </div>

      <div className="mission-card p-5 md:p-6">
        <SectionTitle>{range === 'today' ? 'Revenue by Hour' : 'Revenue by Day'}</SectionTitle>
        {data.orderCount === 0 ? (
          <p className="text-xs text-teamax-secondary italic py-10 text-center">No sales in this period yet.</p>
        ) : (
          <RevenueChart buckets={data.buckets} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="mission-card p-5 md:p-6">
          <SectionTitle>Best Sellers (Qty)</SectionTitle>
          <BarList rows={data.topByQty} format={n => `${n} sold`} empty="No items sold yet." />
        </div>
        <div className="mission-card p-5 md:p-6">
          <SectionTitle>Top Items by Revenue</SectionTitle>
          <BarList rows={data.topByRevenue} format={peso} empty="No items sold yet." />
        </div>
        <div className="mission-card p-5 md:p-6">
          <SectionTitle>Sales by Service Type</SectionTitle>
          <BarList rows={data.byService} format={peso} empty="No sales yet." />
        </div>
        <div className="mission-card p-5 md:p-6">
          <SectionTitle>Sales by Payment Method</SectionTitle>
          <BarList rows={data.byPayment} format={peso} empty="No sales yet." />
        </div>
      </div>

      <div className="mission-card p-5 md:p-6">
        <SectionTitle>Order Status</SectionTitle>
        {data.byStatus.length === 0 ? (
          <p className="text-xs text-teamax-secondary italic">No orders in this period.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {data.byStatus.map(s => (
              <div key={s.name} className="border border-teamax-gold/20 bg-black p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-teamax-secondary flex items-center justify-center gap-1">
                  {s.name === 'Cancelled' && <XCircle className="h-3 w-3" />}
                  {s.name}
                </p>
                <p className="text-xl font-bold text-teamax-primary mt-1 tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesAnalytics;
