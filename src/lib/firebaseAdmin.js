// src/lib/firebaseAdmin.js
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

let app;

// Verifica se já existe uma instância inicializada do Firebase Admin
if (getApps().length === 0) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ?.replace(/\\n/g, '\n')
      ?.replace(/"/g, '') // Remove aspas extras que a Vercel pode injetar
      ?.trim();

    if (!privateKey) {
      throw new Error("FIREBASE_PRIVATE_KEY não encontrada no .env");
    }

    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error("FIREBASE_PROJECT_ID não encontrada no .env");
    }

    if (!process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error("FIREBASE_CLIENT_EMAIL não encontrada no .env");
    }

    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });

    console.log("✅ Firebase Admin inicializado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao inicializar Firebase Admin:", error);
  }
} else {
  app = getApps()[0];
}

// Exporta APENAS o database de forma segura (sem carregar o submódulo de auth que quebra a Vercel)
export const adminDb = app ? getDatabase(app) : null;

export default app;