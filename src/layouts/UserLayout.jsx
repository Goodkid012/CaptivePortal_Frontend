import React from "react";
import Logo from "../assets/Logo.jpeg";
import Cwt from "../assets/cwt.png";

export default function UnifiedLayout({ children }) {
  return (
    <div className="relative min-h-screen">
      {/* -----------------------
          DESKTOP / TABLET (md and up)
          ----------------------- */}
      <div className="hidden md:flex flex-col items-center bg-gradient-to-r from-[#0085FF] to-[#6DDC5F] min-h-screen relative overflow-auto">
        {/* Logo */}
        <div className="absolute top-20 flex flex-col items-center z-50">
          <div className="bg-white p-4 rounded-2xl shadow-md">
            <img src={Logo} alt="Ulwembu Connect Logo" className="w-16 h-16" />
          </div>
        </div>

        {/* White Content Card */}
        <div className="bg-white mt-36 mb-12 w-[360px] rounded-3xl shadow-lg flex flex-col items-center py-10 relative z-10">
          <div className="text-center px-6 w-full">{children}</div>
        </div>

        {/* Background Image */}
        <div className="absolute bottom-0 opacity-20 z-0">
          <img src={Cwt} alt="CWT Test" className="w-screen h-80" />
        </div>
      </div>

      {/* -----------------------
          MOBILE (below md)
          ----------------------- */}
      <div className="md:hidden flex flex-col bg-gradient-to-r from-blue-500 to-green-400 min-h-screen relative">
        {/* Logo */}
        <div className="flex justify-center mt-10">
          <div className="bg-white rounded-3xl p-2 shadow-md">
            <img
              src={Logo}
              alt="ULWEMBU CONNECT Logo"
              className="w-20 h-20 object-contain"
            />
          </div>
        </div>

        {/* CWT Image Positioned Above White Container (auto-adjusting) */}
        <div className="w-full mt-8 flex justify-center">
          <img
            src={Cwt}
            alt="CWT Decorative"
            className="w-full max-h-40 object-cover opacity-30"
          />
        </div>

        {/* White Card Container */}
        <div className="bg-white shadow-lg rounded-tl-[50px] w-full -mt-12 p-8 text-center z-10 flex flex-col items-center ">
          <div className="flex flex-col items-center justify-center w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}