import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Plus, Edit, Trash2, Wifi, Timer, HardDrive, DollarSign } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { BASE_URL } from "../../api/api";

const mockPlans = [];

export function PlansManagement() {
  const [plans, setPlans] = useState(mockPlans);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isActive, setIsActive] = useState();
  const [formData, setFormData] = useState({
    title: "",
    speedLimit: "",
    dataLimit: "",
    duration: "",
    price: "",
    adsEnabled: false,
  });

  const handleToggleActivate = async () => {
    setActionLoading(true);

    const nextState = !isActive;
    const action = nextState ? "activate" : "deactivate";

    try {
      const res = await fetch(`${BASE_URL}/plans/${nextState}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`Failed to ${action} `);
      setIsActive(nextState);
    } catch (error) {
      console.error(`${action} error:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const { toast } = useToast();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`${BASE_URL}/subscriptions`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setPlans(data);
      } catch (error) {
        console.error("fetch error:", error);
      }
    };
    fetchPlans();
  }, []);

  const handleAddPlan = () => {
    setEditingPlan(null);
    setIsDialogOpen(true);
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setFormData({
      title: plan.title || "",
      speedLimit: plan.speedLimit || "",
      dataLimit: plan.dataLimit || "",
      duration: plan.duration || "",
      price: plan.price || "",
      adsEnabled: plan.adsEnabled || false,
    });
    setIsDialogOpen(true);
  };

  const handleDeletePlan = async (planId) => {
    try {
      const res = await fetch(`${BASE_URL}/subscriptions/${planId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setPlans(plans.filter((p) => p.id !== planId));
      toast({
        title: "Plan Deleted",
        description: "The plan has been successfully deleted.",
      });
    } catch (error) {
      console.error("delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete plan.",
      });
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    let key = id;

    switch (id) {
      case "name":
        key = "title";
        break;
      case "speed":
        key = "speedLimit";
        break;
      case "data":
        key = "dataLimit";
        break;
      default:
        key = id;
    }

    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-primary" />
            Internet Plans Management
          </CardTitle>

          {/* Buttons aligned side-by-side to the right */}
          <div className="flex items-center gap-3">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddPlan} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add Plan
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingPlan ? "Edit Plan" : "Add New Plan"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Plan Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Weekly Pro"
                      value={formData.title}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="speed">Speed</Label>
                      <Input
                        id="speed"
                        placeholder="e.g., 50 Mbps"
                        value={formData.speedLimit}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="data">Data Limit</Label>
                      <Input
                        id="data"
                        placeholder="e.g., 5 GB"
                        value={formData.dataLimit}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration</Label>
                      <Input
                        id="duration"
                        placeholder="e.g., 6 Hours"
                        value={formData.duration}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (R)</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="9.99"
                        value={formData.price}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={async () => {
                      try {
                        const method = editingPlan ? "PUT" : "POST";
                        const url = editingPlan
                          ? `${BASE_URL}/subscriptions/${editingPlan.id}`
                          : `${BASE_URL}/subscriptions`;

                        const res = await fetch(url, {
                          method,
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(formData),
                        });

                        if (!res.ok) throw new Error("Failed to save plan");
                        const savedPlan = await res.json();

                        if (editingPlan) {
                          setPlans((prev) =>
                            prev.map((p) => (p.id === editingPlan.id ? savedPlan : p))
                          );
                          toast({
                            title: "Plan Updated",
                            description: "The plan has been successfully updated.",
                          });
                        } else {
                          setPlans((prev) => [...prev, savedPlan]);
                          toast({
                            title: "Plan Created",
                            description: "The new plan has been successfully created.",
                          });
                        }

                        setIsDialogOpen(false);
                        setEditingPlan(null);
                        setFormData({
                          title: "",
                          speedLimit: "",
                          dataLimit: "",
                          duration: "",
                          price: "",
                          adsEnabled: false,
                        });
                      } catch (error) {
                        console.error("save error:", error);
                        toast({
                          title: "Error",
                          description: "Failed to save plan.",
                        });
                      }
                    }}
                  >
                    {editingPlan ? "Update Plan" : "Create Plan"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={handleToggleActivate}
              disabled={actionLoading}
              className={`px-4 py-1 rounded-md font-medium transition-colors ${
                isActive
                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                  : "bg-green-100 text-green-700 hover:bg-green-200 "
              }`}
            >
              {actionLoading
                ? isActive
                  ? "Deactivating..."
                  : "Activating..."
                : isActive
                ? "Deactivate"
                : "Activate"}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Name</TableHead>
                <TableHead>Speed</TableHead>
                <TableHead>Data Limit</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Ads</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.title}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-muted-foreground" /> {plan.speedLimit}
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" /> {plan.dataLimit}
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-muted-foreground" /> {plan.duration}
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" /> R{plan.price}
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.adsEnabled ? "default" : "secondary"}>
                      {plan.adsEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditPlan(plan)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeletePlan(plan.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
