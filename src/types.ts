export type PhotoCategory =
  | 'general'
  | 'sello_candado'
  | 'puertas_exterior'
  | 'interior_vacio'
  | 'carga_pallets'
  | 'embalaje_danos'
  | 'documentos';

export interface PhotoItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  type: string;
  category: PhotoCategory;
  timestamp: number;
  customNotes?: string;
  uploadStatus: 'idle' | 'uploading' | 'completed' | 'error';
  uploadProgress: number; // 0 to 100
  driveFileId?: string;
  driveLink?: string;
  errorMessage?: string;
}

export interface ContainerMetadata {
  containerNumber: string;
  clientName: string;
  poNumber: string;
  sealNumber?: string;
  inspectionDate: string;
  inspectorName?: string;
  notes?: string;
  targetParentFolderId?: string; // Optional custom Google Drive parent folder
  parentFolderName?: string;
  folderNamingPattern: 'standard' | 'hyphen' | 'underscore' | 'date_first';
}

export interface DriveFolderInfo {
  id: string;
  name: string;
  webViewLink: string;
  createdTime?: string;
}

export interface UploadBatchRecord {
  id: string;
  containerNumber: string;
  clientName: string;
  poNumber: string;
  sealNumber?: string;
  folderName: string;
  folderId: string;
  folderUrl: string;
  photoCount: number;
  totalSizeBytes: number;
  uploadedAt: string;
  uploadedBy?: string;
  status: 'completed' | 'partial' | 'failed';
}

export interface UploadSettings {
  maxConcurrency: number;
  autoOptimizeImages: boolean;
  maxImageDimension: number; // e.g. 1920 or 2560
  imageQuality: number; // 0.6 to 0.95
  createManifestDoc: boolean;
  prefixPhotoSequence: boolean;
}
