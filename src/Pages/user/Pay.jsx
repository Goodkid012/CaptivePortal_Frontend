/* eslint-disable no-undef */
import React, { useState,useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import logo from "../../assets/ulwembu connect logo.jpeg";
import Cwt from "../../assets/cwt.png";
import { BASE_URL } from "../../api/api";

export default function CheckoutPage() {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});
  const {id} = useParams();
  const [formData, setFormData] = useState({
    streetAddress: "",
    apt: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
  });

  const backendUrl = BASE_URL;
  const [subscription,setSubscription] = useState({});
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const res = await fetch(
          `${backendUrl}/subscriptions/${id}`
        );
        if (!res.ok) throw new Error("Failed to fetch"); 
        const data = await res.json();
        setSubscription(data);
      } catch (error) {
        console.error("fetch error:", error);
      }
    };
    fetchSubscriptions();
  }, []);
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.streetAddress.trim()) newErrors.streetAddress = "Street address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State/Province is required";
    if (!formData.country) newErrors.country = "Country is required";
    if (!formData.zipCode.trim()) newErrors.zipCode = "ZIP/Postal code is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Stripe Payment
  const handleStripePayment = async () => {
    if (!stripe || !elements) {
      alert("Stripe is not ready yet");
      return;
    }

    // Create PaymentIntent
    const res = await fetch(`${backendUrl}/payments/create-payment-intent/${subscription.price}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billingAddress: formData }),
    });
    const data = await res.json();

    if (!data.clientSecret) throw new Error("Failed to create payment intent");

    // Get mounted CardElement
    const cardElement = elements.getElement(CardElement);

    const { paymentIntent, error } = await stripe.confirmCardPayment(data.clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          address: {
            line1: formData.streetAddress,
            city: formData.city,
            state: formData.state,
            country: formData.country,
            postal_code: formData.zipCode,
          },
        },
      },
    });

    if (error) throw new Error(error.message);
      console.log(sessionStorage.getItem("userId"));
    if (paymentIntent.status === "succeeded") {
       try{
      const response = await fetch(`http://localhost:8080/payments/create-payment-subscription`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userId: sessionStorage.getItem("userId"),
                        subscriptionId: id,
                        payment:{
                          amount:subscription.price,
                          paymentMethod:"card",
                          paymentStatus:"success "
                        }
                    })
                });
                     if(response.status===200){
                      navigate("/PaymentSuccess", { state: { paymentMethod: "card" } });
                     }
                
            } catch (error) {
                console.error(error.message);
            }
      
    }
  };

  // Main payment handler
  const handlePayment = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("Please fill in all required fields");
      return;
    }

    setIsProcessing(true);

    try {
      switch (paymentMethod) {
        case "card":
          await handleStripePayment();
          break;
        case "paypal":
          await handlePayPalPayment();
          break;
        case "apple":
          await handleApplePay();
          break;
        case "google":
          await handleGooglePay();
          break;
        default:
          throw new Error("Unknown payment method");
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      alert(`Payment failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // PayPal Payment
  const handlePayPalPayment = async () => {
    try {
      const createOrderResponse = await fetch(`${backendUrl}/api/payment/create-paypal-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingAddress: formData }),
      });

      if (!createOrderResponse.ok) throw new Error("Failed to create PayPal order");

      const orderData = await createOrderResponse.json();
      window.location.href = `https://www.paypal.com/checkoutnow?token=${orderData.id}`;
    } catch (error) {
      console.error("PayPal payment error:", error);
      throw error;
    }
  };

  // Apple Pay
  const handleApplePay = async () => {
    if (!window.ApplePaySession) {
      alert("Apple Pay is not available in this browser");
      return;
    }

    try {
      const paymentRequest = {
        countryCode: "US",
        currencyCode: "USD",
        supportedNetworks: ["visa", "masterCard", "amex"],
        merchantCapabilities: ["supports3DS"],
        total: { label: "Ulwembu Connect", amount: "19.99" },
      };

      const session = new ApplePaySession(3, paymentRequest);

      session.onvalidatemerchant = async (event) => {
        const response = await fetch(`${backendUrl}/api/payment/validate-apple-pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ validationURL: event.validationURL }),
        });
        const merchantSession = await response.json();
        session.completeMerchantValidation(merchantSession);
      };

      session.onpaymentauthorized = (event) => {
        processWalletPayment("apple", event.payment.token)
          .then(() => {
            session.completePayment(ApplePaySession.STATUS_SUCCESS);
            navigate("/payment-success");
          })
          .catch(() => session.completePayment(ApplePaySession.STATUS_FAILURE));
      };

      session.begin();
    } catch (error) {
      console.error("Apple Pay error:", error);
      throw error;
    }
  };

  // Google Pay
  const handleGooglePay = async () => {
    if (!window.google) {
      alert("Google Pay is not available");
      return;
    }

    try {
      const paymentsClient = new google.payments.api.PaymentsClient({ environment: "TEST" });
      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        merchantInfo: { merchantId: "YOUR_MERCHANT_ID", merchantName: "Ulwembu Connect" },
        allowedPaymentMethods: [
          {
            type: "CARD",
            parameters: {
              allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
              allowedCardNetworks: ["VISA", "MASTERCARD"],
            },
            tokenizationSpecification: {
              type: "PAYMENT_GATEWAY",
              parameters: {
                gateway: "stripe",
                "stripe:version": "2020-08-27",
                "stripe:publishableKey":
                  "pk_test_51SHOdsRZ5uZgKDhIoqRmpQo89maI4Xfz7wuXweYmovj9rmap1uulAvHpoAFVRn2td1MopQCQW7A2rCHTK9Re6l5v00kfj78S6A",
              },
            },
          },
        ],
        transactionInfo: {
          totalPriceStatus: "FINAL",
          totalPriceLabel: "Total",
          totalPrice: "19.99",
          currencyCode: "USD",
          countryCode: "US",
        },
        callbackIntents: ["PAYMENT_AUTHORIZATION"],
      };

      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);
      await processGooglePayPayment(paymentData);
      navigate("/payment-success");
    } catch (error) {
      console.error("Google Pay error:", error);
      throw error;
    }
  };

  // Wallet Payments
  const processWalletPayment = async (walletType, paymentToken) => {
    const response = await fetch(`${backendUrl}/api/payment/process-wallet-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletType, paymentToken, amount: 1999, currency: "usd", billingAddress: formData }),
    });
    if (!response.ok) throw new Error("Wallet payment failed");
    return await response.json();
  };

  const processGooglePayPayment = async (paymentData) => {
    const response = await fetch(`${backendUrl}/api/payment/process-google-pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentData, amount: 1999, currency: "usd", billingAddress: formData }),
    });
    if (!response.ok) throw new Error("Google Pay payment failed");
    return await response.json();
  };

  const paymentMethods = [
    { id: "card", label: "Credit or Debit card" }
  ];

   return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-gradient-to-tl from-blue-500 to-green-400">
      {/* Left Section */}
      <div className="text-white flex flex-col justify-between p-6 md:p-10 relative">
        <div className="flex justify-center mb-6 mt-20 lg:mt-32 md:mt-10">
          <img
            src={logo}
            alt="Ulwembu Connect Logo"
            className="w-20 h-20 md:w-24 md:h-24 rounded-xl shadow-lg bg-white p-2 md:p-3"
          />
        </div>

        <div className="absolute bottom-0 left-0 opacity-20 z-0">
          <img src={Cwt} alt="CWT Test" className="w-screen h-80" />
        </div>
      </div>

      {/* Right Section */}
      <div className="p-6 md:p-10 bg-white rounded-tl-[50px] md:rounded-tl-none -mt-12 z-10">
        <h2 className="text-2xl font-semibold mb-6 mt-10">Payment Method</h2>
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            type="button"
            onClick={() => setPaymentMethod("card")}
            disabled={isProcessing}
            className={`min-w-[120px] flex-1 border rounded-lg py-2 px-3 text-center capitalize text-sm transition-colors ${
              paymentMethod === "card"
                ? "border-blue-500 text-blue-600 bg-blue-50"
                : "border-gray-300 hover:border-blue-300 text-gray-700"
            } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Credit or Debit Card
          </button>
        </div>

        <h2 className="text-2xl font-semibold mb-6">Payment Information</h2>
        <form className="space-y-5" onSubmit={handlePayment}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Card Details *
          </label>
          <div
            className={`border p-3 rounded-lg ${
              errors.card ? "border-red-500" : "border-gray-300"
            }`}
          >
            <CardElement options={{ hidePostalCode: true }} />
          </div>

          {/* Street Address */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                errors.streetAddress ? "text-red-600" : "text-gray-700"
              }`}
            >
              Street Address *
            </label>
            <input
              name="streetAddress"
              value={formData.streetAddress}
              onChange={handleInputChange}
              disabled={isProcessing}
              placeholder="123 Main St"
              className={`w-full border rounded-lg p-3 outline-none focus:ring-2 ${
                errors.streetAddress
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            {errors.streetAddress && (
              <p className="text-red-600 text-sm mt-1">
                {errors.streetAddress}
              </p>
            )}
          </div>

          {/* Apt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apartment / Unit (Optional)
            </label>
            <input
              name="apt"
              value={formData.apt}
              onChange={handleInputChange}
              disabled={isProcessing}
              placeholder="Unit 4B"
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* City + State */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label
                className={`block text-sm font-medium mb-1 ${
                  errors.city ? "text-red-600" : "text-gray-700"
                }`}
              >
                City *
              </label>
              <input
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                disabled={isProcessing}
                placeholder="City"
                className={`w-full border rounded-lg p-3 outline-none focus:ring-2 ${
                  errors.city
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {errors.city && (
                <p className="text-red-600 text-sm mt-1">{errors.city}</p>
              )}
            </div>

            <div className="flex-1">
              <label
                className={`block text-sm font-medium mb-1 ${
                  errors.state ? "text-red-600" : "text-gray-700"
                }`}
              >
                State / Province *
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                disabled={isProcessing}
                className={`w-full border rounded-lg p-3 focus:ring-2 outline-none ${
                  errors.state
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              >
                <option value="">Select Province *</option>
                <option value="EASTERN_CAPE">Eastern Cape</option>
                <option value="FREESTATE">Free State</option>
                <option value="KWA_ZULU_NATAL">KwaZulu-Natal</option>
                <option value="GAUTENG">Gauteng</option>
                <option value="LIMPOPO">Limpopo</option>
                <option value="MPUMALANGA">Mpumalanga</option>
                <option value="NORTHERN_CAPE">Northern Cape</option>
                <option value="NORTH_WEST">North West</option>
                <option value="WESTERN_CAPE">Western Cape</option>
              </select>
              {errors.state && (
                <p className="text-red-600 text-sm mt-1">{errors.state}</p>
              )}
            </div>
          </div>

          {/* Country + ZIP */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label
                className={`block text-sm font-medium mb-1 ${
                  errors.country ? "text-red-600" : "text-gray-700"
                }`}
              >
                Country *
              </label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                disabled={isProcessing}
                className={`w-full border rounded-lg p-3 focus:ring-2 outline-none ${
                  errors.country
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              >
                <option value="">Select Country *</option>
                <option value="ZA">South Africa</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
              </select>
              {errors.country && (
                <p className="text-red-600 text-sm mt-1">{errors.country}</p>
              )}
            </div>

            <div className="flex-1">
              <label
                className={`block text-sm font-medium mb-1 ${
                  errors.zipCode ? "text-red-600" : "text-gray-700"
                }`}
              >
                ZIP / Postal Code *
              </label>
              <input
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                disabled={isProcessing}
                placeholder="12345"
                className={`w-full border rounded-lg p-3 outline-none focus:ring-2 ${
                  errors.zipCode
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {errors.zipCode && (
                <p className="text-red-600 text-sm mt-1">{errors.zipCode}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className={`w-full bg-gradient-to-r from-blue-500 to-green-400 text-white text-xl font-bold py-3 rounded-lg mt-6 transition-all ${
              isProcessing
                ? "opacity-50 cursor-not-allowed"
                : "hover:from-blue-600 hover:to-green-500 hover:shadow-lg transform hover:-translate-y-0.5"
            }`}
          >
            {isProcessing
              ? "Processing..."
              : `Pay Now - R${subscription.price || ""}`}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          🔒 Your payment information is secure and encrypted
        </div>
      </div>
    </div>
  );
}