"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Lock, Pencil, Trash2, Unlock } from "lucide-react";
import {
  deleteAdminUser,
  formatAdminDate,
  getAdminStatusLabel,
  getAdminUser,
  type AdminUser,
  type UpdateAdminUserPayload,
  updateAdminUser,
  updateAdminUserStatus,
} from "@/services/admin";
import {
  ConfirmDialog,
  DetailItem,
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
  Notice,
  StatusBadge,
} from "./AdminUi";
import UserEditDialog from "./UserEditDialog";

type ConfirmAction =
  | {
      type: "delete";
    }
  | {
      type: "status";
      nextStatus: string;
    };

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected admin error.";
}

function isLockedStatus(status: string) {
  return ["locked", "blocked", "disabled", "inactive"].includes(
    status.toLowerCase(),
  );
}

function isSafePrimitive(value: unknown) {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function getAdditionalFields(user: AdminUser) {
  const hiddenKeys = new Set([
    "id",
    "userId",
    "user_id",
    "uuid",
    "name",
    "fullName",
    "full_name",
    "displayName",
    "display_name",
    "email",
    "phone",
    "phoneNumber",
    "phone_number",
    "role",
    "status",
    "accountStatus",
    "account_status",
    "createdAt",
    "created_at",
    "createdDate",
    "created_date",
    "updatedAt",
    "updated_at",
    "address",
  ]);

  return Object.entries(user.raw ?? {})
    .filter(([key, value]) => {
      const normalizedKey = key.toLowerCase();

      return (
        !hiddenKeys.has(key) &&
        !normalizedKey.includes("password") &&
        !normalizedKey.includes("token") &&
        !normalizedKey.includes("secret") &&
        isSafePrimitive(value)
      );
    })
    .map(([key, value]) => [key, String(value)] as const);
}

export default function UserDetailClient({ userId }: { userId: string }) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionErrorMessage, setActionErrorMessage] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editErrorMessage, setEditErrorMessage] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const loadUser = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      setUser(await getAdminUser(userId));
    } catch (error) {
      setUser(null);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void loadUser();
    }, 0);

    return () => {
      window.clearTimeout(loadId);
    };
  }, [loadUser]);

  const additionalFields = useMemo(
    () => (user ? getAdditionalFields(user) : []),
    [user],
  );
  const locked = user ? isLockedStatus(user.status) : false;
  const nextStatus = locked ? "active" : "locked";

  const handleUpdateUser = async (payload: UpdateAdminUserPayload) => {
    if (!user || savingEdit) {
      return;
    }

    setSavingEdit(true);
    setEditErrorMessage("");
    setSuccessMessage("");
    setActionErrorMessage("");

    try {
      const result = await updateAdminUser(user.id, payload);
      const nextUser = {
        ...user,
        ...payload,
        ...(result.user ?? {}),
      };

      setUser(nextUser);
      setEditingUser(null);
      setSuccessMessage(result.message || "User updated successfully.");
    } catch (error) {
      setEditErrorMessage(getErrorMessage(error));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || !user || confirmLoading) {
      return;
    }

    setConfirmLoading(true);
    setSuccessMessage("");
    setActionErrorMessage("");

    try {
      if (confirmAction.type === "delete") {
        await deleteAdminUser(user.id);
        router.push("/admin/users");
        return;
      }

      const result = await updateAdminUserStatus(user.id, confirmAction.nextStatus);
      setUser({
        ...user,
        status: confirmAction.nextStatus,
        ...(result.user ?? {}),
      });
      setSuccessMessage(result.message || "User status updated successfully.");
      setConfirmAction(null);
    } catch (error) {
      setActionErrorMessage(getErrorMessage(error));
    } finally {
      setConfirmLoading(false);
    }
  };

  if (loading) {
    return <LoadingPanel label="Loading user detail" />;
  }

  if (errorMessage) {
    return <ErrorPanel message={errorMessage} onRetry={loadUser} />;
  }

  if (!user) {
    return (
      <EmptyPanel
        title="User not found"
        description="The requested user could not be loaded from the admin API."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition hover:text-stone-950"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to user list
        </Link>
      </div>

      <Notice
        tone="success"
        message={successMessage}
        onDismiss={() => setSuccessMessage("")}
      />
      <Notice
        tone="error"
        message={actionErrorMessage}
        onDismiss={() => setActionErrorMessage("")}
      />

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="break-words text-2xl font-bold text-stone-950">
                {user.name}
              </h2>
              <StatusBadge status={user.status} />
            </div>
            <p className="mt-2 break-words text-sm text-stone-500">
              {user.email || "No email available"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setEditErrorMessage("");
                setEditingUser(user);
              }}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-stone-200 px-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit user
            </button>
            <button
              type="button"
              onClick={() => setConfirmAction({ type: "status", nextStatus })}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-amber-200 px-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
            >
              {locked ? (
                <Unlock className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Lock className="h-4 w-4" aria-hidden="true" />
              )}
              {locked ? "Unlock user" : "Lock user"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmAction({ type: "delete" })}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete user
            </button>
          </div>
        </div>
      </section>

      <dl className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DetailItem label="User ID" value={`#${user.id}`} />
        <DetailItem label="Name" value={user.name} />
        <DetailItem label="Email" value={user.email} />
        <DetailItem label="Phone" value={user.phone} />
        <DetailItem label="Role" value={getAdminStatusLabel(user.role)} />
        <DetailItem label="Status" value={<StatusBadge status={user.status} />} />
        <DetailItem label="Address" value={user.address} />
        <DetailItem label="Created date" value={formatAdminDate(user.createdAt)} />
        <DetailItem label="Updated date" value={formatAdminDate(user.updatedAt)} />
      </dl>

      {additionalFields.length > 0 ? (
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="text-lg font-bold text-stone-950">Additional fields</h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {additionalFields.map(([key, value]) => (
              <DetailItem key={key} label={key} value={value} />
            ))}
          </dl>
        </section>
      ) : null}

      <UserEditDialog
        key={editingUser?.id ?? "closed"}
        open={Boolean(editingUser)}
        user={editingUser}
        saving={savingEdit}
        errorMessage={editErrorMessage}
        onClose={() => {
          if (!savingEdit) {
            setEditingUser(null);
          }
        }}
        onSubmit={handleUpdateUser}
      />

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={
          confirmAction?.type === "delete"
            ? "Delete user?"
            : nextStatus === "locked"
              ? "Lock account?"
              : "Unlock account?"
        }
        description={
          confirmAction?.type === "delete"
            ? `${user.name} will be permanently removed.`
            : `${user.name} will be marked as ${getAdminStatusLabel(nextStatus)}.`
        }
        confirmLabel={
          confirmAction?.type === "delete"
            ? "Delete user"
            : nextStatus === "locked"
              ? "Lock account"
              : "Unlock account"
        }
        destructive={confirmAction?.type === "delete"}
        loading={confirmLoading}
        onClose={() => {
          if (!confirmLoading) {
            setConfirmAction(null);
          }
        }}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
