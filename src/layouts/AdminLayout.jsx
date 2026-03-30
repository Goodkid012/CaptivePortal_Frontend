import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/AdminComponents/SideBar";
import Header from "../components/AdminComponents/Header";

export default function AdminLayout() {
  const location = useLocation();

  // 🔹 Clean human-readable titles per route
  const routeTitles = {
    "/admin": "Overview",
    "/admin/billing": "Billing Dashboard",
    "/admin/users": "User Management",
    "/admin/plans": "Plans Management",
    "/admin/reports": "Reports",
    "/admin/security": "Security Center",
    "/admin/analytics": "Report Analytics",
    "/admin/notifications": "Alerts & Notifications",
  };

  // 🔹 Default fallback if path isn't in the map
  const title = routeTitles[location.pathname] || "Dashboard";

  const handleSignOut = () => {
    console.log("Signing out...");
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Sidebar stays full height relative to content */}
      <div className="flex-shrink-0 bg-white">
        <Sidebar />
      </div>

      {/* Content wrapper handles scroll */}
      <div className="flex flex-1 flex-col min-h-screen">
        <Header title={title} onSignOut={handleSignOut} />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
