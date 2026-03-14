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
import { Bell, Mail, Phone, Edit, Loader2, CheckCircle, Server } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface NotificationSettings {
  phoneNumber: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  lowStockAlerts: boolean;
  salesReports: boolean;
  forecastAlerts: boolean;
}

interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
}

export default function SettingsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Notification settings state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [salesReports, setSalesReports] = useState(true);
  const [forecastAlerts, setForecastAlerts] = useState(true);

  // Email SMTP state
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    fromEmail: "",
    fromName: "SmartInventory",
  });

  // Fetch notification settings
  const { data: notifSettings } = useQuery({
    queryKey: ["/api/user/notification-settings"],
    enabled: !!user,
  });

  // Fetch email settings
  const { data: emailSettings, isLoading: isLoadingEmail } = useQuery({
    queryKey: ["/api/email-settings"],
    enabled: !!user,
  });

  useEffect(() => {
    if (notifSettings) {
      setPhoneNumber(notifSettings.phoneNumber || "");
      setEmailNotifications(notifSettings.emailNotifications);
      setSmsNotifications(notifSettings.smsNotifications);
      setLowStockAlerts(notifSettings.lowStockAlerts);
      setSalesReports(notifSettings.salesReports);
      setForecastAlerts(notifSettings.forecastAlerts);
    }
  }, [notifSettings]);

  useEffect(() => {
    if (emailSettings) {
      setEmailConfig({
        smtpHost: emailSettings.smtpHost || "smtp.gmail.com",
        smtpPort: emailSettings.smtpPort || 587,
        smtpUser: emailSettings.smtpUser || "",
        smtpPass: emailSettings.smtpPass || "",
        fromEmail: emailSettings.fromEmail || "",
        fromName: emailSettings.fromName || "SmartInventory",
      });
    }
  }, [emailSettings]);

  // Update notification settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: NotificationSettings) => {
      const res = await fetch("/api/user/notification-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Settings Updated", description: "Notification settings saved successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update settings.", variant: "destructive" });
    },
  });

  // Save email settings
  const saveEmailMutation = useMutation({
    mutationFn: async (config: EmailConfig) => {
      const res = await apiRequest("PUT", "/api/email-settings", config);
      if (!res.ok) throw new Error("Failed to save email settings");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Email Settings Saved", description: "SMTP credentials have been saved. Supplier order emails will now be sent." });
      queryClient.invalidateQueries({ queryKey: ["/api/email-settings"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to save email settings.", variant: "destructive" });
    },
  });

  // Test SMS
  const testSmsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/test-sms", { method: "POST", headers: { "Content-Type": "application/json" } });
      if (!res.ok) throw new Error("Failed to send test SMS");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "SMS Sent", description: "Test SMS sent to your phone number." });
    },
    onError: (err: any) => {
      toast({ title: "SMS Failed", description: err?.message || "Failed to send test SMS.", variant: "destructive" });
    },
  });

  const handleSaveNotifications = () => {
    updateSettingsMutation.mutate({ phoneNumber, emailNotifications, smsNotifications, lowStockAlerts, salesReports, forecastAlerts });
  };

  const handleSaveEmail = () => {
    saveEmailMutation.mutate(emailConfig);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header onMobileMenuToggle={() => setMobileSidebarOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
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
                <TabsTrigger value="email">Email (SMTP)</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Profile Information</CardTitle>
                      <CardDescription>Update your account and business details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="businessName">Business Name</Label>
                        <div className="flex">
                          <Input id="businessName" defaultValue={user?.businessName || ""} className="flex-1" />
                          <Button variant="ghost" size="icon" className="ml-2"><Edit className="h-4 w-4" /></Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Username / Email</Label>
                        <div className="flex">
                          <Input id="username" defaultValue={user?.username || ""} className="flex-1" />
                          <Button variant="ghost" size="icon" className="ml-2"><Edit className="h-4 w-4" /></Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="businessType">Business Type</Label>
                        <div className="flex">
                          <Input id="businessType" defaultValue={user?.businessType || "Kirana Store"} className="flex-1" />
                          <Button variant="ghost" size="icon" className="ml-2"><Edit className="h-4 w-4" /></Button>
                        </div>
                      </div>
                      <Button className="mt-4 bg-primary">Save Changes</Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Password & Security</CardTitle>
                      <CardDescription>Update your password and security settings</CardDescription>
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

              {/* Notifications Tab */}
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Notification Settings</CardTitle>
                    <CardDescription>Configure how you receive alerts and updates</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Channels</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Mail className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-gray-500">Receive updates via email</p>
                          </div>
                        </div>
                        <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Phone className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium">SMS Notifications (Twilio)</p>
                            <p className="text-sm text-gray-500">Receive alerts via text message</p>
                          </div>
                        </div>
                        <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
                      </div>
                    </div>

                    {smsNotifications && (
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number (with country code)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="phoneNumber"
                            placeholder="+919876543210"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            onClick={() => testSmsMutation.mutate()}
                            disabled={testSmsMutation.isPending || !phoneNumber}
                          >
                            {testSmsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test SMS"}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Alert Types</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Low Stock Alerts</p>
                          <p className="text-sm text-gray-500">When inventory falls below minimum levels</p>
                        </div>
                        <Switch checked={lowStockAlerts} onCheckedChange={setLowStockAlerts} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Daily Sales Reports</p>
                          <p className="text-sm text-gray-500">Daily and weekly sales summaries</p>
                        </div>
                        <Switch checked={salesReports} onCheckedChange={setSalesReports} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Forecast Alerts</p>
                          <p className="text-sm text-gray-500">AI-generated demand predictions</p>
                        </div>
                        <Switch checked={forecastAlerts} onCheckedChange={setForecastAlerts} />
                      </div>
                    </div>

                    <Button
                      className="bg-primary"
                      onClick={handleSaveNotifications}
                      disabled={updateSettingsMutation.isPending}
                    >
                      {updateSettingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Save Notification Settings
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Email SMTP Tab */}
              <TabsContent value="email">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Server className="h-5 w-5 text-primary" />
                      Email Credentials (SMTP)
                    </CardTitle>
                    <CardDescription>
                      Configure your outgoing email server. These credentials are used to send purchase order emails to suppliers when you click "Order Now".
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {isLoadingEmail ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-blue-800 font-medium">Gmail Users</p>
                          <p className="text-xs text-blue-700 mt-1">
                            Use <strong>smtp.gmail.com</strong> with port <strong>587</strong>. Your password should be a
                            <strong> Gmail App Password</strong> (not your regular password). Generate one at:
                            Google Account → Security → App Passwords.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="smtpHost">SMTP Host</Label>
                            <Input
                              id="smtpHost"
                              placeholder="smtp.gmail.com"
                              value={emailConfig.smtpHost}
                              onChange={(e) => setEmailConfig(c => ({ ...c, smtpHost: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="smtpPort">SMTP Port</Label>
                            <Input
                              id="smtpPort"
                              type="number"
                              placeholder="587"
                              value={emailConfig.smtpPort}
                              onChange={(e) => setEmailConfig(c => ({ ...c, smtpPort: Number(e.target.value) }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="smtpUser">SMTP Username (your email)</Label>
                            <Input
                              id="smtpUser"
                              type="email"
                              placeholder="yourstore@gmail.com"
                              value={emailConfig.smtpUser}
                              onChange={(e) => setEmailConfig(c => ({ ...c, smtpUser: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="smtpPass">SMTP Password / App Password</Label>
                            <Input
                              id="smtpPass"
                              type="password"
                              placeholder="••••••••••••••••"
                              value={emailConfig.smtpPass}
                              onChange={(e) => setEmailConfig(c => ({ ...c, smtpPass: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="fromEmail">From Email Address</Label>
                            <Input
                              id="fromEmail"
                              type="email"
                              placeholder="yourstore@gmail.com"
                              value={emailConfig.fromEmail}
                              onChange={(e) => setEmailConfig(c => ({ ...c, fromEmail: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="fromName">From Name (sender name)</Label>
                            <Input
                              id="fromName"
                              placeholder="My Kirana Store"
                              value={emailConfig.fromName}
                              onChange={(e) => setEmailConfig(c => ({ ...c, fromName: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                          <Button
                            className="bg-primary"
                            onClick={handleSaveEmail}
                            disabled={saveEmailMutation.isPending}
                          >
                            {saveEmailMutation.isPending ? (
                              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
                            ) : (
                              <><CheckCircle className="h-4 w-4 mr-2" />Save Email Settings</>
                            )}
                          </Button>
                          {saveEmailMutation.isSuccess && (
                            <span className="text-sm text-green-600 flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" /> Saved!
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Application Preferences</CardTitle>
                    <CardDescription>Customize your SmartInventory experience</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dateFormat">Date Format</Label>
                        <select id="dateFormat" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <select id="language" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                          <option value="en">English</option>
                          <option value="hi">Hindi</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <select id="currency" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                          <option value="INR">Indian Rupee (₹)</option>
                          <option value="USD">US Dollar ($)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="theme">Theme</Label>
                        <select id="theme" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-6">
                      <Switch id="autoLogout" />
                      <Label htmlFor="autoLogout">Automatically log out after 30 minutes of inactivity</Label>
                    </div>
                    <Button className="mt-4 bg-primary">Save Preferences</Button>
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
