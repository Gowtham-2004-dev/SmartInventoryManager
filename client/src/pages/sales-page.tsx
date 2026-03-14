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
import { formatCurrency, formatDate } from "@/lib/utils";

export default function SalesPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showAddSaleDialog, setShowAddSaleDialog] = useState(false);

  const { data: sales, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/sales"],
  });

  const { data: products } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const totalSales = sales?.reduce((sum, sale) => sum + Number(sale.totalAmount), 0) || 0;
  const totalItems = sales?.reduce((sum, sale) => sum + Number(sale.quantity), 0) || 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySales = sales?.filter(sale => new Date(sale.date) >= today) || [];
  const todaySalesAmount = todaySales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0) || 0;

  const getProductName = (productId: number) => {
    const p = products?.find(p => p.id === productId);
    return p ? p.name : `Product #${productId}`;
  };

  const handleExport = () => {
    if (!sales || sales.length === 0) return;

    const headers = ["Date", "Product", "Quantity", "Unit Price (₹)", "Total Amount (₹)"];
    const rows = sales.map(sale => [
      formatDate(sale.date),
      getProductName(sale.productId),
      sale.quantity,
      Number(sale.salePrice).toFixed(2),
      Number(sale.totalAmount).toFixed(2),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales_report_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
                <Button
                  variant="outline"
                  className="flex gap-2 items-center"
                  onClick={handleExport}
                  disabled={!sales || sales.length === 0}
                >
                  <FileDown className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button className="bg-primary" onClick={() => setShowAddSaleDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Sale
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <h3 className="text-2xl font-bold mt-1">{formatCurrency(totalSales)}</h3>
                  <p className="text-sm text-gray-500 mt-2">All time · {sales?.length || 0} transactions</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-gray-500">Today's Sales</p>
                  <h3 className="text-2xl font-bold mt-1">{formatCurrency(todaySalesAmount)}</h3>
                  <p className="text-sm text-gray-500 mt-2">{todaySales.length} transactions today</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-gray-500">Total Items Sold</p>
                  <h3 className="text-2xl font-bold mt-1">{totalItems.toLocaleString("en-IN")}</h3>
                  <p className="text-sm text-gray-500 mt-2">Units across all sales</p>
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
