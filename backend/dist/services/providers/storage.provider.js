"use strict";
/**
 * SplitMate Flexible Storage Provider
 * Supports:
 *  - Local File System Storage (Default dev mode)
 *  - AWS S3 / Cloudinary Stub (Production mode)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageProvider = exports.S3StorageProvider = exports.LocalStorageProvider = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class LocalStorageProvider {
    uploadsDir;
    constructor() {
        this.uploadsDir = path_1.default.resolve(process.cwd(), 'data', 'uploads');
        if (!fs_1.default.existsSync(this.uploadsDir)) {
            try {
                fs_1.default.mkdirSync(this.uploadsDir, { recursive: true });
            }
            catch (err) {
                console.warn('[Storage] Failed to create uploads dir:', err);
            }
        }
    }
    async uploadBase64(base64Data, prefix, options) {
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
            const filePath = path_1.default.join(this.uploadsDir, fileName);
            fs_1.default.writeFileSync(filePath, buffer);
            // Return public URL path
            return `/uploads/${fileName}`;
        }
        catch (err) {
            console.error('[Storage] Error saving file locally:', err);
            // Fallback: return as base64 data URI directly so image display never breaks
            return base64Data;
        }
    }
    async deleteFile(fileUrl) {
        try {
            if (fileUrl.startsWith('/uploads/')) {
                const fileName = path_1.default.basename(fileUrl);
                const filePath = path_1.default.join(this.uploadsDir, fileName);
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                    return true;
                }
            }
            return false;
        }
        catch {
            return false;
        }
    }
}
exports.LocalStorageProvider = LocalStorageProvider;
class S3StorageProvider {
    local = new LocalStorageProvider();
    async uploadBase64(base64Data, prefix, options) {
        if (!process.env.AWS_S3_BUCKET) {
            return this.local.uploadBase64(base64Data, prefix, options);
        }
        // Future expansion: call s3.putObject(...)
        return this.local.uploadBase64(base64Data, prefix, options);
    }
    async deleteFile(fileUrl) {
        return this.local.deleteFile(fileUrl);
    }
}
exports.S3StorageProvider = S3StorageProvider;
exports.storageProvider = new LocalStorageProvider();
