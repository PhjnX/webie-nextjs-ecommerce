"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Loader2,
  X,
} from "lucide-react";
import { getAdminStatusLabel } from "@/services/admin";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function getStatusClassName(status: string) {
  const normalizedStatus = status.toLowerCase();

  if (["active", "completed", "success", "delivered"].includes(normalizedStatus)) {
    return "border-green-300 bg-emerald-50 text-black";
  }

  if (["locked", "blocked", "cancelled", "canceled", "failed", "unpaid"].includes(normalizedStatus)) {
    return "border-red-200 bg-red-50 text-black";
  }

  if (["processing"].includes(normalizedStatus)) {
    return "border-blue-300 bg-blue-50 text-black";
  }
  if (["pending"].includes(normalizedStatus)) {
    return "border-yellow-200 bg-yellow-50 text-black";
  }

  if (["paid"].includes(normalizedStatus)) {
    return "border-violet-200 bg-violet-100 text-black";
  }

  return "border-sky-200 bg-sky-50 text-sky-700";
}

export function StatusBadge({
  status,
  size = "xs",
}: {
  status: string;
  size?: "xs" | "sm";
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full border px-2.5 font-bold",
        size === "sm" ? "text-sm" : "text-xs",
        getStatusClassName(status),
      )}
    >
      {getAdminStatusLabel(status)}
    </span>
  );
}

export function Notice({
  message,
  tone,
  onDismiss,
}: {
  message: string;
  tone: "success" | "error";
  onDismiss?: () => void;
}) {
  if (!message) {
    return null;
  }

  const success = tone === "success";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border px-4 py-3 text-sm font-medium",
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800",
      )}
    >
      {success ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
      ) : (
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
      )}
      <span className="min-w-0 flex-1">{message}</span>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-6 w-6 flex-none items-center justify-center rounded text-current/70 transition hover:bg-white/70 hover:text-current"
          aria-label="Dismiss message"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

export function LoadingPanel({ label = "Loading" }: { label?: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-5 py-16 text-center shadow-sm">
      <Loader2 className="mx-auto h-6 w-6 animate-spin text-stone-500" aria-hidden="true" />
      <p className="mt-3 text-sm font-semibold text-stone-500">{label}</p>
    </div>
  );
}

export function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-white px-5 py-12 text-center shadow-sm">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-stone-950">
        Something went wrong
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-stone-500">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800"
      >
        Retry
      </button>
    </div>
  );
}

export function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-white px-5 py-14 text-center">
      <Inbox className="mx-auto h-8 w-8 text-stone-400" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-bold text-stone-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">
        {description}
      </p>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 px-4 py-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 shadow-xl"
      >
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full",
            destructive ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700",
          )}
        >
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 id="admin-confirm-title" className="mt-4 text-xl font-bold text-stone-950">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-md border border-stone-200 px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60",
              destructive ? "bg-red-600 hover:bg-red-700" : "bg-stone-950 hover:bg-stone-800",
            )}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-stone-200 bg-white p-4">
      <dt className="text-xs font-bold uppercase tracking-[0.14em] text-stone-400">
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm font-semibold text-stone-900">
        {value || "Not available"}
      </dd>
    </div>
  );
}
