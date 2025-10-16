import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Client,
  AccountId,
  PrivateKey,
  Hbar,
  TransferTransaction,
} from "@hashgraph/sdk";

const Payment = () => {
  const navigate = useNavigate();
  const {
    cart,
    clearCart,
    getTotalPrice,
    getTransportationFee,
    getFinalTotal,
  } = useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [checkoutData, setCheckoutData] = useState<any>(null);

  // Hedera testnet receiver account (replace with your actual account)
  const RECEIVER_ACCOUNT = "0.0.9968729";

  useEffect(() => {
    // Get checkout data from sessionStorage
    const data = sessionStorage.getItem("checkoutData");
    if (!data) {
      toast.error("Please complete checkout form first");
      navigate("/checkout");
      return;
    }
    setCheckoutData(JSON.parse(data));
  }, [navigate]);

  const handlePayment = async () => {
    if (!accountId || !privateKey) {
      toast.error("Please enter your Hedera account details");
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsProcessing(true);

    try {
      // Connect to Hedera testnet
      const client = Client.forTestnet();
      client.setOperator(
        AccountId.fromString(accountId),
        PrivateKey.fromString(privateKey)
      );

      const totalInHBAR = getFinalTotal();
      const hbarAmount = totalInHBAR;

      // Create transfer transaction
      const transaction = new TransferTransaction()
        .addHbarTransfer(AccountId.fromString(accountId), new Hbar(-hbarAmount))
        .addHbarTransfer(
          AccountId.fromString(RECEIVER_ACCOUNT),
          new Hbar(hbarAmount)
        )
        .setTransactionMemo(`Order payment - ${cart.length} items`);

      // Submit transaction
      const txResponse = await transaction.execute(client);
      const receipt = await txResponse.getReceipt(client);

      if (receipt.status.toString() === "SUCCESS") {
        const transactionId = txResponse.transactionId.toString();

        // Save order to database
        if (user) {
          try {
            // Insert order
            const { data: order, error: orderError } = await supabase
              .from("orders")
              .insert({
                user_id: user.id,
                customer_name: checkoutData.name,
                phone1: checkoutData.phone1,
                phone2: checkoutData.phone2,
                address: checkoutData.address,
                total_amount: getFinalTotal(),
                payment_status: "completed",
                transaction_id: transactionId,
              })
              .select()
              .single();

            if (orderError) throw orderError;

            // Insert order items
            const orderItems = cart.map((item) => ({
              order_id: order.id,
              product_name: item.name,
              product_image: item.image,
              quantity: item.quantity,
              price: item.price,
            }));

            const { error: itemsError } = await supabase
              .from("order_items")
              .insert(orderItems);

            if (itemsError) throw itemsError;
          } catch (dbError) {
            console.error("Database error:", dbError);
            toast.error(
              "Order saved to blockchain but failed to save to database"
            );
          }
        }

        toast.success(`Payment successful! Transaction ID: ${transactionId}`);
        sessionStorage.removeItem("checkoutData");
        clearCart();
        navigate("/products");
      } else {
        toast.error("Payment failed. Please try again.");
      }
    } catch (error) {
      console.error("Hedera payment error:", error);
      toast.error(
        "Payment failed. Please check your credentials and try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!checkoutData) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-background">
        <div className="bg-muted/30 py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-['Playfair_Display']">
              Payment
            </h1>
            <p className="text-muted-foreground">
              Complete your payment with Hedera
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Delivery Info */}
            <div className="lg:col-span-2">
              <Card className="border-border mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">
                    Delivery Information
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name: </span>
                      <span className="font-medium">{checkoutData.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Primary Phone:{" "}
                      </span>
                      <span className="font-medium">{checkoutData.phone1}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Secondary Phone:{" "}
                      </span>
                      <span className="font-medium">{checkoutData.phone2}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Address: </span>
                      <span className="font-medium">
                        {checkoutData.address}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/checkout")}
                    className="mt-4"
                  >
                    Edit Information
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">
                    Hedera Payment Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Hedera Account ID
                      </label>
                      <Input
                        placeholder="0.0.XXXXXXX"
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        disabled={isProcessing}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Private Key
                      </label>
                      <Input
                        type="password"
                        placeholder="302e020100300506032b..."
                        value={privateKey}
                        onChange={(e) => setPrivateKey(e.target.value)}
                        disabled={isProcessing}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Summary */}
            <div className="lg:col-span-1">
              <Card className="border-border sticky top-20">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Order Summary</h3>

                  {/* Order ID */}
                  {checkoutData.orderId && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">
                        Order ID
                      </p>
                      <p className="font-mono text-sm font-semibold">
                        {checkoutData.orderId}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3 mb-6">
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {item.name} x {item.quantity}
                          </span>
                          <span className="font-medium">
                            {(item.price * item.quantity).toFixed(2)} HBAR
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-border pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">
                          {getTotalPrice().toFixed(2)} HBAR
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Transportation Fee
                        </span>
                        <span className="font-medium">
                          {getTransportationFee().toFixed(2)} HBAR
                        </span>
                      </div>
                      <div className="border-t border-border pt-2">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span className="text-primary">
                            {getFinalTotal().toFixed(2)} HBAR
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handlePayment}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Pay with Hedera"
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    Secure payment via Hedera blockchain
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Payment;
