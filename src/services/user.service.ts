import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getSecondaryAuth, getFirebaseDb } from "@/lib/firebase";
import { readCollection } from "@/lib/local-db";
import { AppUser, UserFormInput, UserRole } from "@/types";

const COLLECTION = "users";

function getUsersCollection() {
  return collection(getFirebaseDb(), COLLECTION);
}

function sanitizeUserPayload(input: Partial<UserFormInput>) {
  return {
    fullName: input.fullName?.trim() ?? "",
    email: input.email?.trim().toLowerCase() ?? "",
    role: (input.role ?? "customer") as UserRole,
    phone: input.phone?.trim() ?? "",
    address: input.address?.trim() ?? "",
    avatar64: input.avatar64 ?? "",
    rdcId:
      input.role === "rdc" || input.role === "logistics"
        ? input.rdcId
        : undefined,
  };
}

function removeUndefinedFields<T extends object>(value: T) {
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(([, fieldValue]) => fieldValue !== undefined),
  ) as T;
}

function normalizeDate(value: unknown) {
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : value;
  }

  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }

  return "";
}

function deriveNameFromEmail(email: string) {
  const localPart = email.split("@")[0]?.trim();
  if (!localPart) {
    return "Unnamed User";
  }

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeUser(id: string, value: Record<string, unknown>) {
  const email = typeof value.email === "string" ? value.email : "";

  return {
    id: typeof value.id === "string" && value.id ? value.id : id,
    fullName:
      typeof value.fullName === "string" && value.fullName.trim()
        ? value.fullName
        : deriveNameFromEmail(email),
    email,
    role:
      value.role === "customer" ||
      value.role === "rdc" ||
      value.role === "logistics" ||
      value.role === "ho" ||
      value.role === "admin"
        ? value.role
        : "customer",
    phone: typeof value.phone === "string" ? value.phone : "",
    address: typeof value.address === "string" ? value.address : "",
    avatar64: typeof value.avatar64 === "string" ? value.avatar64 : "",
    rdcId:
      value.rdcId === "north" ||
      value.rdcId === "south" ||
      value.rdcId === "east" ||
      value.rdcId === "west" ||
      value.rdcId === "central"
        ? value.rdcId
        : undefined,
    createdAt: normalizeDate(value.createdAt),
    updatedAt: normalizeDate(value.updatedAt),
  } satisfies AppUser;
}

function mapAuthError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

  if (code === "auth/email-already-in-use") {
    return "This email address already has a Firebase Authentication account.";
  }

  if (code === "auth/weak-password") {
    return "Password must contain at least 6 characters.";
  }

  return error instanceof Error ? error.message : "Unable to save user.";
}

export async function getAllUsers() {
  try {
    const snapshot = await getDocs(query(getUsersCollection()));
    const users = snapshot.docs
      .map((documentSnapshot) => normalizeUser(documentSnapshot.id, documentSnapshot.data() as Record<string, unknown>))
      .sort((left, right) => (right.createdAt || "").localeCompare(left.createdAt || ""));

    if (users.length > 0) {
      return users;
    }
  } catch (error) {
    console.warn("Falling back from Firestore getAllUsers()", error);
  }

  return readCollection<AppUser[]>("users").sort(
    (left, right) => (right.createdAt || "").localeCompare(left.createdAt || ""),
  );
}

export async function getUserProfile(id: string) {
  if (!id) {
    return null;
  }

  try {
    const snapshot = await getDoc(doc(getFirebaseDb(), COLLECTION, id));
    return snapshot.exists()
      ? normalizeUser(snapshot.id, snapshot.data() as Record<string, unknown>)
      : null;
  } catch (error) {
    console.warn(`Falling back from Firestore getUserProfile(${id})`, error);
    return readCollection<AppUser[]>("users").find((user) => user.id === id) ?? null;
  }
}

export async function createUserProfile(user: AppUser) {
  await setDoc(doc(getFirebaseDb(), COLLECTION, user.id), removeUndefinedFields(user));
  return user;
}

export async function addUser(input: UserFormInput) {
  if (!input.password?.trim()) {
    throw new Error("Password is required when creating a user.");
  }

  const now = new Date().toISOString();
  const secondaryAuth = getSecondaryAuth();
  const payload = sanitizeUserPayload(input);
  const email = input.email.trim();
  const password = input.password.trim();
  let userId = "";

  try {
    try {
      const credentials = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      userId = credentials.user.uid;
    } catch (authError) {
      const code =
        typeof authError === "object" && authError && "code" in authError
          ? String(authError.code)
          : "";

      if (code !== "auth/email-already-in-use") {
        throw new Error(mapAuthError(authError));
      }

      try {
        const existingCredentials = await signInWithEmailAndPassword(secondaryAuth, email, password);
        userId = existingCredentials.user.uid;
      } catch {
        throw new Error(
          "This email already exists in Firebase Authentication. Use a different email, or use the correct existing password to reconnect its Firestore profile.",
        );
      }
    }

    const existingProfile = userId ? await getUserProfile(userId) : null;
    const user: AppUser = {
      id: userId,
      ...payload,
      createdAt: existingProfile?.createdAt || now,
      updatedAt: now,
    };

    await setDoc(doc(getFirebaseDb(), COLLECTION, user.id), removeUndefinedFields(user));
    return user;
  } finally {
    await signOut(secondaryAuth);
  }
}

export async function updateUser(userId: string, input: Partial<UserFormInput>) {
  const existingUser = await getUserProfile(userId);
  if (!existingUser) {
    throw new Error("User not found.");
  }

  const updatedAt = new Date().toISOString();
  const payload = sanitizeUserPayload({
    ...existingUser,
    ...input,
    email: existingUser.email,
  });

  const updatedUser: AppUser = {
    ...existingUser,
    ...payload,
    email: existingUser.email,
    updatedAt,
  };

  await updateDoc(doc(getFirebaseDb(), COLLECTION, userId), {
    fullName: updatedUser.fullName,
    role: updatedUser.role,
    phone: updatedUser.phone ?? "",
    address: updatedUser.address ?? "",
    avatar64: updatedUser.avatar64 ?? "",
    rdcId: updatedUser.rdcId ?? null,
    updatedAt,
  });

  return updatedUser;
}

export async function deleteUser(userId: string) {
  const existingUser = await getUserProfile(userId);
  if (!existingUser) {
    throw new Error("User not found.");
  }

  await deleteDoc(doc(getFirebaseDb(), COLLECTION, userId));
  return {
    deletedUser: existingUser,
    authDeletionSupported: false,
  };
}

export async function deleteUsers(userIds: string[]) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];

  if (uniqueIds.length === 0) {
    return {
      deletedIds: [],
      authDeletionSupported: false,
    };
  }

  await Promise.all(uniqueIds.map((userId) => deleteDoc(doc(getFirebaseDb(), COLLECTION, userId))));

  return {
    deletedIds: uniqueIds,
    authDeletionSupported: false,
  };
}

export async function updateUserAvatar(userId: string, avatar64: string) {
  return updateUser(userId, { avatar64 });
}

export async function updateUserRole(userId: string, role: UserRole, rdcId?: AppUser["rdcId"]) {
  return updateUser(userId, { role, rdcId });
}

export async function getUsersByRole(role: UserRole) {
  const users = await getAllUsers();
  return users.filter((user) => user.role === role);
}
