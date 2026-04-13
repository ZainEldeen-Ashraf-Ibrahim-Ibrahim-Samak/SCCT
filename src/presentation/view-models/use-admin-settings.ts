import { useState, useEffect } from "react";
import { toast } from "sonner";

export interface SettingsState {
  backup: {
    destination: "local" | "cloud" | "both";
    active: boolean;
    lastRunAt: string | null;
  };
  cron: {
    activeInterval: "minutely" | "hourly" | "daily" | "monthly" | "none";
    timezone: string;
  };
}

export function useAdminSettings() {
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      const data = await res.json();
      
      if (data.data) {
        setSettings({
          backup: data.data.backup || { destination: "cloud", active: true, lastRunAt: null },
          cron: data.data.cron || { activeInterval: "none", timezone: "UTC" }
        });
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveSettings = async (newSettings: SettingsState) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });

      if (!res.ok) throw new Error("Failed to save settings");
      setSettings(newSettings);
      toast.success("Settings updated successfully");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const triggerBackup = async () => {
    setIsBackingUp(true);
    const toastId = toast.loading("Executing database backup...");
    try {
      const res = await fetch("/api/admin/backups", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Backup failed");
      
      toast.success("Backup securely exported!", { id: toastId });
      // Refresh to update lastRunAt
      await fetchSettings();
    } catch (e: any) {
      toast.error(e.message, { id: toastId });
    } finally {
      setIsBackingUp(false);
    }
  };

  return {
    settings,
    isLoading,
    isSaving,
    isBackingUp,
    saveSettings,
    triggerBackup
  };
}
