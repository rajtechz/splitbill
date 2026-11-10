/**
 * SplitMate Flexible Storage Provider
 * Supports:
 *  - Local File System Storage (Default dev mode)
 *  - AWS S3 / Cloudinary Stub (Production mode)
 */

import fs from 'fs';
import path from 'path';

export interface UploadOptions {
  fileName?: string;
  mimeType?: string;
}

export interface IStorageProvider {
  uploadBase64(base64Data: string, prefix: string, options?: UploadOptions): Promise<string>;
  deleteFile(fileUrl: string): Promise<boolean>;
}

export class LocalStorageProvider implements IStorageProvider {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.resolve(process.cwd(), 'data', 'uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      try {
        fs.mkdirSync(this.uploadsDir, { recursive: true });
      } catch (err) {
        console.warn('[Storage] Failed to create uploads dir:', err);
      }
    }
  }

  async uploadBase64(base64Data: string, prefix: string, options?: UploadOptions): Promise<string> {
    // If it's already a full HTTP URL, return as is
    if (base64Data.startsWith('http://') || base64Data.startsWith('https://')) {
      return base64Data;
    }

    try {
      // Strip base64 prefix if present (e.g. data:image/png;base64,...)
      const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      const ext = options?.mimeType?.split('/')[1] || 'jpg';
      const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
      const filePath = path.join(this.uploadsDir, fileName);

      fs.writeFileSync(filePath, buffer);

      // Return public URL path
      return `/uploads/${fileName}`;
    } catch (err) {
      console.error('[Storage] Error saving file locally:', err);
      // Fallback: return as base64 data URI directly so image display never breaks
      return base64Data;
    }
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      if (fileUrl.startsWith('/uploads/')) {
        const fileName = path.basename(fileUrl);
        const filePath = path.join(this.uploadsDir, fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }
}

export class S3StorageProvider implements IStorageProvider {
  private local = new LocalStorageProvider();

  async uploadBase64(base64Data: string, prefix: string, options?: UploadOptions): Promise<string> {
    if (!process.env.AWS_S3_BUCKET) {
      return this.local.uploadBase64(base64Data, prefix, options);
    }
    // Future expansion: call s3.putObject(...)
    return this.local.uploadBase64(base64Data, prefix, options);
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    return this.local.deleteFile(fileUrl);
  }
}

export const storageProvider: IStorageProvider = new LocalStorageProvider();

