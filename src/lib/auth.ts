"use client";

import {
  createElement,
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { AppUser, RegisterInput } from "@/types";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  firebaseUser: FirebaseUser | null;
  loginWithEmail: (email: string, password: string) => Promise<AppUser>;
  registerWithEmail: (input: RegisterInput) => Promise<AppUser>;
  authenticateWithGoogle: () => Promise<AppUser>;
  logoutUser: () => Promise<void>;
  refreshUserProfile: (id?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeStringDate(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  return new Date().toISOString();
}

function toAppUser(id: string, value: Record<string, unknown> | undefined | null): AppUser | null {
  if (!value) {
    return null;
  }

  return {
    id,
    fullName: typeof value.fullName === "string" ? value.fullName : "",
    email: typeof value.email === "string" ? value.email : "",
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
    createdAt: normalizeStringDate(value.createdAt),
    updatedAt: normalizeStringDate(value.updatedAt),
  };
}

async function getUserProfile(userId: string) {
  const snapshot = await getDoc(doc(getFirebaseDb(), "users", userId));
  return snapshot.exists() ? toAppUser(snapshot.id, snapshot.data()) : null;
}

async function createCustomerProfile(userId: string, input: RegisterInput) {
  const now = new Date().toISOString();
  const profile: AppUser = {
    id: userId,
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    role: "customer",
    phone: input.phone?.trim() ?? "",
    address: input.address?.trim() ?? "",
    avatar64: input.avatar64 ?? "",
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(getFirebaseDb(), "users", userId), profile);
  return profile;
}

async function getOrCreateGoogleCustomerProfile(firebaseUser: FirebaseUser) {
  const existingProfile = await getUserProfile(firebaseUser.uid);

  if (existingProfile) {
    return existingProfile;
  }

  return createCustomerProfile(firebaseUser.uid, {
    fullName: firebaseUser.displayName?.trim() || firebaseUser.email?.split("@")[0] || "Google User",
    email: firebaseUser.email?.trim().toLowerCase() || "",
    password: "",
    phone: firebaseUser.phoneNumber?.trim() || "",
    role: "customer",
  });
}

function mapAuthError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("invalid-credential") || message.includes("wrong-password")) {
    return "Invalid email or password.";
  }

  if (message.includes("user-not-found")) {
    return "No account found for this email address.";
  }

  if (message.includes("email-already-in-use")) {
    return "An account with this email already exists.";
  }

  if (message.includes("weak-password")) {
    return "Password must contain at least 6 characters.";
  }

  if (message.includes("network-request-failed")) {
    return "Network error. Please check your internet connection and Firebase setup.";
  }

  if (message.includes("popup-closed-by-user")) {
    return "Google sign-in was cancelled before it completed.";
  }

  if (message.includes("popup-blocked")) {
    return "Google sign-in popup was blocked by the browser. Allow popups and try again.";
  }

  return error instanceof Error ? error.message : "Authentication failed.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setUser(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (currentUser) => {
      setFirebaseUser(currentUser);
      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile(currentUser.uid);
        setUser(profile);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      firebaseUser,
      async loginWithEmail(email, password) {
        if (!isFirebaseConfigured) {
          throw new Error("Firebase is not configured. Add valid NEXT_PUBLIC_FIREBASE_* values.");
        }

        try {
          const response = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
          const profile = await getUserProfile(response.user.uid);

          if (!profile) {
            throw new Error("User profile not found for this account.");
          }

          setUser(profile);
          return profile;
        } catch (error) {
          throw new Error(mapAuthError(error));
        }
      },
      async registerWithEmail(input) {
        if (!isFirebaseConfigured) {
          throw new Error("Firebase is not configured. Add valid NEXT_PUBLIC_FIREBASE_* values.");
        }

        try {
          const response = await createUserWithEmailAndPassword(
            getFirebaseAuth(),
            input.email.trim(),
            input.password,
          );
          const profile = await createCustomerProfile(response.user.uid, input);
          setUser(profile);
          return profile;
        } catch (error) {
          throw new Error(mapAuthError(error));
        }
      },
      async authenticateWithGoogle() {
        if (!isFirebaseConfigured) {
          throw new Error("Firebase is not configured. Add valid NEXT_PUBLIC_FIREBASE_* values.");
        }

        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: "select_account" });
          const response = await signInWithPopup(getFirebaseAuth(), provider);
          const profile = await getOrCreateGoogleCustomerProfile(response.user);
          setUser(profile);
          return profile;
        } catch (error) {
          throw new Error(mapAuthError(error));
        }
      },
      async logoutUser() {
        if (isFirebaseConfigured) {
          await signOut(getFirebaseAuth());
        }
        setFirebaseUser(null);
        setUser(null);
      },
      async refreshUserProfile(id) {
        const nextProfile = await getUserProfile(id ?? firebaseUser?.uid ?? user?.id ?? "");
        setUser(nextProfile ?? null);
      },
    }),
    [firebaseUser, loading, user],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
