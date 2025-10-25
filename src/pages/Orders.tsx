import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Calendar, CreditCard } from "lucide-react";
import { format } from "date-fns";

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  payment_status: string;
  transaction_id: string;
  customer_name: string;
  phone1: string;
  address: string;
  order_items: OrderItem[];
}

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (*)
        `
        )
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      setOrders(ordersData || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              Please sign in to view your orders
            </p>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="bg-muted/30 py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-['Playfair_Display']">
              My Orders
            </h1>
            <p className="text-muted-foreground">
              View your order history and track your purchases
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground">
                Start shopping to see your orders here
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id} className="border-border">
                  <CardHeader className="border-b border-border">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl mb-2">
                          Order #{order.id.slice(0, 8)}
                        </CardTitle>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(order.created_at), "PPP")}
                          </div>
                          {order.transaction_id && (
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              Tx: {order.transaction_id.slice(0, 12)}...
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          variant={
                            order.payment_status === "completed"
                              ? "default"
                              : "secondary"
                          }
                          className="capitalize"
                        >
                          {order.payment_status}
                        </Badge>
                        <p className="text-2xl font-bold text-primary">
                          &#8358;{Number(order.total_amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">
                          Delivery Information
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>
                            <span className="font-medium">Name:</span>{" "}
                            {order.customer_name}
                          </p>
                          <p>
                            <span className="font-medium">Phone:</span>{" "}
                            {order.phone1}
                          </p>
                          <p>
                            <span className="font-medium">Address:</span>{" "}
                            {order.address}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Order Items</h4>
                        <div className="space-y-3">
                          {order.order_items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-4 p-3 rounded-lg bg-muted/30"
                            >
                              <img
                                src={item.product_image}
                                alt={item.product_name}
                                className="w-16 h-16 object-cover rounded"
                              />
                              <div className="flex-1">
                                <p className="font-medium">
                                  {item.product_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Quantity: {item.quantity}
                                </p>
                              </div>
                              <p className="font-semibold">
                                &#8358;
                                {Number(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Orders;
