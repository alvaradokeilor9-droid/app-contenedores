import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FolderPlus,
  Camera,
  Image as ImageIcon,
  Layers,
  Zap,
  CheckCircle2,
  Plus
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
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              2. Carga Masiva de Fotografías
            </h2>
            <p className="text-xs text-slate-400">
              Soporta más de 100 fotos simultáneas, arrastre de carpetas o captura en tiempo real
            </p>
          </div>
        </div>

        {currentCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {currentCount} {currentCount === 1 ? 'Foto cargada' : 'Fotos cargadas'} ({formatBytes(totalSizeBytes)})
            </span>
          </div>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
      {/* Directory Selector */}
      <input
        ref={folderInputRef}
        type="file"
        multiple
        {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
        onChange={handleFileInputChange}
        className="hidden"
      />
      {/* Camera Capture on Mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all cursor-pointer group ${
          isDragOver
            ? 'border-indigo-400 bg-indigo-500/10 scale-[1.008]'
            : 'border-slate-700 hover:border-indigo-500/60 bg-slate-900/60 hover:bg-slate-900/90'
        }`}
      >
        <div className="flex flex-col items-center justify-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-transform">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h3 className="text-base font-semibold text-white mb-1">
            {currentCount > 0
              ? 'Arrastra más fotos o haz clic para añadir'
              : 'Arrastra y suelta tus fotos aquí'}
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Selecciona cientos de fotos de una sola vez o sube una carpeta completa
          </p>

          {/* Quick Trigger Buttons inside Drop Area */}
          <div
            className="flex flex-wrap items-center justify-center gap-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              id="btn-select-photos"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/25 hover:scale-[1.02] transition-all cursor-pointer"
            >
              {currentCount > 0 ? (
                <>
                  <Plus className="w-4 h-4" />
                  Añadir Más Fotos (+100)
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  Seleccionar Fotos (+100)
                </>
              )}
            </button>

            <button
              id="btn-select-folder"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                folderInputRef.current?.click();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600/80 rounded-xl transition-all cursor-pointer"
              title="Carga una carpeta completa con todas sus fotos"
            >
              <FolderPlus className="w-4 h-4 text-blue-400" />
              Subir Carpeta Completa
            </button>

            <button
              id="btn-take-photo"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                cameraInputRef.current?.click();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600/80 rounded-xl transition-all cursor-pointer"
              title="Tomar foto con la cámara del teléfono o tablet"
            >
              <Camera className="w-4 h-4 text-emerald-400" />
              Tomar Foto
            </button>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Subida concurrente optimizada
          </span>
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-blue-400" /> Sin límite de cantidad
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> JPG, PNG, WEBP, HEIC
          </span>
        </div>
      </div>
    </div>
  );
};
