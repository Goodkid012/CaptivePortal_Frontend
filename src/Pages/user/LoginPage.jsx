import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import UnifiedLayout from "../../layouts/UserLayout";
import { BASE_URL } from "../../api/api";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = "Enter a valid email";
    if (!form.password.trim()) newErrors.password = "Password is required";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          deviceId: sessionStorage.getItem("deviceId"),
        }),
      });

      if (response.status === 200) {
        const data = await response.json();
        if (!data) return;
          if (data.isBlocked) {
            alert("Your account has been blocked. Please contact support.");
            return;
          }

        sessionStorage.setItem("userId", data.id || data.userId);
        if (!data.subscriptions || data.subscriptions.length === 0) {
          navigate("/ad");
        } else {
          navigate("/Redirected");
        }
      } else if (response.status === 401) {
        // Invalid credentials
        setErrors({
          email: " ",
          password: "Invalid email or password",
        });
      }
    } catch (error) {
      console.error("Login error:", error.message);
    }
  };

  return (
    <UnifiedLayout>
      <div className="w-full max-w-sm mx-auto text-center">
        <h2 className="text-2xl font-bold text-blue-800 mb-2">Login</h2>
        <p className="text-gray-500 text-sm mb-6">Sign in to continue.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="text-left">
            <label
              className={`block text-sm font-medium mb-1 ${
                errors.email ? "text-red-600" : "text-gray-700"
              }`}
            >
              EMAIL
            </label>
            <input
              type="email"
              name="email"
              placeholder="example@domain.com"
              value={form.email}
              onChange={handleChange}
              className={`w-full rounded-lg p-2 outline-none focus:ring-2 ${
                errors.email
                  ? "border border-red-500 focus:ring-red-500"
                  : "border border-green-400 focus:ring-green-400"
              }`}
            />
            {errors.email && (
              <p className="text-red-600 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="text-left">
            <label
              className={`block text-sm font-medium mb-1 ${
                errors.password ? "text-red-600" : "text-gray-700"
              }`}
            >
              PASSWORD
            </label>
            <input
              type="password"
              name="password"
              placeholder="******"
              value={form.password}
              onChange={handleChange}
              className={`w-full rounded-lg p-2 outline-none focus:ring-2 ${
                errors.password
                  ? "border border-red-500 focus:ring-red-500"
                  : "border border-green-400 focus:ring-green-400"
              }`}
            />
            {errors.password && (
              <p className="text-red-600 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-teal-500 to-green-500 text-white font-semibold py-2 rounded-lg hover:from-teal-600 hover:to-green-600 transition"
          >
            Log in
          </button>
        </form>

        {/* Links */}
        <div className="flex justify-between mt-3 text-sm">
          <button
            onClick={() => navigate("/send-otp")}
            className="text-gray-500 hover:text-blue-600 transition"
          >
            Forgot Password?
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="text-blue-600 font-medium hover:underline"
          >
            Signup
          </button>
        </div>
      </div>
    </UnifiedLayout>
  );
}
