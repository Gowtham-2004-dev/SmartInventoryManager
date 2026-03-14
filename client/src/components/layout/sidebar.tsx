import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Brain,
  Truck,
  Settings,
  Store,
  HelpCircle,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const menuItems = [
    { name: "Dashboard", path: "/", icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: "Inventory", path: "/inventory", icon: <Package className="h-5 w-5" /> },
    { name: "Sales", path: "/sales", icon: <ShoppingCart className="h-5 w-5" /> },
    { name: "Forecasting", path: "/forecasting", icon: <Brain className="h-5 w-5" /> },
    { name: "Suppliers", path: "/suppliers", icon: <Truck className="h-5 w-5" /> },
    { name: "Settings", path: "/settings", icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    
    <div className={cn("bg-gray-800 text-white w-64 flex-shrink-0 h-screen hidden md:flex flex-col", className)}>
      <div className="p-4 flex-1">
        <div className="flex items-center mb-6 mt-3">
          <Store className="h-6 w-6 text-primary mr-3" />
          <div>
            <div className="font-medium">{user?.businessName || "Business Name"}</div>
            <div className="text-xs text-gray-400">{user?.businessType || "Small Business"}</div>
          </div>
        </div>
        <nav>
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg transition-colors hover:bg-gray-700",
                    location === item.path ? "bg-gray-900 text-white" : "text-gray-300"
                  )}
                >
                  <span className={cn("w-5 mr-3", location === item.path ? "text-primary" : "text-gray-400")}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="p-4 mt-auto">
        <Separator className="mb-4 bg-gray-700" />
        <div className="flex items-center mb-4">
          <HelpCircle className="h-5 w-5 text-gray-400 mr-3" />
          <div>
            <p className="text-sm font-medium">Need help?</p>
            <p className="text-xs text-gray-400">support@smartinventory.com</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-gray-700"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
