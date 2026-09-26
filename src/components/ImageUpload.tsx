import React, { useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useImageUpload } from '../hooks/useImageUpload';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string | undefined) => void;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  currentImage, 
  onImageChange, 
  className = '' 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, uploading, uploadProgress } = useImageUpload();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imageUrl = await uploadImage(file);
      onImageChange(imageUrl);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to upload image');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Only clears the field; the stored file is left alone so cancelling the
  // edit doesn't leave the saved item pointing at a deleted image.
  const handleRemoveImage = () => {
    onImageChange(undefined);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2">Menu Item Image</label>
      
      {currentImage ? (
        <div className="relative">
          <img
            src={currentImage}
            alt="Menu item preview"
            className="w-full h-48 object-cover border border-teamax-gold/30 rounded-xl transition-opacity duration-300"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
            onLoad={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            style={{ opacity: 0 }}
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 p-2 bg-black/80 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white rounded-xl transition-colors duration-200"
            disabled={uploading}
            title="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
          {uploading && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teamax-gold mb-2"></div>
              <p className="text-sm text-teamax-secondary">Uploading... {uploadProgress}%</p>
            </div>
          )}
          <button
            type="button"
            onClick={triggerFileSelect}
            disabled={uploading}
            className="mission-btn-outline mt-3 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-[10px] disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            <span>Change Image</span>
          </button>
        </div>
      ) : (
        <div
          onClick={triggerFileSelect}
          className="w-full h-48 border-2 border-dashed border-teamax-gold/30 bg-black rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-teamax-gold/60 hover:bg-teamax-gold/5 transition-all duration-200"
        >
          {uploading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teamax-gold mx-auto mb-2"></div>
              <p className="text-sm text-teamax-secondary">Uploading... {uploadProgress}%</p>
              <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-teamax-gold h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <>
              <ImageIcon className="h-12 w-12 text-teamax-secondary mb-2" />
              <p className="text-sm text-teamax-secondary mb-1">Click to upload image</p>
              <p className="text-xs text-teamax-secondary">JPEG, PNG, WebP, GIF (max 5MB)</p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {!currentImage && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={triggerFileSelect}
            disabled={uploading}
            className="mission-btn-outline rounded-xl flex items-center space-x-2 px-4 py-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Image</span>
          </button>
          <span className="text-sm text-teamax-secondary">or enter URL below</span>
        </div>
      )}

      {/* URL Input as fallback */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-teamax-gold mb-2">Or enter image URL</label>
        <input
          type="url"
          value={currentImage || ''}
          onChange={(e) => onImageChange(e.target.value || undefined)}
          className="mission-input w-full px-4 py-3"
          placeholder="https://example.com/image.jpg"
          disabled={uploading}
        />
      </div>
    </div>
  );
};

export default ImageUpload;
