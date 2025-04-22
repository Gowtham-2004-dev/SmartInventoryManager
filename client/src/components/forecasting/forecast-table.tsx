import { useState } from "react";
import { Forecast } from "@shared/schema";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { Search } from "lucide-react";

interface ForecastTableProps {
  forecasts: Forecast[];
  getProductName: (productId: number) => string;
}

export function ForecastTable({ forecasts, getProductName }: ForecastTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter forecasts based on search query
  const filteredForecasts = forecasts.filter((forecast) => {
    const productName = getProductName(forecast.productId).toLowerCase();
    return productName.includes(searchQuery.toLowerCase());
  });

  // Sort forecasts by date
  const sortedForecasts = [...filteredForecasts].sort((a, b) => 
    new Date(a.forDate).getTime() - new Date(b.forDate).getTime()
  );

  return (
    <div>
      <div className="relative mb-6">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search by product name..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {sortedForecasts.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No forecasts found</h3>
          <p className="text-gray-500">Try adjusting your search or generate new forecasts</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Forecast Date</TableHead>
                <TableHead className="text-right">Predicted Demand</TableHead>
                <TableHead className="text-right">Confidence Level</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedForecasts.map((forecast) => (
                <TableRow key={forecast.id}>
                  <TableCell className="font-medium">{getProductName(forecast.productId)}</TableCell>
                  <TableCell>{formatDate(forecast.forDate)}</TableCell>
                  <TableCell className="text-right">{forecast.predictedDemand} units</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            forecast.confidenceLevel > 0.8 ? 'bg-green-500' : 
                            forecast.confidenceLevel > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${forecast.confidenceLevel * 100}%` }}
                        ></div>
                      </div>
                      <span>{Math.round(forecast.confidenceLevel * 100)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(forecast.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
