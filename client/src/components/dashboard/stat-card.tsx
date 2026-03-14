import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, Box, AlertTriangle, ShoppingCart, Brain, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  changeText: string;
  icon: string;
  iconColor: string;
  iconBgColor: string;
  positive: boolean;
}

export function StatCard({
  title,
  value,
  change,
  changeText,
  icon,
  iconColor,
  iconBgColor,
  positive
}: StatCardProps) {
  // Function to render the appropriate icon based on the icon prop
  const renderIcon = () => {
    switch (icon) {
      case "box":
        return <Box className={cn("text-xl", iconColor)} />;
      case "alert-triangle":
        return <AlertTriangle className={cn("text-xl", iconColor)} />;
      case "shopping-cart":
        return <ShoppingCart className={cn("text-xl", iconColor)} />;
      case "brain":
        return <Brain className={cn("text-xl", iconColor)} />;
      case "trending-up":
        return <TrendingUp className={cn("text-xl", iconColor)} />;
      default:
        return <Box className={cn("text-xl", iconColor)} />;
    }
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex justify-between">
          <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          </div>
          <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", iconBgColor)}>
            {renderIcon()}
          </div>
        </div>
        <div className="mt-4 text-sm">
          <span className={cn("font-medium flex items-center", positive ? "text-green-600" : "text-red-600")}>
            {positive ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {change}%
          </span>
          <span className="text-gray-500 ml-1">{changeText}</span>
        </div>
      </CardContent>
    </Card>
  );
}
