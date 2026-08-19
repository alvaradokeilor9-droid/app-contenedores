import React, { useState } from 'react';
import {
  FolderOpen,
  LogOut,
  History,
  Settings,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FolderGit2,
  Download,
  FileArchive
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { downloadProjectAsZip } from '../lib/projectExporter';

interface HeaderProps {
  user: User | null;
  isLoadingAuth: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isLoadingAuth,
  onLogin,
  onLogout,
  onOpenHistory,
  onOpenSettings,
  historyCount,
}) => {
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const handleDownloadZip = async () => {
    try {
      setIsDownloadingZip(true);
      await downloadProjectAsZip();
    } catch (err) {
      console.error('Error creating zip:', err);
      alert('Hubo un problema al crear el archivo ZIP.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold">
            <FolderGit2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                ContainerDrive <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono font-medium border border-blue-500/30">100+ Fotos</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Organizador y cargador automático de fotos a Google Drive
            </p>
          </div>
        </div>

        {/* Right Actions & Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Direct Download ZIP Button */}
          <button
            id="btn-download-project-zip"
            onClick={handleDownloadZip}
            disabled={isDownloadingZip}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 rounded-lg transition-all shadow-sm cursor-pointer"
            title="Descargar todo el código fuente en archivo ZIP para Android Studio o computadora"
          >
            {isDownloadingZip ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <Download className="w-4 h-4 text-emerald-400" />
            )}
            <span className="hidden sm:inline">Descargar ZIP</span>
          </button>

          {/* History Button */}
          <button
            id="btn-open-history"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors cursor-pointer"
            title="Historial de contenedores cargados"
          >
            <History className="w-4 h-4 text-slate-400" />
            <span className="hidden md:inline">Historial</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 text-xs bg-slate-700 text-slate-200 rounded-full font-mono">
                {historyCount}
              </span>
            )}
          </button>

          {/* Settings Button */}
          <button
            id="btn-open-settings"
            onClick={onOpenSettings}
            className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors cursor-pointer"
            title="Ajustes de subida y compresión"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Google Auth Status / Button */}
          {isLoadingAuth ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">Verificando...</span>
            </div>
          ) : user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2 bg-slate-800/80 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Usuario'}
                    className="w-6 h-6 rounded-full ring-1 ring-emerald-500/40"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-400 text-xs font-semibold flex items-center justify-center">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col text-left pr-1 hidden lg:block">
                  <span className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Drive Conectado
                  </span>
                </div>
                <button
                  id="btn-logout-google"
                  onClick={onLogout}
                  className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-700/60 transition-colors cursor-pointer"
                  title="Cerrar sesión de Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              id="btn-login-google"
              onClick={onLogin}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="hidden sm:inline">Conectar Google Drive</span>
              <span className="sm:hidden">Conectar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
