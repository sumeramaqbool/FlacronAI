// Firebase Admin SDK Configuration for FlacronAI
const admin = require('firebase-admin');
require('dotenv').config();

let firebaseApp;

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
  try {
    if (!firebaseApp) {
      // Build service account from environment variables
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL.replace('@', '%40')}`,
        universe_domain: "googleapis.com"
      };

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
        // Storage bucket removed - using local file storage instead
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
      });

      console.log('✅ Firebase initialized successfully');
      console.log(`   Project ID: ${serviceAccount.project_id}`);
    }
    return firebaseApp;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    throw error;
  }
}

/**
 * Get Firestore database instance
 */
function getFirestore() {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.firestore();
}

/**
 * Get Firebase Storage instance
 * NOTE: Firebase Storage is disabled. Use local file storage instead.
 * This function is kept for backward compatibility but will throw an error if called.
 */
function getStorage() {
  throw new Error('Firebase Storage is disabled. Using local file storage instead. Check services/storageService.js');
}

/**
 * Get Firebase Auth instance
 */
function getAuth() {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.auth();
}

/**
 * Verify Firebase ID token
 */
async function verifyIdToken(idToken) {
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Token verification error:', error);
    throw new Error('Invalid authentication token');
  }
}

module.exports = {
  initializeFirebase,
  getFirestore,
  getStorage,
  getAuth,
  verifyIdToken,
  admin
};
