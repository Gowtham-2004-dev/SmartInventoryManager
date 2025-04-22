import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, LineChart, BarChart, BarChart2 } from "lucide-react";

export function ModelInfo() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ML Models Overview</CardTitle>
          <CardDescription>
            SmartInventory uses multiple machine learning models to predict future demand for your products.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="arima">
            <TabsList className="mb-4">
              <TabsTrigger value="arima">ARIMA</TabsTrigger>
              <TabsTrigger value="xgboost">XGBoost</TabsTrigger>
              <TabsTrigger value="lstm">LSTM</TabsTrigger>
            </TabsList>
            
            <TabsContent value="arima">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-medium mb-2 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    ARIMA (AutoRegressive Integrated Moving Average)
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    ARIMA is a time series forecasting model that incorporates three components:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>Autoregression (AR): Uses past values to predict future values</li>
                    <li>Integration (I): Makes the time series stationary through differencing</li>
                    <li>Moving Average (MA): Uses past forecast errors in the prediction</li>
                  </ul>
                  <p className="text-sm text-gray-600 mt-3">
                    <span className="font-medium">Best for:</span> Seasonal trends and patterns with regular cycles
                  </p>
                </div>
                
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="text-sm font-medium mb-2">Model Parameters</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Training Data Range:</span>
                      <span>Last 90 days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Forecast Horizon:</span>
                      <span>7 days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Update Frequency:</span>
                      <span>Daily</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Average Accuracy:</span>
                      <span>92.5%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Last Updated:</span>
                      <span>Today, 2:30 PM</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="xgboost">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-medium mb-2 flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-accent" />
                    XGBoost (eXtreme Gradient Boosting)
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    XGBoost is a powerful machine learning algorithm that uses an ensemble of decision trees:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>Gradient Boosting: Builds trees sequentially to correct previous errors</li>
                    <li>Feature Importance: Identifies which factors most affect demand</li>
                    <li>Regularization: Prevents overfitting for more reliable forecasts</li>
                  </ul>
                  <p className="text-sm text-gray-600 mt-3">
                    <span className="font-medium">Best for:</span> Complex relationships with multiple factors like promotions, holidays, and weather
                  </p>
                </div>
                
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="text-sm font-medium mb-2">Model Parameters</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Features Used:</span>
                      <span>Day of week, holidays, promotions</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Training Data Range:</span>
                      <span>Last 180 days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Forecast Horizon:</span>
                      <span>14 days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Average Accuracy:</span>
                      <span>89.7%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Last Updated:</span>
                      <span>Yesterday</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="lstm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-medium mb-2 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    LSTM (Long Short-Term Memory)
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    LSTM is a type of recurrent neural network (RNN) designed to recognize patterns in sequence data:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>Memory Cells: Retain information over long periods</li>
                    <li>Deep Learning: Captures complex temporal dependencies</li>
                    <li>Sequential Processing: Understands patterns over time</li>
                  </ul>
                  <p className="text-sm text-gray-600 mt-3">
                    <span className="font-medium">Best for:</span> Long-range forecasting and complex seasonal patterns
                  </p>
                  <p className="text-sm bg-yellow-100 text-yellow-800 p-2 mt-3 rounded-md">
                    Currently in beta testing phase - will be fully deployed in the next release
                  </p>
                </div>
                
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="text-sm font-medium mb-2">Model Parameters</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Model Architecture:</span>
                      <span>3 LSTM layers, 64 units each</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Training Data Range:</span>
                      <span>Last 365 days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Forecast Horizon:</span>
                      <span>30 days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Average Accuracy:</span>
                      <span>95.3% (testing)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Status:</span>
                      <span className="text-yellow-600">Beta</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Forecasting Works</CardTitle>
          <CardDescription>
            Understanding the process behind SmartInventory's AI demand predictions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border rounded-lg bg-blue-50 border-blue-100">
              <div className="mb-3 text-lg font-medium text-blue-700">1. Data Collection</div>
              <p className="text-sm text-blue-800">
                Historical sales data is collected and processed, including product information, quantities, dates, and any external factors.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-purple-50 border-purple-100">
              <div className="mb-3 text-lg font-medium text-purple-700">2. Model Training</div>
              <p className="text-sm text-purple-800">
                ML models analyze patterns in your data, learning from seasonal trends, product relationships, and external factors.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-green-50 border-green-100">
              <div className="mb-3 text-lg font-medium text-green-700">3. Prediction Generation</div>
              <p className="text-sm text-green-800">
                The trained models predict future demand, providing quantities and confidence levels for each product.
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-medium mb-2">Improving Forecast Accuracy</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <LineChart className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>More data:</strong> The more historical sales data you have, the more accurate the predictions will be.</span>
              </li>
              <li className="flex items-start gap-2">
                <LineChart className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Consistent data:</strong> Regular sales recording and inventory management improves pattern recognition.</span>
              </li>
              <li className="flex items-start gap-2">
                <LineChart className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>External factors:</strong> Future versions will allow you to input known events like promotions or holidays.</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
