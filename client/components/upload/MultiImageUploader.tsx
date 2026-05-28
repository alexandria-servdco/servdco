import { useState, useCallback } from "react";
import { useImageUpload } from "../../hooks/useImageUpload";
import { UploadDropzone } from "./UploadDropzone";
import { UploadProgress } from "./UploadProgress";
import { UploadError } from "./UploadError";
import { UploadResponse } from "../../types/upload.types";
import { Image as ImageIcon, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiImageUploaderProps {
  onImagesUploaded: (responses: UploadResponse[]) => void;
  maxFiles?: number;
}

export function MultiImageUploader({ onImagesUploaded, maxFiles = 10 }: MultiImageUploaderProps) {
  const [queue, setQueue] = useState<{ file: File; id: string }[]>([]);
  const { upload, status, progress, error, previewUrl } = useImageUpload(); // We reuse the hook logic but manage state locally for multiple

  // This is a simplified multi-uploader that uploads sequentially to maintain stability
  const [isUploading, setIsUploading] = useState(false);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(-1);
  const [successfulUploads, setSuccessfulUploads] = useState<UploadResponse[]>([]);

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).slice(0, maxFiles - successfulUploads.length);
      const newQueue = newFiles.map(file => ({ file, id: crypto.randomUUID() }));
      setQueue([...queue, ...newQueue]);
    }
  };

  const startUpload = async () => {
    if (queue.length === 0 || isUploading) return;
    setIsUploading(true);
    
    const results: UploadResponse[] = [];
    
    for (let i = 0; i < queue.length; i++) {
      setCurrentUploadIndex(i);
      const res = await upload(queue[i].file, { folder: "portfolio" });
      if (res) {
        results.push(res);
      }
    }
    
    setSuccessfulUploads([...successfulUploads, ...results]);
    onImagesUploaded(results);
    
    setQueue([]);
    setIsUploading(false);
    setCurrentUploadIndex(-1);
  };

  const removeQueueItem = (id: string) => {
    setQueue(queue.filter(q => q.id !== id));
  };

  return (
    <div className="space-y-4 bg-[#161616] p-6 rounded-2xl border border-white/5">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-white font-serif">Add to Portfolio</h3>
          <p className="text-[10px] text-[#A8A8A8] uppercase tracking-wider mt-1">
            Max {maxFiles} images. High quality WEBP/JPG.
          </p>
        </div>
        {queue.length > 0 && !isUploading && (
          <button
            onClick={startUpload}
            className="px-4 py-2 bg-[#FF7A59] text-white text-xs font-bold rounded-xl hover:bg-[#E96A49] transition-colors"
          >
            Upload {queue.length} Images
          </button>
        )}
      </div>

      <div className="relative flex flex-col items-center justify-center w-full min-h-[120px] rounded-xl border-2 border-dashed border-white/10 hover:border-[#FF7A59]/50 transition-colors cursor-pointer group overflow-hidden bg-white/[0.02]">
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFilesSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        <div className="flex flex-col items-center p-4 pointer-events-none">
          <ImageIcon size={20} className="text-[#A8A8A8] group-hover:text-[#FF7A59] mb-2 transition-colors" />
          <span className="text-xs font-bold text-white group-hover:text-[#FF7A59] transition-colors">Select multiple images</span>
        </div>
      </div>

      {queue.length > 0 && (
        <div className="space-y-2">
          {queue.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex-shrink-0 overflow-hidden">
                {/* Local URL creation for quick preview in queue */}
                <img src={URL.createObjectURL(item.file)} alt="" className="w-full h-full object-cover opacity-60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-white truncate">{item.file.name}</p>
                
                {isUploading && currentUploadIndex === idx && (
                  <UploadProgress value={progress} className="mt-2" />
                )}
                {isUploading && currentUploadIndex > idx && (
                  <p className="text-[10px] text-[#2E7D66] font-bold flex items-center gap-1 mt-1">
                    <CheckCircle size={10} /> Uploaded
                  </p>
                )}
                {!isUploading && (
                  <p className="text-[10px] text-[#A8A8A8]">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                )}
              </div>
              {!isUploading && (
                <button onClick={() => removeQueueItem(item.id)} className="p-2 text-[#A8A8A8] hover:text-red-400">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      {status === "error" && error && (
        <UploadError message={error} />
      )}
    </div>
  );
}
