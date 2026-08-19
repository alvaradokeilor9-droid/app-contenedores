import React, { useState } from 'react';
import {
  X,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Calendar,
  FileImage,
  Tag
} from 'lucide-react';
import { PhotoItem } from '../types';
import { formatBytes } from '../lib/imageProcessor';

interface PhotoLightboxProps {
  photo: PhotoItem | null;
  allPhotos: PhotoItem[];
  onClose: () => void;
  onSelectPhoto: (photo: PhotoItem) => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photo,
  allPhotos,
  onClose,
  onSelectPhoto,
}) => {
  const [rotation, setRotation] = useState(0);

  if (!photo) return null;

  const currentIndex = allPhotos.findIndex((p) => p.id === photo.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allPhotos.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      setRotation(0);
      onSelectPhoto(allPhotos[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setRotation(0);
      onSelectPhoto(allPhotos[currentIndex + 1]);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 rounded-md bg-white/10 text-white font-mono text-xs">
            Foto {currentIndex + 1} de {allPhotos.length}
          </div>
          <span className="text-sm font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-md">
            {photo.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRotate}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Rotar 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-rose-600 text-white transition-colors cursor-pointer"
            title="Cerrar visor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image View */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden my-2">
        {/* Prev Button */}
        {hasPrev && (
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Image Container with Dynamic Rotation */}
        <div
          className="w-full h-full flex items-center justify-center p-2 transition-transform duration-200"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <img
            src={photo.previewUrl}
            alt={photo.name}
            className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
          />
        </div>

        {/* Next Button */}
        {hasNext && (
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Info Bar */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300 bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 max-w-2xl mx-auto z-10">
        <span className="flex items-center gap-1.5">
          <FileImage className="w-3.5 h-3.5 text-blue-400" /> {formatBytes(photo.size)}
        </span>
        <span className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-emerald-400" /> Categoría: {photo.category}
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />{' '}
          {new Date(photo.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};
