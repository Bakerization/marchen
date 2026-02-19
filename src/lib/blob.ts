const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

const sanitizeFilename = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const getFileExtension = (filename: string) => {
  const match = filename.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : "bin";
};

export const uploadImageToBlob = async (params: {
  file: File;
  prefix: string;
}) => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  }

  const { file, prefix } = params;

  if (!file || file.size === 0) {
    throw new Error("Image file is required");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported");
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Image size must be 10MB or less");
  }

  const ext = getFileExtension(file.name);
  const randomPart = Math.random().toString(36).slice(2, 10);
  const filename = sanitizeFilename(`${Date.now()}-${randomPart}.${ext}`);
  const safePrefix = prefix
    .split("/")
    .map((segment) => sanitizeFilename(segment))
    .filter(Boolean)
    .join("/");
  const blobPath = `${safePrefix || "uploads"}/${filename}`;

  const uploadRes = await fetch("https://blob.vercel-storage.com", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-vercel-filename": blobPath,
      "content-type": file.type,
    },
    body: Buffer.from(await file.arrayBuffer()),
  });

  if (!uploadRes.ok) {
    const message = await uploadRes.text();
    throw new Error(`Blob upload failed: ${uploadRes.status} ${message}`);
  }

  const payload = (await uploadRes.json()) as { url?: string };
  if (!payload.url) {
    throw new Error("Blob upload did not return a URL");
  }

  return {
    url: payload.url,
    fileName: filename,
    mimeType: file.type,
    sizeBytes: file.size,
  };
};
