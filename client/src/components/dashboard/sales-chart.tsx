import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";

export function SalesChart() {
  const [timeRange, setTimeRange] = useState("10");

  const { data: chartData, isLoading } = useQuery<any[]>({
    queryKey: ["/api/analytics/sales-chart", { days: timeRange }],
  });

  const totalSales = chartData?.reduce((s, d) => s + d.amount, 0) ?? 0;
  const bestDay = chartData?.reduce((best, d) => (d.amount > best.amount ? d : best), { amount: 0, date: "" });
  const lastVariation = chartData?.length ? chartData[chartData.length - 1].variation : 0;
  const avgSales = chartData?.length ? totalSales / chartData.length : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const variation = payload.find((p: any) => p.dataKey === "variation")?.value ?? 0;
    const amount = payload.find((p: any) => p.dataKey === "amount")?.value ?? 0;
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-xl p-4 text-sm min-w-[180px]">
        <p className="font-bold text-gray-700 mb-2 text-base">{formatShortDate(label)}</p>
        <div className="flex items-center justify-between gap-4 mb-1">
          <span className="text-gray-500">Revenue</span>
          <span className="font-semibold text-blue-600">{formatCurrency(amount)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-500">vs Prev Day</span>
          <span className={`font-semibold flex items-center gap-1 ${variation > 0 ? "text-green-600" : variation < 0 ? "text-red-500" : "text-gray-400"}`}>
            {variation > 0 ? <TrendingUp className="w-3 h-3" /> : variation < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {variation > 0 ? "+" : ""}{variation}%
          </span>
        </div>
      </div>
    );
  };

  const VariationDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload?.variation) return null;
    const color = payload.variation > 0 ? "#10B981" : payload.variation < 0 ? "#EF4444" : "#9CA3AF";
    return <circle cx={cx} cy={cy} r={5} fill={color} stroke="white" strokeWidth={2} />;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between pb-3 gap-2">
        <div>
          <CardTitle className="text-base font-bold">Sales Trend</CardTitle>
          <p className="text-xs text-gray-500 mt-0.5">
            Daily revenue with day-over-day variation
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[140px] h-8 text-xs shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">Last 10 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      {/* Summary Stats */}
      {!isLoading && chartData?.length ? (
        <div className="grid grid-cols-3 gap-3 px-5 pb-3">
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Total</p>
            <p className="text-sm font-bold text-blue-700">{formatCurrency(totalSales)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Best Day</p>
            <p className="text-sm font-bold text-green-700">{bestDay?.date ? formatShortDate(bestDay.date) : "—"}</p>
          </div>
          <div className={`rounded-lg p-2 text-center ${lastVariation >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Today vs Yesterday</p>
            <p className={`text-sm font-bold ${lastVariation >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              {lastVariation > 0 ? "+" : ""}{lastVariation}%
            </p>
          </div>
        </div>
      ) : null}

      <CardContent className="px-2 pb-4">
        {isLoading ? (
          <div className="h-72 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : chartData?.length ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => formatShortDate(d)}
                  stroke="#CBD5E1"
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`}
                  stroke="#CBD5E1"
                  tick={{ fill: "#64748B", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(v) => `${v}%`}
                  stroke="#CBD5E1"
                  tick={{ fill: "#64748B", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[-80, 80]}
                  width={36}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine yAxisId="left" y={avgSales} stroke="#94A3B8" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "Avg", position: "insideTopLeft", fill: "#94A3B8", fontSize: 10 }} />
                <ReferenceLine yAxisId="right" y={0} stroke="#CBD5E1" strokeWidth={1} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="amount"
                  name="Sales"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  fill="url(#salesGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#3B82F6", stroke: "white", strokeWidth: 2 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="variation"
                  name="Variation %"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={<VariationDot />}
                  activeDot={{ r: 5, stroke: "white", strokeWidth: 2 }}
                  strokeDasharray="5 3"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 flex flex-col items-center justify-center text-gray-400 gap-2">
            <TrendingUp className="w-8 h-8 opacity-30" />
            <p className="text-sm">No sales data for this period</p>
          </div>
        )}

        {/* Legend */}
        {!isLoading && chartData?.length ? (
          <div className="flex items-center gap-6 justify-center mt-3 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-[3px] bg-blue-500 rounded-full" />
              <span>Daily Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-[3px] bg-emerald-500 rounded-full opacity-70" />
              <span>Day-over-Day %</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-[2px] bg-slate-400 rounded-full" />
              <span>Average</span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
