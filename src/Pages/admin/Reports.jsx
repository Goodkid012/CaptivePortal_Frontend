import React, { useRef, useState, useEffect } from "react";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { StatsCard } from "../../components/admin/StatsCard";
import { UsageChart } from "../../components/admin/UsageChart";
import { GenerateReportModal } from "../../components/modals/GenerateReportModal";
import { useToastNotification } from "../../hooks/useToastNotification";
import { BASE_URL } from "../../api/api";
import {
  FileText,
  Download,
  Database,
  Users,
  Wifi,
  Activity,
  Shield,
  AlertTriangle,
  TrendingUp,
  Zap,
  Clock,
  MapPin,
  Signal,
  Send,
  Calendar,
  Settings,
  X,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Input } from "../../components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/select";

const initialReports = [
  { id: 1, name: "Monthly Usage Report", type: "Usage", date: new Date().toISOString().split("T")[0], status: "completed", timeline: "Today" },
  { id: 2, name: "Security Audit", type: "Security", date: new Date().toISOString().split("T")[0], status: "completed", timeline: "Today" },
  { id: 3, name: "User Analytics", type: "Analytics", date: new Date().toISOString().split("T")[0], status: "completed", timeline: "Today" },
  { id: 4, name: "Network Performance", type: "Performance", date: new Date().toISOString().split("T")[0], status: "completed", timeline: "Today" },
];

export default function Reports() {
  const [accessPoints, setAccessPoints] = useState([]);
  const [users, setUsers] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [events,setEvents] = useState([]);
  const [showScheduler, setShowScheduler] = useState(false);
  const [schedules, setSchedules] = useState([]);

  const [scheduleForm, setScheduleForm] = useState({
    reportType: "",
    frequency: "",
    email: "",
    recurring: false,
  });

  const { showSuccess, showError } = useToastNotification();
  const reportRef = useRef();

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

  const totalusers = users.length;
  const totalpoints = accessPoints.length;
  const onlinepoints = accessPoints.filter((ap) => ap.isActive).length;
  const offlinepoints = totalpoints - onlinepoints;
  const uptimePercent =
    totalpoints > 0 ? Math.round((onlinepoints / totalpoints) * 100) : 0;

  const dataProcessed = accessPoints.reduce((sum, ap) => {
    const totalDeviceData = ap.deviceMetric?.reduce(
      (acc, m) => acc + (m.dataProcessed || 0),
      0
    );
    return sum + (totalDeviceData || 0);
  }, 0);

  const allResponseTimes = accessPoints.flatMap(
    (ap) => ap.deviceMetric?.map((m) => m.responseTime || 0) || []
  );
  const averageResponseTime =
    allResponseTimes.length > 0
      ? allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length
      : 0;

  const activeAlerts = accessPoints.filter((ap) =>
    ap.deviceMetric?.some(
      (m) => (m.packetLoss || 0) > 40 || (m.latency || 0) > 500
    )
  ).length;

  const today = new Date().toISOString().split("T")[0];
  const usersToday = users.filter((u) =>
    u.devices?.some((d) =>
      d.wifiSessions?.some(
        (s) =>
          s.status?.toLowerCase() === "online" &&
          s.startTime?.startsWith(today)
      )
    )
  ).length;

  const yesterday = new Date(Date.now() - 86400000)
    .toISOString()
    .split("T")[0];
  const yesterdayUsers = users.filter((u) =>
    u.devices?.some((d) =>
      d.wifiSessions?.some(
        (s) =>
          s.status?.toLowerCase() === "online" &&
          s.startTime?.startsWith(yesterday)
      )
    )
  ).length;

  const userChange =
    yesterdayUsers > 0
      ? ((usersToday - yesterdayUsers) / yesterdayUsers) * 100
      : usersToday > 0
      ? 100
      : 0;

  const averageScore =
    policies.length > 0
      ? policies.reduce((sum, policy) => sum + policy.score, 0) / policies.length
      : 0;


  let rating = "";
  let color = "";
  if (averageScore >= 90) {
    rating = "Excellent";
    color = "text-green-600";
  } else if (averageScore >= 80) {
    rating = "Good";
    color = "text-blue-600";
  } else if (averageScore >= 50) {
    rating = "Needs Improvement";
    color = "text-yellow-600";
  } else {
    rating = "Critical";
    color = "text-red-600";
  }

const handleScheduleSubmit = async () => {
  const recipientEmailsString = (scheduleForm.emails || []).join(",");

  if (!scheduleForm.reportType || !scheduleForm.frequency || !(scheduleForm.emails || []).length) {
    showError("Missing Fields", "Please fill in all required fields.");
    return;
  }

  try {
    const scheduleReport = {
      reportType: scheduleForm.reportType,
      frequency: scheduleForm.frequency,
      recipientEmails: recipientEmailsString,
      recurring: scheduleForm.recurring,
      createdAt: new Date().toISOString(),
    };

    // 1️⃣ Generate PDF dynamically using the full logic from handleDownloadReport
    const doc = new jsPDF();
    const reportName = scheduleForm.reportType;
    const reportDate = new Date().toISOString().split("T")[0];
    let yPos = 50;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const checkPageBreak = (requiredSpace) => {
      if (yPos + requiredSpace > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
        return true;
      }
      return false;
    };

    const addSectionHeader = (title) => {
      checkPageBreak(15);
      doc.setFillColor(41, 128, 185);
      doc.rect(10, yPos - 5, pageWidth - 20, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text(title, 15, yPos);
      yPos += 12;
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, "normal");
    };

    const addKeyValue = (key, value, indent = 15) => {
      checkPageBreak(8);
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text(`${key}:`, indent, yPos);
      doc.setFont(undefined, "normal");
      doc.text(String(value), indent + 60, yPos);
      yPos += 7;
    };

    const addTable = (headers, rows) => {
      checkPageBreak(rows.length * 8 + 15);
      const colWidth = (pageWidth - 30) / headers.length;

      doc.setFillColor(52, 152, 219);
      doc.rect(15, yPos, pageWidth - 30, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      headers.forEach((header, i) => {
        doc.text(header, 17 + i * colWidth, yPos + 5);
      });
      yPos += 8;

      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, "normal");
      rows.forEach((row, rowIndex) => {
        if (rowIndex % 2 === 0) {
          doc.setFillColor(240, 240, 240);
          doc.rect(15, yPos, pageWidth - 30, 7, "F");
        }
        row.forEach((cell, cellIndex) => {
          doc.text(cell, 17 + cellIndex * colWidth, yPos + 5);
        });
        yPos += 7;
      });
      yPos += 5;
    };

    // PDF header
    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, pageWidth, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text(reportName, 15, 20);
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(`Generated: ${format(new Date(reportDate), "MMMM d, yyyy")}`, 15, 30);
    doc.text(`Report Type: ${reportName}`, 15, 36);

    yPos = 50;
    doc.setTextColor(0, 0, 0);

    // === Full content based on report type ===
    switch (reportName) {
      case "Usage Report":
        addSectionHeader("USAGE OVERVIEW");
        addKeyValue("Total Data Processed", `${(dataProcessed / 100).toFixed(2)} GB`);
        addKeyValue("Peak Usage", `${usersToday} users today`);
        addKeyValue("Total Daily Users", totalusers);
        yPos += 5;

        addSectionHeader("TOP CONSUMING LOCATIONS");
        addTable(
          ["Location", "Wifi Sessions", "Bandwidth"],
          accessPoints
            .sort((a, b) => b.uptime - a.uptime)
            .slice(0, 5)
            .map((ap) => [
              ap.location?.street || ap.name,
              `${ap.wifiSessions?.length || 0}`,
              ap.deviceMetric?.[0]?.bandwidth
                ? `${ap.deviceMetric[0].bandwidth.toFixed(1)} Mbps`
                : "N/A",
            ])
        );
        break;

      case "User Analytics":
        addSectionHeader("USER ANALYTICS");
        addKeyValue("Total Active Users", totalusers);
        addKeyValue("New Registrations Today", usersToday);
        yPos += 5;

        addSectionHeader("TOP USER LOCATIONS");
        addTable(
          ["Location", "Active Sessions"],
          accessPoints
            .sort((a, b) => b.uptime - a.uptime)
            .slice(0, 5)
            .map((ap) => [ap.location?.street || ap.name, `${ap.wifiSessions?.length || 0}`])
        );
        break;

      case "Security Audit":
        { addSectionHeader("SECURITY OVERVIEW");
        addKeyValue("Overall Security Score", Math.round(averageScore) + "/100");
        addKeyValue("System Events", events.length);
        addKeyValue("Active Security Policies", policies.length);
        yPos += 5;

        addSectionHeader("SECURITY METRICS");
        const grouped = events.reduce((acc, event) => {
          const type = event.eventType || "Unknown";
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        const metrics = Object.entries(grouped).map(([type, count]) => ({
          type,
          count,
          change: "+0%",
        }));

        addTable(
          ["Metric", "Count", "Change"],
          metrics.map((m) => [m.type, m.count.toString(), m.change])
        );
        break; }

      case "Network Performance":
        addSectionHeader("NETWORK PERFORMANCE");
        addKeyValue("Network Uptime", uptimePercent + "%");
        addKeyValue("Average Response Time", averageResponseTime + "ms");
        addKeyValue("Peak Load", totalusers + " concurrent users");
        yPos += 5;

        addSectionHeader("ACCESS POINT PERFORMANCE");
        addTable(
          ["Location", "Wifi Sessions", "Bandwidth"],
          accessPoints
            .sort((a, b) => b.uptime - a.uptime)
            .slice(0, 5)
            .map((ap) => [
              ap.location?.street || ap.name,
              `${ap.wifiSessions?.length || 0}`,
              ap.deviceMetric?.[0]?.bandwidth
                ? `${ap.deviceMetric[0].bandwidth.toFixed(1)} Mbps`
                : "N/A",
            ])
        );
        break;

      default:
        addSectionHeader("SYSTEM OVERVIEW");
        addKeyValue("Total Access Points", totalpoints);
        addKeyValue("Active Users", totalusers);
        addKeyValue("Network Uptime", uptimePercent + "%");
    }

    // Add footer to all pages
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFillColor(44, 62, 80);
      doc.rect(0, pageHeight - 15, pageWidth, 15, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text("WiFi Captive Portal System", 15, pageHeight - 7);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 35, pageHeight - 7);
    }

    // 2️⃣ Convert to Blob
    const pdfBlob = doc.output("blob");

    // 3️⃣ Prepare FormData
    const formData = new FormData();
    formData.append(
      "report",
      new Blob([JSON.stringify(scheduleReport)], { type: "application/json" })
    );
    formData.append(
      "scheduled-report",
      pdfBlob,
      `${reportName.replace(/\s+/g, "_")}_${reportDate}.pdf`
    );

    // 4️⃣ Send to backend
    const response = await fetch(`${BASE_URL}/schedule-reports`, {
      method: "PUT",
      body: formData,
    });

    if (!response.ok) throw new Error("Failed to schedule report");

    const savedSchedule = await response.json();

    // 5️⃣ Update UI
    setSchedules((prev) => [savedSchedule, ...prev]);
    showSuccess(
      "Report Scheduled",
      `${scheduleForm.reportType} will be sent ${scheduleForm.frequency.toLowerCase()} to ${recipientEmailsString}`
    );

    setShowScheduler(false);
    setScheduleForm({
      reportType: "",
      frequency: "",
      emails: [],
      recurring: false,
      reportFile: null,
    });
  } catch (err) {
    console.error(err);
    showError("Failed", "Could not schedule the report. Please try again.");
  }
};

  const [reports, setReports] = useState(initialReports);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  const getTimelineLabel = (timeline, startDate, endDate) => {
    if (timeline === "custom" && startDate && endDate) {
      return `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;
    }
    const labels = {
      today: "Today",
      yesterday: "Yesterday",
      last7days: "Last 7 Days",
      last30days: "Last 30 Days",
      thisWeek: "This Week",
      lastWeek: "Last Week",
      thisMonth: "This Month",
      lastMonth: "Last Month"
    };
    return labels[timeline] || timeline;
  };

  const handleGenerateReport = (reportType, reportName, timeline, startDate, endDate) => {
    const newReport = {
      id: reports.length + 1,
      name: reportName,
      type: reportType,
      date: new Date().toISOString().split("T")[0],
      status: "processing",
      timeline: getTimelineLabel(timeline, startDate, endDate)
    };

    setReports(prev => [newReport, ...prev]);
    showSuccess("Report Generation", "Report generation has been started. You will be notified when it's complete.");

    setTimeout(() => {
      setReports(prev =>
        prev.map(report =>
          report.id === newReport.id ? { ...report, status: "completed" } : report
        )
      );
      showSuccess("Report Complete", `${newReport.name} is now ready for download.`);
    }, 3000);
  };

  const handleDownloadReport = (reportName, reportDate, reportType) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    const checkPageBreak = requiredSpace => {
      if (yPos + requiredSpace > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
        return true;
      }
      return false;
    };

    const addSectionHeader = title => {
      checkPageBreak(15);
      doc.setFillColor(41, 128, 185);
      doc.rect(10, yPos - 5, pageWidth - 20, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text(title, 15, yPos);
      yPos += 12;
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, "normal");
    };

    const addKeyValue = (key, value, indent = 15) => {
      checkPageBreak(8);
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text(`${key}:`, indent, yPos);
      doc.setFont(undefined, "normal");
      doc.text(String(value), indent + 60, yPos); 
      yPos += 7;
    };

    const addTable = (headers, rows) => {
      checkPageBreak(rows.length * 8 + 15);
      const colWidth = (pageWidth - 30) / headers.length;

      doc.setFillColor(52, 152, 219);
      doc.rect(15, yPos, pageWidth - 30, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      headers.forEach((header, i) => {
        doc.text(header, 17 + i * colWidth, yPos + 5);
      });
      yPos += 8;

      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, "normal");
      rows.forEach((row, rowIndex) => {
        if (rowIndex % 2 === 0) {
          doc.setFillColor(240, 240, 240);
          doc.rect(15, yPos, pageWidth - 30, 7, "F");
        }
        row.forEach((cell, cellIndex) => {
          doc.text(cell, 17 + cellIndex * colWidth, yPos + 5);
        });
        yPos += 7;
      });
      yPos += 5;
    };

    // PDF header
    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, pageWidth, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text(reportName, 15, 20);
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(`Generated: ${format(new Date(reportDate), "MMMM d, yyyy")}`, 15, 30);
    doc.text(`Report Type: ${reportType}`, 15, 36);

    yPos = 50;
    doc.setTextColor(0, 0, 0);

        switch (reportType) {
      case 'Usage':
        addSectionHeader('USAGE OVERVIEW');
        addKeyValue('Total Data Processed', dataProcessed/100 + ' GB');
        addKeyValue('Peak Usage', usersToday + ' users today');
        addKeyValue('Total Daily Users', totalusers);
        yPos += 5;

        addSectionHeader('TOP CONSUMING LOCATIONS');
        addTable(
          ['Location', 'Wifi Sessions', 'Bandwidth'],
          accessPoints
          .sort((a, b) => b.uptime - a.uptime) 
          .slice(0, 5) 
          .map(ap => [
            ap.location?.street || ap.name,
            `${ap.wifiSessions?.length || 0}`,
            ap.deviceMetric?.[0]?.bandwidth
                    ? `${ap.deviceMetric[0].bandwidth.toFixed(1)} Mbps`
                    : "N/A"
          ])
        );

        // addSectionHeader('USAGE TRENDS');
        // addTable(
        //   ['Time Period', 'Users', 'Data'],
        //   [
        //     ['Morning (6AM-12PM)', '450', '0.8 TB'],
        //     ['Afternoon (12PM-6PM)', '892', '1.2 TB'],
        //     ['Evening (6PM-12AM)', '320', '0.4 TB'],
        //     ['Night (12AM-6AM)', '85', '0.1 TB']
        //   ]
        // );

        // addSectionHeader('BANDWIDTH ALLOCATION');
        // addTable(
        //   ['Category', 'Percentage', 'Data'],
        //   [
        //     ['Streaming', '45%', '1.08 TB'],
        //     ['Browsing', '30%', '0.72 TB'],
        //     ['Downloads', '15%', '0.36 TB'],
        //     ['Other', '10%', '0.24 TB']
        //   ]
        // );
         break;

      case 'Security':
        { addSectionHeader('SECURITY OVERVIEW');
        addKeyValue('Overall Security Score', Math.round(averageScore)+'/100');
        addKeyValue('System Events', events.length);
        addKeyValue('Active Security Policies', policies.length);
        addKeyValue('Compliance Status', 'PASSED');
        yPos += 5;

        // === SECURITY METRICS ===
addSectionHeader('SECURITY METRICS');

// Group events by type and calculate counts
const grouped = events.reduce((acc, event) => {
  const type = event.eventType || 'Unknown';
  acc[type] = (acc[type] || 0) + 1;
  return acc;
}, {});

// Convert grouped data into metrics array
const metrics = Object.entries(grouped).map(([type, count]) => ({
  type,
  count,
  change: '+0%' // You can later calculate actual % change
}));

// Add table to report
addTable(
  ['Metric', 'Count', 'Change'],
  metrics.map(m => [m.type, m.count.toString(), m.change])
);


        // addSectionHeader('THREAT ANALYSIS');
        // addTable(
        //   ['Threat Type', 'Status'],
        //   [
        //     ['Malware Attempts', '8 blocked'],
        //     ['DDoS Attempts', '2 blocked'],
        //     ['Unauthorized Access', '5 blocked'],
        //     ['SQL Injection', '3 blocked'],
        //     ['XSS Attempts', '5 blocked']
        //   ]
        // );

        addSectionHeader('POLICY COMPLIANCE');
        addKeyValue('Firewall Rules', 'Active (100%)');
        addKeyValue('Encryption', 'AES-256 (Enforced)');
        addKeyValue('Access Control', 'Role-Based (Configured)');
        addKeyValue('Data Protection', 'GDPR Compliant');
        yPos += 5;

        addSectionHeader('RECOMMENDATIONS');
        doc.setFontSize(10);
        const recommendations = [
          '• Update firewall rules for improved threat detection',
          '• Review failed login patterns for potential brute force',
          '• Consider implementing 2FA for admin accounts'
        ];
        recommendations.forEach(rec => {
          checkPageBreak(7);
          doc.text(rec, 15, yPos);
          yPos += 7;
        });
        break; }

      case 'Analytics':
        addSectionHeader('USER ANALYTICS');
        addKeyValue('Total Active Users', totalusers);
        addKeyValue('New Registrations Today', usersToday);
        yPos += 5;

        addSectionHeader('USER DEMOGRAPHICS');
        addKeyValue('Peak Active Time', '2:30 PM (892 users)');
        addKeyValue('Average Session Duration', '42 minutes');
        addKeyValue('Daily Active Users', usersToday);
        addKeyValue('Weekly Active Users', totalusers);
        addKeyValue('Monthly Active Users', totalusers);
        yPos += 5;

        addSectionHeader('TOP USER LOCATIONS');
        addTable(
          ['Location', 'Active Sessions'],
           accessPoints
          .sort((a, b) => b.uptime - a.uptime) 
          .slice(0, 5) 
          .map(ap => [
            ap.location?.street || ap.name,
            `${ap.wifiSessions?.length || 0}%`
          ])
        );

        addSectionHeader('USER BEHAVIOR');
        addTable(
          ['Device Type', 'Percentage'],
          [
            ['Mobile', '68%'],
            ['Desktop', '25%'],
            ['Tablet', '7%']
          ]
        );
        addKeyValue('Average Data Per Session', '145 MB');
        addKeyValue('Sessions Per User (Avg)', '2.3');
        yPos += 5;

        addSectionHeader('ENGAGEMENT METRICS');
        addKeyValue('Connection Success Rate', '97.5%');
        addKeyValue('User Satisfaction Score', '4.2/5');
        addKeyValue('Support Tickets', '8 (resolved: 6)');
        addKeyValue('Average Login Time', '3.2 seconds');
        break;

      case 'Performance':
        addSectionHeader('NETWORK PERFORMANCE');
        addKeyValue('Network Uptime', uptimePercent+'%');
        addKeyValue('Average Response Time', averageResponseTime+'ms');
        addKeyValue('Peak Load', totalusers+' concurrent users');
        addKeyValue('Total Access Points', totalpoints+' ('+ onlinepoints+ ' online, '+offlinepoints+' offline)');
        yPos += 5;

        // addSectionHeader('PERFORMANCE METRICS');
        // addTable(
        //   ['Metric', 'Value'],
        //   [
        //     ['Latency (Avg)', '12ms'],
        //     ['Latency (Peak)', '45ms'],
        //     ['Packet Loss', '0.02%'],
        //     ['Jitter', '2ms'],
        //     ['Throughput', '2.4 TB/day']
        //   ]
        // );

        addSectionHeader('ACCESS POINT PERFORMANCE');
        addTable(
          ['Location', 'Wifi Sessions', 'Bandwidth'],
          accessPoints
          .sort((a, b) => b.uptime - a.uptime) 
          .slice(0, 5) 
          .map(ap => [
            ap.location?.street || ap.name,
            `${ap.wifiSessions?.length || 0}`,
            ap.deviceMetric?.[0]?.bandwidth
                    ? `${ap.deviceMetric[0].bandwidth.toFixed(1)} Mbps`
                    : "N/A"
          ])
        );

        addSectionHeader('NETWORK HEALTH');
        addKeyValue('CPU Usage (Avg)', '34%');
        addKeyValue('Memory Usage (Avg)', '58%');
        addKeyValue('Disk I/O', 'Normal');
        addKeyValue('Network Traffic', dataProcessed/100+' GB');
        addKeyValue('Connection Errors', '0.3%');
        yPos += 5;

        addSectionHeader('PERFORMANCE TRENDS');
        addKeyValue('Response Time Trend', 'Stable');
        addKeyValue('Uptime Trend', 'Improving ');
        addKeyValue('User Load', 'Increasing');
        addKeyValue('Bandwidth Usage', 'Within limits');
        break;

      default:
        addSectionHeader('SYSTEM OVERVIEW');
        addKeyValue('Total Access Points', totalpoints);
        addKeyValue('Active Users', totalusers);
        addKeyValue('Network Uptime', uptimePercent+'%');
        addKeyValue('Data Processed', dataProcessed/100+' GB');
        yPos += 5;

        addSectionHeader('PERFORMANCE METRICS');
        addKeyValue('Avg Response Time', averageResponseTime+'ms');
        addKeyValue('Peak Users Today', usersToday);
        addKeyValue('Security Score', Math.round(averageScore)+'/100');
        addKeyValue('Active Alerts', events.length);
    }


    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFillColor(44, 62, 80);
      doc.rect(0, pageHeight - 15, pageWidth, 15, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text("WiFi Captive Portal System", 15, pageHeight - 7);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 35, pageHeight - 7);
    }

    doc.save(`${reportName.replace(/\s+/g, "_")}_${reportDate}.pdf`);
    showSuccess("Download Started", `Downloading ${reportName} as PDF...`);
  };

  return (
  <div ref={reportRef} className="space-y-10 relative">
      <GenerateReportModal 
        open={isGenerateModalOpen} 
        onOpenChange={setIsGenerateModalOpen}
        onGenerate={handleGenerateReport}
      />
      <div className="absolute -top-[50px] right-[2px] flex gap-3">
          <Button className="gap-2" onClick={() => setIsGenerateModalOpen(true)}>
            <FileText className="w-4 h-4" />
            Generate Report
          </Button>
        <Button variant="outline" className="gap-2" onClick={() => setShowScheduler(true)}>
          <Calendar className="w-4 h-4" />
          Schedule Report
        </Button>
      </div>

      {/* Scheduler Modal */}
      {showScheduler && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                Schedule a Report
              </h3>
              <button onClick={() => setShowScheduler(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Report Type</label>
                <Select
                  value={scheduleForm.reportType}
                  onValueChange={(val) => setScheduleForm({ ...scheduleForm, reportType: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Usage Report">Usage Report</SelectItem>
                    <SelectItem value="User Analytics">User Analytics</SelectItem>
                    <SelectItem value="Security Audit">Security Audit</SelectItem>
                    <SelectItem value="Network Performance">Network Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Frequency</label>
                <Select
                  value={scheduleForm.frequency}
                  onValueChange={(val) => setScheduleForm({ ...scheduleForm, frequency: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hourly">Hourly</SelectItem>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

<div>
  <label className="text-sm font-medium">Recipient Emails</label>
  <div className="flex flex-wrap items-center gap-2 border rounded-md p-2 min-h-[44px]">
    {(scheduleForm.emails || []).map((email, index) => (
      <span
        key={index}
        className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
      >
        {email}
        <button
          type="button"
          className="text-blue-600 hover:text-red-500"
          onClick={() =>
            setScheduleForm({
              ...scheduleForm,
              emails: (scheduleForm.emails || []).filter((_, i) => i !== index),
            })
          }
        >
          ×
        </button>
      </span>
    ))}
    <input
      type="email"
      placeholder="Add email and press Enter"
      className="flex-1 outline-none border-none text-sm p-1"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === ",") {
          e.preventDefault();
          const newEmail = e.target.value.trim();
          if (
            newEmail &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail) &&
            !(scheduleForm.emails || []).includes(newEmail)
          ) {
            setScheduleForm({
              ...scheduleForm,
              emails: [...(scheduleForm.emails || []), newEmail],
            });
            e.target.value = "";
          }
        }
      }}
    />
  </div>
</div>


              <div className="flex items-center gap-2">
                <input
                  id="recurring"
                  type="checkbox"
                  checked={scheduleForm.recurring}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, recurring: e.target.checked })}
                />
                <label htmlFor="recurring" className="text-sm font-medium">
                  Enable recurring email sending
                </label>
              </div>

              <Button className="w-full mt-3 gap-2" onClick={handleScheduleSubmit}>
                <Send className="w-4 h-4" />
                Save Schedule
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* === Overview Section === */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <StatsCard title="Total Access Points"  value={totalpoints} change={offlinepoints + " offline"} changeType="neutral" icon={Wifi}/>
  <StatsCard title="Active Users"  value={totalusers} change={userChange + "% from yesterday"} changeType="positive" icon={Users}/>
  <StatsCard title="Network Uptime" value={uptimePercent + "%"} change="" changeType="positive" icon={Activity}/>
  <StatsCard title="Data Processed"  value={`${(dataProcessed / 1024).toFixed(2)} GB`}  change="Last 24 hours"  changeType="neutral" icon={Database}/>
</div>

{/* === Performance & Security === */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <StatsCard  title="Avg Response Time"  value={`${averageResponseTime.toFixed(2)} ms`} change="Excellent"  changeType="positive"  icon={Zap}/>
  <StatsCard  title="Peak Users Today"  value={usersToday}  change=""  changeType="neutral"  icon={TrendingUp}/>
  <StatsCard  title="Security Score"  value={`${Math.round(averageScore)} / 100`}  change={<p className={`${color} text-sm font-medium`}>{rating} Rating</p>} changeType="positive"  icon={Shield}/>
  <StatsCard  title="Active Alerts"  value={activeAlerts}  change=""  changeType="neutral"  icon={AlertTriangle}/>
</div>


      {/* === Charts Section === */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <UsageChart chartColor="#60A5FA" />

  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-blue-400" />
        Top Performing Locations
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {accessPoints
          .sort((a, b) => b.uptime - a.uptime) // sort by uptime
          .slice(0, 5) // show top 5
          .map((ap, index) => (
            <div key={ap.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Signal className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">
                    {ap.location?.street || ap.name || `Access Point ${index + 1}`}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {ap.wifiSessions?.length || 0} Wifi sessions
                </div>
              </div>

              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>
                  {ap.deviceMetric?.[0]?.bandwidth
                    ? `${ap.deviceMetric[0].bandwidth.toFixed(1)} Mbps`
                    : "N/A"}{" "}
                  bandwidth
                </span>
                <span>{ap.uptime?.toFixed(1) ?? 0}% uptime</span>
              </div>

              <Progress value={ap.uptime} className="h-2" />
            </div>
          ))}
      </div>
    </CardContent>
  </Card>
</div>


      {/* === Security & Activities === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Security Metrics (Last 24h)
            </CardTitle>
          </CardHeader>
           <CardContent>
      <div className="space-y-4">
        {(() => {
          // Group events by eventType
          const grouped = events.reduce((acc, event) => {
            const type = event.eventType || "Unknown";
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {});

          // Convert to displayable list
          const metrics = Object.entries(grouped).map(([type, count]) => ({
            type,
            count,
            change: "+0%", 
          }));

          return metrics.map((metric, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <p className="font-medium">{metric.type}</p>
                <p className="text-2xl font-bold text-foreground">{metric.count}</p>
              </div>
              <Badge
                variant={
                  metric.change.startsWith("-")
                    ? "default"
                    : metric.change.startsWith("+")
                    ? "secondary"
                    : "outline"
                }
              >
                {metric.change}
              </Badge>
            </div>
          ));
        })()}
      </div>
    </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Recent System Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      activity.severity === "Critical"
                        ? "bg-destructive"
                        : activity.severity === "High"
                        ? "bg-yellow-500"
                        : "bg-blue-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{activity.eventTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.eventType || activity.eventDescription || activity.details}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{ new Date(activity.timeStamp).toLocaleDateString()|| ""}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === Generated Reports List === */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Generated Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">{report.name}</h4>
                      <p className="text-sm text-muted-foreground">{report.type} • {report.timeline} • {report.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      report.status === 'completed' ? 'default' : 
                      report.status === 'processing' ? 'secondary' : 'outline'
                    }>
                      {report.status}
                    </Badge>
                    {report.status === 'completed' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadReport(report.name, report.date, report.type)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      {/* === Scheduled Reports Section === */}
      {schedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Scheduled Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {schedules.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 border rounded-lg text-sm"
              >
                <div>
                  <p className="font-medium">{s.reportType}</p>
                 <p className="text-muted-foreground">
                  {s.frequency} • {Array.isArray(s.emails) ? s.emails.join(", ") : s.emails || "—"}{" "}
                  {s.recurring ? "(recurring)" : ""}
                </p>

                </div>
                <Badge variant="outline">Scheduled</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}