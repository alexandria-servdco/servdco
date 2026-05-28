export type FileType = "image" | "document" | "auto";
export type UploadStatus = "idle" | "uploading" | "success" | "error";

export interface UploadResponse {
  id: string; // Internal ID or random UUID for the mock
  url: string; // The Cloudinary secure_url
  publicId: string; // Cloudinary public_id
  filename: string; // Original filename
  mimeType: string;
  size: number; // bytes
  uploadedAt: string; // ISO date string
  provider: "cloudinary";
}

export interface UploadError {
  message: string;
  code?: string;
}

export interface UploadOptions {
  folder?: string;
  tags?: string[];
  resourceType?: FileType; // cloudinary resource_type: "image" | "raw" | "auto"
}
