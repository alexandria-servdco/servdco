export type FileType = "image" | "document" | "auto";
export type UploadStatus = "idle" | "uploading" | "success" | "error";
export type StorageBucket = "avatars" | "cook-portfolio" | "cook-documents";

export interface UploadResponse {
  id: string;
  url: string;
  publicId: string;
  storagePath: string;
  bucket: StorageBucket;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  provider: "supabase";
}

export interface UploadError {
  message: string;
  code?: string;
}

export interface UploadOptions {
  folder?: string;
  tags?: string[];
  resourceType?: FileType;
  bucket?: StorageBucket;
  pathPrefix?: string;
  documentType?: string;
}
