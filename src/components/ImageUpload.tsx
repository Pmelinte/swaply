'use client';

import { useState, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';

interface ImageUploadProps {
  maxImages?: number;
  onImagesChange: (urls: string[]) => void;
  existingImages?: string[];
  disabled?: boolean;
}

interface UploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
}

export default function ImageUpload({ 
  maxImages = 6, 
  onImagesChange, 
  existingImages = [],
  disabled = false 
}: ImageUploadProps) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>(existingImages);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
    formData.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!);
    formData.append('folder', 'swaply/objects');
    
    // Optimizations
    formData.append('quality', 'auto:good');
    formData.append('fetch_format', 'auto');
    formData.append('transformation', 'c_fill,w_800,h_600,q_auto,f_auto');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data: UploadResponse = await response.json();
    return data.secure_url;
  };

  const handleFiles = useCallback(async (files: FileList) => {
    if (disabled || images.length >= maxImages) return;

    const validFiles = Array.from(files).filter(file => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Doar fișiere de tip imagine sunt permise');
        return false;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Imaginea este prea mare (max 10MB)');
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    const remainingSlots = maxImages - images.length;
    const filesToUpload = validFiles.slice(0, remainingSlots);

    setUploading(true);
    
    try {
      const uploadPromises = filesToUpload.map(file => uploadToCloudinary(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      
      const newImages = [...images, ...uploadedUrls];
      setImages(newImages);
      onImagesChange(newImages);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Eroare la încărcarea imaginilor. Încearcă din nou.');
    } finally {
      setUploading(false);
    }
  }, [images, maxImages, onImagesChange, disabled]);

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={!disabled ? openFileDialog : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            disabled={disabled}
          />
          
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-gray-600">Se încarcă imaginile...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-gray-600 mb-2">
                Adaugă imagini pentru obiectul tău
              </p>
              <p className="text-sm text-gray-500">
                Drag & drop sau click pentru a selecta ({images.length}/{maxImages})
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG, WebP - max 10MB per imagine
              </p>
            </div>
          )}
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <img
                src={imageUrl}
                alt={`Imagine ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
              />
              
              {/* Remove Button */}
              {!disabled && (
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Șterge imaginea"
                >
                  ×
                </button>
              )}

              {/* Main Image Indicator */}
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  Principală
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      {images.length === 0 && (
        <div className="text-sm text-gray-500 space-y-1">
          <p>📸 Prima imagine va fi imaginea principală</p>
          <p>🎯 Încarcă imagini clare și de calitate pentru mai multe vizualizări</p>
          <p>⚡ Imaginile sunt optimizate automat pentru web</p>
        </div>
      )}
    </div>
  );
}