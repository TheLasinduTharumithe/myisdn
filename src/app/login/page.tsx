"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import GoogleLogo from "@/components/GoogleLogo";
import { useAuth } from "@/lib/auth";
import { getDashboardPath } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authenticateWithGoogle, loginWithEmail } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      const profile = await loginWithEmail(form.email, form.password);
      router.push(searchParams.get("redirect") || getDashboardPath(profile.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setError("");
      setGoogleLoading(true);
      const profile = await authenticateWithGoogle();
      router.push(searchParams.get("redirect") || getDashboardPath(profile.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google login failed.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)] lg:grid-cols-[1.1fr_0.9fr]">
      <div className="hero-banner hidden p-10 lg:block">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-white/80">Sign In</p>
        <h2 className="mt-6 text-5xl font-extrabold leading-tight text-white">Welcome back to your ISDN workspace.</h2>
        <p className="mt-6 max-w-xl text-base leading-8 text-white/88">
          Sign in to manage orders, monitor deliveries, update inventory activity, and access your role-based dashboard from one polished interface.
        </p>
      </div>
      <div className="p-8 sm:p-10">
        <p className="page-eyebrow">Secure Access</p>
        <h1 className="mt-4 text-3xl font-extrabold text-slate-900">Login to ISDN</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          Enter your email address and password to continue to your role-based workspace.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <button
            type="button"
            onClick={() => void handleGoogleLogin()}
            disabled={googleLoading || loading}
            className="btn-outline flex w-full items-center justify-center gap-3 disabled:opacity-70"
          >
            <GoogleLogo />
            {googleLoading ? "Connecting to Google..." : "Continue with Google"}
          </button>

          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            <span>Email Login</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <label className="block">
            <span className="field-label">Email</span>
            <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-[rgba(245,114,36,0.45)] focus-within:shadow-[0_0_0_4px_rgba(245,114,36,0.12)]">
              <Mail size={16} className="text-slate-400" />
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="w-full bg-transparent px-3 py-4 text-slate-900 outline-none"
                placeholder="you@example.com"
              />
            </div>
          </label>

          <label className="block">
            <span className="field-label">Password</span>
            <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-[rgba(245,114,36,0.45)] focus-within:shadow-[0_0_0_4px_rgba(245,114,36,0.12)]">
              <LockKeyhole size={16} className="text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="w-full bg-transparent px-3 py-4 text-slate-900 outline-none"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="text-slate-400 transition hover:text-[#f57224]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {error ? <p className="notice-error">{error}</p> : null}

          <button type="submit" disabled={loading || googleLoading} className="btn-primary w-full disabled:opacity-70">
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Need an account?{" "}
          <Link href="/register" className="font-semibold text-[#f57224]">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <Suspense
        fallback={
          <div className="surface-card w-full max-w-md rounded-[2rem] p-8 text-center text-slate-600">
            Loading login page...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
