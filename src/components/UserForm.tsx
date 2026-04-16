"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Camera, Mail, MapPin, Phone, UserRound } from "lucide-react";
import {
  IMAGE_INPUT_ACCEPT,
  fileToBase64,
  getAvatarPreview,
  getImageValidationText,
} from "@/lib/avatar64";
import { RDC_OPTIONS, ROLE_LABELS } from "@/lib/utils";
import { UserFormInput, UserRole } from "@/types";

const USER_ROLES: UserRole[] = ["customer", "rdc", "logistics", "ho", "admin"];

const defaultValues: UserFormInput = {
  fullName: "",
  email: "",
  password: "",
  role: "customer",
  phone: "",
  address: "",
  avatar64: "",
  rdcId: undefined,
};

interface UserFormProps {
  mode: "create" | "edit";
  initialValues?: Partial<UserFormInput>;
  resetSignal?: number;
  loading?: boolean;
  error?: string;
  onCancel?: () => void;
  onSubmit: (values: UserFormInput) => Promise<void> | void;
}

export default function UserForm({
  mode,
  initialValues,
  resetSignal = 0,
  loading = false,
  error = "",
  onCancel,
  onSubmit,
}: UserFormProps) {
  const [form, setForm] = useState<UserFormInput>(defaultValues);
  const [imageError, setImageError] = useState("");
  const avatar = getAvatarPreview(form.avatar64, form.fullName);

  useEffect(() => {
    setForm({
      ...defaultValues,
      ...initialValues,
      password: "",
    });
    setImageError("");
  }, [initialValues, mode, resetSignal]);

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setImageError("");
      const avatar64 = await fileToBase64(file);
      setForm((current) => ({ ...current, avatar64 }));
    } catch (uploadError) {
      setImageError(uploadError instanceof Error ? uploadError.message : "Unable to upload image.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setImageError("");

    if (!form.fullName.trim() || !form.email.trim()) {
      setImageError("Full name and email are required.");
      return;
    }

    if (mode === "create" && !form.password?.trim()) {
      setImageError("Password is required when creating a user.");
      return;
    }

    if ((form.role === "rdc" || form.role === "logistics") && !form.rdcId) {
      setImageError("Assigned RDC is required for RDC and logistics staff.");
      return;
    }

    await onSubmit({
      ...form,
      rdcId: form.role === "rdc" || form.role === "logistics" ? form.rdcId : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card grid h-fit content-start gap-4 self-start rounded-[2rem] p-6">
      <div>
        <p className="page-eyebrow">{mode === "create" ? "Add User" : "Edit User"}</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          {mode === "create" ? "Create a new user account" : "Update user details"}
        </h2>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Manage internal user information, roles, and optional regional assignments from one form.
        </p>
      </div>

      <div className="surface-soft rounded-[1.5rem] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-orange-100 shadow-sm">
              {avatar.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar.src} alt="User avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-[#f57224]">{avatar.fallback}</span>
              )}
            </div>
          </div>
          <div className="flex-1">
            <p className="field-label">Profile Image</p>
            <p className="text-sm text-slate-600">{getImageValidationText()}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <label className="btn-primary cursor-pointer">
                <Camera size={16} />
                Upload Image
                <input type="file" accept={IMAGE_INPUT_ACCEPT} onChange={handleImageChange} className="hidden" />
              </label>
              {form.avatar64 ? (
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setForm((current) => ({ ...current, avatar64: "" }))}
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <label className="block">
        <span className="field-label">Full Name</span>
        <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
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
        <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
          <Mail size={16} className="text-slate-400" />
          <input
            type="email"
            value={form.email}
            disabled={mode === "edit"}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            className="w-full bg-transparent px-3 py-4 text-slate-900 outline-none disabled:text-slate-400"
            placeholder="user@example.com"
          />
        </div>
      </label>

      {mode === "create" ? (
        <label className="block">
          <span className="field-label">Password</span>
          <input
            type="password"
            value={form.password ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            className="input-field"
            placeholder="Minimum 6 characters"
          />
        </label>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="field-label">Role</span>
          <select
            value={form.role}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                role: event.target.value as UserRole,
                rdcId:
                  event.target.value === "rdc" || event.target.value === "logistics"
                    ? current.rdcId
                    : undefined,
              }))
            }
            className="select-field"
          >
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="field-label">Phone</span>
          <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
            <Phone size={16} className="text-slate-400" />
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              className="w-full bg-transparent px-3 py-4 text-slate-900 outline-none"
              placeholder="Optional phone number"
            />
          </div>
        </label>
      </div>

      {(form.role === "rdc" || form.role === "logistics") ? (
        <label className="block">
          <span className="field-label">Assigned RDC</span>
          <select
            value={form.rdcId ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                rdcId: event.target.value ? (event.target.value as UserFormInput["rdcId"]) : undefined,
              }))
            }
            className="select-field"
          >
            <option value="">Select RDC</option>
            {RDC_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="block">
        <span className="field-label">Address</span>
        <div className="flex items-start rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
          <MapPin size={16} className="mt-4 text-slate-400" />
          <textarea
            value={form.address}
            onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
            className="w-full resize-none bg-transparent px-3 py-4 text-slate-900 outline-none"
            rows={3}
            placeholder="Optional address"
          />
        </div>
      </label>

      {imageError ? <p className="notice-error">{imageError}</p> : null}
      {error ? <p className="notice-error">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
          {loading ? "Saving..." : mode === "create" ? "Create User" : "Save Changes"}
        </button>
        {mode === "edit" && onCancel ? (
          <button type="button" onClick={onCancel} className="btn-outline">
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
