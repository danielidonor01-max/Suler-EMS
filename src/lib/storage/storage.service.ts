import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Storage Service Abstraction
 * Currently handles local file storage in public/storage/reports.
 * Prepared for S3/R2 migration.
 */
export class StorageService {
  private static STORAGE_ROOT = path.join(process.cwd(), 'public', 'storage', 'reports');

  /**
   * Save a buffer or string to secure storage
   */
  static async saveReport(content: Buffer | string, extension: string): Promise<string> {
    // Ensure directory exists
    if (!fs.existsSync(this.STORAGE_ROOT)) {
      fs.mkdirSync(this.STORAGE_ROOT, { recursive: true });
    }

    const filename = `${uuidv4()}.${extension}`;
    const filePath = path.join(this.STORAGE_ROOT, filename);

    await fs.promises.writeFile(filePath, content);

    // Return the relative URL/Path for later retrieval
    return `/api/reports/download/${filename.split('.')[0]}`;
  }

  /**
   * Get physical file path for a jobId/secureId
   */
  static getFilePath(secureId: string): string | null {
    // Audit check: we should probably store the filename in DB, 
    // but for now we look for any file starting with this UUID.
    const files = fs.readdirSync(this.STORAGE_ROOT);
    const filename = files.find(f => f.startsWith(secureId));
    
    if (!filename) return null;
    return path.join(this.STORAGE_ROOT, filename);
  }

  /**
   * Delete a report
   */
  static async deleteReport(secureId: string): Promise<void> {
    const filePath = this.getFilePath(secureId);
    if (filePath && fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }
}
