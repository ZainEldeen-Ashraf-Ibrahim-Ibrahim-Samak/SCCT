"use client";

import { useAdminSettings, SettingsState } from "@/presentation/view-models/use-admin-settings";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function SettingsForm() {
  const { settings, isLoading, isSaving, isBackingUp, saveSettings, triggerBackup } = useAdminSettings();
  const [localState, setLocalState] = useState<SettingsState | null>(null);

  useEffect(() => {
    if (settings) {
      setLocalState(settings);
    }
  }, [settings]);

  if (isLoading) return <div className="p-4 animate-pulse">Loading core system settings...</div>;
  if (!localState) return <div className="p-4 text-red-500">Failed to load system settings.</div>;

  const handleCronChange = (val: SettingsState["cron"]["activeInterval"]) => {
    setLocalState({
      ...localState,
      cron: { ...localState.cron, activeInterval: val }
    });
  };

  const handleDestChange = (val: SettingsState["backup"]["destination"]) => {
    setLocalState({
      ...localState,
      backup: { ...localState.backup, destination: val }
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
      <div>
        <h2 className="text-xl font-bold tracking-tight">System Settings & Backups</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Configure automated procedures and enforce strict DB replication strategies.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-2">
            Automated Backups (Cron)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {["none", "minutely", "hourly", "daily", "monthly"].map(interval => (
              <Button
                key={interval}
                variant={localState.cron.activeInterval === interval ? "default" : "outline"}
                onClick={() => handleCronChange(interval as any)}
                className="capitalize text-xs"
              >
                {interval}
              </Button>
            ))}
          </div>
          <p className="text-xs text-zinc-500">Only one logical interval dictates the global automation.</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-2">
            Backup Storage Destination
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {["cloud", "local", "both"].map(dest => (
              <Button
                key={dest}
                variant={localState.backup.destination === dest ? "default" : "outline"}
                onClick={() => handleDestChange(dest as any)}
                className="capitalize text-xs"
              >
                {dest === "cloud" ? "Cloudinary Blob" : dest === "local" ? "Native Server Storage" : "Enforce Both"}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-4">
          <Button disabled={isSaving} onClick={() => saveSettings(localState)}>
            {isSaving ? "Saving Config..." : "Save Active Policy"}
          </Button>

          <Button variant="secondary" disabled={isBackingUp} onClick={triggerBackup}>
            {isBackingUp ? "Streaming Blob..." : "Force Execute Native Backup Now"}
          </Button>
        </div>
        
        {settings?.backup.lastRunAt && (
          <span className="text-xs text-zinc-400">
            Last successful mirror: {new Date(settings.backup.lastRunAt).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}
