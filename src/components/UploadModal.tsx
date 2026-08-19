import React, { useState, useEffect } from 'react';
import {
  FolderCheck,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  Pause,
  Play,
  FileCheck,
  FolderOpen,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PhotoItem, ContainerMetadata, DriveFolderInfo, UploadSettings } from '../types';
import { formatBytes } from '../lib/imageProcessor';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: ContainerMetadata;
  folderInfo: DriveFolderInfo | null;
  photos: PhotoItem[];
  currentProgressPercent: number;
  completedCount: number;
  totalCount: number;
  isUploading: boolean;
  isCompleted: boolean;
  hasErrors: boolean;
  errorMessage: string | null;
  onRetryFailed: () => void;
  onStartNewUpload: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  metadata,
  folderInfo,
  photos,
  currentProgressPercent,
  completedCount,
  totalCount,
  isUploading,
  isCompleted,
  hasErrors,
  errorMessage,
  onRetryFailed,
  onStartNewUpload,
}) => {
  useEffect(() => {
    if (isCompleted && !hasErrors) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore confetti error if any
      }
    }
  }, [isCompleted, hasErrors]);

  if (!isOpen) return null;

  const failedPhotos = photos.filter((p) => p.uploadStatus === 'error');
  const activePhotos = photos.filter((p) => p.uploadStatus === 'uploading');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : hasErrors
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {isCompleted
                  ? '¡Carga Completada con Éxito!'
                  : hasErrors
                  ? 'Atención durante la Subida'
                  : 'Subiendo Fotografías a Google Drive...'}
              </h3>
              <p className="text-xs text-slate-400">
                {folderInfo ? `Carpeta: ${folderInfo.name}` : 'Preparando carpeta en Google Drive'}
              </p>
            </div>
          </div>

          {!isUploading && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="py-5 space-y-5 overflow-y-auto flex-1 pr-1">
          {/* Main Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                {completedCount} de {totalCount} fotos subidas
              </span>
              <span className="font-mono font-bold text-blue-400">
                {currentProgressPercent}%
              </span>
            </div>
            <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : hasErrors
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                    : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400'
                }`}
                style={{ width: `${currentProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Folder Target Info Card */}
          {folderInfo && (
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <FolderOpen className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="overflow-hidden">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Carpeta creada en Google Drive
                  </div>
                  <div className="text-xs font-mono font-bold text-white truncate">
                    {folderInfo.name}
                  </div>
                </div>
              </div>

              <a
                id="link-open-drive-folder"
                href={folderInfo.webViewLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shrink-0 shadow-sm"
              >
                <span>Ver en Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Active Uploads List */}
          {activePhotos.length > 0 && isUploading && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Procesando en paralelo ({activePhotos.length})
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {activePhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="flex items-center justify-between text-xs bg-slate-800/40 px-3 py-2 rounded-lg border border-slate-800"
                  >
                    <span className="truncate max-w-[240px] text-slate-300">{photo.name}</span>
                    <span className="font-mono text-blue-400 shrink-0">
                      {photo.uploadProgress}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error notice if any */}
          {hasErrors && failedPhotos.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{failedPhotos.length} fotos tuvieron error al subirse.</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {errorMessage || 'Puedes reintentar subir las fotos pendientes ahora mismo.'}
              </p>
              <button
                type="button"
                onClick={onRetryFailed}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reintentar Fotos Fallidas ({failedPhotos.length})
              </button>
            </div>
          )}

          {/* Completion Summary Card */}
          {isCompleted && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
              <div className="text-sm font-semibold text-emerald-300">
                ¡Todas las {totalCount} fotos se guardaron exitosamente!
              </div>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                La carpeta con el número de contenedor <strong>{metadata.containerNumber}</strong>, cliente{' '}
                <strong>{metadata.clientName}</strong> y orden <strong>{metadata.poNumber}</strong> está lista en tu Google Drive.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          {isCompleted ? (
            <>
              {folderInfo && (
                <a
                  href={folderInfo.webViewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <FolderOpen className="w-4 h-4" />
                  Abrir Carpeta en Google Drive
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button
                id="btn-start-new-upload"
                type="button"
                onClick={onStartNewUpload}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                Nuevo Contenedor
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
