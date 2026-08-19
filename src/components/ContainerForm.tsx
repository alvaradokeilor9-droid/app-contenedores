import React, { useState } from 'react';
import {
  Container,
  User,
  FileText,
  Lock,
  Calendar,
  FolderSync,
  Sparkles,
  Copy,
  Check,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ContainerMetadata } from '../types';
import { buildFolderName } from '../lib/imageProcessor';

interface ContainerFormProps {
  metadata: ContainerMetadata;
  onChange: (updated: Partial<ContainerMetadata>) => void;
  photosCount: number;
}

export const ContainerForm: React.FC<ContainerFormProps> = ({
  metadata,
  onChange,
  photosCount,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);

  const folderName = buildFolderName(
    metadata.containerNumber,
    metadata.clientName,
    metadata.poNumber,
    metadata.folderNamingPattern,
    metadata.inspectionDate
  );

  const handleCopyFolderName = () => {
    navigator.clipboard.writeText(folderName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContainerInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Automatically uppercase container numbers for logistics standards
    const val = e.target.value.toUpperCase();
    onChange({ containerNumber: val });
  };

  const handlePOInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ poNumber: e.target.value.toUpperCase() });
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <Container className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              1. Datos del Contenedor y Destino
            </h2>
            <p className="text-xs text-slate-400">
              Estos 3 datos definirán la carpeta creada automáticamente en Google Drive
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-900/80 text-slate-300 border border-slate-700 font-mono">
            {photosCount} {photosCount === 1 ? 'foto lista' : 'fotos listas'}
          </span>
        </div>
      </div>

      {/* Main 3 Core Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Contenedor */}
        <div className="space-y-1.5">
          <label
            htmlFor="input-container-num"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 uppercase tracking-wider"
          >
            <Container className="w-3.5 h-3.5 text-blue-400" />
            Número de Contenedor <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <input
              id="input-container-num"
              type="text"
              required
              value={metadata.containerNumber}
              onChange={handleContainerInput}
              placeholder="Ej: MSKU9876543"
              className="w-full bg-slate-900/90 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-mono tracking-wider transition-all outline-none"
            />
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> 4 letras + 7 dígitos estándar
          </p>
        </div>

        {/* Nombre del Cliente */}
        <div className="space-y-1.5">
          <label
            htmlFor="input-client-name"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 uppercase tracking-wider"
          >
            <User className="w-3.5 h-3.5 text-emerald-400" />
            Nombre del Cliente <span className="text-rose-400">*</span>
          </label>
          <input
            id="input-client-name"
            type="text"
            required
            value={metadata.clientName}
            onChange={(e) => onChange({ clientName: e.target.value })}
            placeholder="Ej: Logística Del Valle / Walmart"
            className="w-full bg-slate-900/90 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-all outline-none"
          />
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Nombre o razón social
          </p>
        </div>

        {/* PO / Orden de Compra */}
        <div className="space-y-1.5">
          <label
            htmlFor="input-po-number"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 uppercase tracking-wider"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            Orden de Compra / PO <span className="text-rose-400">*</span>
          </label>
          <input
            id="input-po-number"
            type="text"
            required
            value={metadata.poNumber}
            onChange={handlePOInput}
            placeholder="Ej: PO-2026-449"
            className="w-full bg-slate-900/90 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-mono transition-all outline-none"
          />
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Purchase Order / Pedido
          </p>
        </div>
      </div>

      {/* Live Folder Preview Banner */}
      <div className="mt-4 p-3.5 rounded-xl bg-slate-900/90 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <FolderSync className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>Nombre de Carpeta en Google Drive</span>
              <span className="text-[10px] text-blue-400 font-normal">(Vista previa en vivo)</span>
            </div>
            <div className="text-sm font-mono font-bold text-white break-all flex items-center gap-2 mt-0.5">
              <span>📂 {folderName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            id="btn-copy-folder-name"
            type="button"
            onClick={handleCopyFolderName}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Copiar nombre de carpeta"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Advanced / Optional Fields Toggle */}
      <div className="mt-3 pt-3 border-t border-slate-700/50">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <span>Campos adicionales (Sello, Fecha, Inspector, Formato de carpeta)</span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAdvanced && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 pt-2">
            {/* Sello / Precinto */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" /> Sello / Precinto
              </label>
              <input
                type="text"
                value={metadata.sealNumber || ''}
                onChange={(e) => onChange({ sealNumber: e.target.value.toUpperCase() })}
                placeholder="Ej: SL-993812"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 font-mono outline-none focus:border-blue-500"
              />
            </div>

            {/* Fecha */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> Fecha de Inspección
              </label>
              <input
                type="date"
                value={metadata.inspectionDate}
                onChange={(e) => onChange({ inspectionDate: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* Inspector */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" /> Nombre Inspector
              </label>
              <input
                type="text"
                value={metadata.inspectorName || ''}
                onChange={(e) => onChange({ inspectorName: e.target.value })}
                placeholder="Ej: Carlos M."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
              />
            </div>

            {/* Estilo de Nombre de Carpeta */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <FolderSync className="w-3 h-3 text-slate-400" /> Separador Carpeta
              </label>
              <select
                value={metadata.folderNamingPattern}
                onChange={(e) =>
                  onChange({
                    folderNamingPattern: e.target.value as ContainerMetadata['folderNamingPattern'],
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="standard">[Contenedor] - [Cliente] - PO [PO]</option>
                <option value="underscore">[Contenedor]_[Cliente]_[PO]</option>
                <option value="hyphen">[Contenedor] - [Cliente] - [PO]</option>
                <option value="date_first">[Fecha]_[Contenedor]_[Cliente]_[PO]</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
