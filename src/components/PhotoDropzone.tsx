import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FolderPlus,
  Camera,
  Images,
  CheckCircle2,
  Plus,
  Zap,
  Layers,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { formatBytes } from '../lib/imageProcessor';

interface PhotoDropzoneProps {
  onFilesAdded: (files: File[]) => void;
  currentCount: number;
  totalSizeBytes: number;
  isOptimizing: boolean;
}

export const PhotoDropzone: React.FC<PhotoDropzoneProps> = ({
  onFilesAdded,
  currentCount,
  totalSizeBytes,
  isOptimizing,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles: File[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        if (
          file.type.startsWith('image/') ||
          file.name.match(/\.(jpe?g|png|webp|heic|heif|bmp|tiff|gif|avif)$/i)
        ) {
          validFiles.push(file);
        }
      }
      if (validFiles.length > 0) {
        onFilesAdded(validFiles);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesAdded(filesArray);
      // Reset input value so the same files can be re-selected if needed
      e.target.value = '';
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              2. Selección y Carga de Fotos
            </h2>
            <p className="text-xs text-slate-400">
              Abre la galería de tu celular o PC y selecciona más de 100 fotos
            </p>
          </div>
        </div>

        {currentCount > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{currentCount} {currentCount === 1 ? 'Foto' : 'Fotos'}</span>
              <span className="text-emerald-300/80 font-mono">({formatBytes(totalSizeBytes)})</span>
            </span>
          </div>
        )}
      </div>

      {/* Hidden File Inputs */}
      {/* 1. Gallery input (multiple photos selection) */}
      <input
        ref={galleryInputRef}
        id="input-gallery-photos"
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
      {/* 2. Directory Selector (desktop folders) */}
      <input
        ref={folderInputRef}
        id="input-folder-photos"
        type="file"
        multiple
        {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
        onChange={handleFileInputChange}
        className="hidden"
      />
      {/* 3. Camera Capture direct input */}
      <input
        ref={cameraInputRef}
        id="input-camera-capture"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Primary Mobile Action Buttons (Optimized for Touch on Cellphones) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* Main Button: ABRIR GALERÍA */}
        <button
          id="btn-open-gallery"
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] cursor-pointer"
        >
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Images className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold flex items-center gap-1.5">
              <span>Abrir Galería</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-white/25 rounded-full font-mono">+100</span>
            </div>
            <div className="text-[11px] text-blue-100/80">Seleccionar fotos del celular o PC</div>
          </div>
        </button>

        {/* Button: TOMAR FOTO CON CÁMARA */}
        <button
          id="btn-take-camera-photo"
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-3 p-4 bg-slate-800 hover:bg-slate-700/90 text-slate-100 border border-slate-700/80 rounded-xl shadow transition-all active:scale-[0.98] cursor-pointer"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold text-white">Tomar Foto</div>
            <div className="text-[11px] text-slate-400">Capturar con la cámara</div>
          </div>
        </button>

        {/* Button: SUBIR CARPETA */}
        <button
          id="btn-upload-folder"
          type="button"
          onClick={() => folderInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-3 p-4 bg-slate-800 hover:bg-slate-700/90 text-slate-100 border border-slate-700/80 rounded-xl shadow transition-all active:scale-[0.98] cursor-pointer"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <FolderPlus className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold text-white">Subir Carpeta</div>
            <div className="text-[11px] text-slate-400">Cargar carpeta completa</div>
          </div>
        </button>
      </div>

      {/* Drag & Drop Area for Desktop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => galleryInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-5 sm:p-6 text-center transition-all cursor-pointer group ${
          isDragOver
            ? 'border-indigo-400 bg-indigo-500/10 scale-[1.005]'
            : 'border-slate-800 hover:border-indigo-500/50 bg-slate-950/50 hover:bg-slate-950/80'
        }`}
      >
        <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-5 h-5" />
          </div>

          <h3 className="text-xs sm:text-sm font-semibold text-white mb-0.5">
            {currentCount > 0
              ? '¿Deseas agregar más fotos? Haz clic o arrástralas aquí'
              : 'O arrastra y suelta tus fotos en esta zona'}
          </h3>
          <p className="text-[11px] text-slate-400">
            Admite JPG, PNG, WEBP, HEIC/HEIF sin límite de cantidad
          </p>
        </div>

        {/* Feature Badges */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-3 text-[10px] sm:text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Subida rápida concurrente
          </span>
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-blue-400" /> +100 Fotos en paralelo
          </span>
          <span className="flex items-center gap-1">
            <Smartphone className="w-3 h-3 text-emerald-400" /> Optimizado para celular
          </span>
        </div>
      </div>
    </div>
  );
};
