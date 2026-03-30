import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {BASE_URL} from "../../api/api"

const ManageUser = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState();

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/users/customers/${id}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setUser(data);
        setIsBlocked(data.isBlocked)
      } catch (error) {
        console.error("Fetch error:", error);
      }finally{
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);
 const handleToggleBlock = async () => {
    if (!user) return;
    setActionLoading(true);

    
  const nextState = !isBlocked; 
  const action = nextState ? "block" : "unblock";

    try {
      const res = await fetch(
        `${BASE_URL}/users/customers/${id}/${nextState}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) throw new Error(`Failed to ${action} user`);
      const updatedUser = await res.json();
      setUser(updatedUser);
      setIsBlocked(action === "block");
    } catch (error) {
      console.error(`${action} error:`, error);
    } finally {
      setActionLoading(false);
    }
  };

 if (loading || !user)
    return <p className="p-6 text-gray-500">Loading user data...</p>;

  // Extract info safely
  const device = user.devices?.[0];
  const session = device?.wifiSessions?.[0];
  const subscription = user.customerSubscriptions?.[0]?.subscription;

  // Status & plan
  const status = session?.status || "Offline";
  const plan = subscription?.title || "No Plan";

  // Example chart (you can adjust to use real data usage later)
  const data = [
    { name: "Download", value: 70 },
    { name: "Upload", value: 30 },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="flex-1 p-6">
        {/* Header Card */}
        <div className="bg-white shadow-sm rounded-lg p-5 mb-6 flex flex-wrap items-center justify-between border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="bg-[#E6F7FF] text-[#00B0F0] w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg">
              {user.firstName?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">
                {user.firstName} {user.lastName || ""}
              </h2>
              <p className="text-sm text-gray-500">
                Device: {device?.deviceType || "Unknown"}
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p>
              <span className="font-medium">Device OS:</span>{" "}
              {device?.os || "N/A"}
            </p>
            <p>
              <span className="font-medium">IP Address:</span>{" "}
              <span className="text-[#00B0F0]">{device?.ipAddress || "N/A"}</span>
            </p>
          </div>

          <div className="text-sm text-gray-600">
            <p>
              <span className="font-medium">Status:</span>{" "}
              <span
                className={
                  status === "online"
                    ? "text-green-600 font-semibold"
                    : "text-gray-500"
                }
              >
                {status}
              </span>
            </p>
            <p>
              <span className="font-medium">Plan:</span> {plan}
            </p>
          </div>

            <button
            onClick={handleToggleBlock}
            disabled={actionLoading}
            className={`px-4 py-1 rounded-md font-medium transition-colors ${
              isBlocked
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-red-100 text-red-600 hover:bg-red-200"
            }`}
          >
            {actionLoading
              ? isBlocked
                ? "Unblocking..."
                : "Blocking..."
              : isBlocked
              ? "Unblock"
              : "Block"}
          </button>
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Left - Personal and Contact Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-3">
              Personal Information
            </h3>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Date Of Birth:</span>
              <span className="font-medium">
                { new Date(user.dateOfBirth).toLocaleDateString()|| "N/A"}
              </span>
            </div>

            <h3 className="font-semibold text-gray-700 mb-3 mt-4">
              Contact Information
            </h3>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Phone No.:</span>
              <span className="font-medium">{user.phoneNumber || "N/A"}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Email:</span>
              <span className="font-medium text-[#00B0F0]">
                {user.userEmail}
              </span>
            </div>
          </div>

          {/* Right - Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center">
            <h3 className="font-semibold text-gray-700 mb-2">Upload vs Download</h3>
            <p className="text-xs text-gray-400 mb-4">
              Example: 70% download, 30% upload
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                >
                  <Cell fill="#00B0F0" />
                  <Cell fill="#E5E7EB" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Active Wi-Fi Sessions</h3>
          {device?.wifiSessions?.length > 0 ? (
            <table className="w-full text-sm text-left border-t border-gray-100">
              <thead>
                <tr className="text-gray-500">
                  <th className="py-2">Session ID</th>
                  <th className="py-2">Signal Strength</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Start Time</th>
                  <th className="py-2">Data Used (MB)</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {device.wifiSessions.map((s) => (
                  <tr key={s.id} className="border-t border-gray-100">
                    <td className="py-2">{s.id}</td>
                    <td>{s.signalStrength}</td>
                    <td
                      className={
                        s.status === "online"
                          ? "text-green-600 font-semibold"
                          : "text-gray-500"
                      }
                    >
                      {s.status}
                    </td>
                    <td>{new Date(s.startTime).toLocaleString()}</td>
                    <td>{s.dataUsedMb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-500">No active sessions found.</p>
          )}
        </div>

        {/* Subscription Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mt-6">
          <h3 className="font-semibold text-gray-700 mb-3">Subscription Details</h3>
          {subscription ? (
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Title:</span> {subscription.title}</p>
              <p><span className="font-medium">Description:</span> {subscription.description}</p>
              <p><span className="font-medium">Price:</span> R{subscription.price}</p>
              <p><span className="font-medium">Speed Limit:</span> {subscription.speedLimit} Mbps</p>
              <p><span className="font-medium">Duration:</span> {subscription.durationDays} days</p>
              <p><span className="font-medium">Active:</span> {user.customerSubscriptions?.[0]?.isActive ? "Yes" : "No"}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No subscription data found.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManageUser;
