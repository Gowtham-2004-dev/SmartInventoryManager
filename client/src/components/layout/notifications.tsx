import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, RefreshCw, Truck, AlertTriangle } from "lucide-react";

interface NotificationsProps {
  onClose: () => void;
}

export function Notifications({ onClose }: NotificationsProps) {
  // Sample notifications, in a real app these would come from an API
  const notifications = [
    {
      id: 1,
      type: "alert",
      title: "Low Stock Alert",
      message: "Arabica Coffee is running low (5 units remaining)",
      time: "30 minutes ago",
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      bgColor: "bg-red-100",
    },
    {
      id: 2,
      type: "system",
      title: "System Update",
      message: "AI forecasting model has been updated with improved accuracy",
      time: "2 hours ago",
      icon: <RefreshCw className="h-5 w-5 text-blue-500" />,
      bgColor: "bg-blue-100",
    },
    {
      id: 3,
      type: "delivery",
      title: "Order Delivered",
      message: "Your order #ORD-2022-234 has been delivered",
      time: "Yesterday",
      icon: <Truck className="h-5 w-5 text-green-500" />,
      bgColor: "bg-green-100",
    },
  ];

  // Handle click outside to close notifications
  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/20 z-50 flex justify-end items-start"
      onClick={handleClickOutside}
    >
      <Card className="mt-16 mr-4 w-80 max-h-[calc(100vh-80px)] overflow-y-auto shadow-xl">
        <div className="px-4 py-3 border-b flex justify-between items-center">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </h3>
          <div className="text-xs text-gray-500">
            {notifications.length} new
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50"
            >
              <div className="flex">
                <div className="flex-shrink-0 mr-3">
                  <div className={`h-8 w-8 rounded-full ${notification.bgColor} flex items-center justify-center`}>
                    {notification.icon}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{notification.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="px-4 py-3 border-t border-gray-100 text-center">
          <Button variant="link" className="text-primary text-sm font-medium">
            View All Notifications
          </Button>
        </div>
      </Card>
    </div>
  );
}
