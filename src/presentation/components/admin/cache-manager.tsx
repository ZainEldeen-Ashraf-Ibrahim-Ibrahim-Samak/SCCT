"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Trash2, 
  RefreshCcw, 
  ShieldAlert,
  Server,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { getCacheStats, clearCacheGroup } from "@/domain/use-cases/admin/manage-cache";

interface CacheStat {
  label: string;
  count: number;
  color: string;
}

export function CacheManager() {
  const t = useTranslations("cache");
  const [stats, setStats] = useState<{ available: boolean; totalKeys: number; segments: CacheStat[] } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsRefreshing(true);
    try {
      const data = await getCacheStats();
      setStats(data);
    } catch (error) {
      toast.error("Failed to refresh statistics");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleClear = async (type: "all" | "forms" | "submissions") => {
    if (!confirm(t("confirmClear"))) return;
    
    setIsClearing(type);
    try {
      const result = await clearCacheGroup(type);
      if (result.success) {
        toast.success(result.message);
        fetchStats();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An error occurred during cleanup");
    } finally {
      setIsClearing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("status")}</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">
              {stats?.available ? (
                <span className="text-emerald-500 font-medium">{t("connected")}</span>
              ) : (
                <span className="text-destructive font-medium">{t("disconnected")}</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalKeys")}</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">{stats?.totalKeys || 0}</div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stats")}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            {stats?.segments.map((seg, i) => (
              <div key={i} className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground truncate">{seg.label}</span>
                  <span className="font-medium">{seg.count}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500" 
                    style={{ 
                      width: `${(seg.count / (stats.totalKeys || 1)) * 100}%`,
                      backgroundColor: `var(--${seg.color}-500, #3b82f6)`
                    }} 
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Maintenance Operations
          </CardTitle>
          <CardDescription>
            Perform maintenance and data synchronization by clearing specific cache segments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleClear("forms")}
              disabled={isClearing !== null || !stats?.available}
            >
              <RefreshCcw className={`mr-2 h-4 w-4 ${isClearing === "forms" ? "animate-spin" : ""}`} />
              {t("clearForms")}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => handleClear("submissions")}
              disabled={isClearing !== null || !stats?.available}
            >
              <RefreshCcw className={`mr-2 h-4 w-4 ${isClearing === "submissions" ? "animate-spin" : ""}`} />
              {t("clearSubmissions")}
            </Button>

            <Button 
              variant="destructive" 
              onClick={() => handleClear("all")}
              disabled={isClearing !== null || !stats?.available}
            >
              <Trash2 className={`mr-2 h-4 w-4 ${isClearing === "all" ? "animate-spin" : ""}`} />
              {t("clearAll")}
            </Button>

            <Button 
              variant="ghost" 
              onClick={fetchStats}
              disabled={isRefreshing}
            >
              <RefreshCcw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh Stats
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
