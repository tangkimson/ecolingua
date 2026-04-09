-- Add JSON metadata for Cloudinary-managed post images.
ALTER TABLE "Post"
ADD COLUMN "imageAssets" JSONB;
