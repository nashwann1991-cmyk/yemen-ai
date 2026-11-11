import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, UserCredential } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(firebaseApp);

// Configure Google Auth Provider with account selection prompt
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account' // Forces Google to display the Account Chooser listing all Gmail accounts active on device
});

export async function signInWithGooglePopup(): Promise<UserCredential> {
  return await signInWithPopup(auth, googleProvider);
}
