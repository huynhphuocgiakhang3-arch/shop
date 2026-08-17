export type DirectUploadTarget =
  | "product-image"
  | "product-file"
  | "category-banner"
  | "payment-asset"
  | "appearance"
  | "deposit-proof";

export interface DirectUploadResult {
  url: string;
  publicId: string;
  fileName: string;
  sizeMb: number;
}

interface UploadSignResponse {
  cloudName: string;
  resourceType: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
  message?: string;
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id?: string;
  error?: { message?: string };
}

export async function uploadDirectToCloudinary(
  file: File,
  target: DirectUploadTarget,
  options?: { slot?: string; onProgress?: (percent: number) => void }
): Promise<DirectUploadResult> {
  const signResponse = await fetch("/api/uploads/sign", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target, fileName: file.name, fileType: file.type, fileSize: file.size, slot: options?.slot })
  });
  const signBody: Partial<UploadSignResponse> = await signResponse.json().catch(() => ({}));
  if (!signResponse.ok) throw new Error(signBody.message ?? "Không thể khởi tạo upload.");

  const uploadUrl = `https://api.cloudinary.com/v1_1/${signBody.cloudName}/${signBody.resourceType}/upload`;
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", signBody.apiKey ?? "");
  form.append("timestamp", String(signBody.timestamp ?? ""));
  form.append("signature", signBody.signature ?? "");
  form.append("folder", signBody.folder ?? "");
  form.append("public_id", signBody.publicId ?? "");

  const result = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);
    xhr.responseType = "json";
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) options?.onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      const body: Partial<CloudinaryUploadResponse> = xhr.response ?? (() => { try { return JSON.parse(xhr.responseText); } catch { return {}; } })();
      if (xhr.status >= 200 && xhr.status < 300 && body.secure_url) resolve(body as CloudinaryUploadResponse);
      else reject(new Error(body.error?.message ?? "Cloudinary upload thất bại."));
    };
    xhr.onerror = () => reject(new Error("Kết nối upload bị gián đoạn."));
    xhr.onabort = () => reject(new Error("Upload đã bị hủy."));
    xhr.send(form);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id ?? signBody.publicId ?? "",
    fileName: file.name,
    sizeMb: Math.max(1, Math.round(file.size / 1024 / 1024))
  };
}
