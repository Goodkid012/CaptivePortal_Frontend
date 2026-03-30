import React, { useEffect, useState } from "react";
import { Bell, RefreshCw, AlertTriangle } from "lucide-react";
import {BASE_URL} from "../../api/api"

export default function AlertsDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Map severity to colors/badges
  const severityMap = {
    Critical: { color: "bg-red-500", badge: "bg-red-100 text-red-600" },
    High: { color: "bg-yellow-400", badge: "bg-yellow-100 text-yellow-600" },
    Medium: { color: "bg-orange-400", badge: "bg-orange-100 text-orange-600" },
    Low: { color: "bg-blue-400", badge: "bg-blue-100 text-blue-600" },
    Resolved: { color: "bg-green-500", badge: "bg-green-100 text-green-600" },
  };

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch(`${BASE_URL}/system-events`);
        if (!response.ok) throw new Error("Failed to fetch system events");
        const data = await response.json();

        // Map backend data to dashboard format
        const mappedAlerts = data.map(event => ({
          id: event.id,
          type: event.eventTitle,
          location: event.eventDescription,
          time: new Date(event.timeStamp).toLocaleString(),
          status: event.severity,
          color: severityMap[event.severity]?.color || "bg-gray-400",
          badge: severityMap[event.severity]?.badge || "bg-gray-100 text-gray-600",
        }));

        setAlerts(mappedAlerts);
      } catch (err) {
        console.error(err);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  // Compute dashboard stats
  const totalAlerts = alerts.length;
  const criticalAlerts = alerts.filter(a => a.status === "Critical").length;
  const highAlerts = alerts.filter(a => a.status === "High").length;
  const mediumAlerts = alerts.filter(a => a.status === "Medium").length;
  const lowAlerts = alerts.filter(a => a.status === "Low").length;
  const resolved = alerts.filter(a => a.status === "Resolved").length;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-gray-700 font-semibold text-xl">Active Alerts</h2>
            <p className="text-3xl font-bold text-sky-500 mt-2">{totalAlerts}</p>
            <p className="text-green-500 text-sm mt-1">
              {criticalAlerts} critical, {highAlerts} high, {mediumAlerts} medium, {lowAlerts} low
            </p>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl">
            <Bell className="text-sky-400 w-8 h-8" />
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-gray-700 font-semibold text-xl">Resolved Today</h2>
            <p className="text-3xl font-bold text-green-500 mt-2">{resolved}</p>
            <p className="text-green-500 text-sm mt-1">Alerts Resolved</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl">
            <RefreshCw className="text-sky-400 w-8 h-8" />
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-gray-700 font-semibold text-xl">Critical</h2>
            <p className="text-3xl font-bold text-red-500 mt-2">{criticalAlerts}</p>
            <p className="text-red-500 text-sm mt-1">Immediate attention</p>
          </div>
          <div className="bg-red-50 p-3 rounded-xl">
            <AlertTriangle className="text-red-400 w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700">Recent Alerts</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            <p className="p-4 text-gray-500">Loading alerts...</p>
          ) : alerts.length === 0 ? (
            <p className="p-4 text-gray-500">No alerts found.</p>
          ) : (
            alerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                <div className="flex items-center space-x-4">
                  <span className={`w-3 h-3 rounded-full ${alert.color} flex-shrink-0`}></span>
                  <div>
                    <p className="text-gray-800 font-medium">{alert.type}</p>
                    <p className="text-gray-500 text-sm">{alert.location} • {alert.time}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${alert.badge}`}>
                    {alert.status}
                  </span>
                  <button className="px-4 py-1 border border-gray-300 rounded-full hover:bg-gray-100 text-sm font-medium">
                    View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
