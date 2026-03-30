import { Routes, Route } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

import Payments from "../Pages/user/Payments";
import Ad from "../Pages/user/Ad";
import PaymentSuccess from '../Pages/user/PaymentSucess';
import Redirected from "../Pages/user/Redirected";
import Payy from "../Pages/user/Pay";
import Plan from "../Pages/user/Plan";
import HomePage from "../Pages/user/HomePage";
import LoginPage from "../Pages/user/LoginPage";
import SignupPage from "../Pages/user/SignupPage";
import ResetPage from "../Pages/user/ResetPasswordPage";
import VerifyPage from "../Pages/user/VerifyPage";
import ChoosePlan from "../Pages/user/ChoosePlan";
import SendOtpPage  from "../Pages/user/SendOtpPage";
import VerifyOtpPage from "../Pages/user/VerifyOtpPage";

// Stripe publishable key
const stripePromise = loadStripe("pk_test_51SHOdsRZ5uZgKDhIoqRmpQo89maI4Xfz7wuXweYmovj9rmap1uulAvHpoAFVRn2td1MopQCQW7A2rCHTK9Re6l5v00kfj78S6A");

export default function UserRoutes() {
  return (
    <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/ad" element={<Ad />} />
        <Route path="/PaymentSuccess" element={<PaymentSuccess />} />
        <Route path="/Redirected" element={<Redirected/>} />
        {/* Wrap Payy with Elements provider */}
        <Route 
          path="/payy/:id" 
          element={
            <Elements stripe={stripePromise}>
              <Payy />
            </Elements>
          } 
        />
        <Route path="/plans" element={<Plan />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/reset-password" element={<ResetPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/chooseplan" element={<ChoosePlan/>} />
        <Route path="/send-otp" element={<SendOtpPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
      </Routes>
  );
}
