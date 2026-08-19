import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken
} from './lib/firebase';
import {
  createOrGetFolder,
  uploadPhotoMultipart,
  createInspectionManifest
} from './lib/googleDrive';
import { optimizeImage, buildFolderName, formatBytes } from './lib/imageProcessor';
import {
  PhotoItem,
  ContainerMetadata,
  DriveFolderInfo,
  UploadBatchRecord,
  UploadSettings,
  PhotoCategory
} from './types';

// Components
import { Header } from './components/Header';
import { ContainerForm } from './components/ContainerForm';
import { PhotoDropzone } from './components/PhotoDropzone';
import { PhotoGrid } from './components/PhotoGrid';
import { PhotoLightbox } from './components/PhotoLightbox';
import { UploadModal } from './components/UploadModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { SettingsModal } from './components/SettingsModal';
import { ConfirmModal } from './components/ConfirmModal';

import {
  UploadCloud,
  CheckCircle2,
  FolderOpen,
  AlertTriangle,
  Sparkles,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  FolderSync
} from 'lucide-react';
import type { User } from 'firebase/auth';

const STORAGE_KEY_HISTORY = 'container_drive_history_v1';
const STORAGE_KEY_SETTINGS = 'container_drive_settings_v1';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Form Metadata
  const [metadata, setMetadata] = useState<ContainerMetadata>({
    containerNumber: '',
    clientName: '',
    poNumber: '',
    sealNumber: '',
    inspectionDate: new Date().toISOString().slice(0, 10),
    inspectorName: '',
    notes: '',
    folderNamingPattern: 'standard',
  });

  // Form field errors
  const [formErrors, setFormErrors] = useState<{
    container?: boolean;
    client?: boolean;
    po?: boolean;
    photos?: boolean;
  }>({});

  // Photos State
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<PhotoItem | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Settings
  const [settings, setSettings] = useState<UploadSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return {
      maxConcurrency: 4,
      autoOptimizeImages: true,
      maxImageDimension: 2560,
      imageQuality: 0.88,
      createManifestDoc: true,
      prefixPhotoSequence: true,
    };
  });

  // Upload Engine State
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [createdFolder, setCreatedFolder] = useState<DriveFolderInfo | null>(null);
  const [completedUploadsCount, setCompletedUploadsCount] = useState(0);
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const isUploadCancelled = useRef(false);

  // Modals & Drawers
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // In-app confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: React.ReactNode;
    confirmText?: string;
    confirmVariant?: 'primary' | 'danger' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // History State
  const [history, setHistory] = useState<UploadBatchRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return [];
  });

  // Initialize Firebase Auth listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        if (token) setAccessToken(token);
        setIsLoadingAuth(false);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setIsLoadingAuth(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Save settings when changed
  const handleSaveSettings = (newSettings: UploadSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings));
    } catch {
      // Ignore
    }
  };

  // Save history helper
  const saveBatchToHistory = (record: UploadBatchRecord) => {
    setHistory((prev) => {
      const updated = [record, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
    } catch {
      // Ignore
    }
  };

  // Google Login Handler
  const handleLogin = async () => {
    try {
      setIsLoadingAuth(true);
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch (err: unknown) {
      console.error('Error logging in with Google:', err);
      const msg = err instanceof Error ? err.message : 'Error desconocido al conectar con Google';
      setConfirmDialog({
        isOpen: true,
        title: 'Error de Autenticación',
        message: `No se pudo iniciar sesión con Google: ${msg}`,
        confirmText: 'Entendido',
        confirmVariant: 'danger',
        onConfirm: () => setConfirmDialog((d) => ({ ...d, isOpen: false })),
      });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
    setUser(null);
    setAccessToken(null);
  };

  // Handling adding 100+ photos
  const handleFilesAdded = (files: File[]) => {
    const newItems: PhotoItem[] = files.map((file, idx) => {
      const objectUrl = URL.createObjectURL(file);
      return {
        id: `${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl: objectUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        category: 'general',
        timestamp: file.lastModified || Date.now(),
        uploadStatus: 'idle',
        uploadProgress: 0,
      };
    });

    setPhotos((prev) => [...prev, ...newItems]);
    setFormErrors((prev) => ({ ...prev, photos: false }));
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos((prev) => {
      const photoToDelete = prev.find((p) => p.id === id);
      if (photoToDelete) {
        URL.revokeObjectURL(photoToDelete.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleDeleteMultiple = (ids: string[]) => {
    const idSet = new Set(ids);
    setPhotos((prev) => {
      prev.forEach((p) => {
        if (idSet.has(p.id)) {
          URL.revokeObjectURL(p.previewUrl);
        }
      });
      return prev.filter((p) => !idSet.has(p.id));
    });
  };

  const handleClearAllPhotos = () => {
    if (photos.length === 0) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Quitar Todas las Fotos',
      message: `¿Estás seguro de que deseas quitar las ${photos.length} fotos de la lista actual?`,
      confirmText: 'Sí, Quitar Todas',
      confirmVariant: 'danger',
      onConfirm: () => {
        photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
        setPhotos([]);
        setConfirmDialog((d) => ({ ...d, isOpen: false }));
      },
    });
  };

  const handleUpdateCategory = (ids: string[], category: PhotoCategory) => {
    const idSet = new Set(ids);
    setPhotos((prev) =>
      prev.map((p) => (idSet.has(p.id) ? { ...p, category } : p))
    );
  };

  // Total size calculation
  const totalSizeBytes = useMemo(() => {
    return photos.reduce((acc, p) => acc + p.size, 0);
  }, [photos]);

  // Overall upload progress %
  const currentProgressPercent = useMemo(() => {
    if (photos.length === 0) return 0;
    const totalProgress = photos.reduce((acc, p) => acc + p.uploadProgress, 0);
    return Math.round(totalProgress / photos.length);
  }, [photos]);

  // Execute the actual upload queue
  const executeUpload = async (token: string) => {
    const folderName = buildFolderName(
      metadata.containerNumber,
      metadata.clientName,
      metadata.poNumber,
      metadata.folderNamingPattern,
      metadata.inspectionDate
    );

    setIsUploadModalOpen(true);
    setIsUploading(true);
    setIsCompleted(false);
    setUploadErrorMessage(null);
    setCompletedUploadsCount(0);
    isUploadCancelled.current = false;

    // Reset photo statuses
    setPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        uploadStatus: 'idle',
        uploadProgress: 0,
        errorMessage: undefined,
      }))
    );

    try {
      // Step A: Create or Get Google Drive Folder
      const folder = await createOrGetFolder(
        folderName,
        metadata.targetParentFolderId,
        token
      );
      setCreatedFolder(folder);

      // Step B: Process & Upload Photos with Worker Pool
      const concurrency = Math.min(settings.maxConcurrency || 4, 6);
      const queue = [...photos];
      let completedCount = 0;
      let hasAnyError = false;
      const uploadedFileNames: string[] = [];

      // Worker function
      const processItem = async (photoItem: PhotoItem, index: number) => {
        if (isUploadCancelled.current) return;

        // Determine target filename
        let targetFileName = photoItem.name;
        if (settings.prefixPhotoSequence) {
          const extension = photoItem.name.split('.').pop() || 'jpg';
          const seq = (index + 1).toString().padStart(3, '0');
          const cleanContainer = metadata.containerNumber.replace(/[^a-zA-Z0-9]/g, '');
          targetFileName = `${cleanContainer}_${seq}.${extension}`;
        }

        // Set status to uploading
        setPhotos((prev) =>
          prev.map((p) => (p.id === photoItem.id ? { ...p, uploadStatus: 'uploading' } : p))
        );

        try {
          let blobToUpload: Blob | File = photoItem.file;

          // Client-side optimization if enabled
          if (settings.autoOptimizeImages && photoItem.file.type.startsWith('image/')) {
            const optimized = await optimizeImage(photoItem.file, {
              maxDimension: settings.maxImageDimension,
              quality: settings.imageQuality,
            });
            blobToUpload = optimized.blob;
          }

          // Upload to Google Drive with progress
          const driveRes = await uploadPhotoMultipart(
            blobToUpload,
            targetFileName,
            photoItem.file.type || 'image/jpeg',
            folder.id,
            token,
            (percent) => {
              setPhotos((prev) =>
                prev.map((p) =>
                  p.id === photoItem.id ? { ...p, uploadProgress: percent } : p
                )
              );
            }
          );

          uploadedFileNames.push(targetFileName);
          completedCount++;
          setCompletedUploadsCount(completedCount);

          setPhotos((prev) =>
            prev.map((p) =>
              p.id === photoItem.id
                ? {
                    ...p,
                    uploadStatus: 'completed',
                    uploadProgress: 100,
                    driveFileId: driveRes.id,
                  }
                : p
            )
          );
        } catch (err: unknown) {
          console.error(`Error uploading photo ${photoItem.name}:`, err);
          hasAnyError = true;
          const msg = err instanceof Error ? err.message : 'Error al subir foto';
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === photoItem.id
                ? { ...p, uploadStatus: 'error', errorMessage: msg }
                : p
            )
          );
        }
      };

      // Pool executor
      let currentIndex = 0;
      const workers: Promise<void>[] = [];

      for (let i = 0; i < concurrency; i++) {
        workers.push(
          (async () => {
            while (currentIndex < queue.length && !isUploadCancelled.current) {
              const itemIndex = currentIndex++;
              const item = queue[itemIndex];
              await processItem(item, itemIndex);
            }
          })()
        );
      }

      await Promise.all(workers);

      // Step C: Create Manifest text file in Drive folder if enabled
      if (settings.createManifestDoc && uploadedFileNames.length > 0) {
        try {
          await createInspectionManifest(
            metadata,
            folder.id,
            uploadedFileNames.length,
            uploadedFileNames,
            token,
            user?.email || undefined
          );
        } catch (manifestErr) {
          console.warn('Could not generate manifest:', manifestErr);
        }
      }

      // Step D: Record in history
      saveBatchToHistory({
        id: `batch_${Date.now()}`,
        containerNumber: metadata.containerNumber,
        clientName: metadata.clientName,
        poNumber: metadata.poNumber,
        sealNumber: metadata.sealNumber,
        folderName: folder.name,
        folderId: folder.id,
        folderUrl: folder.webViewLink,
        photoCount: completedCount,
        totalSizeBytes,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user?.email || undefined,
        status: hasAnyError ? 'partial' : 'completed',
      });

      setIsCompleted(!hasAnyError);
      if (hasAnyError) {
        setUploadErrorMessage('Algunas fotos tuvieron errores de conexión. Puedes reintentarlas ahora.');
      }
    } catch (err: unknown) {
      console.error('Fatal upload error:', err);
      const msg = err instanceof Error ? err.message : 'Error durante la subida a Google Drive';
      setUploadErrorMessage(msg);
    } finally {
      setIsUploading(false);
    }
  };

  // Main Upload Button Trigger
  const handleStartUpload = async () => {
    // 1. Check form errors
    const errors = {
      container: !metadata.containerNumber.trim(),
      client: !metadata.clientName.trim(),
      po: !metadata.poNumber.trim(),
      photos: photos.length === 0,
    };
    setFormErrors(errors);

    if (errors.container || errors.client || errors.po) {
      setConfirmDialog({
        isOpen: true,
        title: 'Faltan Datos del Contenedor',
        message: 'Por favor completa los 3 campos obligatorios para nombrar la carpeta:',
        details: (
          <ul className="text-xs text-slate-300 space-y-1 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            {errors.container && <li className="text-rose-400 font-semibold">• Número de Contenedor</li>}
            {errors.client && <li className="text-rose-400 font-semibold">• Nombre del Cliente</li>}
            {errors.po && <li className="text-rose-400 font-semibold">• Orden de Compra (PO)</li>}
          </ul>
        ),
        confirmText: 'Completar Campos',
        confirmVariant: 'primary',
        onConfirm: () => setConfirmDialog((d) => ({ ...d, isOpen: false })),
      });
      return;
    }

    if (errors.photos) {
      setConfirmDialog({
        isOpen: true,
        title: 'Sin Fotografías',
        message: 'No has seleccionado fotos aún. Arrastra o selecciona tus fotos antes de guardar.',
        confirmText: 'Entendido',
        confirmVariant: 'primary',
        onConfirm: () => setConfirmDialog((d) => ({ ...d, isOpen: false })),
      });
      return;
    }

    // 2. Validate Google Auth
    let token = accessToken;
    if (!token) {
      token = await getAccessToken();
    }

    if (!token || !user) {
      setConfirmDialog({
        isOpen: true,
        title: 'Conexión con Google Drive Requerida',
        message:
          'Para crear la carpeta y subir las fotos a tu cuenta, es necesario iniciar sesión con Google.',
        details: (
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs text-slate-300">
            Se abrirá la ventana oficial de Google para autorizar el acceso a Google Drive.
          </div>
        ),
        confirmText: 'Conectar Google Drive',
        confirmVariant: 'success',
        onConfirm: async () => {
          setConfirmDialog((d) => ({ ...d, isOpen: false }));
          try {
            const loginRes = await googleSignIn();
            if (loginRes && loginRes.accessToken) {
              setUser(loginRes.user);
              setAccessToken(loginRes.accessToken);
              // Directly start upload after login
              executeUpload(loginRes.accessToken);
            }
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al conectar';
            setConfirmDialog({
              isOpen: true,
              title: 'Error de Conexión',
              message: `No se pudo conectar: ${msg}`,
              confirmText: 'Cerrar',
              confirmVariant: 'danger',
              onConfirm: () => setConfirmDialog((d) => ({ ...d, isOpen: false })),
            });
          }
        },
      });
      return;
    }

    // 3. User is logged in, confirm and start upload
    const folderName = buildFolderName(
      metadata.containerNumber,
      metadata.clientName,
      metadata.poNumber,
      metadata.folderNamingPattern,
      metadata.inspectionDate
    );

    setConfirmDialog({
      isOpen: true,
      title: 'Confirmar Subida a Google Drive',
      message: `Se creará la siguiente carpeta en tu Google Drive con ${photos.length} fotos:`,
      details: (
        <div className="bg-slate-800/90 p-3.5 rounded-xl border border-blue-500/40 text-xs space-y-2">
          <div className="flex items-center gap-2 text-white font-mono font-bold">
            <FolderSync className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="break-all">{folderName}</span>
          </div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-700/60 flex justify-between">
            <span>Total: <strong>{photos.length} fotos</strong></span>
            <span>Peso: <strong>{formatBytes(totalSizeBytes)}</strong></span>
          </div>
        </div>
      ),
      confirmText: `Subir ${photos.length} Fotos`,
      confirmVariant: 'primary',
      onConfirm: () => {
        setConfirmDialog((d) => ({ ...d, isOpen: false }));
        executeUpload(token!);
      },
    });
  };

  // Retry Failed Photos
  const handleRetryFailed = async () => {
    const token = accessToken || (await getAccessToken());
    if (!token || !createdFolder) return;

    setIsUploading(true);
    setUploadErrorMessage(null);

    const failed = photos.filter((p) => p.uploadStatus === 'error');
    for (let i = 0; i < failed.length; i++) {
      const p = failed[i];
      try {
        setPhotos((prev) =>
          prev.map((item) =>
            item.id === p.id ? { ...item, uploadStatus: 'uploading' } : item
          )
        );

        let blobToUpload: Blob | File = p.file;
        if (settings.autoOptimizeImages && p.file.type.startsWith('image/')) {
          const optimized = await optimizeImage(p.file, {
            maxDimension: settings.maxImageDimension,
            quality: settings.imageQuality,
          });
          blobToUpload = optimized.blob;
        }

        const driveRes = await uploadPhotoMultipart(
          blobToUpload,
          p.name,
          p.file.type || 'image/jpeg',
          createdFolder.id,
          token,
          (percent) => {
            setPhotos((prev) =>
              prev.map((item) =>
                item.id === p.id ? { ...item, uploadProgress: percent } : item
              )
            );
          }
        );

        setCompletedUploadsCount((prev) => prev + 1);
        setPhotos((prev) =>
          prev.map((item) =>
            item.id === p.id
              ? { ...item, uploadStatus: 'completed', uploadProgress: 100, driveFileId: driveRes.id }
              : item
          )
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al reintentar';
        setPhotos((prev) =>
          prev.map((item) =>
            item.id === p.id ? { ...item, uploadStatus: 'error', errorMessage: msg } : item
          )
        );
      }
    }

    setIsUploading(false);
    const stillFailed = photos.filter((p) => p.uploadStatus === 'error');
    setIsCompleted(stillFailed.length === 0);
  };

  // Reset form for next container
  const handleStartNewUpload = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPhotos([]);
    setMetadata({
      containerNumber: '',
      clientName: '',
      poNumber: '',
      sealNumber: '',
      inspectionDate: new Date().toISOString().slice(0, 10),
      inspectorName: '',
      notes: '',
      folderNamingPattern: metadata.folderNamingPattern,
    });
    setCreatedFolder(null);
    setIsUploadModalOpen(false);
    setIsCompleted(false);
    setFormErrors({});
  };

  const isFormFilled =
    Boolean(metadata.containerNumber.trim()) &&
    Boolean(metadata.clientName.trim()) &&
    Boolean(metadata.poNumber.trim());

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* App Header */}
      <Header
        user={user}
        isLoadingAuth={isLoadingAuth}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        historyCount={history.length}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Hero Notice Banner */}
        <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900/40 border border-blue-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Carga Masiva Organizada Directo a Google Drive
              </h2>
              <p className="text-xs text-slate-300">
                Sube más de 100 fotos. Se creará automáticamente la carpeta con el{' '}
                <span className="text-blue-300 font-semibold">Número de Contenedor</span>,{' '}
                <span className="text-emerald-300 font-semibold">Nombre del Cliente</span> y{' '}
                <span className="text-amber-300 font-semibold">PO</span>.
              </p>
            </div>
          </div>

          {!user && (
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer shrink-0"
            >
              <FolderOpen className="w-4 h-4" />
              Conectar Google Drive
            </button>
          )}
        </div>

        {/* Step 1: Form Information */}
        <ContainerForm
          metadata={metadata}
          onChange={(updated) => {
            setMetadata((prev) => ({ ...prev, ...updated }));
            setFormErrors((prev) => ({ ...prev, container: false, client: false, po: false }));
          }}
          photosCount={photos.length}
        />

        {/* Step 2: Dropzone */}
        <PhotoDropzone
          onFilesAdded={handleFilesAdded}
          currentCount={photos.length}
          totalSizeBytes={totalSizeBytes}
          isOptimizing={isOptimizing}
        />

        {/* Step 3: Photo Gallery Grid */}
        <PhotoGrid
          photos={photos}
          onDeletePhoto={handleDeletePhoto}
          onDeleteMultiple={handleDeleteMultiple}
          onClearAll={handleClearAllPhotos}
          onSelectPhotoToPreview={(photo) => setPreviewPhoto(photo)}
          onUpdateCategory={handleUpdateCategory}
        />

        {/* Floating / Sticky Bottom Upload Bar when ready */}
        <div className="sticky bottom-4 z-20 max-w-4xl mx-auto">
          <div className="bg-slate-900/95 border border-blue-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <span>{photos.length} fotos listas para subir</span>
                  {photos.length > 0 && (
                    <span className="text-slate-400 font-normal font-mono">
                      ({formatBytes(totalSizeBytes)})
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  Destino: <code className="text-blue-300 font-mono">
                    {buildFolderName(
                      metadata.containerNumber,
                      metadata.clientName,
                      metadata.poNumber,
                      metadata.folderNamingPattern,
                      metadata.inspectionDate
                    )}
                  </code>
                </div>
              </div>
            </div>

            <button
              id="btn-start-upload"
              type="button"
              onClick={handleStartUpload}
              disabled={isUploading}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer ${
                isFormFilled && photos.length > 0
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 scale-[1.02]'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>
                {photos.length > 0
                  ? `Guardar en Google Drive (${photos.length} Fotos)`
                  : 'Guardar en Google Drive'}
              </span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Lightbox Modal */}
      <PhotoLightbox
        photo={previewPhoto}
        allPhotos={photos}
        onClose={() => setPreviewPhoto(null)}
        onSelectPhoto={(photo) => setPreviewPhoto(photo)}
      />

      {/* Upload Progress & Success Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        metadata={metadata}
        folderInfo={createdFolder}
        photos={photos}
        currentProgressPercent={currentProgressPercent}
        completedCount={completedUploadsCount}
        totalCount={photos.length}
        isUploading={isUploading}
        isCompleted={isCompleted}
        hasErrors={photos.some((p) => p.uploadStatus === 'error')}
        errorMessage={uploadErrorMessage}
        onRetryFailed={handleRetryFailed}
        onStartNewUpload={handleStartNewUpload}
      />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={handleClearHistory}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      {/* Custom In-App Confirmation / Alert Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        details={confirmDialog.details}
        confirmText={confirmDialog.confirmText}
        confirmVariant={confirmDialog.confirmVariant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((d) => ({ ...d, isOpen: false }))}
      />
    </div>
  );
}
