import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Verificar si hay credenciales de Firebase
const hasFirebaseCredentials = 
  process.env.FIREBASE_PROJECT_ID && 
  process.env.FIREBASE_PRIVATE_KEY && 
  process.env.FIREBASE_CLIENT_EMAIL;

if (hasFirebaseCredentials) {
  // Inicializar Firebase Admin
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
    console.log('✅ Firebase Admin inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin:', error);
  }
} else {
  console.warn('⚠️  Firebase no configurado - Configura las variables en .env para habilitar autenticación');
  console.warn('   Ver .env.example para las variables necesarias');
}

// Exportar con manejo seguro
export const firebaseAuth = hasFirebaseCredentials ? admin.auth() : null;
export const firebaseDb = hasFirebaseCredentials ? admin.firestore() : null;

export default admin;
