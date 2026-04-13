import mongoose, { Schema, Document } from "mongoose";

export interface ISettingsConfiguration extends Document {
  environmentVersion: string;
  backup: {
    destination: "local" | "cloud" | "both";
    active: boolean;
    lastRunAt: Date | null;
  };
  cron: {
    activeInterval: "minutely" | "hourly" | "daily" | "monthly" | "none";
    timezone: string;
  };
  updatedAt: Date;
  updatedBy: string;
}

const SettingsConfigurationSchema = new Schema<ISettingsConfiguration>({
  environmentVersion: { type: String, required: true, default: "1.0.0" },
  backup: {
    destination: { type: String, enum: ["local", "cloud", "both"], default: "cloud" },
    active: { type: Boolean, default: true },
    lastRunAt: { type: Date, default: null },
  },
  cron: {
    activeInterval: { type: String, enum: ["minutely", "hourly", "daily", "monthly", "none"], default: "none" },
    timezone: { type: String, default: "UTC" },
  },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: String, required: true },
}, {
  timestamps: true,
});

export const SettingsConfigurationModel =
  mongoose.models.SettingsConfiguration ||
  mongoose.model<ISettingsConfiguration>("SettingsConfiguration", SettingsConfigurationSchema);
