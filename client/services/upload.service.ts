import { getSupabaseClient } from "@/lib/supabase/client";
import { FileType, UploadOptions, UploadResponse } from "../types/upload.types";

type StorageBucket = "avatars" | "cook-portfolio" | "cook-documents";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export class UploadService {
  private static resolveBucket(options?: UploadOptions): StorageBucket {
    if (options?.bucket) return options.bucket;
    if (
      options?.folder === "documents" ||
      options?.resourceType === "document"
    ) {
      return "cook-documents";
    }
    if (options?.folder === "avatars") return "avatars";
    return "cook-portfolio";
  }

  private static buildPath(
    file: File,
    bucket: StorageBucket,
    options?: UploadOptions,
  ): string {
    const prefix = options?.pathPrefix ?? "uploads";
    const safeName = `${Date.now()}-${sanitizeFilename(file.name)}`;
    if (bucket === "cook-documents" && options?.documentType) {
      const docFolder = options.documentType.replace(/\s+/g, "_").toLowerCase();
      return `${prefix}/${docFolder}/${safeName}`;
    }
    return `${prefix}/${safeName}`;
  }

  private static async resolveUrl(
    bucket: StorageBucket,
    path: string,
  ): Promise<string> {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase is not configured.");

    if (bucket === "cook-documents") {
      const { data, error } = await client.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60);
      if (error) throw new Error(error.message);
      return data.signedUrl;
    }

    const { data } = client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  private static async _upload(
    file: File,
    options?: UploadOptions,
    onProgress?: (progress: number) => void,
  ): Promise<UploadResponse> {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error(
        "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      );
    }

    const bucket = this.resolveBucket(options);
    const path = this.buildPath(file, bucket, options);

    onProgress?.(15);

    const { error } = await client.storage.from(bucket).upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

    if (error) throw new Error(error.message);

    onProgress?.(85);
    const url = await this.resolveUrl(bucket, path);
    onProgress?.(100);

    return {
      id: crypto.randomUUID(),
      url,
      publicId: `${bucket}/${path}`,
      storagePath: path,
      bucket,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      provider: "supabase",
    };
  }

  static async uploadImage(
    file: File,
    onProgress?: (progress: number) => void,
    options?: Omit<UploadOptions, "resourceType">,
  ): Promise<UploadResponse> {
    return this._upload(file, { ...options, resourceType: "image" }, onProgress);
  }

  static async uploadDocument(
    file: File,
    onProgress?: (progress: number) => void,
    options?: Omit<UploadOptions, "resourceType">,
  ): Promise<UploadResponse> {
    return this._upload(file, { ...options, resourceType: "document" }, onProgress);
  }

  static async deleteUpload(publicId: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    const slash = publicId.indexOf("/");
    if (slash < 0) return false;

    const bucket = publicId.slice(0, slash) as StorageBucket;
    const path = publicId.slice(slash + 1);

    const { error } = await client.storage.from(bucket).remove([path]);
    return !error;
  }

  static async refreshSignedUrl(
    bucket: StorageBucket,
    path: string,
  ): Promise<string> {
    return this.resolveUrl(bucket, path);
  }
}
