'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { useI18n } from '@/lib/i18n';

interface MultiImageUploadProps {
  maxImages?: number;
  onImagesChange: (urls: string[]) => void;
  existingImages?: string[];
  disabled?: boolean;
}

interface UploadProgress {
  [key: string]: number; // filename -> progress percentage
}

export default function MultiImageUpload({
  maxImages = 6,
  onImagesChange,
  existingImages = [],
  disabled = false
}: MultiImageUploadProps) {
  const { t } = useI18n();
  const [images, setImages] = useState<string[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [previews, setPreviews] = useState<{ [key: string]: string }>({});

  // Compress image before upload
  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 2, // Max 2MB per image
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/jpeg' as const,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      console.log(`📸 Compressed ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      return compressedFile;
    } catch (error) {
      console.error('Compression failed:', error);
      return file; // Fallback to original file
    }
  };

  // Upload single image to Cloudinary
  const uploadToCloudinary = async (file: File, filename: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
    formData.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!);
    formData.append('folder', 'swaply/objects');

    // Optimizations
    formData.append('quality', 'auto:good');
    formData.append('fetch_format', 'auto');

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(prev => ({ ...prev, [filename]: percentComplete }));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[filename];
            return newProgress;
          });
          resolve(data.secure_url);
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error')));
      xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

      xhr.open(
        'POST',
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`
      );
      xhr.send(formData);
    });
  };

  // Handle file drop/selection
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled || images.length >= maxImages) return;

    const remainingSlots = maxImages - images.length;
    const filesToUpload = acceptedFiles.slice(0, remainingSlots);

    if (filesToUpload.length === 0) return;

    setUploading(true);

    // Create preview URLs
    const newPreviews: { [key: string]: string } = {};
    filesToUpload.forEach(file => {
      newPreviews[file.name] = URL.createObjectURL(file);
    });
    setPreviews(prev => ({ ...prev, ...newPreviews }));

    try {
      // Compress and upload all images in parallel
      const uploadPromises = filesToUpload.map(async (file) => {
        const compressedFile = await compressImage(file);
        return uploadToCloudinary(compressedFile, file.name);
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      const newImages = [...images, ...uploadedUrls];
      setImages(newImages);
      onImagesChange(newImages);

      // Clean up preview URLs
      filesToUpload.forEach(file => {
        URL.revokeObjectURL(newPreviews[file.name]);
      });
      setPreviews({});
    } catch (error) {
      console.error('Upload failed:', error);
      alert('❌ Eroare la încărcarea imaginilor. Încearcă din nou.');
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  }, [images, maxImages, onImagesChange, disabled]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif']
    },
    maxFiles: maxImages - images.length,
    disabled: disabled || uploading || images.length >= maxImages,
    multiple: true
  });

  // Remove image
  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      {images.length < maxImages && (
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50 scale-105' 
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
            }
            ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-3">
            <div className="text-5xl">
              {uploading ? '⏳' : isDragActive ? '📥' : '📸'}
            </div>
            
            <div>
              <p className="text-lg font-semibold text-gray-700">
                {uploading 
                  ? 'Se încarcă imaginile...' 
                  : isDragActive 
                    ? 'Eliberează pentru a încărca' 
                    : 'Trage imaginile aici sau click pentru a selecta'
                }
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Maxim {maxImages} imagini • PNG, JPG, WEBP • Max 10MB per imagine
              </p>
              <p className="text-xs text-gray-400 mt-1">
                ✨ Compresie automată la max 2MB
              </p>
            </div>

            {!uploading && (
              <div className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">
                Selectează {maxImages - images.length} {maxImages - images.length === 1 ? 'imagine' : 'imagini'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([filename, progress]) => (
            <div key={filename} className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 truncate flex-1">
                  {filename}
                </span>
                <span className="text-sm text-blue-600 font-semibold ml-2">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-500 h-2 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Imagini încărcate ({images.length}/{maxImages})
            </h3>
            {images.length === maxImages && (
              <span className="text-xs text-green-600 font-medium">
                ✅ Limită atinsă
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((url, index) => (
              <div 
                key={url} 
                className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <img
                  src={url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Delete Button */}
                <button
                  onClick={() => removeImage(index)}
                  disabled={disabled}
                  className="
                    absolute top-2 right-2 
                    bg-red-500 hover:bg-red-600 
                    text-white rounded-full p-2 
                    opacity-0 group-hover:opacity-100 
                    transition-opacity duration-200
                    disabled:opacity-50
                    shadow-lg
                  "
                  type="button"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Image Number Badge */}
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
                  #{index + 1}
                </div>
              </div>
            ))}

            {/* Preview Placeholders (while uploading) */}
            {Object.entries(previews).map(([filename, url]) => (
              <div 
                key={filename}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-200 animate-pulse"
              >
                <img
                  src={url}
                  alt={filename}
                  className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="text-white text-2xl">⏳</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
