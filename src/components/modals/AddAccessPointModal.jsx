import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Plus } from "lucide-react";
import { useToastNotification } from "../../hooks/useToastNotification";
import { BASE_URL } from "../../api/api";

export function AddAccessPointModal({ onAccessPointAdded }) {
  const [open, setOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    macAddress: "",
    ipAddress: "",
    location: "",
    deviceType: "",
    model: "",
    authMode: "",
    apiToken: "",
    vendor: "",
    serialNumber: "",
    snmp: "",
    subnet: "",
    max:"",
    min:""
  });
  const [discoveredAPs, setDiscoveredAPs] = useState([]);
  const [selectedAPs, setSelectedAPs] = useState([]);
  const [currentAPIndex, setCurrentAPIndex] = useState(0); // NEW
  const { showSuccess } = useToastNotification();

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

 const handleScanSNMP = async () => {
  if (!formData.subnet || !formData.snmp) {
    alert("Please enter both Subnet and SNMP community.");
    return;
  }

  setIsScanning(true);
  setDiscoveredAPs([]);

  try {
    const response = await fetch(`${BASE_URL}/snmp/discover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subnet: formData.subnet,
        community: formData.snmp,
      }),
    });

    if (!response.ok) throw new Error("SNMP discovery failed");

    const data = await response.json();
    setDiscoveredAPs(data || []);
  } catch (error) {
    console.error("SNMP scan failed:", error);
    alert("Error discovering devices. Check your subnet/community or backend.");
  } finally {
    setIsScanning(false);
  }
};

 const handleScanSNMPIndex = async () => {
  if (!formData.subnet || !formData.snmp) {
    alert("Please enter both Subnet and SNMP community.");
    return;
  }

  setIsScanning(true);
  setDiscoveredAPs([]);

  try {
    const response = await fetch(`${BASE_URL}/snmp/discover/index`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subnet: formData.subnet,
        community: formData.snmp,
        min:formData.min,
        max:formData.max
      }),
    });

    if (!response.ok) throw new Error("SNMP discovery failed");

    const data = await response.json();
    setDiscoveredAPs(data || []);
  } catch (error) {
    console.error("SNMP scan failed:", error);
    alert("Error discovering devices. Check your subnet/community or backend.");
  } finally {
    setIsScanning(false);
  }
};


  const handleToggleAP = (ap) => {
    setSelectedAPs((prev) => {
      const exists = prev.find((a) => a.ipAddress === ap.ipAddress);
      if (exists) {
        return prev.filter((a) => a.ipAddress !== ap.ipAddress);
      } else {
        return [...prev, ap];
      }
    });
  };

  // === Auto-fill form when selectedAPs or index changes ===
  useEffect(() => {
    if (selectedAPs.length > 0) {
      const currentAP = selectedAPs[currentAPIndex];
      setFormData((prev) => ({
        ...prev,
        name: currentAP.name || "",
        macAddress: currentAP.macAddress || "",
        ipAddress: currentAP.ipAddress || "",
        location: currentAP.location || "",
        vendor: currentAP.vendor || "",
        model: currentAP.model || "",
        serialNumber: currentAP.serialNumber || "",
      }));
    }
  }, [selectedAPs, currentAPIndex]);

  const handlePrev = () => {
    setCurrentAPIndex((prev) => (prev > 0 ? prev - 1 : selectedAPs.length - 1));
  };

  const handleNext = () => {
    setCurrentAPIndex((prev) => (prev < selectedAPs.length - 1 ? prev + 1 : 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const apsToAdd = selectedAPs.length > 0 ? selectedAPs : [formData];

    for (const ap of apsToAdd) {
      const newAP = {
        name: ap.name || formData.name,
        location: ap.location || formData.location,
        status: "online",
        uptime: 100,
        users: 0,
        macAddress: ap.macAddress || formData.macAddress,
        ipAddress:
          ap.ipAddress ||
          formData.ipAddress ||
          "192.168.1." + Math.floor(Math.random() * 200 + 100),
        vendor: ap.vendor || formData.vendor,
        model: ap.model || formData.model,
        serialNumber:
          ap.serialNumber ||
          formData.serialNumber ||
          "AP-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        firmware: "v2.4.1",
        lastCheckin: "Just now",
      };

      try {
        const response = await fetch(`${BASE_URL}/access-points`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isActive: true,
            createdAt: getCurrentDate(),
            name: newAP.name,
            macAddress: newAP.macAddress,
            ipAddress: newAP.ipAddress,
            vendor: newAP.vendor,
            deviceModel: newAP.model,
            serialNumber: newAP.serialNumber,
            apiToken: formData.apiToken,
            load: Math.random(0, 100) * 101,
            uptime: 100,
            authenticationMode: formData.authMode,
            location: {
              street: newAP.location,
              city: "",
              province: "GAUTENG",
              zipcode: "",
            },
          }),
        });

        if (response.ok) {
          onAccessPointAdded(newAP);
        } else {
          alert("Failed to add one or more Access Points. Check backend logs.");
        }
      } catch (error) {
        console.error(error.message);
        alert("Error adding Access Point.");
      }
    }

    showSuccess(
      "Access Point(s) Added",
      `${apsToAdd.length} access point(s) registered successfully.`
    );

    setFormData({
      name: "",
      macAddress: "",
      ipAddress: "",
      location: "",
      deviceType: "",
      model: "",
      authMode: "",
      apiToken: "",
      vendor: "",
      serialNumber: "",
      snmp: "",
      subnet: "",
    });
    setSelectedAPs([]);
    setDiscoveredAPs([]);
    setCurrentAPIndex(0);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Access Point
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New Access Point</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SNMP & Subnet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="snmp">SNMP Community *</Label>
              <Input
                id="snmp"
                placeholder="public"
                value={formData.snmp}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, snmp: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subnet">Subnet *</Label>
              <Input
                id="subnet"
                placeholder="192.168.1"
                value={formData.subnet}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subnet: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min">Min</Label>
              <Input
                id="min"
                placeholder="Minimum Range"
                value={formData.min}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, min: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max">Maximum Range</Label>
              <Input
                id="max"
                placeholder="Maximum"
                value={formData.max}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, max: e.target.value }))
                }
                required
              />
            </div>

            <div className="flex items-end space-x-2">
             <Button type="button" onClick={handleScanSNMPIndex} disabled={isScanning}>
  {isScanning ? (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      Scanning...
    </div>
  ) : (
    "Specify Range"
  )}
</Button>
          <Button type="button" onClick={handleScanSNMP} disabled={isScanning}>
  {isScanning ? (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      Scanning...
    </div>
  ) : (
    "Scan Network"
  )}
</Button>

            </div>
          </div>

          {/* Multi Select Discovered APs */}
          {discoveredAPs.length > 0 && (
            <div className="space-y-2">
              <Label>Discovered Access Points</Label>
              <div className="border rounded-md p-2 max-h-48 overflow-y-auto">
                {discoveredAPs.map((ap) => {
                  const selected = selectedAPs.find(
                    (s) => s.ipAddress === ap.ipAddress
                  );
                  return (
                    <div
                      key={ap.ipAddress}
                      className={`flex items-center justify-between px-3 py-1 rounded cursor-pointer ${
                        selected ? "bg-blue-100" : "hover:bg-gray-100"
                      }`}
                      onClick={() => handleToggleAP(ap)}
                    >
                      <span>
                        {ap.name || "Unnamed"} - {ap.ipAddress} ({ap.vendor})
                      </span>
                      {selected && (
                        <span className="text-blue-500 font-semibold">✓</span>
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedAPs.length > 0 && (
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-gray-600">
                    Reviewing {currentAPIndex + 1} of {selectedAPs.length} AP(s)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrev}
                    >
                      ◀ Prev
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleNext}
                    >
                      Next ▶
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual Details (auto-filled) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Friendly Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Main Library AP"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mac">MAC Address *</Label>
              <Input
                id="mac"
                placeholder="00:1B:63:84:45:E6"
                value={formData.macAddress}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    macAddress: e.target.value,
                  }))
                }
                required
                pattern="^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ip">IP Address</Label>
              <Input
                id="ip"
                placeholder="192.168.1.100"
                value={formData.ipAddress}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, ipAddress: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="e.g., Downtown Library"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Select
                value={formData.vendor}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, vendor: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ubiquiti">Ubiquiti</SelectItem>
                  <SelectItem value="cisco">Cisco</SelectItem>
                  <SelectItem value="aruba">Aruba</SelectItem>
                  <SelectItem value="tp-link">TP-Link</SelectItem>
                  <SelectItem value="netgear">Netgear</SelectItem>
                  <SelectItem value="huawei">Huawei</SelectItem>
                  <SelectItem value="h3c">H3C</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Device Model</Label>
              <Input
                id="model"
                placeholder="e.g., UniFi AP AC Pro"
                value={formData.model}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, model: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serial">Serial Number</Label>
              <Input
                id="serial"
                placeholder="e.g., UB-AP-12345678"
                value={formData.serialNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    serialNumber: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth">Authentication Mode</Label>
              <Select
                value={formData.authMode}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, authMode: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select auth method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="voucher">Voucher System</SelectItem>
                  <SelectItem value="radius">RADIUS</SelectItem>
                  <SelectItem value="local">Local Authentication</SelectItem>
                  <SelectItem value="social">Social Login</SelectItem>
                  <SelectItem value="mixed">
                    Mixed (RADIUS + Voucher)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">API Token / Shared Secret</Label>
            <Textarea
              id="token"
              placeholder="Enter API token or shared secret"
              value={formData.apiToken}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, apiToken: e.target.value }))
              }
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Register Access Point(s)</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
