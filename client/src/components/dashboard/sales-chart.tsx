import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function SalesChart() {
  const [timeRange, setTimeRange] = useState("7");
  
  // Fetch sales chart data
  const { data: chartData, isLoading, refetch } = useQuery({
    queryKey: ["/api/analytics/sales-chart", { days: timeRange }],
  });
  
  // Refetch when time range changes
  useEffect(() => {
    refetch();
  }, [timeRange, refetch]);
  
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Sales Trend</CardTitle>
        <Select value={timeRange} onValueChange={handleTimeRangeChange}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : chartData?.length ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => formatShortDate(date)} 
                  stroke="#888888"
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value).split('.')[0]} 
                  stroke="#888888"
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), "Amount"]}
                  labelFormatter={(label) => formatShortDate(label)}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No sales data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
