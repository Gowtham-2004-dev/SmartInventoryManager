import { useState } from "react";
import { Product } from "@shared/schema";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { formatCurrency, getStockStatus } from "@/lib/utils";
import { ProductForm } from "./product-form";
import { Search, MoreVertical, Edit, Trash2, Plus, Minus, RefreshCw } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProductTableProps {
  products: Product[];
  onRefresh: () => void;
}

export function ProductTable({ products, onRefresh }: ProductTableProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAdjustStockDialog, setShowAdjustStockDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"IN" | "OUT">("IN");

  // Filter products based on search query
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      toast({
        title: "Product Deleted",
        description: "The product has been successfully removed from inventory.",
      });
      setShowDeleteDialog(false);
      onRefresh();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete product: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Adjust stock mutation
  const adjustStockMutation = useMutation({
    mutationFn: async (data: { 
      productId: number; 
      type: string; 
      quantity: number; 
      reason: string; 
    }) => {
      const res = await apiRequest("POST", "/api/inventory-logs", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Stock Adjusted",
        description: "The inventory has been successfully updated.",
      });
      setShowAdjustStockDialog(false);
      onRefresh();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to adjust stock: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle delete product
  const handleDeleteProduct = () => {
    if (selectedProduct) {
      deleteProductMutation.mutate(selectedProduct.id);
    }
  };

  // Handle adjust stock
  const handleAdjustStock = () => {
    if (selectedProduct && adjustmentQuantity > 0) {
      adjustStockMutation.mutate({
        productId: selectedProduct.id,
        type: adjustmentType,
        quantity: adjustmentQuantity,
        reason: adjustmentReason || (adjustmentType === "IN" ? "Stock In" : "Stock Out"),
      });
    } else {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a quantity greater than zero.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search products by name, SKU, or category..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          className="ml-2"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No products found</h3>
          <p className="text-gray-500">Try adjusting your search or add a new product</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.quantity, product.minStock);
                
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                    <TableCell className="text-right">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${stockStatus.bgColor} ${stockStatus.color}`}>
                        {product.quantity} units
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Options</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => {
                            setSelectedProduct(product);
                            setShowEditDialog(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Product
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedProduct(product);
                            setAdjustmentType("IN");
                            setAdjustmentQuantity(0);
                            setAdjustmentReason("");
                            setShowAdjustStockDialog(true);
                          }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Stock
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedProduct(product);
                            setAdjustmentType("OUT");
                            setAdjustmentQuantity(0);
                            setAdjustmentReason("");
                            setShowAdjustStockDialog(true);
                          }}>
                            <Minus className="h-4 w-4 mr-2" />
                            Remove Stock
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Product
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Product Dialog */}
      {selectedProduct && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            <ProductForm 
              onSuccess={() => {
                setShowEditDialog(false);
                onRefresh();
              }} 
              initialData={selectedProduct}
              isEdit={true}
              productId={selectedProduct.id}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedProduct?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProduct}
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={showAdjustStockDialog} onOpenChange={setShowAdjustStockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustmentType === "IN" ? "Add Stock" : "Remove Stock"} - {selectedProduct?.name}
            </DialogTitle>
            <DialogDescription>
              Current stock: {selectedProduct?.quantity} units
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <Input 
                type="number" 
                min="1" 
                value={adjustmentQuantity.toString()}
                onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Input 
                placeholder={adjustmentType === "IN" ? "e.g., New shipment, Return" : "e.g., Damaged, Expired"} 
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAdjustStockDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAdjustStock}
              disabled={adjustStockMutation.isPending}
              className="bg-primary"
            >
              {adjustStockMutation.isPending ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
