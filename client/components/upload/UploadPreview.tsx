import { FileText, Image as ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadPreviewProps {
  url: string; // The URL to preview (could be local blob or remote url)
  filename?: string;
  type?: "image" | "document" | "auto";
  onRemove?: () => void;
  className?: string;
}

export function UploadPreview({ url, filename, type = "auto", onRemove, className }: UploadPreviewProps) {
  // Determine if it looks like a document
  const isDocument = type === "document" || (filename && filename.toLowerCase().endsWith(".pdf"));

  return (
    <div className={cn("relative group rounded-xl overflow-hidden border border-white/10 bg-[#1A1A1A]", className)}>
      {isDocument ? (
        <div className="flex items-center gap-3 p-4 w-full">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0">
            <FileText size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{filename || "Document.pdf"}</p>
            <p className="text-[10px] text-[#A8A8A8] uppercase tracking-wider">PDF File</p>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-full aspect-video sm:aspect-auto sm:h-32 flex items-center justify-center bg-black/50">
          {url ? (
            <img src={url} alt={filename || "Preview"} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={24} className="text-[#A8A8A8]" />
          )}
        </div>
      )}

      {/* Remove Button Overlay */}
      {onRemove && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
          <button
            onClick={(e) => {
              e.preventDefault();
              onRemove();
            }}
            className="w-8 h-8 rounded-full bg-red-500/90 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors hover:scale-110"
          >
            <X size={14} strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  );
}
