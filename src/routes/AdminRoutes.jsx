import { Routes, Route } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";

import Dashboard from "../Pages/admin/Dashboard";
import UserManagement from "../Pages/admin/UserManagement";
import Security from "../Pages/admin/Security";
import Analytics from "../Pages/admin/Reports";
import AlertsDashboard from "../pages/admin/Notifications";
import BillingDashboard from "../pages/admin/BillingDashboard";
import AccessPoints from "../Pages/admin/AccessPoints";
import ManageUser from "../Pages/admin/ManageUser";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Dashboard />} />
        {/* <Route path="/users" element={<UserManagement />} /> */}
        <Route path="/security" element={<Security />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/notifications" element={<AlertsDashboard />} />
        <Route path="/billing" element={<BillingDashboard />} />
        <Route path="/manage-ap/:1" element={<AccessPoints/>} />
        <Route path="/manage-user/:id" element={<ManageUser/>} />  
      </Route>
    </Routes>
  );
}
