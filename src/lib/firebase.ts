import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  type User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Provider with Google Drive scopes
export const googleProvider = new GoogleAuthProvider();
// Required Google Drive scopes:
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
// Prompt user to select account if needed
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Flag to track sign-in state and cache access token in memory
let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup to obtain OAuth token with Drive scope
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google Drive');
    }

    cachedAccessToken = credential.accessToken;
    // Also save in sessionStorage as temporary backup during the active browser session
    try {
      sessionStorage.setItem('gd_access_token', cachedAccessToken);
    } catch {
      // Ignore if sessionStorage is restricted
    }

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Error during Google Sign In:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const stored = sessionStorage.getItem('gd_access_token');
    if (stored) {
      cachedAccessToken = stored;
      return stored;
    }
  } catch {
    // Ignore
  }
  return null;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  try {
    sessionStorage.removeItem('gd_access_token');
  } catch {
    // Ignore
  }
};
