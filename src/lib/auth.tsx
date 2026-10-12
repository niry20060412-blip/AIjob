"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { cloud } from "@/lib/cloudClient";

export type AuthUser = {
  id: string;
  email?: string;
  phone?: string;
};

export type PendingOtp = {
  email: string;
  verificationId: string;
  isExistingUser: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  sendEmailCode: (email: string) => Promise<{ challenge: PendingOtp | null; error?: string }>;
  verifyEmailCode: (
    params: PendingOtp & { token: string; password?: string },
  ) => Promise<{ error?: string }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const apply = (session: { user?: AuthUser } | null) => {
      if (!active) return;
      setUser(session?.user ? { id: session.user.id, email: session.user.email, phone: session.user.phone } : null);
      setLoading(false);
    };

    const unsub = cloud.auth.onAuthStateChange((_event, session) => {
      apply(session ? { user: { id: session.user.id, email: session.user.email, phone: session.user.phone } } : null);
    });

    cloud.auth
      .getSession()
      .then((res) => {
        const session = res.data ?? null;
        apply(session);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  const sendEmailCode = useCallback(async (email: string) => {
    const res = await cloud.auth.sendOtp({ email });
    if (res.error) return { challenge: null, error: res.error.message };
    return {
      challenge: {
        email,
        verificationId: res.data.verificationId,
        isExistingUser: res.data.isExistingUser,
      },
    };
  }, []);

  const verifyEmailCode = useCallback(
    async (params: PendingOtp & { token: string; password?: string }) => {
      const res = await cloud.auth.verifyOtp({
        email: params.email,
        verificationId: params.verificationId,
        isExistingUser: params.isExistingUser,
        token: params.token,
        password: params.isExistingUser ? undefined : params.password,
      });
      if (res.error) return { error: res.error.message };
      return {};
    },
    [],
  );

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const res = await cloud.auth.signInWithPassword({ email, password });
    if (res.error) return { error: res.error.message };
    return {};
  }, []);

  const signOut = useCallback(async () => {
    await cloud.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, sendEmailCode, verifyEmailCode, signInWithPassword, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 必须在 AuthProvider 内部使用");
  return ctx;
}
