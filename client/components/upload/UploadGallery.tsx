import { UploadResponse } from "../../types/upload.types";
import { UploadPreview } from "./UploadPreview";
import { EmptyState } from "../ui/EmptyState";
import { GripHorizontal } from "lucide-react";

interface UploadGalleryProps {
  images: UploadResponse[];
  onRemoveImage: (publicId: string) => void;
  // Reordering logic can be passed in if needed for MVP+
}

export function UploadGallery({ images, onRemoveImage }: UploadGalleryProps) {
  if (images.length === 0) {
    return (
      <EmptyState
        title="No portfolio images yet"
        description="Upload high-quality images of your signature dishes to attract more bookings."
        actionLabel=""
      />
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {images.map((image) => (
        <div key={image.id} className="group relative">
          <UploadPreview
            url={image.url}
            filename={image.filename}
            type="image"
            onRemove={() => onRemoveImage(image.publicId)}
            className="aspect-square sm:aspect-[4/3] rounded-2xl w-full h-full"
          />
          {/* Optional Drag Handle UI hint (functionality would require dnd-kit or similar) */}
          <div className="absolute top-2 left-2 p-1.5 bg-black/50 backdrop-blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-white/70 hover:text-white">
            <GripHorizontal size={14} />
          </div>
        </div>
      ))}
    </div>
  );
}
