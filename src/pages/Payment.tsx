import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  HederaSessionEvent,
  HederaJsonRpcMethod,
  SignAndExecuteTransactionParams,
  DAppConnector,
  HederaChainId,
} from "@hashgraph/hedera-wallet-connect";
import { SessionTypes } from "@walletconnect/types";
import { AccountId, Hbar, LedgerId, TransferTransaction } from "@hashgraph/sdk";

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
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [dAppConnector, setDAppConnector] = useState<DAppConnector | null>(null);
  const [session, setSession] = useState<SessionTypes.Struct | null>(null);
  const [accountId, setAccountId] = useState<string>("");

  // Hedera testnet receiver account
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

    // Initialize DApp Connector
    const initWalletConnect = async () => {
      const metadata = {
        name: "AgroFresh",
        description: "Fresh Farm Products Marketplace",
        url: window.location.origin,
        icons: [window.location.origin + "/favicon.ico"],
      };

      const connector = new DAppConnector(
        metadata,
        LedgerId.TESTNET,
        "wc_AgroFresh_v1"
      );

      await connector.init();
      setDAppConnector(connector);
    };

    initWalletConnect();
  }, [navigate]);

  const connectWallet = async () => {
    if (!dAppConnector) {
      toast.error("Wallet connector not initialized");
      return;
    }

    try {
      const newSession = await dAppConnector.openModal();
      setSession(newSession);

      const accountIds = newSession.namespaces?.hedera?.accounts || [];
      if (accountIds.length > 0) {
        const accId = accountIds[0].split(":").pop() || "";
        setAccountId(accId);
        toast.success(`Wallet connected: ${accId}`);
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      toast.error("Failed to connect wallet");
    }
  };

  const disconnectWallet = async () => {
    if (dAppConnector && session) {
      await dAppConnector.disconnectAll();
      setSession(null);
      setAccountId("");
      toast.info("Wallet disconnected");
    }
  };

  const handlePayment = async () => {
    if (!dAppConnector || !session || !accountId) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsProcessing(true);

    try {
      const totalInHBAR = getFinalTotal();
      const hbarAmount = totalInHBAR;

      // Create transfer transaction
      const transaction = new TransferTransaction()
        .addHbarTransfer(
          AccountId.fromString(accountId),
          new Hbar(-hbarAmount)
        )
        .addHbarTransfer(
          AccountId.fromString(RECEIVER_ACCOUNT),
          new Hbar(hbarAmount)
        )
        .setTransactionMemo(`Order payment - ${cart.length} items`);

      // Execute transaction through wallet
      const params: SignAndExecuteTransactionParams = {
        transactionList: Buffer.from(
          transaction.toBytes()
        ).toString("base64"),
        signerAccountId: `hedera:testnet:${accountId}`,
      };

      const result = await dAppConnector.signAndExecuteTransaction(params);
      
      if (result) {
        // Extract transaction ID from result
        const transactionId = JSON.stringify(result).substring(0, 50);

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
        toast.error("Payment failed or was rejected");
      }
    } catch (error) {
      console.error("Hedera payment error:", error);
      toast.error("Payment failed. Please try again.");
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
                    Wallet Connection
                  </h3>
                  {!session ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Connect your Hedera wallet to complete the payment securely.
                      </p>
                      <Button
                        onClick={connectWallet}
                        className="w-full"
                        variant="outline"
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        Connect Wallet
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Supports HashPack, Blade, and other WalletConnect wallets
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">
                          Connected Account
                        </p>
                        <p className="font-mono text-sm font-semibold">
                          {accountId}
                        </p>
                      </div>
                      <Button
                        onClick={disconnectWallet}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Disconnect Wallet
                      </Button>
                    </div>
                  )}
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
                    disabled={isProcessing || !session}
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
