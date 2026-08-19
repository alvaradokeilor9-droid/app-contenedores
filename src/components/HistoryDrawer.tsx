import React, { useState } from 'react';
import {
  X,
  History,
  FolderOpen,
  ExternalLink,
  Search,
  Trash2,
  Calendar,
  CheckCircle2,
  Layers,
  FileText
} from 'lucide-react';
import { UploadBatchRecord } from '../types';
import { formatBytes } from '../lib/imageProcessor';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: UploadBatchRecord[];
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.containerNumber.toLowerCase().includes(q) ||
      item.clientName.toLowerCase().includes(q) ||
      item.poNumber.toLowerCase().includes(q) ||
      item.folderName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-lg h-full flex flex-col shadow-2xl">
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Historial de Contenedores ({history.length})
              </h3>
              <p className="text-xs text-slate-400">
                Carpetas subidas previamente a Google Drive
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Actions */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por contenedor, cliente o PO..."
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
            />
          </div>

          {history.length > 0 && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Deseas limpiar el historial local de cargas? (Las carpetas permanecerán seguras en Google Drive)')) {
                    onClearHistory();
                  }
                }}
                className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Limpiar historial local
              </button>
            </div>
          )}
        </div>

        {/* List of Batches */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Layers className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">
                {search ? 'No hay resultados para tu búsqueda' : 'Aún no has subido contenedores'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Completa el formulario y sube tus fotos para ver el registro aquí.
              </p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 rounded-xl p-4 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-blue-400">
                        {item.containerNumber}
                      </span>
                      <span className="text-xs px-2 py-0.2 rounded-md bg-slate-700 text-slate-200">
                        PO: {item.poNumber}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-white mt-1">
                      {item.clientName}
                    </div>
                  </div>

                  <a
                    href={item.folderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition-colors shrink-0"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    {item.photoCount} fotografías ({formatBytes(item.totalSizeBytes)})
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {new Date(item.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
