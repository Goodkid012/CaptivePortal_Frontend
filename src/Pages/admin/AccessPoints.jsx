import { useState, useEffect } from "react";
import { StatsCard } from "../../components/admin/StatsCard";
import { Wifi, WifiOff, Plus, Activity } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { AddAccessPointModal } from "../../components/modals/AddAccessPointModal";
import { ManageAccessPointModal } from "../../components/modals/ManageAccessPointModal";
import { useToastNotification } from "../../hooks/useToastNotification";
import { BASE_URL } from "../../api/api"

const initialAccessPoints = [];


  

export default function AccessPoints() {
  const [accessPoints, setAccessPoints] = useState(initialAccessPoints);
  const [managingAP, setManagingAP] = useState(null);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const total = accessPoints.length;
  const online = accessPoints.filter(ap => ap.isActive).length;
  const offline = total - online;
  const avgLoad =
    total > 0
      ? Math.round(
          accessPoints.reduce((sum, ap) => sum + (ap.load || 0), 0) / total
        )
      : 0;
  const uptimePercent =
    total > 0 ? Math.round((online / total) * 100) : 0;

  const { showSuccess } = useToastNotification();
  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/access-points`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setAccessPoints(data);
      } catch (error) {
        console.error("fetch error:", error);
      }
    };
    fetchPoints();
  }, []);

const handleManageAP = (ap) => {
  setManagingAP(ap);
  setManageModalOpen(true);
  showSuccess(`Managing ${ap.name}`); 
};



  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Access Points</h1>
            <p className="text-muted-foreground mt-1">Monitor and manage Wi-Fi access points</p>
          </div>
          <AddAccessPointModal onAccessPointAdded={(ap) => setAccessPoints(prev => [...prev, ap])} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Total Access Points"
        value={total}
        change={`${online > 0 ? "+" + online : "0"} active`}
        changeType="positive"
        icon={Wifi}
          />
          <StatsCard
           title="Online"
        value={online}
        change={`${uptimePercent}% uptime`}
        changeType="positive"
        icon={Activity}
          />
          <StatsCard
          title="Offline"
        value={offline}
        change="Maintenance required"
        changeType={offline > 0 ? "neutral" : "positive"}
        icon={WifiOff}
          />
          <StatsCard
                 title="Average Load"
        value={`${avgLoad}%`}
        change="Optimal performance"
        changeType={avgLoad < 80 ? "positive" : "neutral"}
        icon={Activity}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accessPoints.map((ap) => (
            <Card key={ap.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{ap.name}</CardTitle>
                <Badge variant={ap.isActive ? 'default' : 'destructive'}>
                  {ap.isActive ? 'Online' : 'Offline'}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{ap.location.street}</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Uptime</span>
                      <span>{ap.uptime}%</span>
                    </div>
                    <Progress value={ap.uptime} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Connected Users:</span>
                    <span className="font-medium">{ap.users || 0}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleManageAP(ap)}
                  >
                    Manage AP
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <ManageAccessPointModal
          accessPoint={managingAP}
          open={manageModalOpen}
          onOpenChange={setManageModalOpen}
          onAccessPointUpdated={(updatedAP) => {
            setAccessPoints(prev => prev.map(ap => ap.id === updatedAP.id ? updatedAP : ap));
          }}
        />
      </div>
  );
}
