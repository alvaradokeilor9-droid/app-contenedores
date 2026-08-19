import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  type User,
  Auth
} from 'firebase/auth';

// Standard Firebase config for ContainerDrive OAuth & Firestore
const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'gen-lang-client-0632157554',
  appId: '1:774120931391:web:298b7c1121c6bbfaec788a',
  apiKey: 'AIzaSyC-07tQanZKd8kuzfMQxDPxb3-ecg01YbQ',
  authDomain: 'gen-lang-client-0632157554.firebaseapp.com',
  storageBucket: 'gen-lang-client-0632157554.firebasestorage.app',
  messagingSenderId: '774120931391',
  measurementId: '',
  oAuthClientId: '774120931391-a0fhbrn0hp71rdju4ulhrer9l9il1sto.apps.googleusercontent.com',
  recaptchaSiteKey: '',
};

// Initialize Firebase App instance safely with fallback
let app: FirebaseApp;
try {
  app = !getApps().length ? initializeApp(DEFAULT_FIREBASE_CONFIG) : getApp();
} catch (e) {
  console.warn('Firebase initialization fallback:', e);
  app = !getApps().length ? initializeApp(DEFAULT_FIREBASE_CONFIG) : getApp();
}

export const auth: Auth = getAuth(app);

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
