import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { X, Store, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Brain,
  Truck,
  Settings,
  LogOut
} from "lucide-react";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
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

  // If the sidebar is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      
      {/* Sidebar */}
      <div className="absolute inset-y-0 left-0 w-64 bg-gray-800 text-white shadow-lg">
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Store className="h-6 w-6 text-primary mr-3" />
              <div>
                <div className="font-medium">{user?.businessName || "Business Name"}</div>
                <div className="text-xs text-gray-400">{user?.businessType || "Small Business"}</div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <nav>
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link href={item.path}>
                    <a 
                      className={cn(
                        "flex items-center px-4 py-3 rounded-lg transition-colors hover:bg-gray-700",
                        location === item.path ? "bg-gray-900 text-white" : "text-gray-300"
                      )}
                      onClick={onClose}
                    >
                      <span className={cn("w-5 mr-3", location === item.path ? "text-primary" : "text-gray-400")}>
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        
        <div className="p-4 mt-auto">
          <div className="border-t border-gray-700 pt-4 mb-4">
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
              onClick={() => {
                logoutMutation.mutate();
                onClose();
              }}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
