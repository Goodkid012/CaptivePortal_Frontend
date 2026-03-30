import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import UnifiedLayout from "../../layouts/UserLayout";
import { BASE_URL,EMAIL_URL } from "../../api/api";

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (value, index) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      setError("");
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`).focus();
      }
    }
  };

  const validateOtp = () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter all 6 digits.");
      return false;
    }
    return true;
  };

  const handleVerify = async () => {
    const email = localStorage.getItem("resetEmail");
    if (!email) {
      alert("No email found. Please start over.");
      return;
    }

    if (!validateOtp()) return;

    setIsVerifying(true);
    const otpCode = otp.join("");

    try {
      const res = await fetch(`${EMAIL_URL}/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      if (res.status === 200) {
        navigate("/reset-password");
      } else {
        setError("Invalid OTP. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Error verifying OTP. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <UnifiedLayout>
      <div className="text-center w-full max-w-sm mx-auto">
        <h2 className="text-2xl font-bold text-[#007BFF] mb-10 mt-10">Verify OTP</h2>
        <p className="text-gray-600 text-sm mb-10">
          Enter the 6-digit code sent to your email.
        </p>

        <div className="flex justify-center space-x-2 mb-10">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              maxLength="1"
              disabled={isVerifying}
              className={`w-10 h-10 border border-gray-300 text-center rounded-md focus:outline-none focus:ring-2 focus:ring-[#6DDC5F] text-lg font-semibold ${
                error
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-[#6DDC5F]"
              } ${isVerifying ? "bg-gray-100 cursor-not-allowed" : ""}`}
            />
          ))}
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className={`w-full bg-gradient-to-r from-[#0085FF] to-[#6DDC5F] text-white py-2 rounded-md font-semibold transition-all ${
            isVerifying
              ? "opacity-50 cursor-not-allowed"
              : "hover:opacity-90"
          }`}
        >
          {isVerifying ? "Verifying..." : "Verify"}
        </button>

        <p className="text-sm text-gray-600 mt-10 mb-10">
          Didn’t receive the OTP?{" "}
          <button
            onClick={() => navigate("/send-otp")}
            className="text-[#007BFF] hover:underline"
          >
            Resend
          </button>
        </p>
      </div>
    </UnifiedLayout>
  );
}