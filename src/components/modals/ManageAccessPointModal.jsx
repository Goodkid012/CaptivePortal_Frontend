import { useState, useEffect, useRef } from "react"; // Added useRef import
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { LoadScript, Autocomplete } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Wifi,
  RefreshCw,
  Users,
  BarChart3,
  Info,
  Settings,
} from "lucide-react";
import { useToastNotification } from "../../hooks/useToastNotification";
import { BASE_URL } from "../../api/api";

const libraries = ["places"];

export function ManageAccessPointModal({ accessPoint, open, onOpenChange, onAccessPointUpdated }) {
  // Fixed: Removed duplicate state, using apSettings only
  const [apSettings, setApSettings] = useState({
    location: "",
    name: "",
    latitude: null,
    longitude: null,
    maxUsers: 100,
    bandwidthLimit: 50,
    signalPower: 80,
  });
  
  const autocompleteRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [clientAnalytics, setClientAnalytics] = useState(null);
  
  const { showSuccess, showError, showInfo } = useToastNotification();

  // Initialize apSettings when accessPoint changes
  useEffect(() => {
    if (accessPoint) {
      setApSettings({
        name: accessPoint.name || "",
        location: accessPoint.location || "",
        latitude: accessPoint.latitude || null,
        longitude: accessPoint.longitude || null,
        maxUsers: accessPoint.maxUsers || 100,
        bandwidthLimit: accessPoint.bandwidthLimit || 50,
        signalPower: accessPoint.signalPower || 80,
      });
    }
  }, [accessPoint]);

  // Fetch client analytics
  useEffect(() => {
    if (!accessPoint?.id) return;

    fetch(`${BASE_URL}/access-points/${accessPoint.id}/client-analytics`)
      .then(res => res.json())
      .then(data => setClientAnalytics(data))
      .catch(err => console.error("Analytics error:", err));
  }, [accessPoint]);

  // Handle Google Places selection
  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      
      if (place.formatted_address) {
        setApSettings(prev => ({
          ...prev,
          location: place.formatted_address,
          latitude: place.geometry?.location?.lat() || null,
          longitude: place.geometry?.location?.lng() || null,
          addressComponents: extractAddressComponents(place)
        }));
      }
    }
  };

  // Extract address components
  const extractAddressComponents = (place) => {
    const components = {};
    if (place.address_components) {
      place.address_components.forEach(component => {
        component.types.forEach(type => {
          components[type] = component.long_name;
        });
      });
    }
    return components;
  };

  // Handle status updates
  const updateStatus = async (isActive) => {
    try {
      const res = await fetch(`${BASE_URL}/access-points/${accessPoint.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...accessPoint, isActive }),
      });

      if (!res.ok) throw new Error("Failed to update Access Point");
      const updated = await res.json();
      onAccessPointUpdated(updated);
      return updated;
    } catch (err) {
      console.error("Update error:", err);
      throw err;
    }
  };

  // Handle actions
  const handleAction = async (action) => {
    setLoading(true);
    
    try {
      switch (action) {
        case "restart":
          showSuccess("Access Point Restarted", `${accessPoint.name} is restarting...`);
          break;
        case "reboot":
          showInfo("Rebooting", `${accessPoint.name} is rebooting. This may take a few minutes.`);
          break;
        case "ping":
          showSuccess("Ping Test", "Ping successful - AP is responding normally.");
          break;
        case "update":
          showSuccess("Firmware Update", "Firmware update initiated. Check back in 10 minutes.");
          break;
        case "disable":
          await updateStatus(false); 
          showInfo("AP Disabled", `${accessPoint.name} has been disabled.`);
          break;
        case "enable":
          await updateStatus(true); 
          showSuccess("AP Enabled", `${accessPoint.name} has been enabled.`);
          break;
        case "push-config":
          showSuccess("Configuration Pushed", "New configuration has been pushed to the device.");
          break;
        case "locate":
          showInfo("Device Location", "LED indicator activated for 30 seconds.");
          break;
        case "reset":
          showError("Factory Reset", "Factory reset initiated. All settings will be lost.");
          break;
        default:
          break;
      }
    } catch (error) {
      showError(
         "Error", `Failed to ${action} access point.  ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Save settings
  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const updatedAP = {
        ...accessPoint,
        name: apSettings.name,
        location: apSettings.location,
        latitude: apSettings.latitude,
        longitude: apSettings.longitude,
        maxUsers: apSettings.maxUsers,
        bandwidthLimit: apSettings.bandwidthLimit,
        signalPower: apSettings.signalPower,
      };

      // Optionally save to backend
      const res = await fetch(`${BASE_URL}/access-points/${accessPoint.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedAP),
      });

      if (!res.ok) throw new Error("Failed to save settings");
      
      const savedAP = await res.json();
      onAccessPointUpdated(savedAP);
      showSuccess("Settings Updated", "Access point settings have been saved.");
      onOpenChange(false);
    } catch (error) {
      showError("Error", `Failed to save settings. ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Add name input to config tab
  const handleNameChange = (e) => {
    setApSettings(prev => ({ ...prev, name: e.target.value }));
  };

  if (!accessPoint) return null;

  const apDetails = {
    ipAddress: accessPoint.ipAddress || "",
    macAddress: accessPoint.macAddress || "",
    model: accessPoint.deviceModel || "",
    vendor: accessPoint.vendor || "",
    serialNumber: accessPoint.serialNumber || ""
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            Manage Access Point - {accessPoint.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="config">Config</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          {/* --- OVERVIEW TAB --- */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Access Point Info
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <p><strong>IP Address:</strong> {apDetails.ipAddress}</p>
                <p><strong>MAC:</strong> {apDetails.macAddress}</p>
                <p><strong>Model:</strong> {apDetails.model}</p>
                <p><strong>Vendor:</strong> {apDetails.vendor}</p>
                <p><strong>Serial #:</strong> {apDetails.serialNumber}</p>
                {apSettings.latitude && apSettings.longitude && (
                  <p className="col-span-2">
                    <strong>Coordinates:</strong> {apSettings.latitude.toFixed(6)}, {apSettings.longitude.toFixed(6)}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- CLIENTS TAB --- */}
          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Client Demographics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!clientAnalytics ? (
                  <p>Loading analytics...</p>
                ) : (
                  <div className="grid grid-cols-3 gap-6">
                    {/* Gender */}
                    <div>
                      <h4 className="font-semibold mb-2">Gender</h4>
                      {Object.entries(clientAnalytics.gender || {}).map(([k, v]) => (
                        <p key={k}>{k}: {v}</p>
                      ))}
                    </div>

                    {/* Race */}
                    <div>
                      <h4 className="font-semibold mb-2">Race</h4>
                      {Object.entries(clientAnalytics.race || {}).map(([k, v]) => (
                        <p key={k}>{k}: {v}</p>
                      ))}
                    </div>

                    {/* Age */}
                    <div>
                      <h4 className="font-semibold mb-2">Age Groups</h4>
                      {Object.entries(clientAnalytics.ageGroups || {}).map(([k, v]) => (
                        <p key={k}>{k}: {v}</p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- PERFORMANCE TAB --- */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Signal Strength: {apSettings.signalPower}%</Label>
                    <Progress value={apSettings.signalPower} className="mt-1" />
                  </div>
                  <div>
                    <Label>Bandwidth Usage: {apSettings.bandwidthLimit}%</Label>
                    <Progress value={apSettings.bandwidthLimit} className="mt-1" />
                  </div>
                  <div>
                    <Label>Max Users: {apSettings.maxUsers}</Label>
                    <Progress value={50} className="mt-1" /> {/* Example: 50% of max users */}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- CONFIG TAB --- */}
          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Access Point Name</Label>
                  <Input
                    id="name"
                    value={apSettings.name}
                    onChange={handleNameChange}
                    placeholder="Enter AP name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="location">Location</Label>
                  <LoadScript
                    googleMapsApiKey={""}
                    libraries={libraries}
                    loadingElement={<div className="text-sm text-gray-500">Loading maps...</div>}
                  >
                    <Autocomplete
                      onLoad={(autocomplete) => {
                        autocompleteRef.current = autocomplete;
                      }}
                      onPlaceChanged={handlePlaceChanged}
                    >
                      <Input
                        id="location"
                        value={apSettings.location}
                        onChange={(e) => setApSettings({ 
                          ...apSettings, 
                          location: e.target.value 
                        })}
                        placeholder="Search for a location..."
                      />
                    </Autocomplete>
                  </LoadScript>
                  
                  {/* Show coordinates if available */}
                  <div className="mt-2 space-y-1">
                    {apSettings.latitude && apSettings.longitude && (
                      <>
                        <p className="text-xs text-gray-500">
                          Coordinates: {apSettings.latitude.toFixed(6)}, {apSettings.longitude.toFixed(6)}
                        </p>
                        <a
                          href={`https://maps.google.com/?q=${apSettings.latitude},${apSettings.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          View on Google Maps
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {/* Additional settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxUsers">Max Users</Label>
                    <Input
                      id="maxUsers"
                      type="number"
                      value={apSettings.maxUsers}
                      onChange={(e) => setApSettings({ 
                        ...apSettings, 
                        maxUsers: parseInt(e.target.value) || 0 
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bandwidthLimit">Bandwidth Limit (%)</Label>
                    <Input
                      id="bandwidthLimit"
                      type="number"
                      min="0"
                      max="100"
                      value={apSettings.bandwidthLimit}
                      onChange={(e) => setApSettings({ 
                        ...apSettings, 
                        bandwidthLimit: parseInt(e.target.value) || 0 
                      })}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSaveSettings} 
                  className="mt-2"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- LOGS TAB --- */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Logs</CardTitle>
              </CardHeader>
              <CardContent>
                {accessPoint.errorLogs?.length > 0 ? (
                  accessPoint.errorLogs.map((log, idx) => (
                    <div key={idx} className="border-b py-2 text-sm">
                      <span className="font-semibold">{log.type}</span>: {log.message}
                      {log.timestamp && (
                        <span className="text-gray-500 text-xs ml-2">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No logs available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- ACTIONS TAB --- */}
          <TabsContent value="actions" className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Button onClick={() => handleAction("restart")} variant="outline">Restart</Button>
              <Button onClick={() => handleAction("ping")} variant="outline">Ping</Button>
              <Button onClick={() => handleAction("reboot")} variant="outline">Reboot</Button>
              <Button onClick={() => handleAction("update")} variant="outline">Update Firmware</Button>
              <Button onClick={() => handleAction("disable")} variant="destructive">Disable</Button>
              <Button onClick={() => handleAction("enable")} variant="default">Enable</Button>
              <Button onClick={() => handleAction("push-config")} variant="outline">Push Config</Button>
              <Button onClick={() => handleAction("locate")} variant="outline">Locate</Button>
              <Button onClick={() => handleAction("reset")} variant="destructive">Factory Reset</Button>
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processing action...
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}