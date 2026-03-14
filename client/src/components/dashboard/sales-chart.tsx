import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function SalesChart() {
  const [timeRange, setTimeRange] = useState("10");

  const { data: chartData, isLoading } = useQuery({
    queryKey: ["/api/analytics/sales-chart", { days: timeRange }],
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold mb-1">{formatShortDate(label)}</p>
        {payload.map((entry: any) => (
          <p key={entry.dataKey} style={{ color: entry.color }}>
            {entry.dataKey === "amount"
              ? `Sales: ${formatCurrency(entry.value)}`
              : `Variation: ${entry.value > 0 ? "+" : ""}${entry.value}%`}
          </p>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Sales Trend</CardTitle>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">Last 10 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {isLoading ? (
          <div className="h-72 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : chartData?.length ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => formatShortDate(d)}
                  stroke="#888888"
                  fontSize={11}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(v) => formatCurrency(v).split(".")[0]}
                  stroke="#3B82F6"
                  fontSize={11}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(v) => `${v}%`}
                  stroke="#F59E0B"
                  fontSize={11}
                  domain={[-100, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="amount"
                  name="Sales (₹)"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="variation"
                  name="Day-over-Day %"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 flex items-center justify-center text-gray-500">
            No sales data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
