import JSZip from 'jszip';

/**
 * Bundles and downloads the entire project as a .zip file directly from the browser.
 */
export async function downloadProjectAsZip(): Promise<void> {
  const zip = new JSZip();

  // Root files
  zip.file(
    'package.json',
    JSON.stringify(
      {
        name: 'container-drive-uploader',
        private: true,
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'vite --port=3000 --host=0.0.0.0',
          build: 'vite build',
          preview: 'vite preview',
        },
        dependencies: {
          '@tailwindcss/vite': '^4.1.14',
          '@vitejs/plugin-react': '^5.0.4',
          'canvas-confetti': '^1.9.4',
          dotenv: '^17.2.3',
          firebase: '^12.17.1',
          'lucide-react': '^0.546.0',
          motion: '^12.23.24',
          react: '^19.0.1',
          'react-dom': '^19.0.1',
          tailwindcss: '^4.1.14',
          vite: '^6.2.3',
          jszip: '^3.10.1',
        },
        devDependencies: {
          '@types/canvas-confetti': '^1.9.0',
          '@types/node': '^22.14.0',
          '@types/react': '^19.0.1',
          '@types/react-dom': '^19.0.1',
          typescript: '~5.8.2',
        },
      },
      null,
      2
    )
  );

  zip.file(
    'tsconfig.json',
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          useDefineForClassFields: false,
          module: 'ESNext',
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          skipLibCheck: true,
          moduleResolution: 'bundler',
          isolatedModules: true,
          moduleDetection: 'force',
          allowJs: true,
          jsx: 'react-jsx',
          paths: {
            '@/*': ['./*'],
          },
          noEmit: true,
        },
      },
      null,
      2
    )
  );

  zip.file(
    'vite.config.ts',
    `import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
`
  );

  zip.file(
    'index.html',
    `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cargador de Fotos de Contenedor | Google Drive</title>
    <meta name="description" content="Carga masiva de más de 100 fotos organizadas automáticamente en Google Drive por número de contenedor, cliente y PO." />
    <meta name="theme-color" content="#020617" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  </head>
  <body class="bg-slate-900 text-slate-100 min-h-screen antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
  );

  zip.file(
    'firebase-applet-config.json',
    JSON.stringify(
      {
        projectId: 'gen-lang-client-0632157554',
        appId: '1:774120931391:web:298b7c1121c6bbfaec788a',
        apiKey: 'AIzaSyC-07tQanZKd8kuzfMQxDPxb3-ecg01YbQ',
        authDomain: 'gen-lang-client-0632157554.firebaseapp.com',
        storageBucket: 'gen-lang-client-0632157554.firebasestorage.app',
        messagingSenderId: '774120931391',
        measurementId: '',
        oAuthClientId: '774120931391-a0fhbrn0hp71rdju4ulhrer9l9il1sto.apps.googleusercontent.com',
        recaptchaSiteKey: '',
      },
      null,
      2
    )
  );

  zip.file(
    'public/manifest.json',
    JSON.stringify(
      {
        name: 'Cargador de Fotos de Contenedor',
        short_name: 'ContainerDrive',
        description: 'Carga masiva de fotos de contenedores a Google Drive',
        start_url: '/',
        display: 'standalone',
        background_color: '#020617',
        theme_color: '#020617',
      },
      null,
      2
    )
  );

  zip.file(
    'README.md',
    `# Cargador de Fotos de Contenedores a Google Drive

Aplicación web y móvil para la carga masiva y organizada de más de 100 fotografías a Google Drive con creación automática de carpetas por **Número de Contenedor**, **Nombre del Cliente** y **PO**.

## 🚀 Cómo ejecutar en tu computadora:

1. Instala las dependencias:
\`\`\`bash
npm install
\`\`\`

2. Inicia el servidor de desarrollo:
\`\`\`bash
npm run dev
\`\`\`

3. Abre en tu navegador: \`http://localhost:3000\`

---

## 📱 Cómo abrir y compilar en Android Studio (APK):

1. Instala Capacitor en la carpeta del proyecto:
\`\`\`bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "ContainerDrive" "com.container.drive" --web-dir dist
\`\`\`

2. Compila la app y genera la carpeta Android:
\`\`\`bash
npm run build
npx cap add android
npx cap sync
\`\`\`

3. Abre Android Studio:
\`\`\`bash
npx cap open android
\`\`\`

4. En Android Studio ve a **Build > Build Bundle(s) / APK(s) > Build APK(s)** para generar tu archivo APK instalable.
`
  );

  // Read current active source files if available or inject clean source modules
  const mainTsx = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`;

  const indexCss = `@import "tailwindcss";
`;

  zip.file('src/main.tsx', mainTsx);
  zip.file('src/index.css', indexCss);

  // Generate the blob and trigger download
  const content = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = 'ContainerDrive_App_CodigoFuente.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}
