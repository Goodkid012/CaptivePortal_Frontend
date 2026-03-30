// src/pages/SignupPage.jsx
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import UnifiedLayout from "../../layouts/UserLayout";
import { BASE_URL,EMAIL_URL } from "../../api/api";

const SignupPage = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [emailError, setEmailError] = useState(""); 
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    password: "",
    birthDate: "",
    email: "",
    agreeToTerms: false,
    cellNumber: "",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (!/^[A-Za-z\s]+$/.test(formData.name)) {
      newErrors.name = "Only alphabetic characters allowed";
    }

    if (!formData.surname.trim()) {
      newErrors.surname = "Surname is required";
    } else if (!/^[A-Za-z\s]+$/.test(formData.surname)) {
      newErrors.surname = "Only alphabetic characters allowed";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.cellNumber.trim()) {
      newErrors.cellNumber = "Cell phone number is required";
    } else if (!/^\d+$/.test(formData.cellNumber)) {
      newErrors.cellNumber = "Cell number must be numeric";
    } else if (
      formData.cellNumber.length < 10 ||
      formData.cellNumber.length > 13
    ) {
      newErrors.cellNumber = "Enter a valid cell number (10–13 digits)";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.birthDate) {
      newErrors.birthDate = "Birth date is required";
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must accept the terms and conditions.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });

    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if(validate()){
      setIsProcessing(true);
      setEmailError("");
      try {
        const response = await fetch(`${BASE_URL}/users/customers/exists`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email }),
        });

        const exists = await response.json();
        if (response.status === 200 && exists === false) {
          // Step 2: Send OTP
          try {
            const otpResponse = await fetch(`${EMAIL_URL}/auth/otp/send`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: formData.email }),
            });

            if (otpResponse.status === 200) {
              localStorage.setItem("tempUser", JSON.stringify(formData));
              navigate("/verify");
            } else {
              console.error("OTP sending failed");
            }
          } catch (otpError) {
            console.error(otpError.message);
          }
        } else if (exists === true) {
          setEmailError("An account with this email already exists.");
        } else {
          console.error("Unexpected response from server");
        }
      } catch (error) {
        console.error("Error checking email existence:", error.message);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <UnifiedLayout>
      <h2 className="text-xl font-semibold text-[#00B0F0] mb-2">
        User Registration
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Please complete your details to connect to the Wi-Fi
      </p>

      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="w-full space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-left">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className={`block text-sm font-medium mb-1 ${
                errors.name ? "text-red-500" : "text-gray-700"
              }`}
            >
              NAME<span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. John"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.name
                  ? "border-red-500 ring-red-300"
                  : "border-gray-300 focus:ring-[#00D18C]"
              }`}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Surname */}
          <div>
            <label
              htmlFor="surname"
              className={`block text-sm font-medium mb-1 ${
                errors.surname ? "text-red-500" : "text-gray-700"
              }`}
            >
              SURNAME<span className="text-red-500">*</span>
            </label>
            <input
              id="surname"
              name="surname"
              type="text"
              value={formData.surname}
              onChange={handleChange}
              placeholder="e.g. Doe"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.surname
                  ? "border-red-500 ring-red-300"
                  : "border-gray-300 focus:ring-[#00D18C]"
              }`}
            />
            {errors.surname && (
              <p className="text-xs text-red-500 mt-1">{errors.surname}</p>
            )}
          </div>
        </div>

       

        {/* Email */}
        <div className="text-left">
          <label
            htmlFor="email"
            className={`block text-sm font-medium mb-1 ${
              errors.email ? "text-red-500" : "text-gray-700"
            }`}
          >
            EMAIL ADDRESS<span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g. johndoe@gmail.com"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.email 
                ? "border-red-500 ring-red-300"
                : "border-gray-300 focus:ring-[#00D18C]"
            }`}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email}</p>
          )}
          <p className="text-xs text-red-500 mt-1">{emailError}</p>
        </div>

         {/* Password */}
        <div className="text-left">
          <label
            htmlFor="password"
            className={`block text-sm font-medium mb-1 ${
              errors.password ? "text-red-500" : "text-gray-700"
            }`}
          >
            PASSWORD<span className="text-red-500">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.password
                ? "border-red-500 ring-red-300"
                : "border-gray-300 focus:ring-[#00D18C]"
            }`}
          />
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password}</p>
          )}
        </div>

        {/* Cell Number & Birth Date */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          <div className="text-left">
            <label
              htmlFor="cellNumber"
              className={`block text-sm font-medium mb-1 ${
                errors.cellNumber ? "text-red-500" : "text-gray-700"
              }`}
            >
              CELL NUMBER<span className="text-red-500">*</span>
            </label>
            <input
              id="cellNumber"
              name="cellNumber"
              type="tel"
              value={formData.cellNumber}
              onChange={handleChange}
              placeholder="e.g. 0821234567"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.cellNumber
                  ? "border-red-500 ring-red-300"
                  : "border-gray-300 focus:ring-[#00D18C]"
              }`}
            />
            {errors.cellNumber && (
              <p className="text-xs text-red-500 mt-1">{errors.cellNumber}</p>
            )}
          </div>

          <div className="text-left">
            <label
              htmlFor="birthDate"
              className={`block text-sm font-medium mb-1 ${
                errors.birthDate ? "text-red-500" : "text-gray-700"
              }`}
            >
              BIRTH DATE<span className="text-red-500">*</span>
            </label>
            <input
              id="birthDate"
              name="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 ${
                errors.birthDate
                  ? "border-red-500 ring-red-300"
                  : "border-gray-300 focus:ring-[#00D18C]"
              }`}
            />
            {errors.birthDate && (
              <p className="text-xs text-red-500 mt-1">{errors.birthDate}</p>
            )}
          </div>
        </div>

        {/* ✅ Terms & Marketing Side-by-Side */}
        <div className="flex flex-col md:flex-row md:space-x-4">
          {/* Terms Checkbox */}
          <div className="flex items-start flex-1">
            <input
              id="agreeToTerms"
              name="agreeToTerms"
              type="checkbox"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              className={`mt-1 h-3 w-3 rounded border-gray-300 focus:ring-[#00D18C] ${
                errors.agreeToTerms ? "border-red-500" : ""
              }`}
            />
            <label
              htmlFor="agreeToTerms"
              className={`ml-1 text-xs ${
                errors.agreeToTerms ? "text-red-500" : "text-gray-700"
              }`}
            >
              I accept{" "}
              <Link to="/terms" className="text-[#00B0F0] hover:underline">
                terms and conditions
              </Link>
              .
            </label>
          </div>

          {/* Marketing Checkbox */}
          <div className="flex items-start flex-1 mt-2 md:mt-0">
            <input
              id="marketingConsent"
              name="marketingConsent"
              type="checkbox"
              checked={formData.marketingConsent}
              onChange={handleChange}
              className="mt-1 h-3 w-3 rounded border-gray-300 focus:ring-[#00D18C]"
            />
            <label
              htmlFor="marketingConsent"
              className="ml-2 text-xs text-gray-700"
            >
              I accept marketing communications.
            </label>
          </div>
        </div>

        {/* ✅ Employment Checkbox */}
        <div className="flex items-start">
          <input
            id="currentlyEmployed"
            name="currentlyEmployed"
            type="checkbox"
            checked={formData.currentlyEmployed}
            onChange={handleChange}
            className="mt-1 h-3 w-3 rounded border-gray-300 focus:ring-[#00D18C]"
          />
          <label
            htmlFor="currentlyEmployed"
            className="ml-1 text-xs text-gray-700"
          >
            Are you currently employed?
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isProcessing}
          className={`w-full bg-gradient-to-r from-blue-500 to-green-400 text-white text-lg font-bold py-2 rounded-lg mt-6 transition-all ${
            isProcessing
              ? "opacity-50 cursor-not-allowed"
              : "hover:from-blue-600 hover:to-green-500 hover:shadow-lg transform hover:-translate-y-0.5"
          }`}
        >
          {isProcessing ? "Processing..." : "Sign Up"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Already registered?{" "}
          <Link to="/login" className="text-[#00B0F0] hover:underline">
            Log in now.
          </Link>
        </p>
      </form>
    </UnifiedLayout>
  );
};

export default SignupPage;