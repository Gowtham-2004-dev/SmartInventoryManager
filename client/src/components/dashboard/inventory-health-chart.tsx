import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Loader2 } from "lucide-react";

const COLORS = ["#10B981", "#F59E0B", "#EF4444", "#6366F1"];
const BG_COLORS = ["bg-emerald-100", "bg-amber-100", "bg-red-100", "bg-indigo-100"];
const TEXT_COLORS = ["text-emerald-700", "text-amber-700", "text-red-700", "text-indigo-700"];

interface InventoryHealthData {
  name: string;
  value: number;
}

export function InventoryHealthChart() {
  const { data: healthData, isLoading } = useQuery<InventoryHealthData[]>({
    queryKey: ["/api/analytics/inventory-health"],
  });

  const chartData = (healthData || []).filter(d => d.value > 0);
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : 0;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold">{d.name}</p>
        <p className="text-gray-600">{d.value} products ({pct}%)</p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Inventory Health</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-56 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : chartData.length > 0 ? (
          <div className="flex flex-col gap-4">
            {/* Donut chart */}
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={42}
                    dataKey="value"
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom legend below chart */}
            <div className="grid grid-cols-2 gap-2">
              {chartData.map((item, index) => {
                const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
                return (
                  <div
                    key={item.name}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 ${BG_COLORS[index % BG_COLORS.length]}`}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold ${TEXT_COLORS[index % TEXT_COLORS.length]}`}>
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">{item.value} items · {pct}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-56 flex items-center justify-center text-gray-500">
            No inventory data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
