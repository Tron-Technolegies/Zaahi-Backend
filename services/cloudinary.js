import { v2 as cloudinary } from "cloudinary";

export const cleanupCloudinaryImages = async (publicIds = []) => {
  if (!publicIds.length) return;

  await Promise.all(
    publicIds.map((id) => cloudinary.uploader.destroy(id).catch(() => null)),
  );
};
