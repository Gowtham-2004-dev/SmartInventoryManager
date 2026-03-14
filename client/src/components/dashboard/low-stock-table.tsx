import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Product } from "@shared/schema";
import { Coffee, Box, Leaf, ShoppingCart, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { getStockStatus } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LowStockTableProps {
  lowStockProducts: Product[];
}

export function LowStockTable({ lowStockProducts }: LowStockTableProps) {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderQty, setOrderQty] = useState(50);
  const [orderNotes, setOrderNotes] = useState("");

  const orderMutation = useMutation({
    mutationFn: async (data: { productId: number; quantity: number; notes?: string }) => {
      const res = await apiRequest("POST", "/api/orders/place", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Order Sent", description: data.message });
        setSelectedProduct(null);
        setOrderNotes("");
      } else {
        toast({ title: "Order Failed", description: data.message, variant: "destructive" });
      }
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to place order", variant: "destructive" });
    },
  });

  const handleOrderNow = (product: Product) => {
    setSelectedProduct(product);
    setOrderQty(Math.max(50, product.minStock * 3));
    setOrderNotes("");
  };

  const handleSubmitOrder = () => {
    if (!selectedProduct) return;
    orderMutation.mutate({
      productId: selectedProduct.id,
      quantity: orderQty,
      notes: orderNotes || undefined,
    });
  };

  const getProductIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "coffee": return <Coffee className="h-4 w-4 text-gray-600" />;
      case "tea": return <Leaf className="h-4 w-4 text-gray-600" />;
      default: return <Box className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDaysUntilReorder = (product: Product) => {
    const ratio = product.quantity / product.minStock;
    if (ratio < 0.5) return "1 day";
    if (ratio < 0.7) return "3 days";
    return "5 days";
  };

  if (!lowStockProducts || lowStockProducts.length === 0) {
    return (
      <Card>
        <CardHeader className="px-5 py-4 flex justify-between items-center">
          <CardTitle className="text-base font-semibold">Low Stock Items</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="text-center py-8 text-gray-500">No low stock items to display</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="px-5 py-4 flex justify-between items-center">
          <CardTitle className="text-base font-semibold">Low Stock Items</CardTitle>
          <span className="text-xs text-gray-500 bg-red-50 text-red-600 px-2 py-1 rounded-full font-medium">
            {lowStockProducts.length} items
          </span>
        </CardHeader>
        <CardContent className="p-5">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Stock</th>
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
                            <div className="font-medium text-gray-800 text-sm">{product.name}</div>
                            <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${stockStatus.bgColor} ${stockStatus.color}`}>
                          {product.quantity} units
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-800">{getDaysUntilReorder(product)}</td>
                      <td className="py-3">
                        <Button
                          className="text-xs h-7 px-3 py-1 bg-primary hover:bg-primary/90 gap-1"
                          onClick={() => handleOrderNow(product)}
                        >
                          <ShoppingCart className="h-3 w-3" />
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

      {/* Order Confirmation Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Place Purchase Order
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-semibold text-gray-800">{selectedProduct.name}</p>
                <p className="text-sm text-gray-500 mt-1">SKU: {selectedProduct.sku}</p>
                <p className="text-sm text-gray-500">
                  Current stock: <span className="text-red-600 font-medium">{selectedProduct.quantity} units</span>
                  {" "}(Min: {selectedProduct.minStock})
                </p>
                {selectedProduct.supplier && (
                  <p className="text-sm text-gray-500 mt-1">Supplier: <span className="font-medium">{selectedProduct.supplier}</span></p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-qty">Order Quantity (units)</Label>
                <Input
                  id="order-qty"
                  type="number"
                  min={1}
                  value={orderQty}
                  onChange={(e) => setOrderQty(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-notes">Notes (optional)</Label>
                <Textarea
                  id="order-notes"
                  placeholder="e.g. Urgent delivery needed, please confirm availability"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={2}
                />
              </div>
              <p className="text-xs text-gray-500">
                An email will be sent to the supplier with this order request.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedProduct(null)}>Cancel</Button>
            <Button
              onClick={handleSubmitOrder}
              disabled={orderMutation.isPending || orderQty < 1}
              className="gap-2"
            >
              {orderMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
              ) : (
                <><ShoppingCart className="h-4 w-4" /> Send Order Email</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
