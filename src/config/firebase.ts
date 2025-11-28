import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Verificar si hay credenciales de Firebase como JSON completo
const googleAppCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// O verificar credenciales individuales
const hasIndividualCredentials = 
  process.env.FIREBASE_PROJECT_ID && 
  process.env.FIREBASE_PRIVATE_KEY && 
  process.env.FIREBASE_CLIENT_EMAIL;

let firebaseInitialized = false;

if (googleAppCredentials) {
  try {
    // Parsear el JSON completo
    const serviceAccount = JSON.parse(googleAppCredentials);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    console.log('✅ Firebase Admin inicializado correctamente (usando GOOGLE_APPLICATION_CREDENTIALS)');
    firebaseInitialized = true;
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin con GOOGLE_APPLICATION_CREDENTIALS:', error);
  }
} else if (hasIndividualCredentials) {
  // Inicializar Firebase Admin con credenciales individuales
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
    console.log('✅ Firebase Admin inicializado correctamente (usando credenciales individuales)');
    firebaseInitialized = true;
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin con credenciales individuales:', error);
  }
} else {
  console.warn('⚠️  Firebase no configurado - Configura las variables en .env para habilitar autenticación');
  console.warn('   Puedes usar GOOGLE_APPLICATION_CREDENTIALS (JSON completo)');
  console.warn('   O FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL (individuales)');
}

// Exportar con manejo seguro
export const firebaseAuth = firebaseInitialized ? admin.auth() : null;
export const firebaseDb = firebaseInitialized ? admin.firestore() : null;

export default admin;
