import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, MoreHorizontal, Phone, Mail, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Dummy supplier data for demonstration
const suppliers = [
  {
    id: 1,
    name: "Global Coffee Imports",
    contact: "John Smith",
    email: "john@globalcoffee.com",
    phone: "(555) 123-4567",
    category: "Coffee",
    status: "Active",
    location: "Seattle, WA"
  },
  {
    id: 2,
    name: "Flavor Solutions Inc.",
    contact: "Maria Rodriguez",
    email: "maria@flavorsolutions.com",
    phone: "(555) 234-5678",
    category: "Syrups",
    status: "Active",
    location: "Portland, OR"
  },
  {
    id: 3,
    name: "Organic Tea Traders",
    contact: "David Chen",
    email: "david@organictea.com",
    phone: "(555) 345-6789",
    category: "Tea",
    status: "Active",
    location: "San Francisco, CA"
  },
  {
    id: 4,
    name: "Local Organic Farms",
    contact: "Sarah Johnson",
    email: "sarah@localorganic.com",
    phone: "(555) 456-7890",
    category: "Sweeteners",
    status: "Active",
    location: "Austin, TX"
  },
  {
    id: 5,
    name: "Plant Based Foods Co.",
    contact: "Michael Brown",
    email: "michael@plantbased.com",
    phone: "(555) 567-8901",
    category: "Milk",
    status: "Inactive",
    location: "Denver, CO"
  }
];

export default function SuppliersPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter suppliers based on search query
  const filteredSuppliers = suppliers.filter((supplier) => 
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.contact.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
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
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Suppliers</h2>
                <p className="text-gray-600">Manage your product suppliers and vendors.</p>
              </div>
              <Button className="bg-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Supplier
              </Button>
            </div>
            
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search suppliers..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="md:w-auto w-full">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            
            {/* Suppliers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSuppliers.map((supplier) => (
                <Card key={supplier.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{supplier.name}</h3>
                          <p className="text-sm text-gray-500">{supplier.category} Supplier</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>View Orders</DropdownMenuItem>
                            <DropdownMenuItem>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="mt-4">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(supplier.status)}`}>
                          {supplier.status}
                        </span>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <p className="text-sm"><span className="font-medium">Contact:</span> {supplier.contact}</p>
                        <p className="text-sm"><span className="font-medium">Location:</span> {supplier.location}</p>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100 flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Visit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {filteredSuppliers.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No suppliers found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
