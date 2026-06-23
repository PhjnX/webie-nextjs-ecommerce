"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  CirclePlus,
  History,
  Mail,
  Pencil,
  Shield,
  Trash2,
  Unlock,
  UserRound,
} from "lucide-react";
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
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
  Notice,
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

function isBlockedStatus(status: string) {
  return ["blocked", "locked", "disabled", "inactive", "deleted"].includes(
    status.toLowerCase(),
  );
}

function getUserInitials(user: AdminUser) {
  const source = user.name || user.email || user.id;

  return (
    source
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
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
    "isActive",
    "is_active",
    "isVerified",
    "is_verified",
    "accountStatus",
    "account_status",
    "avatar",
    "avatarUrl",
    "avatar_url",
    "imageUrl",
    "image_url",
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

function ProfileAvatar({ user, blocked }: { user: AdminUser; blocked: boolean }) {
  const statusClass = blocked
    ? "border-white bg-red-500"
    : "border-white bg-emerald-500";

  return (
    <div className="relative h-[120px] w-[120px] flex-none rounded-[16px] border-[5px] border-[#dbe4ff] bg-white p-1 shadow-sm">
      {user.avatarUrl ? (
        <span
          className="block h-full w-full rounded-[10px] bg-slate-100 bg-cover bg-center"
          style={{ backgroundImage: `url(${JSON.stringify(user.avatarUrl)})` }}
          aria-label={`${user.name} avatar`}
          role="img"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#111827] text-3xl font-bold text-white">
          {getUserInitials(user)}
        </span>
      )}
      <span
        className={`absolute -bottom-1 -right-1 h-8 w-8 rounded-full border-[3px] ${statusClass}`}
        aria-hidden="true"
      />
    </div>
  );
}

function HeaderStatusBadge({ blocked }: { blocked: boolean }) {
  return (
    <span
      className={`inline-flex min-h-8 items-center gap-2 rounded-full border px-4 text-xs font-extrabold uppercase tracking-wide ${
        blocked
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          blocked ? "bg-red-500" : "bg-emerald-500"
        }`}
      />
      {blocked ? "Blocked" : "Active"}
    </span>
  );
}

function MiniBadge({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "green" | "stone";
}) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "stone"
        ? "bg-slate-100 text-slate-600"
        : "bg-[#dfe6ff] text-[#1d4ed8]";

  return (
    <span
      className={`inline-flex min-h-7 items-center rounded px-3 text-xs font-extrabold uppercase tracking-wide ${toneClass}`}
    >
      {children}
    </span>
  );
}

function InfoCard({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon: ReactNode;
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#c9cfdd] bg-white shadow-sm">
      <div className="flex min-h-20 items-center gap-3 border-b border-[#d6dbe6] bg-[#f8fafc] px-8">
        <span className="text-[#1d57d8]">{icon}</span>
        <h2 className="text-2xl font-extrabold text-[#1f2328]">{title}</h2>
      </div>
      <div className="p-8">{children}</div>
    </section>
  );
}

function InfoField({
  children,
  className = "",
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div className={className}>
      <dt className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#4f5565]">
        {label}
      </dt>
      <dd className="mt-3 break-words text-xl font-extrabold leading-snug text-[#20242b]">
        {children || "Not available"}
      </dd>
    </div>
  );
}

function AuditEvent({
  active = false,
  date,
  label,
}: {
  active?: boolean;
  date: string;
  label: string;
}) {
  return (
    <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-4">
      <div className="relative flex justify-center">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            active
              ? "bg-[#2457d6] text-white"
              : "bg-slate-200 text-slate-600"
          }`}
        >
          {active ? (
            <Pencil className="h-4 w-4" aria-hidden="true" />
          ) : (
            <CirclePlus className="h-4 w-4" aria-hidden="true" />
          )}
        </span>
        {active ? (
          <span className="absolute top-8 h-10 w-px bg-[#d6dbe6]" aria-hidden="true" />
        ) : null}
      </div>
      <div className="pb-7 last:pb-0">
        <dt className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#4f5565]">
          {label}
        </dt>
        <dd className="mt-2 text-lg font-extrabold text-[#20242b]">{date}</dd>
      </div>
    </div>
  );
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
  const blocked = user ? isBlockedStatus(user.status) : false;
  const nextStatus = blocked ? "active" : "blocked";
  const verified = user?.isVerified === true;

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
      const fallbackUser = {
        ...user,
        name: payload.fullName,
        phone: payload.phone ?? "",
        address: payload.address,
        role: payload.role || user.role,
      };
      const nextUser = {
        ...fallbackUser,
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

      const result = await updateAdminUserStatus(user.id);
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
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-base font-bold text-[#1d57d8] transition hover:text-[#1745a8]"
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

      <section className="rounded-lg border border-[#c9cfdd] bg-white px-8 py-10 shadow-sm md:px-10">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-7 sm:flex-row sm:items-center">
            <ProfileAvatar blocked={blocked} user={user} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-4">
                <h1 className="break-words text-3xl font-extrabold text-[#20242b] md:text-4xl">
                  {user.name}
                </h1>
                <HeaderStatusBadge blocked={blocked} />
              </div>
              <div className="mt-3 flex items-center gap-3 text-lg text-[#4f5565]">
                <Mail className="h-5 w-5 flex-none" aria-hidden="true" />
                <span className="break-all">
                  {user.email || "No email available"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:flex-none">
            <button
              type="button"
              onClick={() => {
                setEditErrorMessage("");
                setEditingUser(user);
              }}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-md border border-[#c9cfdd] bg-white px-7 text-base font-extrabold text-[#20242b] shadow-sm transition hover:bg-slate-50"
            >
              <Pencil className="h-5 w-5" aria-hidden="true" />
              Edit user
            </button>
            <button
              type="button"
              onClick={() => setConfirmAction({ type: "status", nextStatus })}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-md border border-[#c9cfdd] bg-white px-7 text-base font-extrabold text-[#20242b] shadow-sm transition hover:bg-slate-50"
            >
              {blocked ? (
                <Unlock className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Ban className="h-5 w-5" aria-hidden="true" />
              )}
              {blocked ? "Unblock user" : "Block user"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmAction({ type: "delete" })}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-md bg-[#bf2f2b] px-7 text-base font-extrabold text-white shadow-lg shadow-red-900/10 transition hover:bg-[#a92724]"
            >
              <Trash2 className="h-5 w-5" aria-hidden="true" />
              Delete user
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(340px,0.95fr)] xl:items-start">
        <div className="space-y-8">
          <InfoCard
            icon={<UserRound className="h-7 w-7" aria-hidden="true" />}
            title="General Information"
          >
            <dl className="grid grid-cols-1 gap-x-16 gap-y-9 md:grid-cols-2">
              <InfoField label="Full name">{user.name}</InfoField>
              <InfoField label="User identifier">
                <span className="text-[#1d57d8]">#{user.id}</span>
              </InfoField>
              <InfoField label="Administrative role">
                {getAdminStatusLabel(user.role)}
              </InfoField>
              <InfoField label="Account status">
                <div className="flex flex-wrap gap-2">
                  <MiniBadge tone={verified ? "blue" : "stone"}>
                    {verified ? "Verified" : "Unverified"}
                  </MiniBadge>
                  <MiniBadge tone={blocked ? "stone" : "green"}>
                    {blocked ? "Blocked" : "Active"}
                  </MiniBadge>
                  <MiniBadge>{getAdminStatusLabel(user.role)}</MiniBadge>
                </div>
              </InfoField>
            </dl>
          </InfoCard>

          <InfoCard
            icon={<Shield className="h-7 w-7" aria-hidden="true" />}
            title="Contact & Security"
          >
            <dl className="grid grid-cols-1 gap-x-16 gap-y-9 md:grid-cols-2">
              <InfoField label="Email address">
                <span className="inline-flex items-center gap-3">
                  <span className="break-all">{user.email || "Not available"}</span>
                  {verified ? (
                    <CheckCircle2 className="h-5 w-5 flex-none text-emerald-600" aria-hidden="true" />
                  ) : null}
                </span>
              </InfoField>
              <InfoField label="Phone number">{user.phone}</InfoField>
              <InfoField className="md:col-span-2" label="Residential address">
                {user.address}
              </InfoField>
            </dl>
          </InfoCard>

          {additionalFields.length > 0 ? (
            <InfoCard
              icon={<CirclePlus className="h-7 w-7" aria-hidden="true" />}
              title="Additional Fields"
            >
              <dl className="grid grid-cols-1 gap-x-16 gap-y-9 md:grid-cols-2">
                {additionalFields.map(([key, value]) => (
                  <InfoField key={key} label={key}>
                    {value}
                  </InfoField>
                ))}
              </dl>
            </InfoCard>
          ) : null}
        </div>

        <InfoCard
          icon={<History className="h-7 w-7" aria-hidden="true" />}
          title="Audit Log"
        >
          <dl>
            <AuditEvent
              active
              date={formatAdminDate(user.updatedAt)}
              label="Updated date"
            />
            <AuditEvent
              date={formatAdminDate(user.createdAt)}
              label="Created date"
            />
          </dl>
        </InfoCard>
      </div>

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
            : nextStatus === "blocked"
              ? "Block account?"
              : "Unblock account?"
        }
        description={
          confirmAction?.type === "delete"
            ? `${user.name} will be permanently removed.`
            : nextStatus === "blocked"
              ? `${user.name} will be blocked and cannot sign in.`
              : `${user.name} will be marked as active.`
        }
        confirmLabel={
          confirmAction?.type === "delete"
            ? "Delete user"
            : nextStatus === "blocked"
              ? "Block account"
              : "Unblock account"
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
