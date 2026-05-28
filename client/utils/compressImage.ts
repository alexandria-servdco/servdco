export const compressImage = async (
  file: File,
  maxWidth = 1200,
  quality = 0.8
): Promise<File> => {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  // Cloudinary optimizes delivery, but pre-compressing on frontend
  // reduces upload bandwidth for large photos (e.g. 5MB down to 500KB)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file); // fallback
              }
            },
            "image/jpeg",
            quality
          );
        } else {
          resolve(file); // fallback
        }
      };
      img.onerror = () => reject(new Error("Failed to load image for compression"));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
  });
};
