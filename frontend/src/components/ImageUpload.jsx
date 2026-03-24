import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { API } from "@/App";

export default function ImageUpload({ 
  entityType, // 'hotel' or 'room'
  entityId, 
  existingImages = [],
  onUploadComplete 
}) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState(existingImages);
  const fileInputRef = useRef(null);
  
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    const uploadedPaths = [];
    
    for (const file of files) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}. Only images allowed.`);
        continue;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File too large: ${file.name}. Max 10MB allowed.`);
        continue;
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch(`${API}/upload/${entityType}/${entityId}`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Upload failed');
        }
        
        const result = await response.json();
        uploadedPaths.push(result.path);
        toast.success(`Uploaded: ${file.name}`);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
      }
    }
    
    setUploading(false);
    
    if (uploadedPaths.length > 0) {
      const newImages = [...images, ...uploadedPaths];
      setImages(newImages);
      if (onUploadComplete) {
        onUploadComplete(newImages);
      }
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleRemoveImage = async (path, index) => {
    // For now, just remove from local state
    // In production, would also call delete API
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    if (onUploadComplete) {
      onUploadComplete(newImages);
    }
    toast.success('Image removed');
  };
  
  const getImageUrl = (path) => {
    // If it's already a full URL, use it directly
    if (path.startsWith('http')) return path;
    // Otherwise, construct the API URL
    return `${API}/files/${path}`;
  };
  
  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div 
        className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-slate-300 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Uploading...</span>
          </div>
        ) : (
          <div>
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Click to upload images or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, GIF, WebP (max 10MB each)
            </p>
          </div>
        )}
      </div>
      
      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((path, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={getImageUrl(path)}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=200';
                }}
              />
              <button
                onClick={() => handleRemoveImage(path, index)}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-2 left-2 text-xs bg-metro-navy text-white px-2 py-1 rounded">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Empty State */}
      {images.length === 0 && !uploading && (
        <div className="text-center text-muted-foreground text-sm">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>No images uploaded yet</p>
        </div>
      )}
    </div>
  );
}
