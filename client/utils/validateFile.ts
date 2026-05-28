export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

export const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const SUPPORTED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateImage = (file: File): ValidationResult => {
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: "Unsupported format. Please upload JPG, PNG, or WEBP.",
    };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      isValid: false,
      error: "Image exceeds 5MB size limit.",
    };
  }
  return { isValid: true };
};

export const validateDocument = (file: File): ValidationResult => {
  if (!SUPPORTED_DOCUMENT_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: "Unsupported format. Please upload PDF, JPG, or PNG.",
    };
  }
  if (file.size > MAX_DOCUMENT_SIZE) {
    return {
      isValid: false,
      error: "Document exceeds 10MB size limit.",
    };
  }
  return { isValid: true };
};
