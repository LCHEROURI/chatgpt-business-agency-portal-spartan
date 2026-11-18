import { initializeApp, getApps, deleteApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { INITIAL_AGENCIES, INITIAL_CLIENTS } from '../data/workflowBlueprint';

const CONFIG_STORAGE_KEY = 'cgpt_portal_firebase_config';
const AGENCIES_STORAGE_KEY = 'cgpt_portal_agencies_v1';
const CLIENTS_STORAGE_KEY = 'cgpt_portal_clients_v1';

let activeApp = null;
let activeDb = null;

export function getEnvFirebaseConfig() {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (!projectId || !apiKey) return null;
  return {
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
  };
}

export function getStoredFirebaseConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.apiKey && parsed.projectId) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function getActiveFirebaseConfig() {
  return getStoredFirebaseConfig() || getEnvFirebaseConfig();
}

export async function initFirestoreFromConfig(config) {
  if (!config || !config.apiKey || !config.projectId) {
    activeDb = null;
    return null;
  }
  try {
    const existing = getApps().find((a) => a.name === 'cgpt-agency-portal');
    if (existing) {
      await deleteApp(existing);
    }
    activeApp = initializeApp(config, 'cgpt-agency-portal');
    activeDb = getFirestore(activeApp);
    return activeDb;
  } catch (err) {
    console.error('Failed to initialize Firebase/Firestore:', err);
    activeDb = null;
    throw err;
  }
}

export async function saveFirebaseConfig(config) {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  return initFirestoreFromConfig(config);
}

export async function clearFirebaseConfig() {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
  const existing = getApps().find((a) => a.name === 'cgpt-agency-portal');
  if (existing) {
    await deleteApp(existing);
  }
  activeApp = null;
  activeDb = null;
}

export function getDbInstance() {
  return activeDb;
}

// Local storage helpers for Sandbox / Demo mode
export function loadLocalAgencies() {
  try {
    const raw = localStorage.getItem(AGENCIES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  localStorage.setItem(AGENCIES_STORAGE_KEY, JSON.stringify(INITIAL_AGENCIES));
  return INITIAL_AGENCIES;
}

export function saveLocalAgencies(agencies) {
  localStorage.setItem(AGENCIES_STORAGE_KEY, JSON.stringify(agencies));
}

export function loadLocalClients() {
  try {
    const raw = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(INITIAL_CLIENTS));
  return INITIAL_CLIENTS;
}

export function saveLocalClients(clients) {
  localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
}

// Firestore Real-Time Subscriptions & Mutations
export function subscribeToAgencies(onData, onError) {
  if (!activeDb) {
    onData(loadLocalAgencies());
    return () => {};
  }
  const colRef = collection(activeDb, 'agencies');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData(list);
    },
    (err) => {
      console.error('Firestore agencies subscription error:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeToAgencyClients(agencyId, onData, onError) {
  if (!agencyId) {
    onData([]);
    return () => {};
  }
  if (!activeDb) {
    const all = loadLocalClients();
    onData(all.filter((c) => c.agencyId === agencyId));
    return () => {};
  }
  const colRef = collection(activeDb, 'agencies', agencyId, 'clients');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData(list);
    },
    (err) => {
      console.error('Firestore clients subscription error:', err);
      if (onError) onError(err);
    }
  );
}

export async function upsertAgencyRecord(agency) {
  if (!activeDb) {
    const list = loadLocalAgencies();
    const idx = list.findIndex((a) => a.id === agency.id);
    const updated = idx >= 0 ? list.map((a) => (a.id === agency.id ? agency : a)) : [...list, agency];
    saveLocalAgencies(updated);
    return updated;
  }
  const docRef = doc(activeDb, 'agencies', agency.id);
  await setDoc(
    docRef,
    {
      ...agency,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
  return null;
}

export async function upsertClientRecord(agencyId, client) {
  const payload = {
    ...client,
    agencyId,
    updatedAt: new Date().toISOString()
  };
  if (!activeDb) {
    const all = loadLocalClients();
    const idx = all.findIndex((c) => c.id === client.id);
    const updated = idx >= 0 ? all.map((c) => (c.id === client.id ? payload : c)) : [payload, ...all];
    saveLocalClients(updated);
    return updated.filter((c) => c.agencyId === agencyId);
  }
  const docRef = doc(activeDb, 'agencies', agencyId, 'clients', client.id);
  await setDoc(
    docRef,
    {
      ...payload,
      firestoreSyncedAt: serverTimestamp()
    },
    { merge: true }
  );
  return null;
}

export async function deleteClientRecord(agencyId, clientId) {
  if (!activeDb) {
    const all = loadLocalClients();
    const updated = all.filter((c) => c.id !== clientId);
    saveLocalClients(updated);
    return updated.filter((c) => c.agencyId === agencyId);
  }
  const docRef = doc(activeDb, 'agencies', agencyId, 'clients', clientId);
  await deleteDoc(docRef);
  return null;
}

export async function seedDemoDataToFirestore() {
  if (!activeDb) {
    throw new Error('Firestore is not connected.');
  }
  const batch = writeBatch(activeDb);
  for (const agency of INITIAL_AGENCIES) {
    const agencyRef = doc(activeDb, 'agencies', agency.id);
    batch.set(agencyRef, { ...agency, updatedAt: serverTimestamp() }, { merge: true });
  }
  for (const client of INITIAL_CLIENTS) {
    const clientRef = doc(activeDb, 'agencies', client.agencyId, 'clients', client.id);
    batch.set(clientRef, { ...client, firestoreSyncedAt: serverTimestamp() }, { merge: true });
  }
  await batch.commit();
}
