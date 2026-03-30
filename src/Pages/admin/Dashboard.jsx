import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Wifi, Database, Activity } from "lucide-react";
import { BASE_URL } from "../../api/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const handleClick = () => navigate("/admin/manage-ap/1");
  const [users, setUsers] = useState([]);
  const [accessPoints, setAccessPoints] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [events, setEvents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [response, setResponse] = useState("");
const extractApName = (description) => {
  const match = description?.match(/Access Point\s+([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
};
const buildApEventStatusMap = (events) => {
  const map = {};

  events
    .filter(e =>
      e.eventTitle === "Access Point Down" ||
      e.eventTitle === "Access Point Restored"
    )
    .forEach(e => {
      const apName = extractApName(e.eventDescription);
      if (!apName) return;

      const time = new Date(e.timeStamp).getTime();

      if (!map[apName] || time > map[apName].time) {
        map[apName] = {
          status:
            e.eventTitle === "Access Point Restored"
              ? "online"
              : "offline",
          time
        };
      }
    });

  return map;
};


  const total = accessPoints.length;
  const online = accessPoints.filter((ap) => ap.isActive).length;
  const offline = total - online;
  const uptimePercent = useMemo(() => {
  if (!accessPoints.length) return 0;

  const apEventMap = buildApEventStatusMap(events);

  const onlineCount = accessPoints.filter(ap => {
    const eventStatus = apEventMap[ap.name];

    // No event? Trust isActive
    if (!eventStatus) return ap.isActive;

    // Event exists → event overrides
    return eventStatus.status === "online";
  }).length;

  return Math.round((onlineCount / accessPoints.length) * 100);
}, [accessPoints, events]);

  useEffect(() => {
    const fetchData = async (endpoint, setter) => {
      try {
        const res = await fetch(`${BASE_URL}/${endpoint}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setter(data);
      } catch (error) {
        console.error("fetch error:", error);
      }
    };

    fetchData("users/customers", setUsers);
    fetchData("access-points", setAccessPoints);
    fetchData("policies", setPolicies);
    fetchData("system-events", setEvents);
    fetchData("schedule-reports", setSchedules);
  }, []);

  const handleAsk = () => {
    const input = userInput.toLowerCase();
    let reply = "";

    if (input.includes("failed") || input.includes("login")) {
      const failed = events.filter((e) =>
        e.eventType.toLowerCase().includes("failed")
      );
      reply = `I found ${failed.length} failed login-related events. The latest is "${failed[0]?.eventTitle}" at ${new Date(
        failed[0]?.timeStamp
      ).toLocaleString()}.`;
    } else if (input.includes("unauthorized") || input.includes("threat")) {
      const blocked = events.filter((e) =>
        e.eventType.toLowerCase().includes("blocked")
      );
      reply = `There are ${blocked.length} blocked threats. The latest was "${blocked[0]?.eventDescription}".`;
    } else if (input.includes("firewall")) {
      const firewall = events.find((e) =>
        e.eventTitle.toLowerCase().includes("firewall")
      );
      reply = firewall
        ? `Firewall event detected: "${firewall.eventDescription}" — severity ${firewall.severity}.`
        : "No firewall events were recorded recently.";
    } else if (input.includes("policy")) {
      reply = `There are ${policies.length} policies in effect. Active ones include: ${policies
        .filter((p) => p.isActive)
        .map((p) => p.policyName)
        .join(", ")}.`;
    } else if (input.includes("access point")) {
      reply = `Currently ${accessPoints.length} access points are registered.`;
    } else if (input.includes("user") || input.includes("customer")) {
      reply = `We have ${users.length} users in the system.`;
    } else if (input.includes("report") || input.includes("schedule")) {
      reply = `There are ${schedules.length} scheduled reports, the latest being "${
        schedules[0]?.reportType || "N/A"
      }".`;
    }  else if (input.includes("event")) {
      const criticalCount = events.filter(e => e.severity?.toLowerCase() === "critical").length;
      reply = `${events.length} system events recorded. ${criticalCount} are marked as critical.`;
    } else {
      reply =
        "I'm not sure what you mean 🤔 — try asking about policies, access points, failed logins, firewall, or reports.";
    }

    setResponse(reply);
  };

  // Generate Google Maps URL with access point markers
  const getMapUrlWithMarkers = () => {
    // Filter access points with coordinates
    const apWithCoords = accessPoints.filter(ap => 
      ap.latitude && ap.longitude && 
      !isNaN(parseFloat(ap.latitude)) && !isNaN(parseFloat(ap.longitude))
    );
    
    // Default center (Johannesburg)
    const defaultCenter = "-26.2041,28.0473";
    
    if (apWithCoords.length === 0) {
      // Return default map if no coordinates
      return `https://maps.googleapis.com/maps/api/staticmap?center=${defaultCenter}&zoom=12&size=600x400&scale=2&markers=color:blue%7C${defaultCenter}&key=${''}`;
    }
    
    // Calculate center based on all coordinates
    const sumLat = apWithCoords.reduce((sum, ap) => sum + parseFloat(ap.latitude), 0);
    const sumLng = apWithCoords.reduce((sum, ap) => sum + parseFloat(ap.longitude), 0);
    const centerLat = sumLat / apWithCoords.length;
    const centerLng = sumLng / apWithCoords.length;
    
    // Build markers string
    let markersString = "";
    apWithCoords.forEach((ap, index) => {
      const color = ap.isActive ? "green" : "red";
      const label = (index + 1).toString(); // 1, 2, 3
      markersString += `&markers=color:${color}%7Clabel:${label}%7C${ap.latitude},${ap.longitude}`;
    });
    
    // Determine zoom level based on number of points
    const zoom = apWithCoords.length > 1 ? 11 : 15;
    
    return `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=${zoom}&size=600x400&scale=2${markersString}&key=${''}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <main className="flex-1 p-6">
        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <Wifi className="w-5 h-5 text-sky-500" />
              <div className="text-right">
                <h2 className="text-gray-500 text-sm">Connected Users</h2>
                <p className="text-2xl font-semibold text-gray-800">
                  {users.length}
                </p>
                <p className="text-xs text-green-500 mt-1">Overall</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <MapPin className="w-5 h-5 text-sky-500" />
              <div className="text-right">
                <h2 className="text-gray-500 text-sm">Online Access Points</h2>
                <p className="text-2xl font-semibold text-gray-800">{online}</p>
                <p className="text-xs text-green-500 mt-1">{offline} offline</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <Database className="w-5 h-5 text-sky-500" />
              <div className="text-right">
                <h2 className="text-gray-500 text-sm">Bandwidth Used</h2>
                <p className="text-2xl font-semibold text-gray-800">0</p>
                <p className="text-xs text-green-500 mt-1">change</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <Activity className="w-5 h-5 text-sky-500" />
              <div className="text-right">
                <h2 className="text-gray-500 text-sm">Network Uptime</h2>
                <p className="text-2xl font-semibold text-gray-800">
                  {uptimePercent}%
                </p>
                <p className="text-xs text-green-500 mt-1">AP</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hotspots + Interactive Network Analyzer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
         <div onClick={handleClick} className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
            <h2 className="text-gray-700 font-medium mb-2 ml-2">Hotspots</h2>
            <div className="rounded-xl overflow-hidden h-64 bg-gray-100 relative">
              {/* Static map with markers */}
              <img
                src={getMapUrlWithMarkers()}
                alt="Access Points Map"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to iframe if static map fails
                  e.target.style.display = 'none';
                  const iframe = document.createElement('iframe');
                  iframe.className = 'w-full h-full';
                  iframe.title = 'Map';
                  iframe.src = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3586.3928090988485!2d28.0473!3d-26.2041!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjbCsDEyJzE0LjgiUyAyOMKwMDInNTYuMyJF!5e0!3m2!1sen!2sza!4v1669223076203';
                  iframe.loading = 'lazy';
                  e.target.parentNode.appendChild(iframe);
                }}
              />
              
              {/* Map overlay with legend */}
              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 shadow-sm">
                  <div className="flex items-center space-x-3 text-xs">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                      <span>Online</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                      <span>Offline</span>
                    </div>
                  </div>
                </div>
                
                {/* Access point counter */}
                <div className="bg-black/70 text-white rounded-lg px-3 py-1 text-xs">
                  {accessPoints.filter(ap => ap.latitude && ap.longitude).length} APs shown
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Network Analyzer */}
          <div className="bg-sky-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
            <div>
              <h2 className="font-semibold text-gray-800 text-lg mb-2">
                Network Analyzer
              </h2>
              <p className="text-sm text-gray-700 mb-4">
                Hi there! 👋 I'm monitoring your network — ask me about policies,
                access points, users, or security events.
              </p>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                placeholder="Ask about failed logins, policies, firewall..."
                className="p-2 rounded-lg border border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-500 w-full"
              />
              <button
                onClick={handleAsk}
                className="bg-sky-600 text-white font-medium rounded-xl mt-4 py-2 hover:bg-sky-700 w-full"
              >
                Ask The Network Analyzer
              </button>

              {response && (
                <div className="mt-4 bg-white rounded-xl p-3 text-gray-800 shadow-sm border border-sky-200">
                  <p>{response}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-gray-800 font-semibold text-lg">User Summary</h2>
            <input
              type="text"
              placeholder="Filter by email"
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-gray-500 bg-gray-50 uppercase">
                <tr>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Full Name</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Plan</th>
                  <th className="px-4 py-2">Device</th>
                  <th className="px-4 py-2">Data Used (MB)</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const devices = u.devices || [];
                  const lastDevice = devices[devices.length - 1];
                  const wifiSessions = lastDevice?.wifiSessions || [];
                  const lastSession = wifiSessions[wifiSessions.length - 1];
                  const totalDataUsed = wifiSessions.reduce(
                    (sum, s) => sum + (s?.dataUsedMb || 0),
                    0
                  );

                  return (
                    <tr
                      key={u.id}
                      className="border-b last:border-none hover:bg-gray-50"
                    >
                      <td className="px-4 py-2">{u.userId}</td>
                      <td className="px-4 py-2">
                        {u.firstName} {u.lastName}
                      </td>
                      <td
                        className={`px-4 py-2 font-medium ${
                          lastSession?.status === "Online"
                            ? "text-green-500"
                            : lastSession?.status === "Blocked"
                            ? "text-red-500"
                            : "text-gray-400"
                        }`}
                      >
                        {lastSession?.status || "N/A"}
                      </td>
                      <td className="px-4 py-2">
                        {u.customerSubscriptions?.[0]?.subscription
                          .description || "free"}
                      </td>
                      <td className="px-4 py-2">
                        {lastDevice?.deviceType || "N/A"}
                      </td>
                      <td className="px-4 py-2">
                        {totalDataUsed.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}