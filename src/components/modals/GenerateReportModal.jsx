import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  FileText,
  Users,
  Shield,
  Activity,
  Database,
  CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../lib/utils";

const reportTypes = [
  {
    value: "Usage",
    label: "Usage Report",
    description: "Data consumption, bandwidth, and usage trends",
    icon: Database,
  },
  {
    value: "Security",
    label: "Security Audit",
    description: "Threats, vulnerabilities, and security metrics",
    icon: Shield,
  },
  {
    value: "Analytics",
    label: "User Analytics",
    description: "User behavior, demographics, and engagement",
    icon: Users,
  },
  {
    value: "Performance",
    label: "Network Performance",
    description: "Uptime, latency, and infrastructure health",
    icon: Activity,
  },
];

export function GenerateReportModal({ open, onOpenChange, onGenerate }) {
  const [selectedType, setSelectedType] = useState("Usage");
  const [reportName, setReportName] = useState("");
  const [timeline, setTimeline] = useState("today");
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();

  const handleGenerate = () => {
    const reportType = reportTypes.find((type) => type.value === selectedType);
    if (reportType && timeline) {
      if (timeline === "custom" && (!startDate || !endDate)) {
        return;
      }

      // ✅ FIX: pass correct parameters in expected order
      // If your parent expects (reportType, reportName, timeline, startDate, endDate):
      onGenerate(reportType.value, reportName || reportType.label, timeline, startDate, endDate);

      // 🧩 Alternatively, better long-term:
      // onGenerate({ reportType: reportType.value, reportName, timeline, startDate, endDate });

      onOpenChange(false);
      setSelectedType("Usage");
      setReportName("");
      setTimeline("today");
      setStartDate(undefined);
      setEndDate(undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate New Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 🆕 Report name input */}
          <div className="space-y-2">
            <Label htmlFor="report-name">Report Name</Label>
            <Input
              id="report-name"
              placeholder="e.g., October Usage Summary"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base">Select Report Type</Label>
            <RadioGroup value={selectedType} onValueChange={setSelectedType}>
              <div className="space-y-3">
                {reportTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <div
                      key={type.value}
                      className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    >
                      <RadioGroupItem
                        value={type.value}
                        id={type.value}
                        className="mt-1"
                      />
                      <label htmlFor={type.value} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="font-medium">{type.label}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {type.description}
                        </p>
                      </label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeline">Timeline</Label>
            <Select value={timeline} onValueChange={setTimeline}>
              <SelectTrigger id="timeline">
                <SelectValue placeholder="Select timeline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="thisWeek">This Week</SelectItem>
                <SelectItem value="lastWeek">Last Week</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {timeline === "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={timeline === "custom" && (!startDate || !endDate)}
          >
            Generate Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
