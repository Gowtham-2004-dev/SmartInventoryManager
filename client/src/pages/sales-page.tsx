import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { SalesTable } from "@/components/sales/sales-table";
import { SalesForm } from "@/components/sales/sales-form";
import { Button } from "@/components/ui/button";
import { Plus, FileDown } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default function SalesPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showAddSaleDialog, setShowAddSaleDialog] = useState(false);

  // Fetch sales
  const { data: sales, isLoading, refetch } = useQuery({
    queryKey: ["/api/sales"],
  });

  // Calculate total sales amount
  const totalSales = sales?.reduce((sum, sale) => sum + Number(sale.totalAmount), 0) || 0;

  // Calculate total items sold
  const totalItems = sales?.reduce((sum, sale) => sum + Number(sale.quantity), 0) || 0;

  // Get today's sales
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySales = sales?.filter(sale => new Date(sale.date) >= today) || [];
  const todaySalesAmount = todaySales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0) || 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header onMobileMenuToggle={() => setMobileSidebarOpen(true)} />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <MobileSidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
        
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Sales Management</h2>
                <p className="text-gray-600">Record and track your sales transactions.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex gap-2 items-center">
                  <FileDown className="h-4 w-4" />
                  Export
                </Button>
                <Button className="bg-primary" onClick={() => setShowAddSaleDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Sale
                </Button>
              </div>
            </div>
            
            {/* Sales Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-gray-500">Total Sales</p>
                  <h3 className="text-2xl font-bold mt-1">{formatCurrency(totalSales)}</h3>
                  <p className="text-sm text-gray-500 mt-2">All time</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-gray-500">Today's Sales</p>
                  <h3 className="text-2xl font-bold mt-1">{formatCurrency(todaySalesAmount)}</h3>
                  <p className="text-sm text-gray-500 mt-2">{todaySales.length} transactions</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-gray-500">Total Items Sold</p>
                  <h3 className="text-2xl font-bold mt-1">{totalItems}</h3>
                  <p className="text-sm text-gray-500 mt-2">{sales?.length || 0} transactions</p>
                </CardContent>
              </Card>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <SalesTable sales={sales || []} onRefresh={refetch} />
            )}
          </div>
        </main>
      </div>
      
      <Dialog open={showAddSaleDialog} onOpenChange={setShowAddSaleDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Record New Sale</DialogTitle>
          </DialogHeader>
          <SalesForm onSuccess={() => {
            setShowAddSaleDialog(false);
            refetch();
          }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
