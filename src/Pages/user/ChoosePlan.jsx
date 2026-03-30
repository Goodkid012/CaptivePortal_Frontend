import { useNavigate } from "react-router-dom";
import wifiIcon from "../../assets/wifi.png";
//import crownIcon from "../assets/crown.png";
import logo from "../../assets/Logo.jpeg";
import { useState, useEffect } from "react";
import { BASE_URL } from "../../api/api";

export default function ChoosePlan() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);

useEffect(() => {
  const fetchPlans = async () => {
    try {
      const res = await fetch(`${BASE_URL}/plans`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const activePlans = data.filter(plan => plan.isActive);
      const sortedPlans = [...activePlans].sort((a, b) => {
        if (a.planName.toLowerCase() === "free") return -1;
        if (b.planName.toLowerCase() === "free") return 1;
        return 0;
      });

      setPlans(sortedPlans);
    } catch (error) {
      console.error("fetch error:", error);
    }
  };
  fetchPlans();
}, []);


  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-green-400 p-6 flex flex-col items-center">
      {/* Logo */}
      <div className="mb-8">
        <img src={logo} alt="Logo" className="h-24 w-24 rounded-full shadow-md" />
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-semibold text-white mb-8 text-center drop-shadow-lg">
        Choose Your Plan
      </h2>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-5xl">
        {plans.map((plan) => (
          <div
            key={plan.planName}
            className={`relative bg-white border-4 ${
              plan.planName.toLowerCase() === "free"
                ? "border-green-400"
                : "border-green-400"
            } rounded-2xl shadow-lg p-6 transition hover:scale-105 hover:shadow-2xl`}
          >
            {/* Label */}
            <span
              className={`absolute top-0 left-0 ${
                plan.planName.toLowerCase() === "free"
                  ? "bg-green-500"
                  : "bg-green-500"
              } text-white text-xs font-semibold px-3 py-1 rounded-br-lg`}
            >
              {plan.description}
            </span>

            {/* Icon */}
            <div className="flex justify-center mb-3">
              <img
                src={wifiIcon}
                alt={`${plan.icon}-icon`}
                className="bg-green-400 p-2 rounded-full h-12 w-12"
              />
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-blue-600 mb-3 text-center">
              {plan.planName}
            </h3>

            {/* Features */}
            <ul className="text-sm text-gray-700 space-y-2 mb-6 list-disc list-inside">
              {plan.features.map((feature, i) => (
                <li key={i}>{feature.name}</li>
              ))}
            </ul>

            {/* Button */}
            <button
              onClick={() => navigate(plan.path)}
              className="w-full bg-gradient-to-r from-blue-500 to-green-400 text-white py-2 rounded-lg hover:opacity-90 transition"
            >
              {plan.planName} Wifi Access
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
