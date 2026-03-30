import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { BASE_URL } from "../../api/api";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${BASE_URL}/users/customers`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setUsers(data);
      } catch (error) {
        console.error("fetch error:", error);
      }
    };
    fetchUsers();
  }, []);

  // Filtered users
  const filteredUsers = users.filter((u) =>
    u.firstName?.toLowerCase().includes(filter.toLowerCase())
  );

  // --- Calculated Stats ---
  const totalUsers = users.length;

  const onlineUsers = users.filter((u) =>
    u.devices?.some((d) =>
      d.wifiSessions?.some((s) => s.status?.toLowerCase() === "online")
    )
  ).length;

  const blockedUsers = users.filter((u) =>
    u.devices?.some((d) =>
      d.wifiSessions?.some((s) => s.status?.toLowerCase() === "blocked")
    )
  ).length;

  const newRegistrations = users.filter((u) => {
    const createdAt = u.customerSubscriptions?.[0]?.createdAt;
    if (!createdAt) return false;
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffDays = (now - createdDate) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  }).length;

  // --- Helper: sum data used across all devices/sessions ---
  const getTotalDataUsed = (user) => {
    return (
      user.devices?.reduce((total, device) => {
        const deviceData =
          device.wifiSessions?.reduce(
            (sum, session) => sum + (session?.dataUsedMb || 0),
            0
          ) || 0;
        return total + deviceData;
      }, 0) || 0
    );
  };

  return (
    <div className="min-h-screen flex">
      <main className="flex-1 p-10 mt-0">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card title="Total Users" value={totalUsers} text="Overrall" icon />
          <Card title="Online Users" value={onlineUsers} text="Currently online" icon />
          <Card title="New Registrations" value={newRegistrations} text="This week" icon />
          <Card title="Blocked Users" value={blockedUsers} text="Security violations" icon />
        </div>

        {/* User Table */}
        <section className="mt-10 bg-white rounded-lg p-6 border border-gray-100 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">User Directory</h2>
            <input
              type="text"
              placeholder="Filter by name"
              className="px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:ring-teal-200"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm divide-y divide-gray-200">
              <thead className="text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 w-12">ID</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Device</th>
                  <th className="px-4 py-3 text-right">Data Used (MB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => {
                  const devices = u.devices || [];
                  const lastDevice = devices[devices.length - 1];
                  const wifiSessions = lastDevice?.wifiSessions || [];
                  const lastSession = wifiSessions[wifiSessions.length - 1];
                  const totalDataUsed = getTotalDataUsed(u);

                  return (
                    <tr key={u.userId} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-4 py-3 text-gray-600">{u.userId}</td>
                      <td className="px-4 py-3 font-medium text-gray-700">
                        <Link
                          to={`/admin/manage-user/${u.userId}`}
                          className="hover:underline"
                        >
                          {u.firstName} {u.lastName || ""}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            lastSession?.status?.toLowerCase() === "online"
                              ? "bg-green-50 text-green-600"
                              : lastSession?.status?.toLowerCase() === "blocked"
                              ? "bg-red-50 text-red-600"
                              : "bg-gray-50 text-gray-600"
                          }`}
                        >
                          {lastSession?.status || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.customerSubscriptions?.[0]?.subscription?.description || "free"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {lastDevice?.deviceType || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {totalDataUsed.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-gray-500 text-xs">
            Showing {filteredUsers.length} entries
          </div>
        </section>
      </main>
    </div>
  );
};

/* -------------------- Card Component -------------------- */
const Card = ({ title, value, text, icon }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <span className="text-sm text-gray-500">{title}</span>
        <span className="text-xl font-semibold text-blue-500 mt-1">{value}</span>
        <span className="text-xs text-lime-600 mt-1">{text}</span>
      </div>
      {icon && (
        <div className="flex-shrink-0 ml-4 p-2 bg-teal-50 rounded-full flex items-center justify-center">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
      )}
    </div>
  </div>
);

export default UserManagement;
