import { BackupLogModel, IBackupLog } from "@/data/models/backup-log.model";

export class MongoBackupRepository {
  async logBackup(data: Partial<IBackupLog>): Promise<IBackupLog> {
    const log = new BackupLogModel(data);
    return await log.save();
  }

  async getRecentLogs(limit = 10): Promise<IBackupLog[]> {
    return await BackupLogModel.find({}).sort({ timestamp: -1 }).limit(limit).exec();
  }
}
