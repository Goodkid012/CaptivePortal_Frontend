import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { BASE_URL } from "../../api/api";

export function UsageChart() {
  const [dailyUsageData, setDailyUsageData] = useState([]);
  const [weeklyBandwidthData, setWeeklyBandwidthData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, accessPointsRes] = await Promise.all([
          fetch(`${BASE_URL}/users/customers`),
          fetch(`${BASE_URL}/access-points`),
        ]);

        if (!usersRes.ok || !accessPointsRes.ok)
          throw new Error("Failed to fetch analytics data");

        const users = await usersRes.json();
        const accessPoints = await accessPointsRes.json();

        // === 🟢 DAILY USER ACTIVITY ===
        const userSessions = [];
        users.forEach((user) => {
          user.devices?.forEach((device) => {
            device.wifiSessions?.forEach((session) => {
              if (session.startTime) {
                const date = new Date(session.startTime)
                  .toISOString()
                  .split("T")[0];
                const existing = userSessions.find((d) => d.time === date);
                if (existing) existing.users += 1;
                else userSessions.push({ time: date, users: 1 });
              }
            });
          });
        });

        const sortedDaily = userSessions.sort((a, b) =>
          a.time.localeCompare(b.time)
        );

        // === 🟣 WEEKLY BANDWIDTH USAGE ===
        // Aggregate upload/download from all access points
        const weeklyMap = {};
        accessPoints.forEach((ap) => {
          ap.wifiSessions?.forEach((s) => {
            if (s.startTime) {
              const day = new Date(s.startTime).toLocaleDateString("en-US", {
                weekday: "short",
              });
              if (!weeklyMap[day])
                weeklyMap[day] = { day, upload: 0, download: 0, count: 0 };

              weeklyMap[day].upload += s.upload || 0;
              weeklyMap[day].download += s.download || 0;
              weeklyMap[day].count++;
            }
          });
        });

        const weeklyData = Object.values(weeklyMap).map((v) => ({
          day: v.day,
          upload: v.count > 0 ? v.upload / v.count : 0,
          download: v.count > 0 ? v.download / v.count : 0,
        }));

        const orderedDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const sortedWeekly = weeklyData.sort(
          (a, b) => orderedDays.indexOf(a.day) - orderedDays.indexOf(b.day)
        );

        setDailyUsageData(sortedDaily);
        setWeeklyBandwidthData(sortedWeekly);
      } catch (error) {
        console.error("Error fetching usage data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* === Daily User Activity === */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Daily User Activity
          </CardTitle>
          <CardDescription>Connected users throughout the day</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyUsageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{
                  fill: "hsl(var(--primary))",
                  strokeWidth: 2,
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                  stroke: "hsl(var(--primary))",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* === Weekly Bandwidth Usage === */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Weekly Bandwidth Usage
          </CardTitle>
          <CardDescription>Average upload and download traffic (GB)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyBandwidthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="day"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar
                dataKey="download"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="upload"
                fill="hsl(var(--success))"
                radius={[0, 0, 4, 4]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
