import { ContainerMetadata, DriveFolderInfo } from '../types';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3/files';

/**
 * Searches for an existing folder by name in a parent or root, or creates a new one.
 */
export async function createOrGetFolder(
  folderName: string,
  parentFolderId: string | undefined,
  accessToken: string
): Promise<DriveFolderInfo> {
  const sanitizedName = folderName.trim().replace(/['\\]/g, '');
  let query = `name = '${sanitizedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  }

  // 1. Check if folder already exists
  try {
    const searchUrl = `${DRIVE_API_URL}/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink,createdTime)&spaces=drive`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        const existing = data.files[0];
        return {
          id: existing.id,
          name: existing.name,
          webViewLink: existing.webViewLink || `https://drive.google.com/drive/folders/${existing.id}`,
          createdTime: existing.createdTime,
        };
      }
    }
  } catch (err) {
    console.warn('Error searching existing folder, creating new one:', err);
  }

  // 2. Create the new folder
  const metadata: Record<string, unknown> = {
    name: folderName.trim(),
    mimeType: 'application/vnd.google-apps.folder',
    description: `Carpeta de inspección de fotos de contenedor creada automáticamente.`,
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const createRes = await fetch(`${DRIVE_API_URL}/files?fields=id,name,webViewLink,createdTime`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!createRes.ok) {
    const errBody = await createRes.json().catch(() => ({}));
    throw new Error(
      errBody.error?.message || `Error ${createRes.status} al crear carpeta en Google Drive`
    );
  }

  const folderData = await createRes.json();
  return {
    id: folderData.id,
    name: folderData.name,
    webViewLink: folderData.webViewLink || `https://drive.google.com/drive/folders/${folderData.id}`,
    createdTime: folderData.createdTime,
  };
}

/**
 * Uploads a photo file to Google Drive using multipart upload with XMLHttpRequest for live progress tracking.
 */
export function uploadPhotoMultipart(
  file: Blob | File,
  fileName: string,
  mimeType: string,
  folderId: string,
  accessToken: string,
  onProgress?: (progress: number) => void
): Promise<{ id: string; webViewLink?: string; webContentLink?: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      mimeType: mimeType || 'image/jpeg',
      parents: [folderId],
    };

    const reader = new FileReader();
    reader.onload = function () {
      const fileBuffer = reader.result;

      // Construct multipart body
      const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
        metadata
      )}`;
      const fileHeaderPart = `${delimiter}Content-Type: ${mimeType || 'image/jpeg'}\r\n\r\n`;

      const metadataBlob = new Blob([metadataPart], { type: 'text/plain' });
      const fileHeaderBlob = new Blob([fileHeaderPart], { type: 'text/plain' });
      const closeBlob = new Blob([closeDelimiter], { type: 'text/plain' });

      const fullBody = new Blob([metadataBlob, fileHeaderBlob, fileBuffer as ArrayBuffer, closeBlob], {
        type: `multipart/related; boundary=${boundary}`,
      });

      xhr.open(
        'POST',
        `${UPLOAD_API_URL}?uploadType=multipart&fields=id,name,webViewLink,webContentLink,thumbnailLink`
      );
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (onProgress) onProgress(100);
            resolve(res);
          } catch (e) {
            reject(new Error('Respuesta inválida del servidor de Google Drive'));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.error?.message || `Error ${xhr.status} al subir archivo`));
          } catch {
            reject(new Error(`Error ${xhr.status} al subir archivo a Google Drive`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Error de conexión de red durante la subida'));
      };

      xhr.send(fullBody);
    };

    reader.onerror = () => {
      reject(new Error('No se pudo leer el archivo de imagen local'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Creates an inspection summary / manifest document in the folder.
 */
export async function createInspectionManifest(
  metadata: ContainerMetadata,
  folderId: string,
  photosCount: number,
  photoFileNames: string[],
  accessToken: string,
  userEmail?: string
): Promise<string> {
  const content = `=====================================================
INSPECCIÓN Y REPORTE FOTOGRÁFICO DE CONTENEDOR
=====================================================
Número de Contenedor : ${metadata.containerNumber || 'N/A'}
Nombre del Cliente   : ${metadata.clientName || 'N/A'}
Orden de Compra (PO) : ${metadata.poNumber || 'N/A'}
Número de Precinto/Sello : ${metadata.sealNumber || 'N/A'}
Fecha de Inspección  : ${metadata.inspectionDate}
Inspector            : ${metadata.inspectorName || userEmail || 'No especificado'}
Total de Fotografías : ${photosCount} fotos
Subido por           : ${userEmail || 'Usuario autenticado'}
Fecha y Hora Subida  : ${new Date().toLocaleString('es-ES', { timeZoneName: 'short' })}
Notas Adicionales    : ${metadata.notes || 'Ninguna'}
=====================================================

LISTADO DE ARCHIVOS SUBIDOS:
${photoFileNames.map((name, i) => `${(i + 1).toString().padStart(3, '0')}. ${name}`).join('\n')}

Generado automáticamente por el Cargador de Fotos de Contenedores.
`;

  const fileName = `INFORME_${metadata.containerNumber || 'CONTENEDOR'}_${metadata.poNumber || 'PO'}.txt`;

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const docMetadata = {
    name: fileName,
    mimeType: 'text/plain',
    parents: [folderId],
  };

  const multipartBody = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
    docMetadata
  )}${delimiter}Content-Type: text/plain; charset=UTF-8\r\n\r\n${content}${closeDelimiter}`;

  const res = await fetch(`${UPLOAD_API_URL}?uploadType=multipart&fields=id,webViewLink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!res.ok) {
    console.warn('Could not create manifest text file:', await res.text());
    return '';
  }

  const data = await res.json();
  return data.id;
}

/**
 * List folders in Google Drive for optional parent folder selector.
 */
export async function listUserFolders(accessToken: string): Promise<DriveFolderInfo[]> {
  try {
    const q = "mimeType = 'application/vnd.google-apps.folder' and trashed = false";
    const res = await fetch(
      `${DRIVE_API_URL}/files?q=${encodeURIComponent(q)}&pageSize=20&orderBy=modifiedTime desc&fields=files(id,name,webViewLink)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.files || []).map((f: { id: string; name: string; webViewLink?: string }) => ({
      id: f.id,
      name: f.name,
      webViewLink: f.webViewLink || `https://drive.google.com/drive/folders/${f.id}`,
    }));
  } catch {
    return [];
  }
}
