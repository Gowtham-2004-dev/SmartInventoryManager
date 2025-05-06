import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { Bell, Mail, Phone, User, Building, Edit, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Notification settings type definition
interface NotificationSettings {
  phoneNumber: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  lowStockAlerts: boolean;
  salesReports: boolean;
  forecastAlerts: boolean;
}

export default function SettingsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Settings state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [salesReports, setSalesReports] = useState(true);
  const [forecastAlerts, setForecastAlerts] = useState(true);
  const [testSmsStatus, setTestSmsStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  
  // Fetch notification settings from API
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/user/notification-settings'],
    enabled: !!user, // Only fetch if user is logged in
  });
  
  // Update notification settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: NotificationSettings) => {
      return await fetch('/api/user/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSettings),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to update settings');
        return res.json();
      });
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your notification settings have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Test SMS notification mutation
  const testSmsMutation = useMutation({
    mutationFn: async () => {
      return await fetch('/api/notifications/test-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => {
        if (!res.ok) throw new Error('Failed to send test SMS');
        return res.json();
      });
    },
    onSuccess: () => {
      setTestSmsStatus("success");
      toast({
        title: "SMS Sent",
        description: "A test SMS has been sent to your phone number.",
      });
    },
    onError: (error: any) => {
      setTestSmsStatus("error");
      toast({
        title: "SMS Failed",
        description: error?.message || "Failed to send test SMS. Please check your phone number.",
        variant: "destructive",
      });
    },
  });
  
  // When settings are loaded from API, update state
  useEffect(() => {
    if (settings) {
      setPhoneNumber(settings.phoneNumber || "");
      setEmailNotifications(settings.emailNotifications);
      setSmsNotifications(settings.smsNotifications);
      setLowStockAlerts(settings.lowStockAlerts);
      setSalesReports(settings.salesReports);
      setForecastAlerts(settings.forecastAlerts);
    }
  }, [settings]);
  
  // Handle save notification settings
  const handleSaveNotificationSettings = () => {
    updateSettingsMutation.mutate({
      phoneNumber,
      emailNotifications,
      smsNotifications,
      lowStockAlerts,
      salesReports,
      forecastAlerts
    });
  };
  
  // Handle test SMS notification
  const handleTestSms = () => {
    if (!phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a valid phone number before testing SMS notifications.",
        variant: "destructive",
      });
      return;
    }
    
    setTestSmsStatus("sending");
    testSmsMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onMobileMenuToggle={() => setMobileSidebarOpen(true)} />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <MobileSidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
        
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Settings</h2>
              <p className="text-gray-600">Manage your account and application preferences.</p>
            </div>
            
            <Tabs defaultValue="profile">
              <TabsList className="mb-6">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Profile Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Profile Information</CardTitle>
                      <CardDescription>
                        Update your account details and business information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="businessName">Business Name</Label>
                        <div className="flex">
                          <Input 
                            id="businessName" 
                            defaultValue={user?.businessName || ""} 
                            className="flex-1"
                          />
                          <Button variant="ghost" size="icon" className="ml-2">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <div className="flex">
                          <Input 
                            id="username" 
                            defaultValue={user?.username || ""} 
                            className="flex-1"
                          />
                          <Button variant="ghost" size="icon" className="ml-2">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="businessType">Business Type</Label>
                        <div className="flex">
                          <Input 
                            id="businessType" 
                            defaultValue={user?.businessType || "Small Business"} 
                            className="flex-1"
                          />
                          <Button variant="ghost" size="icon" className="ml-2">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <Button className="mt-4 bg-primary">Save Changes</Button>
                    </CardContent>
                  </Card>
                  
                  {/* Password and Security */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Password & Security</CardTitle>
                      <CardDescription>
                        Update your password and security settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input id="currentPassword" type="password" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" type="password" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input id="confirmPassword" type="password" />
                      </div>
                      
                      <Button className="mt-4 bg-primary">Update Password</Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Notification Settings</CardTitle>
                    <CardDescription>
                      Configure how you receive notifications and alerts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Notification Channels</h3>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Mail className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-gray-500">Receive updates via email</p>
                          </div>
                        </div>
                        <Switch 
                          checked={emailNotifications} 
                          onCheckedChange={setEmailNotifications} 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Phone className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium">SMS Notifications</p>
                            <p className="text-sm text-gray-500">Receive alerts via text message</p>
                          </div>
                        </div>
                        <Switch 
                          checked={smsNotifications} 
                          onCheckedChange={setSmsNotifications} 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Alert Types</h3>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Low Stock Alerts</p>
                          <p className="text-sm text-gray-500">When inventory falls below minimum levels</p>
                        </div>
                        <Switch 
                          checked={lowStockAlerts} 
                          onCheckedChange={setLowStockAlerts} 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Sales Reports</p>
                          <p className="text-sm text-gray-500">Daily and weekly sales summaries</p>
                        </div>
                        <Switch 
                          checked={salesReports} 
                          onCheckedChange={setSalesReports} 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Forecast Alerts</p>
                          <p className="text-sm text-gray-500">AI-generated demand predictions</p>
                        </div>
                        <Switch 
                          checked={forecastAlerts} 
                          onCheckedChange={setForecastAlerts} 
                        />
                      </div>
                    </div>
                    
                    <Button className="mt-4 bg-primary">Save Notification Settings</Button>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="preferences">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Application Preferences</CardTitle>
                    <CardDescription>
                      Customize your SmartInventory experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dateFormat">Date Format</Label>
                        <select 
                          id="dateFormat" 
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <select 
                          id="language" 
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <select 
                          id="currency" 
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="USD">US Dollar (USD)</option>
                          <option value="EUR">Euro (EUR)</option>
                          <option value="GBP">British Pound (GBP)</option>
                          <option value="CAD">Canadian Dollar (CAD)</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="theme">Theme</Label>
                        <select 
                          id="theme" 
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="system">System Default</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-6">
                      <Switch id="autoLogout" />
                      <Label htmlFor="autoLogout">
                        Automatically log out after 30 minutes of inactivity
                      </Label>
                    </div>
                    
                    <Button className="mt-4 bg-primary">Save Preferences</Button>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="integrations">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Integrations</CardTitle>
                    <CardDescription>
                      Connect SmartInventory with other business tools
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold">QuickBooks</h4>
                            <p className="text-sm text-gray-500">Sync your sales and inventory with QuickBooks</p>
                          </div>
                        </div>
                        <Button variant="outline">Connect</Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M7.5 6.75V0h9v6.75h-9zm9 3.75H24V24H0V10.5h7.5v6.75h9V10.5z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold">Shopify</h4>
                            <p className="text-sm text-gray-500">Connect your Shopify store for automatic inventory updates</p>
                          </div>
                        </div>
                        <Button variant="outline">Connect</Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <svg className="h-8 w-8 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19.044 7.259c-.567-1.583-1.344-3.156-2.378-4.594C15.857 1.274 14.953.5 13.261.5c-1.188 0-2.518.723-2.518 2.918 0 2.102 1.381 4.442 2.518 6.121M4.919 24h14.182v-4.211H4.919V24z" />
                              <path d="M4.919 14.147V24h14.182v-9.853H4.919z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold">Stripe</h4>
                            <p className="text-sm text-gray-500">Process payments directly through SmartInventory</p>
                          </div>
                        </div>
                        <Button variant="outline">Connect</Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                            <svg className="h-8 w-8 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold">Google Analytics</h4>
                            <p className="text-sm text-gray-500">Track user behavior and sales performance</p>
                          </div>
                        </div>
                        <Button variant="outline">Connect</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
