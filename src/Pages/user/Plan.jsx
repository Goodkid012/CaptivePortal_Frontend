import { useNavigate } from "react-router-dom";
import Icon from "../../assets/wifi.png";
import logo from "../../assets/Logo.jpeg";
import { useState,useEffect } from "react";
import { BASE_URL } from "../../api/api";

export default function Plan() {
  const navigate = useNavigate();
  const [subscriptions,setSubscriptions] = useState([]);
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/subscriptions`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setSubscriptions(data);
      } catch (error) {
        console.error("fetch error:", error);
      }
    };
    fetchSubscriptions();
  }, []);
  
 return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-green-400 p-6 flex flex-col items-center">
      {/* Logo */}
      <div className="mb-8">
        <img src={logo} alt="logo" className="h-16 w-16 rounded-full shadow-md" />
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-semibold text-white mb-8 text-center drop-shadow-lg">
        Choose Your Plan
      </h2>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        {subscriptions.map((subscriptions) => (
          <div
            key={subscriptions.title}
            className="relative bg-white border-4 border-green-400 rounded-2xl shadow-lg p-6 transition hover:scale-105 hover:shadow-2xl"
          >
            {/* Label */}
            <span className="absolute top-0 left-0 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-br-lg">
              {subscriptions.description}
            </span>

            {/* Icon */}
            <div className="flex justify-center mb-3">
              <img src={Icon} alt="wifi icon" className="bg-green-400 p-2 rounded-full h-12 w-12" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-blue-600 mb-3 text-center">
              R{subscriptions.price} per {subscriptions.duration} 
            </h3>

            {/* Details */}
            <ul className="text-sm text-gray-700 space-y-2 mb-6 list-disc list-inside">
              {subscriptions.features.map((item, index) => (
                <li key={index}>{item.name}</li>
              ))}
            </ul>

            {/* Button */}
            <button
              onClick={() => navigate(`/payy/${subscriptions.id}`)} 
              className="w-full bg-gradient-to-r from-blue-500 to-green-400 text-white py-2 rounded-lg hover:opacity-90 transition"
            >
             Select {subscriptions.duration} Pro
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
