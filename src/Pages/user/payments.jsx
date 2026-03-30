import React, { useState } from "react";
import logo from "../../assets/Ulwembu connect logo.jpeg";
import googlePayIcon from "../../assets/google.png";
import voucherIcon from "../../assets/voucher.png";
import paypalIcon from "../../assets/paypal.png";
import applePayIcon from "../../assets/apple.png";

export default function PaymentPage() {
  const [success, setSuccess] = useState(false);

  // ✅ Simulated payment gateway triggers
  const handlePayment = (method) => {
    switch (method) {
      case "google":
        console.log("Redirecting to Google Pay...");
        // TODO: integrate Google Pay SDK or backend API
        break;
      case "paypal":
        console.log("Redirecting to PayPal...");
        // TODO: integrate PayPal Checkout flow
        break;
      case "apple":
        console.log("Redirecting to Apple Pay...");
        // TODO: integrate Apple Pay via Payment Request API or Stripe
        break;
      case "voucher":
        console.log("Applying voucher...");
        // TODO: validate voucher code with backend
        break;
      default:
        break;
    }
    // Simulate success after payment flow completes
    setTimeout(() => setSuccess(true), 800);
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
        <img
          src={logo}
          alt="ULWEMBU Connect"
          className="h-24 w-24 object-contain mb-6"
        />
        <h1 className="text-3xl font-bold text-green-600 mb-4">
          Payment Successful 🎉
        </h1>
        <p className="text-lg text-gray-700">Thank you for your purchase!</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-white p-6">
      <div className="max-w-sm w-full overflow-hidden shadow-md border border-green-400 rounded-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-green-400 p-6 flex flex-col items-center rounded-t-xl">
          <img
            src={logo}
            alt="Ulwembu Connect Logo"
            className="w-20 h-20 rounded-xl shadow-lg bg-white p-2 mb-3"
          />
          <h1 className="text-white text-xl font-bold">Choose Payment Method</h1>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-6 -mt-4 rounded-tr-3xl relative z-10">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => handlePayment("google")}
              className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-green-400 text-white rounded-lg py-2 hover:opacity-90 transition"
            >
              <img src={googlePayIcon} alt="Google Pay" className="h-5 w-5 mr-2" />
              Google Pay
            </button>

            <button
              onClick={() => handlePayment("voucher")}
              className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-green-400 text-white rounded-lg py-2 hover:opacity-90 transition"
            >
              <img src={voucherIcon} alt="Voucher" className="h-5 w-5 mr-2" />
              Voucher
            </button>

            <button
              onClick={() => handlePayment("paypal")}
              className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-green-400 text-white rounded-lg py-2 hover:opacity-90 transition"
            >
              <img src={paypalIcon} alt="PayPal" className="h-5 w-5 mr-2" />
              PayPal
            </button>

            <button
              onClick={() => handlePayment("apple")}
              className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-green-400 text-white rounded-lg py-2 hover:opacity-90 transition"
            >
              <img src={applePayIcon} alt="Apple Pay" className="h-5 w-5 mr-2" />
              Apple Pay
            </button>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center mt-6 text-gray-700 font-medium">
            <span>Total Amount :</span>
            <span>R 79</span>
          </div>
        </div>
      </div>
    </div>
  );
}
