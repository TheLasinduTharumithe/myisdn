export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const IMAGE_INPUT_ACCEPT = ".jpg,.jpeg,.png,.webp";
export const DEFAULT_MAX_IMAGE_BYTES = 1_500_000;

export function validateImageFile(file: File, maxBytes = DEFAULT_MAX_IMAGE_BYTES) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Please upload a JPG, PNG, or WEBP image.");
  }

  if (file.size > maxBytes) {
    throw new Error("Image is too large. Please keep it under 1.5 MB.");
  }
}

export function fileToBase64(file: File) {
  validateImageFile(file);

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unable to read image file."));
        return;
      }

      resolve(result);
    };

    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
}

export function isBase64Image(value?: string | null) {
  return Boolean(value && value.startsWith("data:image/"));
}

export function getInitials(name?: string) {
  if (!name) {
    return "IS";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "IS";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function getAvatarPreview(avatar64?: string | null, fullName?: string) {
  return {
    src: isBase64Image(avatar64) ? avatar64 : "",
    fallback: getInitials(fullName),
  };
}

export function getImageValidationText() {
  return "Accepted formats: JPG, PNG, WEBP. Maximum size: 1.5 MB.";
}
