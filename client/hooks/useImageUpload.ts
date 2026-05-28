import { useState, useCallback, useEffect } from "react";
import { UploadResponse, UploadStatus, UploadOptions } from "../types/upload.types";
import { UploadService } from "../services/upload.service";
import { validateImage } from "../utils/validateFile";
import { compressImage } from "../utils/compressImage";
import { generatePreview, revokePreview } from "../utils/generatePreview";

interface UseImageUploadReturn {
  status: UploadStatus;
  progress: number;
  error: string | null;
  result: UploadResponse | null;
  previewUrl: string | null;
  upload: (file: File, options?: UploadOptions) => Promise<UploadResponse | null>;
  reset: () => void;
  remove: () => Promise<void>;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        revokePreview(previewUrl);
      }
    };
  }, [previewUrl]);

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setError(null);
    setResult(null);
    if (previewUrl) {
      revokePreview(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  const remove = useCallback(async () => {
    if (result) {
      await UploadService.deleteUpload(result.publicId);
      reset();
    }
  }, [result, reset]);

  const upload = useCallback(async (file: File, options?: UploadOptions): Promise<UploadResponse | null> => {
    // 1. Validate
    const validation = validateImage(file);
    if (!validation.isValid) {
      setStatus("error");
      setError(validation.error || "Invalid file");
      return null;
    }

    setStatus("uploading");
    setProgress(0);
    setError(null);

    try {
      // 2. Generate local preview immediately for UX
      const url = await generatePreview(file);
      setPreviewUrl(url);

      // 3. Compress
      const compressed = await compressImage(file);

      // 4. Upload
      const response = await UploadService.uploadImage(
        compressed,
        (p) => setProgress(p),
        options
      );

      setStatus("success");
      setProgress(100);
      setResult(response);
      return response;
    } catch (err: any) {
      setStatus("error");
      setError(err.message || "Failed to upload image");
      setProgress(0);
      return null;
    }
  }, []);

  return {
    status,
    progress,
    error,
    result,
    previewUrl,
    upload,
    reset,
    remove,
  };
};
