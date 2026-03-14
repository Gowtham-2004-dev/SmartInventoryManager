import { Forecast } from "@shared/schema";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useState, useMemo } from "react";
import { formatShortDate } from "@/lib/utils";

interface ForecastChartProps {
  forecasts: Forecast[];
  getProductName: (productId: number) => string;
}

const COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899",
  "#06B6D4", "#F97316", "#14B8A6", "#EF4444", "#6366F1",
];

export function ForecastChart({ forecasts, getProductName }: ForecastChartProps) {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  // Get top products by max predicted demand
  const topProductIds = useMemo(() => {
    const maxByProduct: Record<number, number> = {};
    for (const f of forecasts) {
      maxByProduct[f.productId] = Math.max(maxByProduct[f.productId] ?? 0, f.predictedDemand);
    }
    return Object.entries(maxByProduct)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id]) => Number(id));
  }, [forecasts]);

  const activeProductIds = selectedProducts.length > 0 ? selectedProducts : topProductIds.slice(0, 5);

  // Build chart data: one row per unique forDate, columns per product
  const chartData = useMemo(() => {
    const dateMap: Record<string, Record<string, any>> = {};

    for (const f of forecasts) {
      if (!activeProductIds.includes(f.productId)) continue;

      const rawDate = f.forDate ? String(f.forDate) : "";
      const dateKey = rawDate.split("T")[0];
      if (!dateKey) continue;

      if (!dateMap[dateKey]) dateMap[dateKey] = { date: dateKey };
      const name = getProductName(f.productId);
      dateMap[dateKey][name] = f.predictedDemand;
    }

    return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [forecasts, activeProductIds, getProductName]);

  const toggleProduct = (id: number) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  if (!forecasts.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        No forecast data. Click "Update Forecasts" to generate predictions.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => formatShortDate(d)}
              stroke="#888888"
              fontSize={11}
            />
            <YAxis stroke="#888888" fontSize={11} />
            <Tooltip
              formatter={(value, name) => [value + " units", name]}
              labelFormatter={(label) => `Forecast: ${formatShortDate(label)}`}
            />
            <Legend />
            {activeProductIds.map((productId, index) => (
              <Line
                key={productId}
                type="monotone"
                dataKey={getProductName(productId)}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Product filter pills */}
      <div className="flex flex-wrap gap-2">
        {topProductIds.map((productId, index) => {
          const isActive = activeProductIds.includes(productId);
          return (
            <button
              key={productId}
              onClick={() => toggleProduct(productId)}
              className={`px-3 py-1 text-xs rounded-full border flex items-center gap-1.5 transition-opacity ${
                isActive ? "bg-gray-100 border-gray-300" : "bg-white border-gray-200 opacity-50"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              {getProductName(productId)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
