"use client";

import { type FormEvent, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  getAdminStatusLabel,
  type AdminOrder,
} from "@/services/admin";
import { Notice, StatusBadge } from "./AdminUi";

const baseStatusOptions = [
  "pending",
  "processing",
  "completed",
  "cancelled",
  "paid",
];

export default function OrderStatusDialog({
  open,
  order,
  saving,
  errorMessage,
  onClose,
  onSubmit,
}: {
  open: boolean;
  order: AdminOrder | null;
  saving: boolean;
  errorMessage: string;
  onClose: () => void;
  onSubmit: (status: string) => void;
}) {
  const [status, setStatus] = useState(order?.orderStatus ?? "");
  const [validationMessage, setValidationMessage] = useState("");
  const statusOptions = Array.from(
    new Set([
      ...baseStatusOptions,
      ...(order?.orderStatus ? [order.orderStatus] : []),
    ]),
  );

  if (!open || !order) {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!status.trim()) {
      setValidationMessage("Order status is required.");
      return;
    }

    setValidationMessage("");
    onSubmit(status);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">
              Order Management
            </p>
            <h2 className="mt-1 text-xl font-bold text-stone-950">
              Update order status
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-100 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close status dialog"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 rounded-md border border-stone-200 bg-stone-50 p-4">
          <p className="text-sm font-semibold text-stone-950">#{order.id}</p>
          <p className="mt-1 text-sm text-stone-500">{order.customerName}</p>
          <div className="mt-3">
            <StatusBadge status={order.orderStatus} />
          </div>
        </div>

        <div className="mt-5">
          <Notice tone="error" message={validationMessage || errorMessage} />
        </div>

        <label className="mt-5 block space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
            New status
          </span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-11 w-full rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {getAdminStatusLabel(option)}
              </option>
            ))}
          </select>
        </label>

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
            Save status
          </button>
        </div>
      </form>
    </div>
  );
}
