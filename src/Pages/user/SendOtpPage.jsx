/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../../assets/Logo.jpeg";
import { BASE_URL,EMAIL_URL } from "../../api/api";
import UnifiedLayout from "../../layouts/UserLayout";

export default function SendOtpPage() {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
     if (!validateForm()) return;
    setIsSending(true);
    setError("");

    try {
      const checkRes = await fetch(`${BASE_URL}users/customers/exists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const exists = await checkRes.json();

      if (checkRes.status === 200 && exists === true) {
        const otpRes = await fetch(`${EMAIL_URL}/auth/otp/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (otpRes.status === 200) {
          localStorage.setItem("resetEmail", email);
          navigate("/verify-otp");
        } else {
          setError("Failed to send OTP. Please try again.");
        }
      } else if (exists === false) {
        setError("No account found with this email address.");
      } else {
        setError("Unexpected response from the server.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while sending OTP.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <UnifiedLayout>
      <div className="text-center w-full max-w-sm mx-auto">
        <h2 className="text-2xl font-bold text-[#007BFF] mb-2 mt-20">
          Reset Password
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Enter your email to receive a One-Time Password (OTP)
        </p>

        <form onSubmit={handleSendOtp} className="flex flex-col space-y-4 mb-32">
          <div className="flex flex-col text-left">
            <label
              className={`text-sm font-semibold mb-1 ${
                errors.email ? "text-red-600" : "text-gray-700"
              }`}
            >
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({});
              }}
              placeholder="example@email.com"
              disabled={isSending}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                errors.email
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-[#6DDC5F]"
              } ${isSending ? "bg-gray-100 cursor-not-allowed" : ""}`}
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSending}
            className={`w-full bg-gradient-to-r from-[#0085FF] to-[#6DDC5F] text-white py-2 rounded-md font-semibold transition ${
              isSending
                ? "opacity-20 cursor-not-allowed"
                : "hover:opacity-90"
            }`}
          >
            {isSending ? "Sending..." : "Send OTP"}
          </button>
        </form>
      </div>
    </UnifiedLayout>
  );
}