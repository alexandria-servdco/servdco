import { useEffect } from "react";
import { useFileUpload } from "../../hooks/useFileUpload";
import { UploadDropzone } from "./UploadDropzone";
import { UploadProgress } from "./UploadProgress";
import { UploadError } from "./UploadError";
import { UploadPreview } from "./UploadPreview";
import { UploadResponse } from "../../types/upload.types";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  label: string;
  description?: string;
  accept?: string;
  onUploadSuccess?: (response: UploadResponse) => void;
  onUploadRemove?: () => void;
  initialUrl?: string;
  initialFilename?: string;
  className?: string;
}

export function FileUpload({
  label,
  description,
  accept = "application/pdf,image/jpeg,image/png",
  onUploadSuccess,
  onUploadRemove,
  initialUrl,
  initialFilename,
  className,
}: FileUploadProps) {
  const { status, progress, error, result, upload, remove } = useFileUpload();

  // Handle external initial state (e.g., loaded from API)
  const isComplete = status === "success" || (initialUrl && status === "idle");
  const displayUrl = result?.url || initialUrl;
  const displayFilename = result?.filename || initialFilename;

  const handleFileSelect = async (file: File) => {
    const res = await upload(file, { folder: "documents" });
    if (res && onUploadSuccess) {
      onUploadSuccess(res);
    }
  };

  const handleRemove = async () => {
    if (status === "success") {
      await remove();
    }
    if (onUploadRemove) {
      onUploadRemove();
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-0.5">
        <label className="text-xs font-bold text-white tracking-wide">{label}</label>
        {description && <p className="text-[10px] text-[#A8A8A8]">{description}</p>}
      </div>

      {status === "uploading" && (
        <div className="p-4 rounded-xl border border-white/10 bg-[#161616]">
          <UploadProgress value={progress} label="Uploading..." />
        </div>
      )}

      {status === "error" && error && (
        <UploadError message={error} />
      )}

      {!isComplete && status !== "uploading" && (
        <UploadDropzone
          onFileSelect={handleFileSelect}
          accept={accept}
          maxSizeText="Max size: 10MB (PDF, JPG, PNG)"
        />
      )}

      {isComplete && displayUrl && (
        <UploadPreview
          url={displayUrl}
          filename={displayFilename}
          type="document"
          onRemove={handleRemove}
        />
      )}
    </div>
  );
}
