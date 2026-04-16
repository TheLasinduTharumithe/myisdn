"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ImagePlus, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { IMAGE_INPUT_ACCEPT, fileToBase64, getAvatarPreview, getImageValidationText } from "@/lib/avatar64";
import GoogleLogo from "@/components/GoogleLogo";
import { useAuth } from "@/lib/auth";
import { getDashboardPath } from "@/lib/utils";
import { RegisterInput } from "@/types";

export default function RegisterPage() {
  const router = useRouter();
  const { authenticateWithGoogle, registerWithEmail } = useAuth();
  const [form, setForm] = useState<RegisterInput>({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const avatar = getAvatarPreview(form.avatar64, form.fullName);

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setError("");
      const avatar64 = await fileToBase64(file);
      setForm((current) => ({ ...current, avatar64 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload image.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.fullName || !form.email || !form.password) {
      setError("Please complete all required fields.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const profile = await registerWithEmail({ ...form, role: "customer" });
      setSuccess("Registration successful. Redirecting to your dashboard...");
      router.push(getDashboardPath(profile.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    try {
      setError("");
      setSuccess("");
      setGoogleLoading(true);
      const profile = await authenticateWithGoogle();
      setSuccess("Google signup successful. Redirecting to your dashboard...");
      router.push(getDashboardPath(profile.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google signup failed.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="surface-soft hidden p-10 lg:block">
          <p className="page-eyebrow">Customer Registration</p>
          <h2 className="mt-6 text-5xl font-extrabold leading-tight text-slate-900">Create your customer account.</h2>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-600">
            Register to browse products, place orders, and track deliveries through the ISDN customer portal.
          </p>
        </div>
        <div className="p-8 sm:p-10">
          <p className="page-eyebrow">Create Account</p>
          <h1 className="mt-4 text-3xl font-extrabold text-slate-900">Register as a customer</h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Public registration is available for customer accounts only.
          </p>

          <div className="mt-8 space-y-5">
            <button
              type="button"
              onClick={() => void handleGoogleSignup()}
              disabled={googleLoading || loading}
              className="btn-outline flex w-full items-center justify-center gap-3 disabled:opacity-70"
            >
              <GoogleLogo />
              {googleLoading ? "Connecting to Google..." : "Sign up with Google"}
            </button>

            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              <span>Or Register With Email</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="surface-soft md:col-span-2">
              <div className="flex flex-col gap-5 rounded-[1.5rem] p-6 sm:flex-row sm:items-center">
                <div className="flex justify-center">
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-orange-100 shadow-sm">
                    {avatar.src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatar.src} alt="Profile preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#f57224]">
                        {avatar.fallback}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="field-label">Profile Picture</p>
                  <p className="text-sm leading-7 text-slate-600">
                    Add a profile image now so your customer account looks complete from the moment you sign in.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <label className="btn-primary cursor-pointer">
                      <ImagePlus size={16} />
                      Upload Image
                      <input type="file" accept={IMAGE_INPUT_ACCEPT} onChange={handleAvatarChange} className="hidden" />
                    </label>
                    {form.avatar64 ? (
                      <button
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, avatar64: "" }))}
                        className="btn-outline"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-3 text-xs text-slate-500">{getImageValidationText()}</p>
                </div>
              </div>
            </div>

            <label className="block md:col-span-2">
              <span className="field-label">Full Name</span>
              <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-[rgba(245,114,36,0.45)] focus-within:shadow-[0_0_0_4px_rgba(245,114,36,0.12)]">
                <UserRound size={16} className="text-slate-400" />
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                  className="w-full bg-transparent px-3 py-4 text-slate-900 outline-none"
                  placeholder="Enter full name"
                />
              </div>
            </label>

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
                  placeholder="Minimum 8 characters"
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

            <label className="block">
              <span className="field-label">Confirm Password</span>
              <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-[rgba(245,114,36,0.45)] focus-within:shadow-[0_0_0_4px_rgba(245,114,36,0.12)]">
                <LockKeyhole size={16} className="text-slate-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full bg-transparent px-3 py-4 text-slate-900 outline-none"
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="text-slate-400 transition hover:text-[#f57224]"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <label className="block md:col-span-2">
              <span className="field-label">Phone Number (Optional)</span>
              <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-[rgba(245,114,36,0.45)] focus-within:shadow-[0_0_0_4px_rgba(245,114,36,0.12)]">
                <Phone size={16} className="text-slate-400" />
                <input
                  type="tel"
                  value={form.phone ?? ""}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  className="w-full bg-transparent px-3 py-4 text-slate-900 outline-none"
                  placeholder="Enter phone number"
                />
              </div>
            </label>

            {error ? <p className="notice-error md:col-span-2">{error}</p> : null}
            {success ? <p className="notice-success md:col-span-2">{success}</p> : null}

            <button type="submit" disabled={loading || googleLoading} className="btn-primary md:col-span-2 disabled:opacity-70">
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#f57224]">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
