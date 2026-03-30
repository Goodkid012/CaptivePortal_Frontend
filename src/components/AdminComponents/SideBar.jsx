import { NavLink, useLocation } from "react-router-dom";
import { Home, Users, Shield, BarChart2, Bell, FileText } from "lucide-react";
import Logo from "../../assets/Logo.jpeg";

const navItems = [
  { icon: Home, label: "Home", path: "/admin" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: Shield, label: "Security", path: "/admin/security" },
  { icon: BarChart2, label: "Reports", path: "/admin/analytics" },
  { icon: Bell, label: "Notifications", path: "/admin/notifications" },
  { icon: FileText, label: "Billing", path: "/admin/billing" },
];

export default function SideBar() {
  const location = useLocation();

  const isActive = (path) => {
    // Exact match for Home, partial match for others
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-screen w-[80px] bg-[#0E9CD9] flex flex-col items-center py-6 rounded-r-[30px] shadow-lg sticky top-0">
      {/* Logo */}
      <div className="mb-10">
        <img
          src={Logo}
          alt="Ulwembu Logo"
          className="w-12 h-12 rounded-3xl bg-white p-2 shadow-sm"
        />
      </div>

      {/* Navigation */}
      <div className="flex flex-col items-center space-y-8 text-white mt-10">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={`relative group flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-300 
                ${
                  isActive(item.path)
                    ? "bg-white text-[#0E9CD9] shadow-md scale-110"
                    : "text-white hover:text-gray-200 hover:scale-110"
                }`}
            >
              <Icon className="w-6 h-6" />
              <span className="absolute left-14 opacity-0 group-hover:opacity-100 bg-white text-[#0E9CD9] text-sm font-medium rounded-md px-2 py-1 shadow-md transition-all duration-300 whitespace-nowrap">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
