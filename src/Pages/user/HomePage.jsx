import React,{useEffect} from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/Ulwembu connect logo.jpeg";
import map from "../../assets/worldmap.png";
import { BASE_URL } from "../../api/api";

const HomePage = () => {
  const navigate = useNavigate();
   useEffect(() => {
    const sendClientInfo = async () => {
      try {
        const res = await fetch(`${BASE_URL}/devices`, {
          method: "POST",
           headers: {
          "Content-Type": "application/json", 
        },
          body: JSON.stringify({
               status:"online",
               signalStrength:"Strong"
          })
        },);
        const data = await res.json();
        sessionStorage.setItem("deviceId", data.id);
      } catch (error) {
        console.error("Failed to send client info:", error);
      }
    };

    sendClientInfo();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-l from-green-500 to-blue-500 px-6">
              {/* Background world map overlay */}
                  <div className=" z-0 absolute inset-0 opacity-20">
                    <img
                      src={map}  
                      alt="World Map"
                      className="w-full h-full object-cover"
                    />
                  </div>
      
      <div className="z-10 text-center text-white max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src={logo}
            alt="ULWEMBU CONNECT Logo"
            className="w-20 h-20 rounded-md shadow-md"
          />
        </div>

        {/* Headings */}
        <h1 className="text-xl font-bold mb-2">
          Connecting Citizens,
          <br />
          Empowering Communities
        </h1>
        <p className="text-sm mb-20">Enjoy free Wi-Fi</p>

        {/* Buttons */}
        <div className="flex flex-col space-y-4">
          <button
            onClick={() => navigate("/signup")}
            className="py-3 border-[4px] border-white text-white text-lg font-bold rounded-lg hover:bg-white hover:text-green-500 transition"
          >
            Get Started
          </button>
          <button
            onClick={() => navigate("/login")}
            className="py-3 bg-white text-blue-500 text-lg font-bold rounded-lg hover:bg-gray-100 transition"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;