
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { PlansManagement } from "../../components/billing/PlansManagement";
import { UserBilling } from "../../components/billing/UserBilling";
import { RevenueDashboard } from "../../components/billing/RevenueDashboard";
import { AdRevenue } from "../../components/billing/AdRevenue";
import { BarChart3, CreditCard, Settings, TrendingUp, Zap } from "lucide-react";

export default function BillingDashboard() {
  return (
    <div className="min-h-screen bg-dashboard-content">
      <div className="flex">


        {/* Main Content */}
        <div className="flex-1 p-8">
          <Tabs defaultValue="plans" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="plans">Plans Management</TabsTrigger>
              <TabsTrigger value="billing">User Billing</TabsTrigger>
              <TabsTrigger value="revenue">Revenue Dashboard</TabsTrigger>
              <TabsTrigger value="ads">Ad Revenue</TabsTrigger>
            </TabsList>

            <TabsContent value="plans" className="space-y-6">
              <PlansManagement />
            </TabsContent>

            <TabsContent value="billing" className="space-y-6">
              <UserBilling />
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6">
              <RevenueDashboard />
            </TabsContent>

            <TabsContent value="ads" className="space-y-6">
              <AdRevenue />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
