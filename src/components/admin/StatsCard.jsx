import { Card, CardContent } from "../../components/ui/card";
import { cn } from "../../lib/utils";

export function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  className,
}) {
  return (
    <Card className={cn("shadow-card hover:shadow-elevated transition-shadow duration-200", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {change && (
              <p
                className={cn(
                  "text-xs font-medium flex items-center gap-1",
                  changeType === "positive" && "text-success",
                  changeType === "negative" && "text-destructive",
                  changeType === "neutral" && "text-muted-foreground"
                )}
              >
                {change}
              </p>
            )}
          </div>

          {Icon && (
            <div
              className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center",
                "bg-gradient-to-br from-primary/10 to-primary/5"
              )}
            >
              <Icon className="w-6 h-6 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
