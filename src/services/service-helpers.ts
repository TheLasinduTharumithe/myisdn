import {
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";

export function canUseFirestore() {
  return Boolean(db && isFirebaseConfigured);
}

function removeUndefinedFields<T extends object>(value: T) {
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(([, fieldValue]) => fieldValue !== undefined),
  ) as T;
}

function attachDocumentId<T extends object>(documentId: string, value: DocumentData) {
  const record = value as Record<string, unknown>;

  return {
    ...record,
    id: typeof record.id === "string" && record.id ? record.id : documentId,
  } as T;
}

export async function listDocs<T extends object>(collectionName: string) {
  if (!db) {
    return [] as T[];
  }

  try {
    const snapshot = await getDocs(collection(db, collectionName));
    return snapshot.docs.map((document) => attachDocumentId<T>(document.id, document.data()));
  } catch (error) {
    console.warn(`Falling back from Firestore listDocs(${collectionName})`, error);
    return [] as T[];
  }
}

export async function getDocById<T extends object>(collectionName: string, id: string) {
  if (!db || !id) {
    return null;
  }

  try {
    const snapshot = await getDoc(doc(db, collectionName, id));
    return snapshot.exists() ? attachDocumentId<T>(snapshot.id, snapshot.data()) : null;
  } catch (error) {
    console.warn(`Falling back from Firestore getDocById(${collectionName}/${id})`, error);
    return null;
  }
}

export async function setDocById<T extends { id: string }>(collectionName: string, value: T) {
  if (!db) {
    return value;
  }

  try {
    await setDoc(doc(db, collectionName, value.id), removeUndefinedFields(value));
  } catch (error) {
    console.warn(`Firestore set failed for ${collectionName}/${value.id}`, error);
  }
  return value;
}

export async function updateDocById<T extends object>(
  collectionName: string,
  id: string,
  value: Partial<T>,
) {
  if (!db) {
    return;
  }

  try {
    await updateDoc(doc(db, collectionName, id), removeUndefinedFields(value) as Record<string, unknown>);
  } catch (error) {
    console.warn(`Firestore update failed for ${collectionName}/${id}`, error);
  }
}

export async function queryByField<T extends object>(collectionName: string, field: string, value: string) {
  if (!db) {
    return [] as T[];
  }

  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(query(collectionRef, where(field, "==", value)));
    return snapshot.docs.map((document) => attachDocumentId<T>(document.id, document.data()));
  } catch (error) {
    console.warn(`Falling back from Firestore queryByField(${collectionName}.${field})`, error);
    return [] as T[];
  }
}
