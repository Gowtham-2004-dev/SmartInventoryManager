import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus, Search, Phone, Mail, MapPin, MoreHorizontal,
  Loader2, Building2, User, Hash, Pencil, Trash2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Supplier } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const EMPTY_FORM = {
  name: "", contactName: "", phoneNumber: "", email: "",
  address: "", city: "", state: "", pincode: "", status: "active",
};

export default function SuppliersPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof EMPTY_FORM) => {
      const res = await apiRequest("POST", "/api/suppliers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ title: "Supplier Added", description: "New supplier has been added successfully." });
      setDialogOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: () => toast({ title: "Error", description: "Failed to add supplier.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof EMPTY_FORM }) => {
      const res = await apiRequest("PUT", `/api/suppliers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ title: "Supplier Updated", description: "Supplier details updated successfully." });
      setDialogOpen(false);
      setEditingSupplier(null);
      setForm(EMPTY_FORM);
    },
    onError: () => toast({ title: "Error", description: "Failed to update supplier.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ title: "Supplier Deleted", description: "Supplier removed successfully." });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete supplier.", variant: "destructive" }),
  });

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.contactName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.state || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAdd = () => {
    setEditingSupplier(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setForm({
      name: s.name || "",
      contactName: s.contactName || "",
      phoneNumber: s.phoneNumber || "",
      email: s.email || "",
      address: s.address || "",
      city: s.city || "",
      state: s.state || "",
      pincode: s.pincode || "",
      status: s.status || "active",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return toast({ title: "Name required", variant: "destructive" });
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Derive a category badge from supplier name
  const getCategory = (name: string) => {
    if (/nestl|maggi/i.test(name)) return { label: "Food & Beverages", color: "bg-yellow-100 text-yellow-800" };
    if (/britannia|parle|haldiram/i.test(name)) return { label: "Snacks & Bakery", color: "bg-orange-100 text-orange-800" };
    if (/pepsi|coca|thums|beverag/i.test(name)) return { label: "Beverages", color: "bg-blue-100 text-blue-800" };
    if (/mother dairy|amul/i.test(name)) return { label: "Dairy & Fresh", color: "bg-green-100 text-green-800" };
    if (/dabur|marico|himala/i.test(name)) return { label: "FMCG / Health", color: "bg-purple-100 text-purple-800" };
    if (/hul|hindustan|unilever/i.test(name)) return { label: "HUL Products", color: "bg-red-100 text-red-800" };
    if (/itc/i.test(name)) return { label: "ITC Products", color: "bg-indigo-100 text-indigo-800" };
    if (/metro|reliance|big bazaar|d-mart/i.test(name)) return { label: "Wholesale", color: "bg-teal-100 text-teal-800" };
    return { label: "General Supplier", color: "bg-gray-100 text-gray-700" };
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header onMobileMenuToggle={() => setMobileSidebarOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MobileSidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Suppliers</h2>
                <p className="text-gray-500 text-sm">
                  {suppliers.length} Indian suppliers — manage contacts, details and orders
                </p>
              </div>
              <Button className="bg-primary" onClick={openAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Supplier
              </Button>
            </div>

            {/* Search */}
            <div className="relative mb-6 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, contact, city..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {/* Supplier Cards Grid */}
            {!isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((supplier) => {
                  const cat = getCategory(supplier.name);
                  return (
                    <Card key={supplier.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        {/* Card header strip */}
                        <div className="h-1.5 bg-primary w-full" />
                        <div className="p-5">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-base leading-tight truncate pr-2">
                                {supplier.name}
                              </h3>
                              <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${cat.color}`}>
                                {cat.label}
                              </span>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(supplier)}>
                                  <Pencil className="h-4 w-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => deleteMutation.mutate(supplier.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Status */}
                          <div className="flex items-center gap-1.5 mb-3">
                            <span className={`w-2 h-2 rounded-full ${supplier.status === "active" ? "bg-green-500" : "bg-gray-400"}`} />
                            <span className="text-xs text-gray-500 capitalize">{supplier.status}</span>
                          </div>

                          {/* Contact Details */}
                          <div className="space-y-2">
                            {supplier.contactName && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <span className="truncate">{supplier.contactName}</span>
                              </div>
                            )}
                            {supplier.phoneNumber && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <span className="truncate">{supplier.phoneNumber}</span>
                              </div>
                            )}
                            {supplier.email && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <span className="truncate">{supplier.email}</span>
                              </div>
                            )}
                            {(supplier.city || supplier.state) && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <span className="truncate">
                                  {[supplier.city, supplier.state].filter(Boolean).join(", ")}
                                  {supplier.pincode ? ` – ${supplier.pincode}` : ""}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                            <Button
                              variant="outline" size="sm" className="flex-1 text-xs h-8"
                              onClick={() => supplier.phoneNumber && window.open(`tel:${supplier.phoneNumber}`)}
                            >
                              <Phone className="h-3.5 w-3.5 mr-1" /> Call
                            </Button>
                            <Button
                              variant="outline" size="sm" className="flex-1 text-xs h-8"
                              onClick={() => supplier.email && window.open(`mailto:${supplier.email}`)}
                            >
                              <Mail className="h-3.5 w-3.5 mr-1" /> Email
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <div className="text-center py-16">
                <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-1">No suppliers found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your search or add a new supplier</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add/Edit Supplier Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditingSupplier(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Supplier / Company Name *</Label>
                <Input placeholder="e.g. Parle Products Pvt Ltd" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Contact Person</Label>
                <Input placeholder="e.g. Ramesh Iyer" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input placeholder="+91-9876543210" value={form.phoneNumber} onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Email Address</Label>
                <Input type="email" placeholder="contact@supplier.in" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Address</Label>
                <Input placeholder="Street / Area" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input placeholder="e.g. Mumbai" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Input placeholder="e.g. Maharashtra" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Pincode</Label>
                <Input placeholder="e.g. 400056" value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingSupplier ? "Save Changes" : "Add Supplier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
