import React, { useEffect } from "react";
import logo from "../../assets/ulwembu connect logo.jpeg";
import map from "../../assets/worldmap.png";

export default function PaymentSuccess() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "https://www.ulwembubs.com/";
    }, 3000); // Redirect after 3 seconds

    return () => clearTimeout(timer); // Cleanup in case component unmounts
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-teal-500 to-green-400 relative overflow-hidden">
      {/* Background world map overlay */}
      <div className="absolute inset-0 opacity-20">
        <img
          src={map}
          alt="World Map"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src={logo}
            alt="Ulwembu Connect Logo"
            className="w-24 h-24 rounded-xl shadow-lg bg-white p-3"
          />
        </div>

        {/* Success Message */}
        <h1 className="text-white text-xl font-bold mb-2">
          You Will Be Redirected Shortly
        </h1>
        <p className="text-white text-lg font-medium">Enjoy!</p>
      </div>
    </div>
  );
}