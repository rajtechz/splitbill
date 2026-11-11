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
exports.storageProvider = exports.getStorageProvider = exports.S3StorageProvider = exports.CloudinaryStorageProvider = exports.LocalStorageProvider = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cloudinary_1 = require("cloudinary");
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
class CloudinaryStorageProvider {
    local = new LocalStorageProvider();
    constructor() {
        if (process.env.CLOUDINARY_CLOUD_NAME) {
            cloudinary_1.v2.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
                secure: true,
            });
            console.log('☁️ [CLOUDINARY] Connected to cloud storage for receipts & avatars:', process.env.CLOUDINARY_CLOUD_NAME);
        }
    }
    async uploadBase64(base64Data, prefix, options) {
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            return this.local.uploadBase64(base64Data, prefix, options);
        }
        try {
            const dataUri = base64Data.startsWith('data:')
                ? base64Data
                : `data:${options?.mimeType || 'image/jpeg'};base64,${base64Data}`;
            const res = await cloudinary_1.v2.uploader.upload(dataUri, {
                folder: `splitmate/${prefix}`,
                resource_type: 'auto',
            });
            return res.secure_url;
        }
        catch (err) {
            console.warn('⚠️ [CLOUDINARY UPLOAD NOTICE - FALLBACK LOCAL]', err.message);
            return this.local.uploadBase64(base64Data, prefix, options);
        }
    }
    async deleteFile(fileUrl) {
        try {
            if (fileUrl.includes('cloudinary.com')) {
                const parts = fileUrl.split('/');
                const fileWithExt = parts.slice(-2).join('/');
                const publicId = fileWithExt.substring(0, fileWithExt.lastIndexOf('.'));
                await cloudinary_1.v2.uploader.destroy(publicId);
                return true;
            }
            return this.local.deleteFile(fileUrl);
        }
        catch {
            return false;
        }
    }
}
exports.CloudinaryStorageProvider = CloudinaryStorageProvider;
class S3StorageProvider {
    local = new LocalStorageProvider();
    async uploadBase64(base64Data, prefix, options) {
        if (!process.env.AWS_S3_BUCKET) {
            return this.local.uploadBase64(base64Data, prefix, options);
        }
        return this.local.uploadBase64(base64Data, prefix, options);
    }
    async deleteFile(fileUrl) {
        return this.local.deleteFile(fileUrl);
    }
}
exports.S3StorageProvider = S3StorageProvider;
const getStorageProvider = () => {
    const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
    switch (provider) {
        case 'cloudinary':
            return new CloudinaryStorageProvider();
        case 's3':
            return new S3StorageProvider();
        case 'local':
        default:
            if (process.env.CLOUDINARY_CLOUD_NAME) {
                return new CloudinaryStorageProvider();
            }
            return new LocalStorageProvider();
    }
};
exports.getStorageProvider = getStorageProvider;
exports.storageProvider = (0, exports.getStorageProvider)();
