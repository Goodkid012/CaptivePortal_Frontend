/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, TrendingUp, Eye } from "lucide-react";
import { BASE_URL } from "../../api/api";

const COLORS = [
  "hsl(var(--revenue-user))",
  "hsl(var(--revenue-ads))",
];

export function RevenueDashboard() {
  const [planRevenueData, setPlanRevenueData] = useState([]);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState([]);
  const [totalUserPayments, setTotalUserPayments] = useState(0);
  const [adRevenue, setAdRevenue] = useState(0);
  const [adStats, setAdStats] = useState({
    clicks: 0,
    impressions: 0,
    watchTime: 0,
  });

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        /* ================= USER PAYMENTS ================= */
        const userRes = await fetch(`${BASE_URL}/users/customers`);
        if (!userRes.ok) throw new Error("Failed to fetch user data");
        const users = await userRes.json();

        const planMap = {};
        const monthlyMap = {};
        let userTotal = 0;

        users.forEach((user) => {
          user.customerSubscriptions?.forEach((cs) => {
            const payment = cs.payment;
            if (payment?.paymentStatus?.trim().toLowerCase() === "success") {
              const amount = payment.amount || 0;
              const date = new Date(payment.createdAt);
              const month = date.toLocaleString("default", { month: "short" });

              userTotal += amount;

              if (!monthlyMap[month]) {
                monthlyMap[month] = {
                  month,
                  userPayments: 0,
                  adRevenue: 0,
                  combined: 0,
                };
              }

              monthlyMap[month].userPayments += amount;

              const plan = cs.subscription?.subscriptionType || "Unknown";
              if (!planMap[plan]) {
                planMap[plan] = { plan, revenue: 0, users: 0 };
              }
              planMap[plan].revenue += amount;
              planMap[plan].users += 1;
            }
          });
        });

        setPlanRevenueData(Object.values(planMap));
        setTotalUserPayments(userTotal);

        /* ================= AD REVENUE ================= */
        const adRes = await fetch(`${BASE_URL}/advertisements`);
        if (!adRes.ok) throw new Error("Failed to fetch advertisement data");
        const ads = await adRes.json();

        let totalAdRevenue = 0;
        let totalClicks = 0;
        let totalImpressions = 0;
        let totalWatchTime = 0;

        ads.forEach((ad) => {
          const cpc = ad.cpc || 0;
          const cpm = ad.cpm || 0;

          ad.impressions?.forEach((imp) => {
            const date = new Date(imp.createdAt);
            const month = date.toLocaleString("default", { month: "short" });

            totalImpressions += 1;
            totalWatchTime += imp.watchTime || 0;

            if (!monthlyMap[month]) {
              monthlyMap[month] = {
                month,
                userPayments: 0,
                adRevenue: 0,
                combined: 0,
              };
            }

            // CPM revenue (per impression)
            const impressionRevenue = cpm / 1000;
            monthlyMap[month].adRevenue += impressionRevenue;
            totalAdRevenue += impressionRevenue;

            if (imp.click) {
              monthlyMap[month].adRevenue += cpc;
              totalAdRevenue += cpc;
              totalClicks += 1;
            }
          });
        });

        // Combine totals
        Object.values(monthlyMap).forEach((m) => {
          m.combined = m.userPayments + m.adRevenue;
        });

        // Sort months chronologically
        const sortedMonthly = Object.values(monthlyMap).sort(
          (a, b) =>
            new Date(`1 ${a.month} 2025`) - new Date(`1 ${b.month} 2025`)
        );

        setMonthlyRevenueData(sortedMonthly);
        setAdRevenue(totalAdRevenue);
        setAdStats({
          clicks: totalClicks,
          impressions: totalImpressions,
          watchTime: totalWatchTime,
        });
      } catch (err) {
        console.error("Revenue fetch error:", err);
      }
    };

    fetchRevenueData();
  }, []);

  const combinedRevenue = totalUserPayments + adRevenue;

  const revenueData = [
    { name: "User Payments", value: totalUserPayments },
    { name: "Ad Revenue", value: adRevenue },
  ];

  return (
    <div className="space-y-6">
      {/* ================= SUMMARY CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm">Total User Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold text-revenue-user">
            R{totalUserPayments.toLocaleString()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm">Ad Revenue</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-revenue-ads">
              R{adRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {adStats.clicks} clicks • {adStats.impressions} impressions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm">Watch Time</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {(adStats.watchTime / 60000).toFixed(1)} mins
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm">Total Combined</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold text-revenue-combined">
            R{combinedRevenue.toLocaleString()}
          </CardContent>
        </Card>
      </div>

      {/* ================= PIE + BAR ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {revenueData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `R${v.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={planRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plan" />
                <YAxis />
                <Tooltip formatter={(v) => `R${v}`} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ================= MONTHLY TREND ================= */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyRevenueData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="month" />
  <YAxis />
  <Tooltip formatter={(v) => `R${v.toFixed(2)}`} />

  <Line
    type="linear"
    dataKey="combined"
    stroke="#2563eb"
    strokeWidth={4}
    dot={{ r: 5 }}
    activeDot={{ r: 7 }}
  />
</LineChart>

          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
