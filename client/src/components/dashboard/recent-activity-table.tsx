import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InventoryLog } from "@shared/schema";
import { formatDate } from "@/lib/utils";

interface RecentActivityTableProps {
  recentActivity: InventoryLog[];
}

export function RecentActivityTable({ recentActivity }: RecentActivityTableProps) {
  // Get badge variant based on log type
  const getLogTypeBadge = (type: string) => {
    switch (type) {
      case "IN":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-none font-normal">
            Stock In
          </Badge>
        );
      case "OUT":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100 border-none font-normal">
            Stock Out
          </Badge>
        );
      case "ADJUSTMENT":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-none font-normal">
            Update
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none font-normal">
            {type}
          </Badge>
        );
    }
  };

  // Format the time from the timestamp
  const formatActivityTime = (date: Date | string) => {
    const now = new Date();
    const activityDate = new Date(date);
    
    // If today, show time
    if (activityDate.toDateString() === now.toDateString()) {
      return `Today, ${activityDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    
    // If yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (activityDate.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${activityDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    
    // Otherwise show date
    return activityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card>
      <CardHeader className="px-5 py-4 flex justify-between items-center">
        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        <Button variant="link" className="h-8 px-2 py-0 text-primary text-sm">
          View All
        </Button>
      </CardHeader>
      <CardContent className="p-5">
        {!recentActivity || recentActivity.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No recent activity to display
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="pb-3">Time</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Details</th>
                  <th className="pb-3">User</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((activity) => (
                  <tr key={activity.id} className="border-t border-gray-100">
                    <td className="py-3 text-sm text-gray-500">
                      {formatActivityTime(activity.date)}
                    </td>
                    <td className="py-3">
                      {getLogTypeBadge(activity.type)}
                    </td>
                    <td className="py-3 text-sm text-gray-800">
                      {activity.reason || `${activity.type === 'IN' ? 'Added' : 'Removed'} ${activity.quantity} units`}
                    </td>
                    <td className="py-3 text-sm text-gray-800">
                      User #{activity.userId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
