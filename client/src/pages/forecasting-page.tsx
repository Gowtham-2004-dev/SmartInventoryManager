import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { ForecastChart } from "@/components/forecasting/forecast-chart";
import { ForecastTable } from "@/components/forecasting/forecast-table";
import { ModelInfo } from "@/components/forecasting/model-info";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ForecastingPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch forecasts
  const { data: forecasts, isLoading } = useQuery({
    queryKey: ["/api/forecasts"],
  });

  // Fetch products for product names
  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });

  // Generate forecasts mutation
  const generateForecasts = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/forecasts/generate", { days: 7 });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forecasts"] });
      toast({
        title: "Forecasts Generated",
        description: "ML models have been updated with the latest data.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to generate forecasts: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Map product IDs to names
  const getProductName = (productId: number) => {
    const product = products?.find(p => p.id === productId);
    return product ? product.name : `Product #${productId}`;
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
                <h2 className="text-2xl font-bold text-gray-800 mb-2">AI Demand Forecasting</h2>
                <p className="text-gray-600">Predict future product demand with machine learning.</p>
              </div>
              <Button 
                onClick={() => generateForecasts.mutate()} 
                disabled={generateForecasts.isPending}
                className="bg-primary"
              >
                {generateForecasts.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Update Forecasts
                  </>
                )}
              </Button>
            </div>
            
            <Tabs defaultValue="overview">
              <TabsList className="mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
                <TabsTrigger value="models">ML Models</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">Demand Forecast Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : (
                        <ForecastChart 
                          forecasts={forecasts || []} 
                          getProductName={getProductName} 
                        />
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">Forecast Confidence</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {(forecasts || []).slice(0, 5).map(forecast => {
                            const product = products?.find(p => p.id === forecast.productId);
                            const confidencePercent = Math.round(forecast.confidenceLevel * 100);
                            
                            return (
                              <div key={forecast.id} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="font-medium">{product?.name || `Product #${forecast.productId}`}</span>
                                  <span className="text-gray-500">{confidencePercent}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      confidencePercent > 80 ? 'bg-green-500' : 
                                      confidencePercent > 60 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${confidencePercent}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="forecasts">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ForecastTable 
                    forecasts={forecasts || []} 
                    getProductName={getProductName} 
                  />
                )}
              </TabsContent>
              
              <TabsContent value="models">
                <ModelInfo />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
