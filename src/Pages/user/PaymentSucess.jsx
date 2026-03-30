import React from "react";
import logo from "../../assets/ulwembu connect logo.jpeg"; // your logo
import map from "../../assets/worldmap.png"; // your map

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 to-green-500 relative">
      
      {/* Background world map overlay */}
      <div className="absolute inset-0 opacity-20">
        <img
          src={map}   // <-- use imported map here
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
          Your Payment Was Successfull
        </h1>
        <p className="text-white text-lg font-medium">Enjoy!</p>
      </div>
    </div>
  );
}