import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Loader2 } from "lucide-react";

// Custom colors for the chart
const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1'];

// Type for inventory health data
interface InventoryHealthData {
  name: string;
  value: number;
}

export function InventoryHealthChart() {
  // Fetch inventory health data
  const { data: healthData, isLoading } = useQuery<InventoryHealthData[]>({
    queryKey: ["/api/analytics/inventory-health"],
  });

  // Prepare the data for the pie chart
  const chartData = healthData || [];
  
  // Calculate the total to show percentages
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  
  // Custom tooltip renderer
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / total) * 100).toFixed(1);
      
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">{`${data.value} items (${percentage}%)`}</p>
        </div>
      );
    }
    
    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Inventory Health</CardTitle>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : chartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  dataKey="value"
                  nameKey="name"
                  paddingAngle={2}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  layout="horizontal"
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No inventory data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
