import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertSaleSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

// Extend the sale schema with validation rules
const saleFormSchema = z.object({
  productId: z.string().min(1, { message: "Product is required" }),
  quantity: z.number().int().min(1, { message: "Quantity must be at least 1" }),
  salePrice: z.string(),
  totalAmount: z.string(),
});

type SaleFormValues = z.infer<typeof saleFormSchema>;

interface SalesFormProps {
  onSuccess: () => void;
}

export function SalesForm({ onSuccess }: SalesFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedProductDetails, setSelectedProductDetails] = useState({
    price: "0",
    stock: 0
  });
  
  // Fetch products for the dropdown
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products"],
  });

  // Initialize form
  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      productId: "",
      quantity: 1,
      salePrice: "0",
      totalAmount: "0",
    },
  });

  const { watch, setValue } = form;
  const productId = watch("productId");
  const quantity = watch("quantity");

  // Update price and total when product or quantity changes
  useEffect(() => {
    if (productId) {
      const selectedProduct = products?.find(p => p.id.toString() === productId);
      if (selectedProduct) {
        setSelectedProductDetails({
          price: selectedProduct.price,
          stock: selectedProduct.quantity
        });
        setValue("salePrice", selectedProduct.price);
        const total = Number(selectedProduct.price) * quantity;
        setValue("totalAmount", total.toFixed(2));
      }
    }
  }, [productId, quantity, products, setValue]);

  // Create sale mutation
  const mutation = useMutation({
    mutationFn: async (values: SaleFormValues) => {
      const saleData = {
        productId: parseInt(values.productId),
        quantity: values.quantity,
        salePrice: values.salePrice,
        totalAmount: values.totalAmount,
        userId: user?.id,
      };
      
      const res = await apiRequest("POST", "/api/sales", saleData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sale Recorded",
        description: "The sale has been successfully recorded.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to record sale: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: SaleFormValues) => {
    // Check if sufficient stock is available
    const productStock = selectedProductDetails.stock;
    if (values.quantity > productStock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${productStock} units available in inventory.`,
        variant: "destructive",
      });
      return;
    }
    
    mutation.mutate(values);
  };

  if (isLoadingProducts) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} - {formatCurrency(product.price)} ({product.quantity} in stock)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field: { onChange, ...rest } }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1" 
                    step="1" 
                    onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                    {...rest} 
                  />
                </FormControl>
                <FormDescription className={selectedProductDetails.stock < form.getValues("quantity") ? "text-red-500" : ""}>
                  {selectedProductDetails.stock < form.getValues("quantity") 
                    ? `Warning: Only ${selectedProductDetails.stock} units available` 
                    : `${selectedProductDetails.stock} units available`}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="salePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Price</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    onChange={(e) => {
                      const newPrice = e.target.value;
                      field.onChange(newPrice);
                      // Recalculate total
                      const total = Number(newPrice) * form.getValues("quantity");
                      form.setValue("totalAmount", total.toFixed(2));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="totalAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Amount</FormLabel>
              <FormControl>
                <Input {...field} readOnly className="bg-gray-50" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            className="bg-primary"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              "Record Sale"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
