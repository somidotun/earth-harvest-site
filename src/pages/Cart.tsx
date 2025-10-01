import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Client,
  AccountId,
  PrivateKey,
  Hbar,
  TransferTransaction,
} from "@hashgraph/sdk";

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, getTotalPrice } =
    useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [privateKey, setPrivateKey] = useState("");

  // Hedera testnet receiver account (replace with your actual account)
  const RECEIVER_ACCOUNT = "0.0.1234567";

  const handleCheckout = async () => {
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

      const totalInHBAR = getTotalPrice();
      // Convert USD to HBAR (example rate: 1 USD = 10 HBAR, adjust as needed)
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
        toast.success(
          `Payment successful! Transaction ID: ${txResponse.transactionId.toString()}`
        );
        clearCart();
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

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 bg-background flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Your cart is empty
            </h2>
            <p className="text-muted-foreground mb-8">
              Add some products to get started
            </p>
            <Button asChild>
              <a href="/products">Browse Products</a>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const calculateItemTotal = (price: number, quantity: number) => {
    return (price * quantity).toFixed(2);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-background">
        <div className="bg-muted/30 py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-['Playfair_Display']">
              Shopping Cart
            </h1>
            <p className="text-muted-foreground">
              Review your items and checkout with Hedera
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <Card key={item.id} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-2">
                          {item.name}
                        </h3>
                        <p className="text-primary font-bold mb-2  ">
                          {calculateItemTotal(item.price, item.quantity)}
                          <sub className="italic text-xs pl-1">HBAR</sub>
                        </p>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-12 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                            className="ml-auto text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Checkout Summary */}
            <div className="lg:col-span-1">
              <Card className="border-border sticky top-20">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Order Summary</h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>

                      <span className="text-primary font-medium flex flex-row">
                        {getTotalPrice().toFixed(2)}
                        <p className="text-xs italic">
                          <sub>HBAR</sub>
                        </p>
                      </span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total (HBAR)</span>
                        <span className="text-primary flex flex-row ">
                          {getTotalPrice().toFixed(2)}
                          <p>
                            <sub className="text-xs italic">HBAR</sub>
                          </p>
                        </span>
                      </div>
                      {/* <p className="text-xs text-muted-foreground mt-1">
                        ≈ {getTotalPrice().toFixed(2)} HBAR
                      </p> */}
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
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

                  <Button
                    className="w-full bg-primary hover:bg-primary-light text-primary-foreground"
                    onClick={handleCheckout}
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

export default Cart;
