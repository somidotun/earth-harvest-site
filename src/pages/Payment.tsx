import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCart } from "@/contexts/CartContext";
import { useWallet } from "@/contexts/WalletContext";
import { useHbarPrice } from "@/hooks/useHbarPrice";
import { toast } from "sonner";
import {
  Wallet,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { PaystackButton } from "react-paystack";

const schema = z.object({
  email: z.string().email("Invalid email address"),

  amount: z
    .number()
    .positive("amount must be positive")
    .min(100, "Minimun amount is #100")
    .max(1000000, "Minimun amount is #1000000"),
});

type FormData = z.infer<typeof schema>;

// const MERCHANT_ACCOUNT_ID = "0.0.7096536"; // Replace with your Hedera account
const MERCHANT_ACCOUNT_ID = "0.0.7054812"; // Replace with your Hedera account

const Payment = () => {
  const navigate = useNavigate();
  const { cart, getFinalTotal, clearCart } = useCart();
  const {
    accountId,
    isConnected,
    isHashPackInstalled,
    isInitializing,
    connectWallet,
    sendHbarPayment,
    disconnectWallet,
  } = useWallet();
  const { convertToHbar, NairaconvertToHbar } = useHbarPrice();
  const [processing, setProcessing] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState<string>("");
  const { user } = useAuth();

  // open hbar payment

  const [openHbar, setOpenHbar] = useState<boolean>(true);

  const handleOpenHbar = (e) => {
    e.preventDefault();
    setPayStack(false);

    if (openHbar === true) {
      setOpenHbar(true);
    } else {
      setOpenHbar((prev) => !prev);
    }
  };

  // open paystack payment

  const [openPayStack, setPayStack] = useState<boolean>(false);

  const handlePayStack = (e) => {
    e.preventDefault();
    setOpenHbar(false);
    if (openPayStack === true) {
      setPayStack(true);
    } else {
      setPayStack((prev) => !prev);
    }
  };

  const Form = useForm<FormData>({
    defaultValues: {
      email: "",
      amount: 0,
    },
    resolver: zodResolver(schema),
  });

  const publicKey = import.meta.env.VITE_PUBLIC_PAYSTACK_PUBLIC_KEY || "";

  const {
    register,
    reset,
    formState: { errors },
  } = Form;

  useEffect(() => {
    const data = sessionStorage.getItem("checkoutData");
    if (data) {
      setCheckoutData(JSON.parse(data));
    } else {
      navigate("/checkout");
    }

    if (cart.length === 0 && !paymentSuccess) {
      navigate("/products");
    }

    if (!publicKey) {
      toast.error("paystack public key is not set");
      return null;
    }
  }, [cart.length, navigate, paymentSuccess, publicKey]);

  const totalUsd = getFinalTotal();
  const totalHbar = NairaconvertToHbar(totalUsd);

  const handlePayment = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    setProcessing(true);

    try {
      const orderMemo = `Order: ${checkoutData?.orderId || "N/A"} - ${
        checkoutData?.name || "Customer"
      }`;

      const result = await sendHbarPayment(
        MERCHANT_ACCOUNT_ID,
        totalHbar,
        orderMemo
      );

      if (result.success) {
        setPaymentSuccess(true);
        setTransactionId(result.transactionId || "");

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
              price: item.priceUsd,
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

        clearCart();
        sessionStorage.removeItem("checkoutData");

        // Redirect after 5 seconds
        setTimeout(() => {
          navigate("/");
        }, 30000);
      }
    } catch (error) {
      console.error("Payment error:", error);
    } finally {
      setProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 bg-background flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Payment Successful!
                </h1>
                <p className="text-muted-foreground">
                  Your order has been confirmed and is being processed.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-6 mb-6 text-left">
                <div className="grid gap-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order ID:</span>
                    <span className="font-mono font-semibold">
                      {checkoutData?.orderId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Paid:</span>
                    <span className="font-semibold text-primary">
                      {totalHbar} HBAR
                    </span>
                  </div>
                  {transactionId && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Transaction:
                      </span>
                      <a
                        href={`https://hashscan.io/mainnet/transaction/${transactionId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <span className="font-mono text-sm">
                          {transactionId.substring(0, 20)}...
                        </span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                Redirecting to home page in 5 seconds...
              </p>

              <Button onClick={() => navigate("/")} size="lg">
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            Initializing wallet connection...
          </p>
        </div>
      </div>
    );
  }

  if (!isHashPackInstalled) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 bg-background flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-destructive" />
                HashPack Wallet Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Wallet className="h-4 w-4" />
                <AlertTitle>HBAR Payments Only</AlertTitle>
                <AlertDescription>
                  This store accepts HBAR (Hedera) payments only. To complete
                  your purchase, you need to install the HashPack wallet
                  extension.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="font-semibold">How to get started:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Install the HashPack browser extension</li>
                  <li>Create a new Hedera account (or import existing)</li>
                  <li>Add HBAR to your wallet from an exchange</li>
                  <li>Return here to complete your purchase</li>
                </ol>
              </div>

              <div className="flex gap-4">
                <Button
                  className="flex-1"
                  onClick={() =>
                    window.open("https://www.hashpack.app/download", "_blank")
                  }
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Install HashPack
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.location.reload()}
                >
                  I've Installed It
                </Button>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  Need help? Visit{" "}
                  <a
                    href="https://www.hashpack.app/support"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    HashPack Support
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const email = checkoutData?.email;
  const amount = totalUsd;

  const payStackConfig = {
    email,

    amount: amount * 100,
    publicKey,
    handlePayment,
    Currency: "NGN",
    onSuccess: async () => {
      toast.success("payment successFul");
      clearCart();

      // send data to the database
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
            price: item.priceUsd,
          }));

          const { error: itemsError } = await supabase
            .from("order_items")
            .insert(orderItems);

          if (itemsError) throw itemsError;
        } catch (dbError) {
          console.error("Database error:", dbError);
          toast.error("Order saved to paystack but failed to save to database");
        }
      }
      reset();
    },

    onclose: () => {
      toast.error("payment cancelled");
    },
    onError: () => {
      toast.error("payment Failed");
    },
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-background">
        <div className="bg-muted/30 py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-['Playfair_Display']">
              Complete Payment
            </h1>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="py-5 flex flex-row gap-8 ">
              <Button type="button" onClick={handleOpenHbar}>
                Pay with Hedera
              </Button>

              <Button type="button" onClick={handlePayStack}>
                Pay with Naira(Paystack)
              </Button>
            </div>

            <div
              className="flex flex-col  gap-8 lg:flex-row 
             lg:gap-0 justify-between "
            >
              {/* Payment with hbar */}
              {openHbar && (
                <div className="lg:w-[60%]">
                  <Card className="border-primary">
                    <p className="text-muted-foreground p-3 pt-5 pb-0">
                      Pay with HBAR using your HashPack wallet
                    </p>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        HBAR Payment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Wallet Status */}
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">
                            Wallet Status:
                          </span>
                          <span
                            className={`text-sm font-semibold ${
                              isConnected ? "text-green-600" : "text-orange-600"
                            }`}
                          >
                            {isConnected ? "Connected" : "Not Connected"}
                          </span>
                        </div>
                        {isConnected && accountId && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Account:
                            </span>
                            <span className="font-mono text-sm">
                              {accountId}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Payment Amount */}
                      <div className="p-6 bg-primary/5 rounded-lg border-2 border-primary/20">
                        <p className="text-sm text-muted-foreground mb-2">
                          Amount to Pay:
                        </p>
                        <p className="text-4xl font-bold text-primary mb-2">
                          {totalHbar} ℏ
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ≈ &#8358;{totalUsd.toFixed(2)}
                        </p>
                      </div>

                      {/* Action Button */}
                      {isConnected ? (
                        <Button
                          size="lg"
                          className="w-full"
                          onClick={handlePayment}
                          disabled={processing}
                        >
                          {processing ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Processing Payment...
                            </>
                          ) : (
                            <>
                              Pay {totalHbar} ℏ
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          className="w-full"
                          onClick={connectWallet}
                        >
                          <Wallet className="mr-2 h-5 w-5" />
                          Connect HashPack Wallet
                        </Button>
                      )}

                      {isConnected && (
                        <Button
                          size="lg"
                          className="w-full"
                          onClick={disconnectWallet}
                        >
                          <Wallet className="mr-2 h-5 w-5" />
                          Disconnect HashPack Wallet
                        </Button>
                      )}
                      {/* Info Alert */}
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Secure Payment</AlertTitle>
                        <AlertDescription>
                          Your payment is processed securely through the Hedera
                          network. You'll be prompted to approve the transaction
                          in your HashPack wallet.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Payment Card with naira*/}
              {openPayStack && (
                <div className="lg:w-[60%]">
                  <Card className="border-primary">
                    <p className="text-muted-foreground p-3 pt-5 pb-0">
                      Pay with Paystack
                    </p>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        Naira Payment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Payment Amount */}
                      <div className="p-6 bg-primary/5 rounded-lg border-2 border-primary/20">
                        <p className="text-sm text-muted-foreground mb-2">
                          Amount to Pay:
                        </p>
                        <p className="text-4xl font-bold text-primary mb-2">
                          &#8358;{totalUsd.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex flex-col space-y-4">
                        {/* email */}
                        <div>
                          <label htmlFor="email">email address</label>
                          <Input
                            {...register("email")}
                            name="email"
                            type="email"
                            value={checkoutData?.email}
                          />
                          {errors.email && <p>{errors.email.message}</p>}
                        </div>

                        {/* amount */}
                        <div>
                          <label htmlFor="amount">amount</label>

                          <Input
                            {...register("amount")}
                            name="amount"
                            aria-label="amount (NGN) "
                            type="number"
                            value={totalUsd}
                          />
                          {errors.amount && <p>{errors.amount.message}</p>}
                        </div>
                      </div>

                      {email && amount !== 0 && (
                        <PaystackButton
                          {...payStackConfig}
                          text="Pay Now"
                          className="bg-[#358857] w-full text-white  py-2 px-4 rounded-lg"
                        />
                      )}

                      {/* Info Alert */}
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Secure Payment</AlertTitle>
                        <AlertDescription>
                          Your payment is processed securely through the
                          paystack. .
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Order Summary */}
              <div className="lg:w-[35%]">
                <Card className="sticky top-20">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {checkoutData && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">
                          Order ID
                        </p>
                        <p className="font-mono text-sm font-semibold">
                          {checkoutData.orderId}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2 py-4 border-t border-b">
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-muted-foreground">
                            {item.name} x {item.quantity}
                          </span>
                          <span className="font-medium">
                            &#8358;{(item.priceUsd * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-bold">Total (USD)</span>
                        <span className="font-bold text-primary">
                          &#8358;{totalUsd.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-bold">Total (HBAR)</span>
                        <span className="font-bold text-lg text-primary">
                          {totalHbar} ℏ
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Payment;
