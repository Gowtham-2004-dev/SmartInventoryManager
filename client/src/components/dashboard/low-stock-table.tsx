import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Product } from "@shared/schema";
import { Coffee, Box, Leaf } from "lucide-react";
import { getStockStatus } from "@/lib/utils";

interface LowStockTableProps {
  lowStockProducts: Product[];
}

export function LowStockTable({ lowStockProducts }: LowStockTableProps) {
  // If no products provided, show a message
  if (!lowStockProducts || lowStockProducts.length === 0) {
    return (
      <Card>
        <CardHeader className="px-5 py-4 flex justify-between items-center">
          <CardTitle className="text-base font-semibold">Low Stock Items</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="text-center py-8 text-gray-500">
            No low stock items to display
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get appropriate icon for product category
  const getProductIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "coffee":
        return <Coffee className="h-4 w-4 text-gray-600" />;
      case "tea":
        return <Leaf className="h-4 w-4 text-gray-600" />;
      default:
        return <Box className="h-4 w-4 text-gray-600" />;
    }
  };

  // Calculate days until reorder (simplified for demo)
  const getDaysUntilReorder = (product: Product) => {
    const ratio = product.quantity / product.minStock;
    if (ratio < 0.5) return "1 day";
    if (ratio < 0.7) return "3 days";
    return "5 days";
  };

  return (
    <Card>
      <CardHeader className="px-5 py-4 flex justify-between items-center">
        <CardTitle className="text-base font-semibold">Low Stock Items</CardTitle>
        <Button variant="link" className="h-8 px-2 py-0 text-primary text-sm">
          View All
        </Button>
      </CardHeader>
      <CardContent className="p-5">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="pb-3">Product</th>
                <th className="pb-3">Current Stock</th>
                <th className="pb-3">Reorder In</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.map((product) => {
                const stockStatus = getStockStatus(product.quantity, product.minStock);
                
                return (
                  <tr key={product.id} className="border-t border-gray-100">
                    <td className="py-3">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-md bg-gray-200 flex items-center justify-center mr-3">
                          {getProductIcon(product.category)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{product.name}</div>
                          <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${stockStatus.bgColor} ${stockStatus.color}`}>
                        {product.quantity} units
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-800">
                      {getDaysUntilReorder(product)}
                    </td>
                    <td className="py-3">
                      <Button className="text-xs h-7 px-3 py-1 bg-primary hover:bg-primary/90">
                        Order Now
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
