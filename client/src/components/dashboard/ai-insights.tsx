import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Lightbulb, TrendingUp, Clock } from "lucide-react";

interface Insight {
  type: string;
  title: string;
  message: string;
  product: string;
  priority: string;
}

interface AIInsightsProps {
  insights: Insight[];
}

export function AIInsights({ insights }: AIInsightsProps) {
  // If no insights are provided, use some defaults
  const insightsToShow = insights.length > 0 ? insights : [
    {
      type: "demand",
      title: "Demand Forecast",
      product: "Arabica Coffee",
      message: "Expect 28% higher demand for Arabica Coffee next week based on seasonal patterns.",
      priority: "medium"
    },
    {
      type: "pricing",
      title: "Pricing Optimization",
      product: "Specialty Tea",
      message: "Consider increasing Specialty Tea prices by 5-7% based on current market trends.",
      priority: "low"
    },
    {
      type: "restock",
      title: "Restock Recommendation",
      product: "Caramel Syrup",
      message: "Order Caramel Syrup within 2 days to avoid stockout based on current usage rate.",
      priority: "high"
    }
  ];

  // Get icon based on insight type
  const getInsightIcon = (type: string) => {
    switch (type) {
      case "demand":
        return (
          <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
            <Lightbulb className="h-4 w-4 text-yellow-600" />
          </div>
        );
      case "pricing":
        return (
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
        );
      case "restock":
        return (
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
        );
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Lightbulb className="h-4 w-4 text-blue-600" />
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="px-5 py-4 bg-gradient-to-r from-indigo-600 to-primary">
        <h3 className="font-semibold text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI-Powered Insights
        </h3>
      </CardHeader>
      <CardContent className="p-5">
        {insightsToShow.map((insight, index) => (
          <div 
            key={index} 
            className={`mb-4 pb-4 ${index < insightsToShow.length - 1 ? 'border-b border-gray-100' : ''}`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                {getInsightIcon(insight.type)}
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-800">{insight.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
