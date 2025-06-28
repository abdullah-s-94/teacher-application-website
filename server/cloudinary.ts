import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  original_filename: string;
  format: string;
  bytes: number;
}

export async function uploadToCloudinary(
  buffer: Buffer,
  originalName: string,
  folder: string = 'applications'
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    // Always use 'auto' for better file handling, Cloudinary will detect the type
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'raw', // Use raw for PDF files to avoid processing
        public_id: `${Date.now()}_${Math.random().toString(36).substring(2)}`,
        use_filename: false, // Don't use original filename to avoid encoding issues
        unique_filename: true,
        overwrite: false,
        // Set access mode to public for file access
        access_mode: 'public',
        // Set proper content type
        context: {
          original_filename: originalName,
          content_type: 'application/pdf'
        }
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else if (result) {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            original_filename: originalName,
            format: result.format,
            bytes: result.bytes,
          });
        } else {
          reject(new Error('Upload failed: No result returned'));
        }
      }
    );

    uploadStream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`Deleted file from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error(`Error deleting file from Cloudinary: ${publicId}`, error);
    throw error;
  }
}

export function getCloudinaryUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    resource_type: 'raw', // Use raw for PDF files
    secure: true,
    sign_url: false // Disable URL signing for public access
  });
}

export default cloudinary;