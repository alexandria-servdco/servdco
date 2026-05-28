export const generatePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      resolve(url);
    } else {
      // For non-images (like PDFs), we just return a placeholder or icon identifier
      // The UI will handle displaying a generic icon
      resolve("");
    }
  });
};

export const revokePreview = (url: string) => {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
};
