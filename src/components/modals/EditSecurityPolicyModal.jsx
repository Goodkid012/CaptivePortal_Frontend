import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import { useToastNotification } from "../../hooks/useToastNotification";
import { BASE_URL } from "../../api/api";

export function EditSecurityPolicyModal({
  policy,
  open,
  onOpenChange,
  onPolicyUpdated,
}) {
  const { showSuccess } = useToastNotification();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active",
    enforceLevel: "medium",
    autoBlock: false,
  });

  useEffect(() => {
    const fetchPolicy = async () => {
      if (policy && policy.id) {
        try {
          const res = await fetch(`${BASE_URL}/policies/${policy.id}`);
          if (res.ok) {
            const data = await res.json();
            setFormData({
              name: data.policyName || "",
              description: data.rule || "",
              status: data.isActive ? "active" : "inactive",
              enforceLevel: data.policyType || "medium",
              autoBlock: data.autoBlock || false,
            });
          }
        } catch (err) {
          console.error("Failed to fetch policy:", err);
        }
      } else {
        // Reset for new policy creation
        setFormData({
          name: "",
          description: "",
          status: "active",
          enforceLevel: "medium",
          autoBlock: false,
        });
      }
    };

    if (open) fetchPolicy();
  }, [policy, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      policyName: formData.name,
      rule: formData.description,
      policyType: formData.enforceLevel,
      isActive: formData.status === "active",
      autoBlock: formData.autoBlock,
      score: 100,
    };

    const method = policy ? "PUT" : "POST";
    const url = policy
      ? `${BASE_URL}/policies/${policy.id}`
      : `${BASE_URL}/policies`;

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const updatedPolicy = await response.json();
      onPolicyUpdated(updatedPolicy);
      showSuccess(
        policy ? "Policy Updated" : "Policy Added",
        policy
          ? "Security policy has been updated successfully"
          : "New security policy created successfully"
      );
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] z-[1000]">
        <DialogHeader>
          <DialogTitle>
            {policy ? "Edit Security Policy" : "Add New Security Policy"}
          </DialogTitle>
          <DialogDescription>
            {policy
              ? "Update the security policy settings and enforcement rules"
              : "Create a new policy to manage system security and enforcement rules"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Policy Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Policy Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Enforcement Level */}
            <div className="grid gap-2">
              <Label htmlFor="enforceLevel">Enforcement Level</Label>
              <select
                id="enforceLevel"
                value={formData.enforceLevel}
                onChange={(e) =>
                  setFormData({ ...formData, enforceLevel: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Status Switch */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="status">Policy Status</Label>
                <p className="text-sm text-muted-foreground">
                  Enable or disable this policy
                </p>
              </div>
              <Switch
                id="status"
                checked={formData.status === "active"}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    status: checked ? "active" : "inactive",
                  })
                }
              />
            </div>

            {/* Auto Block Switch */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoBlock">Auto Block</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically block threats
                </p>
              </div>
              <Switch
                id="autoBlock"
                checked={formData.autoBlock}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, autoBlock: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {policy ? "Update Policy" : "Create Policy"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
