import React, { useState, useMemo } from 'react';
import {
  Trash2,
  Maximize2,
  Tag,
  Search,
  Filter,
  CheckSquare,
  Square,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { PhotoItem, PhotoCategory } from '../types';
import { formatBytes } from '../lib/imageProcessor';

interface PhotoGridProps {
  photos: PhotoItem[];
  onDeletePhoto: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
  onClearAll: () => void;
  onSelectPhotoToPreview: (photo: PhotoItem) => void;
  onUpdateCategory: (ids: string[], category: PhotoCategory) => void;
}

const CATEGORIES: { id: PhotoCategory; label: string; color: string }[] = [
  { id: 'general', label: 'General', color: 'bg-slate-700 text-slate-200' },
  { id: 'sello_candado', label: 'Sello / Candado', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: 'puertas_exterior', label: 'Puertas / Exterior', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { id: 'interior_vacio', label: 'Interior Vacío', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { id: 'carga_pallets', label: 'Carga / Pallets', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { id: 'embalaje_danos', label: 'Daños / Observaciones', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { id: 'documentos', label: 'Guías / Documentos', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
];

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  onDeletePhoto,
  onDeleteMultiple,
  onClearAll,
  onSelectPhotoToPreview,
  onUpdateCategory,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bulkCategory, setBulkCategory] = useState<PhotoCategory>('general');
  const [page, setPage] = useState(1);
  const pageSize = 48; // Efficient pagination for > 100 photos

  // Filtered photos
  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      const matchCat =
        activeCategoryFilter === 'all' || p.category === activeCategoryFilter;
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [photos, activeCategoryFilter, searchQuery]);

  // Paginated subset
  const totalPages = Math.ceil(filteredPhotos.length / pageSize) || 1;
  const paginatedPhotos = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPhotos.slice(start, start + pageSize);
  }, [filteredPhotos, page, pageSize]);

  // Toggle single selection
  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select / Deselect all
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPhotos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPhotos.map((p) => p.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (
      window.confirm(
        `¿Deseas eliminar las ${selectedIds.size} fotografías seleccionadas de la lista?`
      )
    ) {
      onDeleteMultiple(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleApplyBulkCategory = () => {
    if (selectedIds.size === 0) return;
    onUpdateCategory(Array.from(selectedIds), bulkCategory);
  };

  if (photos.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-sm">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Galería de Fotografías ({photos.length})
            </h2>
            {photos.length >= 100 && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                +100 Fotos listas
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Revisa, organiza o elimina fotos antes de iniciar la subida a Google Drive
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Select all toggle */}
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900/80 hover:bg-slate-900 text-slate-300 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            {selectedIds.size === filteredPhotos.length && filteredPhotos.length > 0 ? (
              <>
                <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                Deseleccionar todo
              </>
            ) : (
              <>
                <Square className="w-3.5 h-3.5 text-slate-400" />
                Seleccionar ({selectedIds.size}/{filteredPhotos.length})
              </>
            )}
          </button>

          {/* Delete Selected */}
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar ({selectedIds.size})
            </button>
          )}

          {/* Bulk Categorize */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700 px-2 py-1 rounded-lg">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value as PhotoCategory)}
                className="bg-transparent text-xs text-white outline-none cursor-pointer pr-1"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleApplyBulkCategory}
                className="text-[11px] px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium cursor-pointer"
              >
                Aplicar
              </button>
            </div>
          )}

          {/* Clear All */}
          <button
            type="button"
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-900/80 rounded-lg transition-colors cursor-pointer ml-auto lg:ml-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpiar todo
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setActiveCategoryFilter('all');
              setPage(1);
            }}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeCategoryFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-700/60'
            }`}
          >
            Todas ({photos.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = photos.filter((p) => p.category === cat.id).length;
            if (count === 0 && activeCategoryFilter !== cat.id) return null;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategoryFilter(cat.id);
                  setPage(1);
                }}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  activeCategoryFilter === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-700/60'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative shrink-0 sm:w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nombre..."
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Photos Grid */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {paginatedPhotos.map((photo, index) => {
          const isSelected = selectedIds.has(photo.id);
          const absoluteIndex = (page - 1) * pageSize + index + 1;
          return (
            <div
              key={photo.id}
              onClick={(e) => toggleSelectOne(photo.id, e)}
              className={`group relative bg-slate-900 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-500/30'
                  : 'border-slate-800 hover:border-slate-600'
              }`}
            >
              {/* Thumbnail Container */}
              <div className="aspect-square relative overflow-hidden bg-slate-950 flex items-center justify-center">
                <img
                  src={photo.previewUrl}
                  alt={photo.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />

                {/* Selection Checkbox Pill */}
                <div className="absolute top-1.5 left-1.5 z-10">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center backdrop-blur-sm transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-black/60 text-transparent group-hover:text-slate-300 border border-white/20'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Photo Index Badge */}
                <div className="absolute top-1.5 right-1.5 z-10 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-mono text-slate-300">
                  #{absoluteIndex}
                </div>

                {/* Quick Hover Action Overlays */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPhotoToPreview(photo);
                    }}
                    className="p-1.5 rounded-lg bg-slate-900/90 text-white hover:bg-blue-600 transition-colors shadow"
                    title="Ver en tamaño completo"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePhoto(photo.id);
                    }}
                    className="p-1.5 rounded-lg bg-slate-900/90 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors shadow"
                    title="Eliminar foto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Photo Meta Footer */}
              <div className="p-2 bg-slate-900">
                <p className="text-[11px] font-medium text-slate-200 truncate" title={photo.name}>
                  {photo.name}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>{formatBytes(photo.size)}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded border text-[9px] truncate max-w-[80px] ${
                      CATEGORIES.find((c) => c.id === photo.category)?.color || 'bg-slate-800'
                    }`}
                  >
                    {CATEGORIES.find((c) => c.id === photo.category)?.label.split('/')[0] || 'Foto'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="mt-5 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
          <div>
            Mostrando {paginatedPhotos.length} de {filteredPhotos.length} fotos (Página {page} de{' '}
            {totalPages})
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Anterior
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && page > 3) {
                  pageNum = page - 3 + i;
                  if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                }
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={`w-7 h-7 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                      page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
