import { Forecast } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState, useMemo } from "react";
import { formatShortDate } from "@/lib/utils";

interface ForecastChartProps {
  forecasts: Forecast[];
  getProductName: (productId: number) => string;
}

export function ForecastChart({ forecasts, getProductName }: ForecastChartProps) {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  // Group forecasts by date for chart data
  const chartData = useMemo(() => {
    // Get unique dates
    const uniqueDates = Array.from(new Set(forecasts.map(f => f.forDate.toString().split('T')[0])));
    
    // If no products are selected, select the top 5 with highest demand
    const productsToShow = selectedProducts.length > 0 
      ? selectedProducts 
      : forecasts
          .sort((a, b) => b.predictedDemand - a.predictedDemand)
          .slice(0, 5)
          .map(f => f.productId);
    
    // Create chart data array
    return uniqueDates.map(date => {
      const dataPoint: Record<string, any> = { date };
      
      forecasts
        .filter(f => f.forDate.toString().includes(date) && productsToShow.includes(f.productId))
        .forEach(forecast => {
          const productName = getProductName(forecast.productId);
          dataPoint[productName] = forecast.predictedDemand;
        });
      
      return dataPoint;
    });
  }, [forecasts, selectedProducts, getProductName]);

  // Get unique product IDs for legend
  const uniqueProductIds = useMemo(() => 
    Array.from(new Set(forecasts.map(f => f.productId)))
      .sort((a, b) => {
        const productAForecasts = forecasts.filter(f => f.productId === a);
        const productBForecasts = forecasts.filter(f => f.productId === b);
        
        const maxDemandA = Math.max(...productAForecasts.map(f => f.predictedDemand));
        const maxDemandB = Math.max(...productBForecasts.map(f => f.predictedDemand));
        
        return maxDemandB - maxDemandA;
      })
      .slice(0, 10), // Limit to top 10 products
  [forecasts]);

  // Toggle product selection
  const toggleProductSelection = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Generate colors for each product
  const productColors = [
    "#3B82F6", // blue
    "#10B981", // green
    "#F59E0B", // amber
    "#8B5CF6", // violet
    "#EC4899", // pink
    "#06B6D4", // cyan
    "#F97316", // orange
    "#14B8A6", // teal
    "#EF4444", // red
    "#6366F1", // indigo
  ];

  return (
    <div className="space-y-4">
      <div className="h-[300px]">
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
            <YAxis stroke="#888888" fontSize={12} />
            <Tooltip 
              formatter={(value, name) => [value, name]}
              labelFormatter={(label) => formatShortDate(label)}
            />
            <Legend />
            
            {uniqueProductIds.map((productId, index) => {
              const productName = getProductName(productId);
              const isSelected = selectedProducts.length === 0 || selectedProducts.includes(productId);
              const color = productColors[index % productColors.length];
              
              return isSelected && (
                <Line
                  key={productId}
                  type="monotone"
                  dataKey={productName}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {uniqueProductIds.map((productId, index) => (
          <div 
            key={productId}
            onClick={() => toggleProductSelection(productId)}
            className={`cursor-pointer px-3 py-1 text-xs rounded-full border flex items-center gap-2 ${
              selectedProducts.length === 0 || selectedProducts.includes(productId)
                ? 'bg-gray-100 border-gray-300'
                : 'bg-white border-gray-200 opacity-60'
            }`}
          >
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: productColors[index % productColors.length] }}
            />
            <span>{getProductName(productId)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
