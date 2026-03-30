import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import UnifiedLayout from "../../layouts/UserLayout";
import { BASE_URL,EMAIL_URL } from "../../api/api";

export default function VerifyPhone() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();

  const handleChange = (value, index) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`)?.focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOtp = [...otp];
      if (otp[index]) {
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        const prevInput = document.getElementById(`otp-${index - 1}`);
        prevInput?.focus();
        const prevOtp = [...otp];
        prevOtp[index - 1] = "";
        setOtp(prevOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    setIsResending(true);
    const tempUserString = localStorage.getItem("tempUser");
    if (!tempUserString) {
      console.error("No user data found");
      setIsResending(false);
      return;
    }

    const tempUser = JSON.parse(tempUserString);
    try {
      const response = await fetch(`${EMAIL_URL}/auth/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: tempUser.email }),
      });

      if (response.status === 200) {
        console.log("OTP resent successfully");
      } else {
        console.error("Failed to resend OTP");
      }
    } catch (error) {
      console.error(error.message);
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async () => {
    const tempUserString = localStorage.getItem("tempUser");
    if (!tempUserString) {
      console.error("No user data found");
      return;
    }

    const tempUser = JSON.parse(tempUserString);
    console.log(tempUser);
    setIsVerifying(true);

    try {
      const otpString = otp.join("");

      const verifyResponse = await fetch(`${EMAIL_URL}/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: tempUser.email,
          otp: otpString,
        }),
      });

      if (verifyResponse.status === 200) {
        const saveResponse = await fetch(`${BASE_URL}/users/customers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userEmail: tempUser.email,
            firstName: tempUser.name,
            lastName: tempUser.surname,
            password: tempUser.password,
            phoneNumber: tempUser.cellNumber,
            dateOfBirth: tempUser.birthDate,
            devices: [{ id: sessionStorage.getItem("deviceId") }],
          }),
        });

        if (saveResponse.status === 200) {
          const data = await saveResponse.json().catch(() => ({}));
          sessionStorage.setItem("userId", data.id || data.userId);
          localStorage.removeItem("tempUser");
          navigate("/ChoosePlan");
        } else {
          console.error("Failed to save customer");
        }
      } else {
        console.error("Invalid OTP");
      }
    } catch (error) {
      console.error(error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <UnifiedLayout>
      <div className="text-center w-full max-w-sm mx-auto">
        {/* Title */}
        <h2 className="text-2xl font-bold text-[#007BFF] mb-6 mt-10">
          Verify Your Email
        </h2>
        <p className="text-gray-600 text-sm mb-10">
          We’ve sent a 6-digit code to your email. Enter it below to continue.
        </p>

        {/* OTP Boxes */}
        <div className="flex justify-center mt-6 space-x-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={digit}
              maxLength={1}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-10 h-10 border border-gray-300 text-center rounded-md focus:outline-none focus:ring-2 focus:ring-[#6DDC5F] text-lg font-semibold"
            />
          ))}
        </div>

        {/* Resend Button */}
        <div className="mt-6 ">
          <button
            onClick={handleResend}
            disabled={isResending}
            className={`text-sm text-blue-500 px-4 py-1.5 transition-all ${
              isResending
                ? "opacity-50 cursor-not-allowed"
                : "hover:from-blue-600 hover:to-green-500 hover:shadow-md transform hover:-translate-y-0.5"
            }`}
          >
            {isResending ? "Resending..." : "Resend Code"}
          </button>
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className={`w-full mt-6 mb-20 bg-gradient-to-r from-blue-500 to-green-400 text-white font-bold py-2 rounded-lg transition-all ${
            isVerifying
              ? "opacity-50 cursor-not-allowed"
              : "hover:from-blue-600 hover:to-green-500 hover:shadow-lg transform hover:-translate-y-0.5"
          }`}
        >
          {isVerifying ? "Verifying..." : "Verify"}
        </button>
      </div>
    </UnifiedLayout>
  );
}
