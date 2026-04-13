import { SettingsConfigurationModel, ISettingsConfiguration } from "@/data/models/settings.model";

export class MongoSettingsRepository {
  async getSettings(): Promise<ISettingsConfiguration | null> {
    return await SettingsConfigurationModel.findOne({}).exec();
  }

  async upsertSettings(
    updaterId: string,
    updates: Partial<ISettingsConfiguration>
  ): Promise<ISettingsConfiguration> {
    const settings = await this.getSettings();
    if (!settings) {
      // Create singleton
      const newSettings = new SettingsConfigurationModel({
        ...updates,
        updatedBy: updaterId,
      });
      return await newSettings.save();
    }

    Object.assign(settings, updates);
    settings.updatedBy = updaterId;
    return await settings.save();
  }

  async updateLastBackupRun(): Promise<void> {
    await SettingsConfigurationModel.updateOne(
      {},
      { $set: { "backup.lastRunAt": new Date() } }
    ).exec();
  }
}
