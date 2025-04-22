import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { InventoryHealthChart } from "@/components/dashboard/inventory-health-chart";
import { AIInsights } from "@/components/dashboard/ai-insights";
import { LowStockTable } from "@/components/dashboard/low-stock-table";
import { RecentActivityTable } from "@/components/dashboard/recent-activity-table";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/analytics/dashboard"],
  });

  // Fetch insights
  const { data: insights } = useQuery({
    queryKey: ["/api/insights"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onMobileMenuToggle={() => setMobileSidebarOpen(true)} />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <MobileSidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
        
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Dashboard</h2>
              <p className="text-gray-600">Welcome back! Here's what's happening with your inventory today.</p>
            </div>

            {/* Summary Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard
                title="Total Items"
                value={dashboardData?.totalProducts || 0}
                change={5.3}
                changeText="from last month"
                icon="box"
                iconColor="text-primary"
                iconBgColor="bg-blue-100"
                positive={true}
              />
              
              <StatCard
                title="Low Stock"
                value={dashboardData?.lowStockCount || 0}
                change={12}
                changeText="requires attention"
                icon="alert-triangle"
                iconColor="text-red-500"
                iconBgColor="bg-red-100"
                positive={false}
              />
              
              <StatCard
                title="Today's Sales"
                value={formatCurrency(dashboardData?.todaySalesAmount || 0)}
                change={8.2}
                changeText="from yesterday"
                icon="shopping-cart"
                iconColor="text-green-500"
                iconBgColor="bg-green-100"
                positive={true}
              />
              
              <StatCard
                title="Forecast Accuracy"
                value={`${dashboardData?.forecastAccuracy || 0}%`}
                change={2.1}
                changeText="improvement"
                icon="brain"
                iconColor="text-purple-600"
                iconBgColor="bg-purple-100"
                positive={true}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <SalesChart />
              <InventoryHealthChart />
            </div>

            {/* AI Insights and Low Stock */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <AIInsights insights={insights || []} />
              <LowStockTable lowStockProducts={dashboardData?.lowStockProducts || []} />
            </div>

            {/* Recent Activity */}
            <RecentActivityTable recentActivity={dashboardData?.recentActivity || []} />
          </div>
        </main>
      </div>
    </div>
  );
}
