import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, App, cert, applicationDefault, type ServiceAccount } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import type { NextFunction, Request, Response } from 'express';

const ALLOWED_ADMIN_EMAIL = (process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'kusumabadiger10@gmail.com').trim().toLowerCase();

function normalizePrivateKey(value?: string): string | undefined {
  if (!value) return undefined;
  return value.replace(/\\n/g, '\n');
}

function getServiceAccountConfig(): ServiceAccount | null {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccountPath) {
    const absolutePath = path.resolve(process.cwd(), serviceAccountPath);
    if (fs.existsSync(absolutePath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));
        return raw as ServiceAccount;
      } catch (error) {
        console.warn('[Company Tech Auth] Failed to read Firebase service account JSON:', error);
      }
    }
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (clientEmail && privateKey && projectId) {
    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey,
    } as ServiceAccount;
  }

  return null;
}

export function initializeFirebaseAdmin(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccount = getServiceAccountConfig();
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;

  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
  });
}

initializeFirebaseAdmin();

export function getBearerTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export type FirebaseAuthedRequest = Request & {
  firebaseUser?: DecodedIdToken;
};

export function requireVerifiedUserAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = getBearerTokenFromHeader(authHeader);

  if (!token) {
    res.status(401).json({ error: 'Missing Firebase ID token in Authorization header.' });
    return;
  }

  getAuth()
    .verifyIdToken(token)
    .then((decodedToken: DecodedIdToken) => {
      const email = decodedToken.email?.toLowerCase();
      const isVerified = decodedToken.email_verified === true;

      if (!email || !isVerified) {
        res.status(403).json({ error: 'Your Firebase account must be verified before submitting an application.' });
        return;
      }

      (req as FirebaseAuthedRequest).firebaseUser = decodedToken;
      next();
    })
    .catch((error: unknown) => {
      console.error('[Company Tech Auth] Firebase ID token verification failed:', error);
      res.status(401).json({ error: 'Invalid or expired Firebase ID token.' });
    });
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = getBearerTokenFromHeader(authHeader);

  if (!token) {
    res.status(401).json({ error: 'Missing Firebase ID token in Authorization header.' });
    return;
  }

  getAuth()
    .verifyIdToken(token)
    .then((decodedToken: DecodedIdToken) => {
      const email = decodedToken.email?.toLowerCase();
      const isVerified = decodedToken.email_verified === true;

      if (!email || email !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
        res.status(403).json({ error: 'Unauthorized admin account.' });
        return;
      }

      if (!isVerified) {
        res.status(403).json({ error: 'Admin email is not verified in Firebase Authentication.' });
        return;
      }

      (req as FirebaseAuthedRequest).firebaseUser = decodedToken;
      next();
    })
    .catch((error: unknown) => {
      console.error('[Company Tech Auth] Firebase ID token verification failed:', error);
      res.status(401).json({ error: 'Invalid or expired Firebase ID token.' });
    });
}

export function getAdminEmail(): string {
  return ALLOWED_ADMIN_EMAIL;
}
