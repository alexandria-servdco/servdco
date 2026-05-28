import { useState, useCallback } from "react";
import { UploadResponse, UploadStatus, UploadOptions } from "../types/upload.types";
import { UploadService } from "../services/upload.service";
import { validateDocument } from "../utils/validateFile";

interface UseFileUploadReturn {
  status: UploadStatus;
  progress: number;
  error: string | null;
  result: UploadResponse | null;
  upload: (file: File, options?: UploadOptions) => Promise<UploadResponse | null>;
  reset: () => void;
  remove: () => Promise<void>;
}

export const useFileUpload = (): UseFileUploadReturn => {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);

  const remove = useCallback(async () => {
    if (result) {
      await UploadService.deleteUpload(result.publicId);
      reset();
    }
  }, [result, reset]);

  const upload = useCallback(async (file: File, options?: UploadOptions): Promise<UploadResponse | null> => {
    // 1. Validate
    const validation = validateDocument(file);
    if (!validation.isValid) {
      setStatus("error");
      setError(validation.error || "Invalid file");
      return null;
    }

    // 2. Start upload
    setStatus("uploading");
    setProgress(0);
    setError(null);

    try {
      const response = await UploadService.uploadDocument(
        file,
        (p) => setProgress(p),
        options
      );

      setStatus("success");
      setProgress(100);
      setResult(response);
      return response;
    } catch (err: any) {
      setStatus("error");
      setError(err.message || "Failed to upload file");
      setProgress(0);
      return null;
    }
  }, []);

  return {
    status,
    progress,
    error,
    result,
    upload,
    reset,
    remove,
  };
};
