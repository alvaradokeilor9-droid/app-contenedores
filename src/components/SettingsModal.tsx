import React, { useState } from 'react';
import {
  X,
  Settings,
  Zap,
  Sliders,
  FileCheck,
  Layers,
  Image as ImageIcon,
  Check,
  Download,
  Loader2,
  FileCode2
} from 'lucide-react';
import { UploadSettings } from '../types';
import { downloadProjectAsZip } from '../lib/projectExporter';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UploadSettings;
  onSaveSettings: (settings: UploadSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExportZip = async () => {
    try {
      setIsExporting(true);
      await downloadProjectAsZip();
    } catch (err) {
      console.error('Error generating zip:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Ajustes de Rendimiento y Subida
              </h3>
              <p className="text-xs text-slate-400">
                Optimiza la velocidad para cargas de más de 100 fotos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Concurrency */}
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/70 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" /> Subidas Simultáneas en Paralelo
              </label>
              <span className="font-mono font-bold text-blue-400 px-2 py-0.5 bg-blue-500/20 rounded">
                {settings.maxConcurrency} fotos a la vez
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={6}
              step={1}
              value={settings.maxConcurrency}
              onChange={(e) =>
                onSaveSettings({ ...settings, maxConcurrency: parseInt(e.target.value, 10) })
              }
              className="w-full accent-blue-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              3 a 4 es ideal para conexiones estándar. Aumenta a 5-6 en WiFi de alta velocidad.
            </p>
          </div>

          {/* Auto Optimization Toggle */}
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-400" /> Optimización Ligera de Fotos
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Reduce el peso de 100 fotos de 800MB a ~40MB sin perder nitidez en sellos ni textos
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoOptimizeImages}
                onChange={(e) =>
                  onSaveSettings({ ...settings, autoOptimizeImages: e.target.checked })
                }
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>

            {settings.autoOptimizeImages && (
              <div className="pt-2 border-t border-slate-700/50 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 font-medium">Resolución Máxima</label>
                  <select
                    value={settings.maxImageDimension}
                    onChange={(e) =>
                      onSaveSettings({
                        ...settings,
                        maxImageDimension: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                  >
                    <option value={1920}>1080p (1920px - Rápido)</option>
                    <option value={2560}>2K (2560px - Recomendado)</option>
                    <option value={3840}>4K (3840px - Ultra HD)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-medium">Calidad JPEG</label>
                  <select
                    value={settings.imageQuality}
                    onChange={(e) =>
                      onSaveSettings({
                        ...settings,
                        imageQuality: parseFloat(e.target.value),
                      })
                    }
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                  >
                    <option value={0.8}>80% (Equilibrado)</option>
                    <option value={0.88}>88% (Alta Nitidez)</option>
                    <option value={0.95}>95% (Máxima)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Manifest Doc */}
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/70 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-purple-400" /> Crear Informe TXT en la Carpeta
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Guarda un resumen con fecha, contenedor, PO, sello y lista de archivos
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.createManifestDoc}
              onChange={(e) =>
                onSaveSettings({ ...settings, createManifestDoc: e.target.checked })
              }
              className="w-4 h-4 accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Prefix Photos Sequence */}
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/70 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-400" /> Renombrar Fotos Secuenciales
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ejemplo: <code className="text-blue-300">MSKU1234567_001.jpg</code> en lugar del nombre de cámara
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.prefixPhotoSequence}
              onChange={(e) =>
                onSaveSettings({ ...settings, prefixPhotoSequence: e.target.checked })
              }
              className="w-4 h-4 accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Download Project Source Code Section */}
          <div className="bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                <FileCode2 className="w-4 h-4 text-emerald-400" /> Código Fuente para Android Studio
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Descarga el archivo ZIP completo listo para compilar en Android Studio o tu PC
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportZip}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer shrink-0"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Descargar ZIP</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
