"use client";

import { type FormEvent, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  getAdminStatusLabel,
  type AdminUser,
  type UpdateAdminUserPayload,
} from "@/services/admin";
import { Notice } from "./AdminUi";

const fieldClass =
  "h-11 w-full rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200";
const textareaClass =
  "min-h-24 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200";
const labelClass = "text-xs font-bold uppercase tracking-[0.14em] text-stone-500";

export default function UserEditDialog({
  open,
  user,
  saving,
  errorMessage,
  onClose,
  onSubmit,
}: {
  open: boolean;
  user: AdminUser | null;
  saving: boolean;
  errorMessage: string;
  onClose: () => void;
  onSubmit: (payload: UpdateAdminUserPayload) => void;
}) {
  const [form, setForm] = useState<UpdateAdminUserPayload>(() => ({
    fullName: user?.name ?? "",
    phone: user?.phone ?? "",
    role: user?.role ?? "",
    address: user?.address ?? "",
  }));
  const [validationMessage, setValidationMessage] = useState("");

  if (!open || !user) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      fullName: form.fullName.trim(),
      phone: form.phone?.trim(),
      address: form.address?.trim(),
      role: form.role?.trim(),
    };

    if (!payload.fullName) {
      setValidationMessage("Full name is required.");
      return;
    }

    setValidationMessage("");
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-stone-200 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">
              User Management
            </p>
            <h2 className="mt-1 text-xl font-bold text-stone-950">
              Edit user
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-100 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close edit user dialog"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <Notice
            tone="error"
            message={validationMessage || errorMessage}
            onDismiss={() => setValidationMessage("")}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className={labelClass}>Full name</span>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(event) =>
                setForm((current) => ({ ...current, fullName: event.target.value }))
              }
              className={fieldClass}
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className={labelClass}>Email</span>
            <input
              type="email"
              value={user.email || "Not available"}
              disabled
              className={`${fieldClass} bg-stone-50 text-stone-500`}
            />
          </label>

          <label className="space-y-2">
            <span className={labelClass}>Phone</span>
            <input
              type="tel"
              value={form.phone ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, phone: event.target.value }))
              }
              className={fieldClass}
            />
          </label>

          <label className="space-y-2">
            <span className={labelClass}>Role</span>
            <select
              value={form.role ?? "user"}
              onChange={(event) =>
                setForm((current) => ({ ...current, role: event.target.value }))
              }
              className={fieldClass}
            >
              {form.role && !["user", "admin"].includes(form.role) ? (
                <option value={form.role}>{getAdminStatusLabel(form.role)}</option>
              ) : null}
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className={labelClass}>Address</span>
            <textarea
              value={form.address ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, address: event.target.value }))
              }
              className={textareaClass}
            />
          </label>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-10 items-center justify-center rounded-md border border-stone-200 px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
