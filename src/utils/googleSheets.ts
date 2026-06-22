import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase Auth
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Provider setup for sheets integration
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');

let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Listen to Auth state changes and return unsubscribe function.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If logged in but cache is empty, we may need to sign in again to get the accessToken
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in with Google and request spreadsheets scope
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Error de autenticación Google Sign In:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get the current cached access token
 */
export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Set a manual token (e.g. from sign-in state)
 */
export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

/**
 * Sign out from Google Auth
 */
export const googleSignOut = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

/**
 * Helper to push the match data to the specific Google Sheet spreadsheet.
 */
export async function exportMatchesToGoogleSheet(
  spreadsheetId: string,
  tournamentName: string,
  category: string,
  rows: string[][]
): Promise<{ sheetTitle: string }> {
  if (!cachedAccessToken) {
    throw new Error('Usuario no autenticado. Inicie sesión de Google primero.');
  }

  // 1. Fetch spreadsheet sheets metadata to get titles
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${cachedAccessToken}` },
  });

  if (!metaRes.ok) {
    const err = await metaRes.text();
    throw new Error(`No se pudo leer la información de la planilla: ${err}`);
  }

  const metaData = await metaRes.json();
  const existingTitles: string[] = (metaData.sheets || []).map((s: any) => s.properties?.title || '');

  // 2. Build title within 31 characters limit
  let sheetTitle = `${tournamentName} - ${category}`.toUpperCase().trim();
  if (sheetTitle.length > 31) {
    sheetTitle = sheetTitle.substring(0, 31);
  }

  const sheetAlreadyExists = existingTitles.includes(sheetTitle);

  if (!sheetAlreadyExists) {
    // 3. Create the new sheet (tab) using batchUpdate
    const createSubSheetRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetTitle,
              },
            },
          },
        ],
      }),
    });

    if (!createSubSheetRes.ok) {
      const err = await createSubSheetRes.text();
      throw new Error(`Error al crear nueva pestaña '${sheetTitle}': ${err}`);
    }
  } else {
    // The tab already exists, let's clear it first to avoid keeping leftover rows if new data is shorter
    const rangeStr = `${sheetTitle}!A1:ZZ5000`;
    const clearRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rangeStr)}:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cachedAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
      }
    );
    if (!clearRes.ok) {
      console.warn("No se pudo limpiar el contenido anterior, continuando con la actualización directa...");
    }
  }

  // 4. Update the values in the new sheet
  const updateValuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${sheetTitle}!A1`,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  if (!updateValuesRes.ok) {
    const err = await updateValuesRes.text();
    throw new Error(`Error al redactar los partidos de torneo en la pestaña: ${err}`);
  }

  return { sheetTitle };
}

/**
 * Export tournament data directly via Google Apps Script Web App (proxied via our backend to bypass browser CORS constraints).
 */
export async function exportMatchesViaAppsScript(
  spreadsheetId: string,
  tournamentName: string,
  category: string,
  rows: string[][]
): Promise<{ sheetTitle: string }> {
  const payload = {
    spreadsheetId,
    tournamentName,
    category,
    rows,
  };

  const response = await fetch('/api/export-sheets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errMsg = `Error de servidor proxy (Status: ${response.status})`;
    try {
      const errJSON = await response.json();
      if (errJSON && errJSON.error) {
        errMsg = errJSON.error;
      }
    } catch (_) {}
    throw new Error(errMsg);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Google Apps Script reportó un error al procesar la exportación.');
  }

  return { sheetTitle: result.sheetTitle };
}

