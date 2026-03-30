import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Edit3, 
  Plus,
  AlertTriangle,
  Activity,
  Database,
  Network,
  Settings,
  Download,
  Filter,
  Search,
  RefreshCw,
  Eye,
  Play,
  Pause,
  Bell
} from "lucide-react";
import { BASE_URL } from "../../api/api";
import { EditSecurityPolicyModal } from "../../components/modals/EditSecurityPolicyModal";
import { Button } from "../../components/ui/button";

export default function Security() {
  const [policies, setPolicies] = useState([]);
  const [events, setEvents] = useState([]);
  const [threats, setThreats] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [activeTab, setActiveTab] = useState("policies");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Custom toast notification function since hook might not exist
  const showToast = (type, title, message) => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white`;
    toast.innerHTML = `
      <strong>${title}</strong>
      <p class="text-sm">${message}</p>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // New state for threat management
  const [firewallRules, setFirewallRules] = useState([
    { id: 1, name: "SSH Access", port: 22, action: "allow", source: "10.0.0.0/24", enabled: true },
    { id: 2, name: "HTTP Access", port: 80, action: "allow", source: "any", enabled: true },
    { id: 3, name: "Block Malicious IPs", port: "any", action: "deny", source: "blacklist", enabled: true },
    { id: 4, name: "RDP Restriction", port: 3389, action: "deny", source: "external", enabled: false },
  ]);

  const [bruteForceProtection, setBruteForceProtection] = useState({
    enabled: true,
    maxAttempts: 5,
    lockoutTime: 900,
    ipBlocking: true
  });

  const [ddosProtection, setDdosProtection] = useState({
    enabled: true,
    threshold: 1000,
    action: "rate-limit",
    autoMitigation: true
  });

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const [policiesRes, eventsRes, threatsRes] = await Promise.all([
        fetch(`${BASE_URL}/policies`),
        fetch(`${BASE_URL}/system-events`),
        fetch(`${BASE_URL}/threats`).catch(() => ({ ok: false })) // Handle if endpoint doesn't exist
      ]);

      if (policiesRes.ok) setPolicies(await policiesRes.json());
      if (eventsRes.ok) setEvents(await eventsRes.json());
      if (threatsRes.ok) setThreats(await threatsRes.json());
    } catch (error) {
      console.error("Error fetching security data:", error);
      showToast('error', 'Fetch Error', 'Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  // API Integration Endpoints
  const securityEndpoints = {
    // SOC Integration
    sendToSOC: async (data) => {
      try {
        const response = await fetch(`${BASE_URL}/security/soc/alert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        return response.ok;
      } catch (error) {
        console.error('SOC Integration Error:', error);
        return false;
      }
    },

    // GET endpoint for external threat analysis
    exportThreatData: async (filters = {}) => {
      try {
        const query = new URLSearchParams(filters).toString();
        const response = await fetch(`${BASE_URL}/security/threats/export?${query}`);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `threat-report-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      } catch (error) {
        console.error('Export Error:', error);
      }
    }
  };

  // Handle policy action (activate/deactivate)
  const handlePolicyAction = async (policyId, action) => {
    try {
      const response = await fetch(`${BASE_URL}/policies/${policyId}/${action}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const updated = await response.json();
        setPolicies(policies.map(p => p.id === policyId ? updated : p));
        showToast('success', 'Policy Updated', `Policy ${action === 'activate' ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error) {
      showToast('error', 'Update Failed', 'Could not update policy status');
    }
  };

  // Handle threat action
  const handleThreatAction = async (threatId, action) => {
    try {
      const response = await fetch(`${BASE_URL}/threats/${threatId}/${action}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const updated = await response.json();
        setThreats(threats.map(t => t.id === threatId ? updated : t));
        
        if (action === 'investigate') {
          const socResult = await securityEndpoints.sendToSOC(updated);
          if (socResult) {
            showToast('info', 'SOC Alert', 'Threat data sent to Security Operations Center');
          }
        }
      }
    } catch (error) {
      showToast('error', 'Action Failed', 'Could not process threat action');
    }
  };

  // Handle export threats
  const handleExportThreats = () => {
    securityEndpoints.exportThreatData({
      severity: 'High,Critical',
      date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      include_metadata: true
    });
  };

  // Handle policy update from modal
  const handlePolicyUpdated = (updatedPolicy) => {
    if (selectedPolicy) {
      // Editing existing policy
      setPolicies(prev => prev.map(p => p.id === updatedPolicy.id ? updatedPolicy : p));
    } else {
      // Adding new policy
      setPolicies(prev => [...prev, { ...updatedPolicy, id: Date.now().toString() }]);
    }
    setOpenModal(false);
    showToast('success', 'Policy Saved', 'Security policy has been saved successfully');
  };

  const filteredPolicies = policies.filter(policy =>
    policy.policyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    policy.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvents = events.filter(event =>
    event.eventTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.eventDescription?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const severityColor = {
    Critical: "bg-red-500 text-white",
    High: "bg-orange-500 text-white",
    Medium: "bg-yellow-500 text-gray-800",
    Low: "bg-blue-500 text-white",
    Info: "bg-gray-500 text-white"
  };

  const policyTypeColor = {
    firewall: "bg-red-100 text-red-800",
    access: "bg-blue-100 text-blue-800",
    compliance: "bg-green-100 text-green-800",
    network: "bg-purple-100 text-purple-800"
  };

  // Simple tabs component since we might not have shadcn tabs
  const Tabs = ({ children, value, onValueChange }) => {
    return (
      <div className="space-y-6">
        {children}
      </div>
    );
  };

  const TabsList = ({ children, className }) => {
    return (
      <div className={`flex space-x-2 border-b ${className}`}>
        {children}
      </div>
    );
  };

  const TabsTrigger = ({ children, value, className }) => {
    const isActive = activeTab === value;
    return (
      <button
        className={`px-4 py-2 font-medium ${isActive ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'} ${className}`}
        onClick={() => setActiveTab(value)}
      >
        {children}
      </button>
    );
  };

  const TabsContent = ({ children, value }) => {
    if (activeTab !== value) return null;
    return <div className="space-y-6">{children}</div>;
  };

  // Simple card components
  const Card = ({ children, className }) => (
    <div className={`bg-white border rounded-xl shadow-sm ${className}`}>
      {children}
    </div>
  );

  const CardContent = ({ children, className }) => (
    <div className={`p-6 ${className}`}>{children}</div>
  );

  const CardHeader = ({ children, className }) => (
    <div className={`border-b p-6 ${className}`}>{children}</div>
  );

  const CardTitle = ({ children, className }) => (
    <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
  );

  // Simple badge component
  const Badge = ({ children, className }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );

  // Simple input component
  const Input = ({ className, ...props }) => (
    <input
      className={`border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      {...props}
    />
  );

  // Simple label component
  const Label = ({ children, className, htmlFor }) => (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}>
      {children}
    </label>
  );

  // Simple switch component
  const Switch = ({ checked, onCheckedChange, id }) => (
    <button
      id={id}
      className={`relative inline-flex h-6 w-11 items-center rounded-full ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
      onClick={() => onCheckedChange(!checked)}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );

  // Simple alert component
  const Alert = ({ children, className }) => (
    <div className={`p-4 rounded-lg border ${className}`}>
      {children}
    </div>
  );

  const AlertTitle = ({ children }) => (
    <h4 className="font-semibold mb-1">{children}</h4>
  );

  const AlertDescription = ({ children }) => (
    <p className="text-sm">{children}</p>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Security Policy Management</h1>
          <p className="text-gray-600">Monitor, manage, and enforce security policies across your network</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSecurityData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Security Score</p>
                <h3 className="text-2xl font-bold">85/100</h3>
                <p className="text-xs text-green-500">+2 this week</p>
              </div>
              <ShieldCheck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Threats</p>
                <h3 className="text-2xl font-bold">{threats.filter(t => t.status === 'active').length}</h3>
                <p className="text-xs text-red-500">Real-time</p>
              </div>
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Policies Active</p>
                <h3 className="text-2xl font-bold">{policies.filter(p => p.isActive).length}/{policies.length}</h3>
                <p className="text-xs text-blue-500">Enforced</p>
              </div>
              <Settings className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Blocked Attacks</p>
                <h3 className="text-2xl font-bold">1,234</h3>
                <p className="text-xs text-green-500">Last 24h</p>
              </div>
              <Network className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">SOC Alerts</p>
                <h3 className="text-2xl font-bold">12</h3>
                <p className="text-xs text-orange-500">Pending review</p>
              </div>
              <Bell className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="policies">Security Policies</TabsTrigger>
          <TabsTrigger value="firewall">Firewall Rules</TabsTrigger>
          <TabsTrigger value="threats">Threat Management</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="protection">Protection Settings</TabsTrigger>
        </TabsList>

        {/* Search Bar */}
        <div className="flex items-center gap-4 mt-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search policies, events, or threats..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Policies Tab */}
        <TabsContent value="policies">
          <div className="flex justify-between items-center mt-6">
            <h2 className="text-xl font-semibold">Security Policies</h2>
            <Button onClick={() => { setSelectedPolicy(null); setOpenModal(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Policy
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filteredPolicies.map((policy) => (
              <Card key={policy.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{policy.policyName}</CardTitle>
                    <Badge className={policyTypeColor[policy.type] || "bg-gray-100"}>
                      {policy.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{policy.description || 'No description'}</p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status:</span>
                      <span className={`font-semibold ${policy.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {policy.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Priority:</span>
                      <Badge className={severityColor[policy.severity]}>
                        {policy.severity || 'Medium'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last Modified:</span>
                      <span>{policy.updatedAt ? new Date(policy.updatedAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => { setSelectedPolicy(policy); setOpenModal(true); }}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant={policy.isActive ? "outline" : "default"}
                      size="sm"
                      className="flex-1"
                      onClick={() => handlePolicyAction(policy.id, policy.isActive ? 'deactivate' : 'activate')}
                    >
                      {policy.isActive ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Activate
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Firewall Rules Tab */}
        <TabsContent value="firewall">
          <div className="flex justify-between items-center mt-6">
            <h2 className="text-xl font-semibold">Firewall Rules</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </div>

          <div className="space-y-4 mt-6">
            {firewallRules.map((rule) => (
              <div key={rule.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{rule.name}</h4>
                    <p className="text-sm text-gray-600">
                      Port: {rule.port} • Source: {rule.source} • Action: {rule.action}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) => {
                        setFirewallRules(rules =>
                          rules.map(r => r.id === rule.id ? { ...r, enabled: checked } : r)
                        );
                      }}
                    />
                    <Badge className={rule.action === 'allow' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {rule.action}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Alert className="mt-6 bg-yellow-50 border-yellow-200">
            <AlertTriangle className="w-4 h-4 text-yellow-600 inline mr-2" />
            <AlertTitle className="inline font-semibold">Firewall Configuration</AlertTitle>
            <AlertDescription className="mt-1">
              Configure trusted sites, untrusted networks, and access control rules.
              Rules are applied in order from top to bottom.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Threat Management Tab */}
        <TabsContent value="threats">
          <div className="flex justify-between items-center mt-6">
            <h2 className="text-xl font-semibold">Threat Management</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportThreats}>
                <Download className="w-4 h-4 mr-2" />
                Export for Analysis
              </Button>
              <Button variant="outline" onClick={() => securityEndpoints.sendToSOC({ type: 'full_scan' })}>
                <Activity className="w-4 h-4 mr-2" />
                Scan Network
              </Button>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            {threats.slice(0, 10).map((threat, index) => (
              <div key={threat.id || index} className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{threat.title || 'Unknown Threat'}</h4>
                      <Badge className={severityColor[threat.severity] || 'bg-gray-500'}>
                        {threat.severity || 'Medium'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{threat.description || 'No description available'}</p>
                    <div className="text-xs text-gray-500">
                      Source: {threat.sourceIp || 'Unknown'} • Detected: {threat.detectedAt ? new Date(threat.detectedAt).toLocaleString() : 'Unknown'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleThreatAction(threat.id || index, 'investigate')}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Investigate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleThreatAction(threat.id || index, 'block')}
                    >
                      <ShieldAlert className="w-4 h-4 mr-2" />
                      Block
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Protection Settings Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Brute Force Protection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="brute-force">Enable Protection</Label>
                  <Switch
                    id="brute-force"
                    checked={bruteForceProtection.enabled}
                    onCheckedChange={(checked) =>
                      setBruteForceProtection({ ...bruteForceProtection, enabled: checked })
                    }
                  />
                </div>
                <div>
                  <Label>Max Login Attempts</Label>
                  <Input
                    type="number"
                    value={bruteForceProtection.maxAttempts}
                    onChange={(e) =>
                      setBruteForceProtection({ ...bruteForceProtection, maxAttempts: parseInt(e.target.value) || 5 })
                    }
                  />
                </div>
                <div>
                  <Label>Lockout Time (seconds)</Label>
                  <Input
                    type="number"
                    value={bruteForceProtection.lockoutTime}
                    onChange={(e) =>
                      setBruteForceProtection({ ...bruteForceProtection, lockoutTime: parseInt(e.target.value) || 900 })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>DDoS Protection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ddos-protection">Enable Protection</Label>
                  <Switch
                    id="ddos-protection"
                    checked={ddosProtection.enabled}
                    onCheckedChange={(checked) =>
                      setDdosProtection({ ...ddosProtection, enabled: checked })
                    }
                  />
                </div>
                <div>
                  <Label>Request Threshold (per second)</Label>
                  <Input
                    type="number"
                    value={ddosProtection.threshold}
                    onChange={(e) =>
                      setDdosProtection({ ...ddosProtection, threshold: parseInt(e.target.value) || 1000 })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-mitigation">Auto Mitigation</Label>
                  <Switch
                    id="auto-mitigation"
                    checked={ddosProtection.autoMitigation}
                    onCheckedChange={(checked) =>
                      setDdosProtection({ ...ddosProtection, autoMitigation: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Events Tab */}
        <TabsContent value="events">
          <h2 className="text-xl font-semibold mt-6">Security Events</h2>
          <div className="space-y-4 mt-6">
            {filteredEvents.slice(0, 20).map((event, index) => (
              <div key={event.id || index} className="bg-white border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{event.eventTitle}</h4>
                      <Badge className={severityColor[event.severity]}>
                        {event.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{event.eventDescription}</p>
                    <div className="text-xs text-gray-500">
                      {event.timeStamp ? new Date(event.timeStamp).toLocaleString() : 'Unknown date'} • Source: {event.source || 'System'}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => securityEndpoints.sendToSOC(event)}
                  >
                    Report to SOC
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Protection Settings Tab */}
        <TabsContent value="protection">
          <h2 className="text-xl font-semibold mt-6">Network Protection Settings</h2>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>API Endpoints for External Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <code className="text-sm">
                    GET {BASE_URL}/security/threats/export?format=json&date_from=YYYY-MM-DD
                  </code>
                  <p className="text-sm text-gray-600 mt-1">Export threat data for external analysis</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <code className="text-sm">
                    POST {BASE_URL}/security/soc/alert
                  </code>
                  <p className="text-sm text-gray-600 mt-1">Send alerts to Security Operations Center</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <code className="text-sm">
                    GET {BASE_URL}/security/policies/active
                  </code>
                  <p className="text-sm text-gray-600 mt-1">Retrieve active security policies</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert className="mt-6 bg-blue-50 border-blue-200">
            <AlertTriangle className="w-4 h-4 text-blue-600 inline mr-2" />
            <AlertTitle className="inline font-semibold">Security Integration Ready</AlertTitle>
            <AlertDescription className="mt-1">
              This system is configured to integrate with external SOC teams and threat analysis platforms.
              Use the API endpoints above to export data for investigation.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      {/* Edit Policy Modal */}
      <EditSecurityPolicyModal
        policy={selectedPolicy}
        open={openModal}
        onOpenChange={setOpenModal}
        onPolicyUpdated={handlePolicyUpdated}  // Fixed: Now defined
      />

      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-center">Loading security data...</p>
          </div>
        </div>
      )}
    </div>
  );
}