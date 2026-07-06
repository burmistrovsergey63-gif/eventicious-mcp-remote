import { logger } from "../logger";

const IMGBB_API_URL = "https://api.imgbb.com/1/upload";

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

const MAX_INLINE_IMAGE_BYTES = 32 * 1024 * 1024; // 32 MB

export type UploadInlineImageInput = {
  fileName?: string;
  mimeType?: string;
  fileBase64?: string;
  dataUri?: string;
  imageUrl?: string;
};

export type UploadInlineImageResult = {
  publicUrl: string;
  provider: "imgbb";
  providerImageId?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  deleteUrlRedacted?: string;
};

export type InlineImageStorageOptions = {
  apiKey: string;
  expirationSeconds?: number;
  maxBytes?: number;
  dryRun?: boolean;
};

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-\.]/g, "_").substring(0, 100);
}

function extractBase64FromDataUri(dataUri: string): { base64: string; mimeType: string } | null {
  const match = dataUri.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (!match) return null;
  return { base64: match[2], mimeType: match[1] };
}

function extractMimeTypeFromBase64(base64: string): string | null {
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length < 4) return null;

  // PNG magic bytes
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  // JPEG magic bytes
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  // GIF magic bytes
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return "image/gif";
  }
  // WebP magic bytes (RIFF....WEBP)
  if (bytes.length >= 12 &&
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return "image/webp";
  }

  return null;
}

function validateMimeType(mimeType: string): void {
  if (mimeType === "image/svg+xml") {
    throw new Error("SVG images are not allowed for inline storage.");
  }
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`Unsupported image type: ${mimeType}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`);
  }
}

function redactDeleteUrl(deleteUrl: string | undefined): string | undefined {
  if (!deleteUrl) return undefined;
  try {
    const url = new URL(deleteUrl);
    const pathParts = url.pathname.split("/");
    if (pathParts.length > 2) {
      pathParts[pathParts.length - 1] = "<redacted>";
      url.pathname = pathParts.join("/");
    }
    return url.toString();
  } catch {
    return "<redacted>";
  }
}

export async function uploadInlineImageToImgBB(
  input: UploadInlineImageInput,
  options: InlineImageStorageOptions
): Promise<UploadInlineImageResult> {
  const { apiKey, expirationSeconds, maxBytes = MAX_INLINE_IMAGE_BYTES, dryRun = false } = options;

  if (!apiKey) {
    throw new Error("IMGBB_API_KEY is required for inline image upload.");
  }

  let base64Data: string;
  let mimeType: string;
  let fileName = input.fileName || "inline-image";

  if (input.fileBase64) {
    mimeType = input.mimeType || extractMimeTypeFromBase64(input.fileBase64) || "image/jpeg";
    validateMimeType(mimeType);
    base64Data = input.fileBase64;
  } else if (input.dataUri) {
    const extracted = extractBase64FromDataUri(input.dataUri);
    if (!extracted) {
      throw new Error("Invalid dataUri format. Expected: data:image/...;base64,...");
    }
    mimeType = input.mimeType || extracted.mimeType;
    validateMimeType(mimeType);
    base64Data = extracted.base64;
  } else if (input.imageUrl) {
    mimeType = input.mimeType || "image/jpeg";
    validateMimeType(mimeType);
    base64Data = "";
  } else {
    throw new Error("No image source provided. Use fileBase64, dataUri, or imageUrl.");
  }

  const sizeBytes = Math.ceil((base64Data.length * 3) / 4);
  if (sizeBytes > maxBytes) {
    throw new Error(`Image too large: ${sizeBytes} bytes. Maximum is ${maxBytes} bytes.`);
  }

  const sanitizedName = sanitizeFileName(fileName.replace(/\.[^.]+$/, ""));

  if (dryRun) {
    return {
      publicUrl: `dry-run://imgbb/${sanitizedName}`,
      provider: "imgbb",
      sizeBytes,
    };
  }

  const formData = new FormData();

  if (input.imageUrl) {
    formData.append("image", input.imageUrl);
  } else {
    formData.append("image", base64Data);
  }

  if (sanitizedName) {
    formData.append("name", sanitizedName);
  }

  if (expirationSeconds) {
    formData.append("expiration", String(expirationSeconds));
  }

  logger.info("imgbb_upload_start", {
    provider: "imgbb",
    mimeType,
    sizeBytes,
    hasExpiration: !!expirationSeconds,
  });

  const url = new URL(IMGBB_API_URL);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString(), {
    method: "POST",
    body: formData,
  });

  const responseData = await response.json() as {
    success?: boolean;
    status?: number;
    data?: {
      url?: string;
      display_url?: string;
      image?: { url?: string };
      delete_url?: string;
      image_id?: string;
      width?: number;
      height?: number;
      size?: number;
    };
    error?: { message?: string };
  };

  if (!responseData.success || responseData.status !== 200) {
    const errorMsg = responseData.error?.message || "Unknown ImgBB error";
    logger.error("imgbb_upload_failed", { status: responseData.status, error: errorMsg });
    throw new Error(`ImgBB upload failed: ${errorMsg}`);
  }

  const publicUrl = responseData.data?.image?.url
    || responseData.data?.url
    || responseData.data?.display_url;

  if (!publicUrl) {
    throw new Error("ImgBB response missing image URL.");
  }

  logger.info("imgbb_upload_success", {
    provider: "imgbb",
    mimeType,
    sizeBytes,
    hasExpiration: !!expirationSeconds,
  });

  return {
    publicUrl,
    provider: "imgbb",
    providerImageId: responseData.data?.image_id,
    width: responseData.data?.width,
    height: responseData.data?.height,
    sizeBytes: responseData.data?.size,
    deleteUrlRedacted: redactDeleteUrl(responseData.data?.delete_url),
  };
}

export function isPublicHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !url.includes("localhost") && !url.includes("127.0.0.1");
  } catch {
    return false;
  }
}

export async function processGravityJsonForInlineImages(
  gravityJson: Record<string, unknown>,
  storageOptions: InlineImageStorageOptions | null,
  dryRun: boolean
): Promise<{ result: Record<string, unknown>; uploads: UploadInlineImageResult[] }> {
  if (!hasImageNodes(gravityJson)) {
    return { result: gravityJson, uploads: [] };
  }

  const uploads: UploadInlineImageResult[] = [];

  async function processNode(node: unknown): Promise<unknown> {
    if (!node || typeof node !== "object") return node;
    if (Array.isArray(node)) {
      return Promise.all(node.map(processNode));
    }

    const obj = node as Record<string, unknown>;

    if (obj.type === "image") {
      const { node: processed, uploaded } = await processImageNode(obj, storageOptions, dryRun);
      if (uploaded) uploads.push(uploaded);
      return processed;
    }

    if (Array.isArray(obj.content)) {
      const processedContent = await Promise.all(obj.content.map(processNode));
      return { ...obj, content: processedContent };
    }

    return obj;
  }

  const result = await processNode(gravityJson) as Record<string, unknown>;
  return { result, uploads };
}

function hasImageNodes(node: unknown): boolean {
  if (!node || typeof node !== "object") return false;
  const obj = node as Record<string, unknown>;
  if (obj.type === "image") return true;
  if (Array.isArray(obj.content)) {
    return obj.content.some(hasImageNodes);
  }
  if (Array.isArray(obj)) {
    return obj.some(hasImageNodes);
  }
  return false;
}

async function processImageNode(
  node: Record<string, unknown>,
  storageOptions: InlineImageStorageOptions | null,
  dryRun: boolean
): Promise<{ node: Record<string, unknown>; uploaded: UploadInlineImageResult | null }> {
  const attrs = node.attrs as Record<string, unknown> | undefined;
  if (!attrs) return { node, uploaded: null };

  const imageUrl = typeof attrs.imageUrl === "string" ? attrs.imageUrl : undefined;
  const fileBase64 = typeof attrs.fileBase64 === "string" ? attrs.fileBase64 : undefined;
  const dataUri = typeof attrs.dataUri === "string" ? attrs.dataUri : undefined;

  if (!imageUrl && !fileBase64 && !dataUri) return { node, uploaded: null };

  const needsUpload = !isPublicHttpsUrl(imageUrl || "");

  if (!needsUpload && imageUrl) {
    const cleanedAttrs = { ...attrs };
    delete cleanedAttrs.imageUrl;
    delete cleanedAttrs.fileBase64;
    delete cleanedAttrs.dataUri;
    cleanedAttrs.src = imageUrl;
    return { node: { ...node, attrs: cleanedAttrs }, uploaded: null };
  }

  if (!storageOptions) {
    if (fileBase64 || dataUri) {
      throw new Error("Inline image storage not configured. Set INLINE_IMAGE_STORAGE_DRIVER=imgbb and IMGBB_API_KEY.");
    }
    return { node, uploaded: null };
  }

  const input: UploadInlineImageInput = {
    fileName: typeof attrs.fileName === "string" ? attrs.fileName : undefined,
    mimeType: typeof attrs.mimeType === "string" ? attrs.mimeType : undefined,
    fileBase64,
    dataUri,
    imageUrl,
  };

  const result = await uploadInlineImageToImgBB(input, {
    ...storageOptions,
    dryRun,
  });

  const cleanedAttrs = { ...attrs };
  delete cleanedAttrs.imageUrl;
  delete cleanedAttrs.fileBase64;
  delete cleanedAttrs.dataUri;
  cleanedAttrs.src = result.publicUrl;

  if (result.width) cleanedAttrs.width = result.width;
  if (result.height) cleanedAttrs.height = result.height;

  return { node: { ...node, attrs: cleanedAttrs }, uploaded: result };
}
