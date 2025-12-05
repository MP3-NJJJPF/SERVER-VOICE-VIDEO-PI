/**
 * Firebase Admin SDK Configuration Module
 * 
 * @description
 * Initializes Firebase Admin SDK with credentials from environment variables.
 * Supports two configuration methods:
 * 1. Complete JSON credentials via GOOGLE_APPLICATION_CREDENTIALS
 * 2. Individual credentials (PROJECT_ID, PRIVATE_KEY, CLIENT_EMAIL)
 * 
 * @module config/firebase
 */

import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Check for complete Firebase credentials as JSON
const googleAppCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// Or check for individual credentials
const hasIndividualCredentials = 
  process.env.FIREBASE_PROJECT_ID && 
  process.env.FIREBASE_PRIVATE_KEY && 
  process.env.FIREBASE_CLIENT_EMAIL;

let firebaseInitialized = false;

if (googleAppCredentials) {
  try {
    // Parse complete JSON credentials
    const serviceAccount = JSON.parse(googleAppCredentials);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    console.log('Firebase Admin inicializado correctamente (usando GOOGLE_APPLICATION_CREDENTIALS)');
    firebaseInitialized = true;
  } catch (error) {
    console.error('Error inicializando Firebase Admin con GOOGLE_APPLICATION_CREDENTIALS:', error);
  }
} else if (hasIndividualCredentials) {
  // Initialize Firebase Admin with individual credentials
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
    console.log('Firebase Admin inicializado correctamente (usando credenciales individuales)');
    firebaseInitialized = true;
  } catch (error) {
    console.error('Error inicializando Firebase Admin con credenciales individuales:', error);
  }
} else {
  console.warn('Firebase not configured - Set environment variables in .env to enable authentication');
  console.warn('   You can use GOOGLE_APPLICATION_CREDENTIALS (complete JSON)');
  console.warn('   Or FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL (individual)');
}

/**
 * Firebase Authentication instance
 * @type {admin.auth.Auth | null}
 * @description Returns Firebase Auth instance if initialized, null otherwise
 */
export const firebaseAuth = firebaseInitialized ? admin.auth() : null;

/**
 * Firebase Firestore instance
 * @type {admin.firestore.Firestore | null}
 * @description Returns Firestore instance if initialized, null otherwise
 */
export const firebaseDb = firebaseInitialized ? admin.firestore() : null;

export default admin;
