"use client";

import { ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirming?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirming = false,
  children,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div className="surface-card w-full max-w-lg rounded-[2rem] p-6 shadow-2xl">
        <p className="page-eyebrow text-rose-500">Confirm Action</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>

        {children ? <div className="mt-5">{children}</div> : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="btn-outline justify-center" disabled={confirming}>
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className="btn-danger justify-center" disabled={confirming}>
            {confirming ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
