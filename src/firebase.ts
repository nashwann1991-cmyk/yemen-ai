import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App using provisioned config
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with the provisioned database ID
export const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Auth
export const auth = getAuth(firebaseApp);

// Configure Google Auth Provider with account selection prompt
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate Connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Save or update user account document in Firestore `/users/{uid}`
export async function syncUserAccountToFirestore(
  firebaseUser: FirebaseUser,
  options?: { displayName?: string; authProvider?: 'password' | 'google' }
): Promise<void> {
  const uid = firebaseUser.uid;
  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  let existingSnap;
  try {
    existingSnap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  const resolvedEmail = (firebaseUser.email || '').trim().toLowerCase().slice(0, 254);
  const resolvedName = (
    options?.displayName ||
    firebaseUser.displayName ||
    resolvedEmail.split('@')[0] ||
    'مستخدم جديد'
  )
    .trim()
    .slice(0, 100);
  const resolvedAvatar = firebaseUser.photoURL ? firebaseUser.photoURL.slice(0, 500) : undefined;
  const isVerifiedAdmin =
    resolvedEmail === 'nashwann1991@gmail.com' && firebaseUser.emailVerified === true;

  if (!existingSnap.exists()) {
    const newUserDoc: Record<string, any> = {
      uid,
      displayName: resolvedName,
      email: resolvedEmail,
      role: isVerifiedAdmin ? 'admin' : 'user',
      status: 'active',
      authProvider: options?.authProvider || 'password',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    if (resolvedAvatar) {
      newUserDoc.avatar = resolvedAvatar;
    }

    try {
      await setDoc(userRef, newUserDoc);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, userPath);
    }
  } else {
    const updatePayload: Record<string, any> = {
      displayName: resolvedName,
      updatedAt: serverTimestamp()
    };
    if (resolvedAvatar) {
      updatePayload.avatar = resolvedAvatar;
    }

    try {
      await updateDoc(userRef, updatePayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, userPath);
    }
  }
}

export async function registerWithFirebaseEmail(
  email: string,
  password: string,
  displayName: string
): Promise<{ user: FirebaseUser; idToken: string }> {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(credential.user, { displayName: displayName.trim().slice(0, 100) });
  await syncUserAccountToFirestore(credential.user, {
    displayName: displayName.trim(),
    authProvider: 'password'
  });
  const idToken = await credential.user.getIdToken();
  return { user: credential.user, idToken };
}

export async function loginWithFirebaseEmail(
  email: string,
  password: string
): Promise<{ user: FirebaseUser; idToken: string }> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  await syncUserAccountToFirestore(credential.user, { authProvider: 'password' });
  const idToken = await credential.user.getIdToken();
  return { user: credential.user, idToken };
}

export async function signInWithGooglePopup(): Promise<UserCredential> {
  const credential = await signInWithPopup(auth, googleProvider);
  await syncUserAccountToFirestore(credential.user, { authProvider: 'google' });
  return credential;
}

export async function signOutFromFirebase(): Promise<void> {
  await signOut(auth);
}
