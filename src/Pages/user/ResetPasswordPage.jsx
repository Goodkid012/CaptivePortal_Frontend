import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../../assets/Logo.jpeg";
import { BASE_URL } from "../../api/api";
import UnifiedLayout from "../../layouts/UserLayout";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
   const validateForm = () => {
    const newErrors = {};

    if (!password.trim()) newErrors.password = "New password is required.";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters.";

    if (!confirmPassword.trim())
      newErrors.confirmPassword = "Please confirm your password.";
    else if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleReset = async (e) => {
    e.preventDefault();
      if (!validateForm()) return;
    const email = localStorage.getItem("resetEmail");

    if (!email) return alert("Email not found. Please start over.");
    if (password !== confirmPassword) return alert("Passwords do not match.");

    setIsResetting(true);
    try {
      const res = await fetch(`${BASE_URL}/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email:email, password: password }),
      });

      if (res.status === 200) {
        localStorage.removeItem("resetEmail");
        alert("Password successfully reset!");
        navigate("/login");
      } else {
        alert("Failed to reset password.");
      }
    } catch (err) {
      console.error(err);
      alert("Error resetting password.");
    } finally {
      setIsResetting(false);
    }
  };

   return (
    <UnifiedLayout>
      <div className="text-center w-full max-w-sm mx-auto">
        <h2 className="text-2xl font-bold text-[#007BFF] mb-6 mt-10">
          Reset Password
        </h2>

        <form onSubmit={handleReset} className="flex flex-col space-y-5">
          {/* New Password */}
          <div className="flex flex-col text-left">
            <label
              className={`text-sm font-semibold mb-1 ${
                errors.password ? "text-red-600" : "text-gray-700"
              }`}
            >
              New Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: "" });
              }}
              placeholder="••••••••"
              disabled={isResetting}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.password
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-[#6DDC5F]"
              }`}
              required
            />
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col text-left">
            <label
              className={`text-sm font-semibold mb-1 ${
                errors.confirmPassword ? "text-red-600" : "text-gray-700"
              }`}
            >
              Confirm Password *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword)
                  setErrors({ ...errors, confirmPassword: "" });
              }}
              placeholder="••••••••"
              disabled={isResetting}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.confirmPassword
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-[#6DDC5F]"
              }`}
              required
            />
            {errors.confirmPassword && (
              <p className="text-red-600 text-sm mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isResetting}
            className={`w-full bg-gradient-to-r from-[#0085FF] to-[#6DDC5F] text-white py-2 rounded-md font-semibold transition ${
              isResetting
                ? "opacity-50 cursor-not-allowed"
                : "hover:opacity-90"
            }`}
          >
            {isResetting ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {/* Back to Login */}
        <p className="text-sm text-gray-600 mt-2 mb-20">
          <button
            onClick={() => navigate("/login")}
            className="hover:underline text-[#007BFF]"
          >
            Back to Log in
          </button>
        </p>
      </div>
    </UnifiedLayout>
  );
}