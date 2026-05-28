import { useState, useRef, ReactNode } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeText?: string;
  className?: string;
  children?: ReactNode;
  disabled?: boolean;
}

export function UploadDropzone({
  onFileSelect,
  accept = "image/*,application/pdf",
  maxSizeText = "Max size: 10MB",
  className,
  children,
  disabled = false,
}: UploadDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
      // Reset input so the same file can be selected again if needed
      e.target.value = "";
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center w-full min-h-[140px] rounded-2xl border-2 border-dashed transition-all cursor-pointer group overflow-hidden",
        isDragActive
          ? "border-[#FF7A59] bg-[#FF7A59]/5"
          : "border-white/10 bg-white/[0.02] hover:border-[#FF7A59]/50 hover:bg-white/[0.04]",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
      />
      
      {children ? (
        children
      ) : (
        <div className="flex flex-col items-center p-6 text-center">
          <div className="w-10 h-10 mb-3 rounded-full bg-white/5 flex items-center justify-center text-[#A8A8A8] group-hover:text-[#FF7A59] group-hover:scale-110 transition-all">
            <UploadCloud size={20} />
          </div>
          <p className="text-xs font-bold text-white mb-1">
            <span className="text-[#FF7A59]">Click to upload</span> or drag and drop
          </p>
          <p className="text-[10px] text-[#A8A8A8] font-medium">{maxSizeText}</p>
        </div>
      )}
    </div>
  );
}
