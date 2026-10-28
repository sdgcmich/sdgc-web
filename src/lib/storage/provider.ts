import { createClient } from "@/lib/supabase/server";
import { type UploadApiResponse, v2 as cloudinary } from "cloudinary";

export type StorageProviderType = "supabase" | "cloudinary";

export interface StorageUploadResult {
  storagePath: string;
  url: string;
  provider: StorageProviderType;
}

export interface StorageProvider {
  type: StorageProviderType;
  upload(params: {
    bucket: string;
    path: string;
    buffer: Buffer | Uint8Array;
    contentType: string;
  }): Promise<StorageUploadResult>;
  delete(bucket: string, path: string): Promise<void>;
  getPublicUrl(bucket: string, path: string): Promise<string>;
}

export class SupabaseStorageProvider implements StorageProvider {
  readonly type: StorageProviderType = "supabase";

  async upload(params: {
    bucket: string;
    path: string;
    buffer: Buffer | Uint8Array;
    contentType: string;
  }): Promise<StorageUploadResult> {
    const supabase = await createClient();
    const { error } = await supabase.storage
      .from(params.bucket)
      .upload(params.path, params.buffer, {
        contentType: params.contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase storage upload failed: ${error.message}`);
    }

    const { data } = supabase.storage.from(params.bucket).getPublicUrl(params.path);
    return {
      storagePath: params.path,
      url: data.publicUrl,
      provider: "supabase",
    };
  }

  async delete(bucket: string, path: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      throw new Error(`Supabase storage delete failed: ${error.message}`);
    }
  }

  async getPublicUrl(bucket: string, path: string): Promise<string> {
    const supabase = await createClient();
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
}

export class CloudinaryStorageProvider implements StorageProvider {
  readonly type: StorageProviderType = "cloudinary";

  private configure(): { cloudName: string } {
    const cloudName =
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        "Cloudinary is configured as the storage provider, but CLOUDINARY_CLOUD_NAME (or NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME), CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET is missing.",
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    return { cloudName };
  }

  async upload(params: {
    bucket: string;
    path: string;
    buffer: Buffer | Uint8Array;
    contentType: string;
  }): Promise<StorageUploadResult> {
    this.configure();

    const cleanPublicId = params.path.replace(/\.[^/.]+$/, "");

    const defaultFolder =
      process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || process.env.CLOUDINARY_FOLDER || "sdgc-web";
    const targetFolder =
      params.bucket && params.bucket !== "club-media"
        ? `${defaultFolder}/${params.bucket}`
        : defaultFolder;

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: cleanPublicId,
          folder: targetFolder,
          resource_type: "auto",
        },
        (error, res) => {
          if (error || !res) {
            reject(new Error(`Cloudinary upload failed: ${error?.message || "Unknown error"}`));
          } else {
            resolve(res);
          }
        },
      );
      uploadStream.end(params.buffer);
    });

    return {
      storagePath: result.public_id,
      url: result.secure_url || result.url,
      provider: "cloudinary",
    };
  }

  async delete(_bucket: string, path: string): Promise<void> {
    this.configure();
    await cloudinary.uploader.destroy(path, { resource_type: "image" });
  }

  async getPublicUrl(_bucket: string, path: string): Promise<string> {
    const cloudName =
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME ||
      "p4wempwi";
    const defaultFolder =
      process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || process.env.CLOUDINARY_FOLDER || "sdgc-web";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    const cleanPath = path.startsWith(`${defaultFolder}/`)
      ? path
      : `${defaultFolder}/${path.replace(/^\/+/, "")}`;
    return `https://res.cloudinary.com/${cloudName}/image/upload/${cleanPath}`;
  }
}

export function getStorageProvider(): StorageProvider {
  const providerType = (
    process.env.NEXT_PUBLIC_STORAGE_PROVIDER ||
    process.env.STORAGE_PROVIDER ||
    "supabase"
  ).toLowerCase();

  switch (providerType) {
    case "cloudinary":
      return new CloudinaryStorageProvider();
    default:
      return new SupabaseStorageProvider();
  }
}
