import { FileType, UploadOptions, UploadResponse } from "../types/upload.types";

export class UploadService {
  private static getCloudName(): string {
    return (
      (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string) ||
      (import.meta.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string) ||
      ""
    );
  }

  private static getUploadPreset(): string {
    return (
      (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string) ||
      (import.meta.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string) ||
      ""
    );
  }

  private static async _upload(
    file: File,
    options: UploadOptions,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    const cloudName = this.getCloudName();
    const preset = this.getUploadPreset();

    if (!cloudName || !preset) {
      throw new Error(
        "Cloudinary environment variables are missing. Please configure VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET."
      );
    }

    const resourceType = options.resourceType === "auto" ? "auto" : options.resourceType === "document" ? "raw" : "image";
    
    // Cloudinary upload URL for unsigned uploads
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const fd = new FormData();
      
      fd.append("upload_preset", preset);
      fd.append("file", file);
      
      if (options.folder) {
        fd.append("folder", options.folder);
      }
      if (options.tags && options.tags.length > 0) {
        fd.append("tags", options.tags.join(","));
      }

      xhr.open("POST", url, true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve({
            id: crypto.randomUUID(), // Mock internal ID for backend readiness
            url: response.secure_url,
            publicId: response.public_id,
            filename: file.name,
            mimeType: file.type,
            size: response.bytes,
            uploadedAt: new Date(response.created_at).toISOString(),
            provider: "cloudinary",
          });
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error?.message || "Upload failed"));
          } catch {
            reject(new Error("Upload failed with status " + xhr.status));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error during upload"));
      };

      xhr.onabort = () => {
        reject(new Error("Upload aborted"));
      };

      xhr.send(fd);
    });
  }

  static async uploadImage(
    file: File,
    onProgress?: (progress: number) => void,
    options?: Omit<UploadOptions, "resourceType">
  ): Promise<UploadResponse> {
    return this._upload(file, { ...options, resourceType: "image" }, onProgress);
  }

  static async uploadDocument(
    file: File,
    onProgress?: (progress: number) => void,
    options?: Omit<UploadOptions, "resourceType">
  ): Promise<UploadResponse> {
    // If it's a PDF or non-image, we should upload as "raw" or "auto"
    // Cloudinary supports 'auto' which handles images and raw files like PDFs automatically.
    return this._upload(file, { ...options, resourceType: "auto" }, onProgress);
  }

  // Deletion without a signed backend requires either the token returned during upload
  // (if return_delete_token is set in preset) or a backend call. For the MVP frontend,
  // we mock this so it doesn't break the UI flow.
  static async deleteUpload(publicId: string): Promise<boolean> {
    // True deletion requires backend signature.
    return new Promise((resolve) => setTimeout(() => resolve(true), 500));
  }
}
