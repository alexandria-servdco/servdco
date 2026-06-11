import { useImageUpload } from "../../hooks/useImageUpload";
import { UploadDropzone } from "./UploadDropzone";
import { UploadProgress } from "./UploadProgress";
import { UploadError } from "./UploadError";
import { UploadPreview } from "./UploadPreview";
import { StorageBucket, UploadResponse } from "../../types/upload.types";
import { cn } from "@/lib/utils";
import { Camera } from "lucide-react";

interface ImageUploadProps {
  label?: string;
  onUploadSuccess?: (response: UploadResponse) => void;
  onUploadRemove?: () => void;
  initialUrl?: string;
  variant?: "avatar" | "cover";
  className?: string;
  pathPrefix?: string;
  bucket?: StorageBucket;
}

export function ImageUpload({
  label,
  onUploadSuccess,
  onUploadRemove,
  initialUrl,
  variant = "cover",
  className,
  pathPrefix,
  bucket,
}: ImageUploadProps) {
  const { status, progress, error, result, previewUrl, upload, remove } = useImageUpload();

  const isComplete = status === "success" || (initialUrl && status === "idle");
  const displayUrl = previewUrl || result?.url || initialUrl; // Local preview takes precedence during upload

  const handleFileSelect = async (file: File) => {
    const res = await upload(file, {
      folder: variant === "avatar" ? "avatars" : "portfolio",
      bucket: bucket ?? (variant === "avatar" ? "avatars" : "cook-portfolio"),
      pathPrefix,
    });
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

  const isAvatar = variant === "avatar";

  return (
    <div className={cn("space-y-3", className)}>
      {label && <label className="text-xs font-bold text-white">{label}</label>}

      {/* Avatar variant is circular, Cover is rectangular */}
      <div className={cn("relative group", isAvatar ? "w-24 h-24 mx-auto" : "w-full")}>
        
        {displayUrl ? (
          <div className={cn(
            "relative overflow-hidden bg-black/50 border border-white/10",
            isAvatar ? "w-full h-full rounded-full" : "w-full h-48 rounded-xl"
          )}>
            <img src={displayUrl} alt="Upload preview" className="w-full h-full object-cover" />
            
            {status === "uploading" && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
                <UploadProgress value={progress} className="w-full max-w-[80%]" />
              </div>
            )}
            
            {status !== "uploading" && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-[2px] cursor-pointer">
                <UploadDropzone
                  onFileSelect={handleFileSelect}
                  accept="image/jpeg,image/png,image/webp"
                  className="absolute inset-0 border-none bg-transparent hover:bg-transparent min-h-0"
                >
                  <div className="flex flex-col items-center text-white p-2">
                    <Camera size={isAvatar ? 16 : 24} className="mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
                  </div>
                </UploadDropzone>
              </div>
            )}
          </div>
        ) : (
          <UploadDropzone
            onFileSelect={handleFileSelect}
            accept="image/jpeg,image/png,image/webp"
            className={cn(isAvatar ? "w-full h-full rounded-full" : "h-48")}
            maxSizeText="Max size: 5MB"
          >
            <div className="flex flex-col items-center p-4 text-center">
              <div className="w-8 h-8 mb-2 rounded-full bg-white/5 flex items-center justify-center text-[#A8A8A8] group-hover:text-[#FF7A59] transition-colors">
                <Camera size={16} />
              </div>
              {!isAvatar && (
                <p className="text-[10px] font-bold text-white mb-0.5 uppercase tracking-wider">
                  <span className="text-[#FF7A59]">Click to upload</span>
                </p>
              )}
            </div>
          </UploadDropzone>
        )}
      </div>

      {status === "error" && error && (
        <UploadError message={error} className="mt-2" />
      )}
    </div>
  );
}
