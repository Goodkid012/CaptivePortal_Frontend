import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "../ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Progress } from "../ui/progress";
import { Eye, MousePointer, TrendingUp, DollarSign, BarChart3, Plus } from "lucide-react";
import { BASE_URL } from "../../api/api";

export function AdRevenue() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ads, setAds] = useState([]);

  const [formData, setFormData] = useState({
    companyName: "",
    advertismentType: "",
    advertismentTitle: "",
    startDate: "",
    endDateTime: "",
    mediaUrl: "",
    cpc: "",
    cpm: "",
  });

  const [errors, setErrors] = useState({});

  // 🔹 Fetch ads from backend
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await fetch(`${BASE_URL}/advertisements`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();

        // Map backend data into analytics-friendly structure
        const transformed = data.map((ad) => {
          const impressions = ad.impressions?.length || 0;
          const clicks = ad.impressions?.filter((imp) => imp.click)?.length || 0;
          const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
          const revenue = (clicks * ad.cpc) + ((impressions / 1000) * ad.cpm);
          return {
            id: ad.id,
            companyName: ad.companyName,
            advertismentTitle: ad.advertismentTitle,
            impressions,
            clicks,
            ctr,
            revenue,
            status: "active",
          };
        });

        setAds(transformed);
      } catch (error) {
        console.error("fetch error:", error);
      }
    };

    fetchAds();
  }, []);

  const totalMetrics = {
    totalImpressions: ads.reduce((sum, ad) => sum + ad.impressions, 0),
    totalClicks: ads.reduce((sum, ad) => sum + ad.clicks, 0),
    totalRevenue: ads.reduce((sum, ad) => sum + ad.revenue, 0),
    averageCtr: ads.length
      ? ads.reduce((sum, ad) => sum + ad.ctr, 0) / ads.length
      : 0,
  };

  // 🔹 Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  // 🔹 Add new advertisement
  const handleSubmit = async () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      if (!formData[key]) newErrors[key] = "This field is required";
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/advertisements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formData.companyName,
          advertismentType: formData.advertismentType,
          advertismentTitle: formData.advertismentTitle,
          startDate: formData.startDate,
          endDateTime: formData.endDateTime,
          mediaUrl: formData.mediaUrl,
          cpc: parseFloat(formData.cpc),
          cpm: parseFloat(formData.cpm),
        }),
      });

      if (response.ok) {
        const savedAd = await response.json();
        setAds([
          ...ads,
          {
            id: savedAd.id,
            companyName: savedAd.companyName,
            advertismentTitle: savedAd.advertismentTitle,
            impressions: 0,
            clicks: 0,
            ctr: 0,
            revenue: 0,
            status: "pending",
          },
        ]);
        setOpen(false);
        setFormData({
          companyName: "",
          advertismentType: "",
          advertismentTitle: "",
          startDate: "",
          endDateTime: "",
          mediaUrl: "",
          cpc: "",
          cpm: "",
        });
      } else {
        console.error("Failed to save ad:", response.status);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 text-white">Active</Badge>;
      case "paused":
        return <Badge className="bg-yellow-500 text-black">Paused</Badge>;
      case "pending":
        return <Badge className="bg-gray-400 text-white">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCtrColor = (ctr) => {
    if (ctr >= 2) return "text-green-600";
    if (ctr >= 1.5) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* 🔹 Add Advertisement Button + Popup */}
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Advertisement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Advertisement Details</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {[
                { label: "Company Name", name: "companyName" },
                { label: "Advertisement Type", name: "advertismentType" },
                { label: "Advertisement Title", name: "advertismentTitle" },
              ].map((field) => (
                <div key={field.name}>
                  <Label>{field.label}</Label>
                  <Input
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className={errors[field.name] ? "border-red-500" : ""}
                  />
                  {errors[field.name] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[field.name]}
                    </p>
                  )}
                </div>
              ))}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="datetime-local"
                    name="endDateTime"
                    value={formData.endDateTime}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <Label>Media URL</Label>
                <Input
                  name="mediaUrl"
                  value={formData.mediaUrl}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CPC (Cost Per Click)</Label>
                  <Input
                    type="number"
                    name="cpc"
                    value={formData.cpc}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>CPM (Cost Per Mille)</Label>
                  <Input
                    type="number"
                    name="cpm"
                    value={formData.cpm}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 🔹 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex justify-between">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMetrics.totalImpressions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMetrics.totalClicks.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between">
            <CardTitle className="text-sm font-medium">Average CTR</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMetrics.averageCtr.toFixed(2)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between">
            <CardTitle className="text-sm font-medium">Ad Revenue</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{totalMetrics.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* 🔹 Ad Performance List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Ad Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {ads.map((ad) => (
              <div key={ad.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{ad.companyName}</h4>
                    {getStatusBadge(ad.status)}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">R{ad.revenue.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Revenue</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Impressions</div>
                    <div className="font-medium">{ad.impressions.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Clicks</div>
                    <div className="font-medium">{ad.clicks.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">CTR</div>
                    <div className={`font-medium ${getCtrColor(ad.ctr)}`}>{ad.ctr.toFixed(2)}%</div>
                  </div>
                </div>

                <Progress value={Math.min(ad.ctr * 50, 100)} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 🔹 Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" /> Detailed Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Impressions</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>CTR</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ads.map((ad) => (
                <TableRow key={ad.id}>
                  <TableCell>{ad.companyName}</TableCell>
                  <TableCell>{ad.impressions.toLocaleString()}</TableCell>
                  <TableCell>{ad.clicks.toLocaleString()}</TableCell>
                  <TableCell className={getCtrColor(ad.ctr)}>
                    {ad.ctr.toFixed(2)}%
                  </TableCell>
                  <TableCell>R{ad.revenue.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(ad.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
