import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { ProductTable } from "@/components/inventory/product-table";
import { ProductForm } from "@/components/inventory/product-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function InventoryPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);

  // Fetch products
  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ["/api/products"],
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header onMobileMenuToggle={() => setMobileSidebarOpen(true)} />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <MobileSidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
        
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Inventory Management</h2>
                <p className="text-gray-600">Manage your products, stock levels, and inventory status.</p>
              </div>
              <Button className="bg-primary" onClick={() => setShowAddProductDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ProductTable products={products || []} onRefresh={refetch} />
            )}
          </div>
        </main>
      </div>
      
      <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <ProductForm onSuccess={() => {
            setShowAddProductDialog(false);
            refetch();
          }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
