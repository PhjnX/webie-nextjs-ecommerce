"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Loader2,
  Lock,
  Pencil,
  Search,
  Trash2,
  Unlock,
  UsersRound,
} from "lucide-react";
import {
  deleteAdminUser,
  formatAdminDate,
  getAdminStatusLabel,
  getAdminUsers,
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

const USERS_PER_PAGE = 6;

type ConfirmAction =
  | {
      type: "delete";
      user: AdminUser;
    }
  | {
      type: "status";
      user: AdminUser;
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

function matchesUser(user: AdminUser, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [user.name, user.email, user.id]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(normalizedQuery));
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

function formatUserId(id: string) {
  const numericId = Number(id);

  if (Number.isInteger(numericId) && numericId >= 0 && numericId < 1000) {
    return `#${String(numericId).padStart(3, "0")}`;
  }

  return `#${id}`;
}

function formatCompactNumber(value: number) {
  return value.toLocaleString("en");
}

function getCompactDate(value: string) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function RolePill({ role }: { role: string }) {
  const admin = role.toLowerCase().includes("admin");

  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-md px-2.5 text-xs font-extrabold uppercase ${
        admin ? "bg-stone-950 text-white" : "bg-stone-200 text-stone-600"
      }`}
    >
      {getAdminStatusLabel(role)}
    </span>
  );
}

function UserStatusPill({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();
  const active = normalizedStatus === "active";
  const inactive = ["inactive", "locked", "blocked", "disabled", "deleted"].includes(
    normalizedStatus,
  );
  const className = active
    ? "bg-emerald-100 text-emerald-700"
    : inactive
      ? "bg-red-100 text-red-700"
      : "bg-[#dfe5f5] text-stone-600";
  const dotClassName = active
    ? "bg-emerald-500"
    : inactive
      ? "bg-red-500"
      : "bg-stone-400";

  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 text-sm font-bold ${className}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotClassName}`} />
      {getAdminStatusLabel(status)}
    </span>
  );
}

function exportUsersCsv(users: AdminUser[]) {
  const headers = ["User ID", "Name", "Email", "Role", "Status", "Created date"];
  const rows = users.map((user) => [
    user.id,
    user.name,
    user.email,
    getAdminStatusLabel(user.role),
    getAdminStatusLabel(user.status),
    formatAdminDate(user.createdAt),
  ]);
  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "admin-users.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function UsersClient() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionErrorMessage, setActionErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editErrorMessage, setEditErrorMessage] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      setUsers(await getAdminUsers());
    } catch (error) {
      setUsers([]);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => {
      window.clearTimeout(loadId);
    };
  }, [loadUsers]);

  const roleOptions = useMemo(
    () => Array.from(new Set(users.map((user) => user.role).filter(Boolean))),
    [users],
  );
  const statusOptions = useMemo(
    () => Array.from(new Set(users.map((user) => user.status).filter(Boolean))),
    [users],
  );
  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        const matchesStatus =
          statusFilter === "all" || user.status === statusFilter;

        return matchesRole && matchesStatus && matchesUser(user, searchTerm);
      }),
    [roleFilter, searchTerm, statusFilter, users],
  );
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visibleUsers = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * USERS_PER_PAGE;

    return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [filteredUsers, safeCurrentPage]);
  const visibleStart =
    filteredUsers.length === 0 ? 0 : (safeCurrentPage - 1) * USERS_PER_PAGE + 1;
  const visibleEnd = Math.min(
    safeCurrentPage * USERS_PER_PAGE,
    filteredUsers.length,
  );

  const handleUpdateUser = async (payload: UpdateAdminUserPayload) => {
    if (!editingUser || savingEdit) {
      return;
    }

    setSavingEdit(true);
    setEditErrorMessage("");
    setSuccessMessage("");
    setActionErrorMessage("");

    try {
      const result = await updateAdminUser(editingUser.id, payload);
      const fallbackUser = {
        ...editingUser,
        name: payload.fullName,
        phone: payload.phone ?? "",
        address: payload.address,
        role: payload.role || editingUser.role,
      };
      const nextUser = {
        ...fallbackUser,
        ...(result.user ?? {}),
      };

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === editingUser.id ? nextUser : user,
        ),
      );
      setEditingUser(null);
      setSuccessMessage(result.message || "User updated successfully.");
    } catch (error) {
      setEditErrorMessage(getErrorMessage(error));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || confirmLoading) {
      return;
    }

    setConfirmLoading(true);
    setSuccessMessage("");
    setActionErrorMessage("");

    try {
      if (confirmAction.type === "delete") {
        const message = await deleteAdminUser(confirmAction.user.id);

        setUsers((currentUsers) =>
          currentUsers.filter((user) => user.id !== confirmAction.user.id),
        );
        setSuccessMessage(message || "User deleted successfully.");
      } else {
        const result = await updateAdminUserStatus(
          confirmAction.user.id,
          confirmAction.nextStatus,
        );
        const nextUser = {
          ...confirmAction.user,
          status: confirmAction.nextStatus,
          ...(result.user ?? {}),
        };

        setUsers((currentUsers) =>
          currentUsers.map((user) =>
            user.id === confirmAction.user.id ? nextUser : user,
          ),
        );
        setSuccessMessage(result.message || "User status updated successfully.");
      }

      setConfirmAction(null);
    } catch (error) {
      setActionErrorMessage(getErrorMessage(error));
    } finally {
      setConfirmLoading(false);
    }
  };

  const confirmTitle =
    confirmAction?.type === "delete"
      ? "Delete user?"
      : confirmAction?.nextStatus === "blocked"
        ? "Block account?"
        : "Unblock account?";
  const confirmDescription =
    confirmAction?.type === "delete"
      ? `${confirmAction.user.name} will be removed from the admin user list.`
      : confirmAction?.nextStatus === "blocked"
        ? `${confirmAction.user.name} will be blocked and cannot sign in.`
        : `${confirmAction?.user.name ?? "This user"} will be marked as active.`;
  const confirmLabel =
    confirmAction?.type === "delete"
      ? "Delete user"
      : confirmAction?.nextStatus === "blocked"
        ? "Block account"
        : "Unblock account";

  if (loading) {
    return <LoadingPanel label="Loading users" />;
  }

  if (errorMessage) {
    return <ErrorPanel message={errorMessage} onRetry={loadUsers} />;
  }

  return (
    <div className="space-y-5">
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

      <section className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-4 xl:grid-cols-[330px_1fr] xl:items-end">
        <article className="rounded-lg border border-[#eee7d9] bg-white p-5 shadow-[0_10px_30px_rgba(37,32,12,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-bold text-stone-500">Total users</p>
              <p className="mt-3 break-words text-3xl font-extrabold tracking-tight text-stone-950">
                {formatCompactNumber(users.length)}
              </p>
            </div>
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-md bg-stone-100 text-stone-700">
              <UsersRound
                className="h-5 w-5"
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </span>
          </div>
          <p className="mt-5 text-sm font-medium leading-6 text-stone-500">
            {formatCompactNumber(filteredUsers.length)} showing after search and filter
          </p>
        </article>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px_200px_auto] xl:justify-self-end xl:w-full xl:max-w-[980px]">
          <label className="relative w-full">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search name or email"
              className="h-12 w-full rounded-md border border-[#eee7d9] bg-white pl-12 pr-4 text-base text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#d8d2c7] focus:ring-2 focus:ring-[#eee7d9]"
            />
          </label>

          <label className="w-full">
            <span className="sr-only">Filter by role</span>
            <select
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="h-12 w-full rounded-md border border-[#eee7d9] bg-white px-4 text-base font-semibold text-stone-700 outline-none transition focus:border-[#d8d2c7] focus:ring-2 focus:ring-[#eee7d9]"
            >
              <option value="all">All roles</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {getAdminStatusLabel(role)}
                </option>
              ))}
            </select>
          </label>

          <label className="w-full">
            <span className="sr-only">Filter by user status</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="h-12 w-full rounded-md border border-[#eee7d9] bg-white px-4 text-base font-semibold text-stone-700 outline-none transition focus:border-[#d8d2c7] focus:ring-2 focus:ring-[#eee7d9]"
            >
              <option value="all">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {getAdminStatusLabel(status)}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => exportUsersCsv(filteredUsers)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-[#eee7d9] bg-white text-stone-600 transition hover:bg-stone-50"
            aria-label="Download filtered users CSV"
            title="Download filtered users CSV"
          >
            <Download className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </section>

      {users.length === 0 ? (
        <EmptyPanel
          title="No users found"
          description="Users returned by the admin API will appear here."
        />
      ) : (
        <section className="mx-auto w-full max-w-[1600px] overflow-hidden rounded-lg border border-[#eee7d9] bg-white shadow-[0_16px_46px_rgba(37,32,12,0.06)]">

          <div className="overflow-x-auto">
            <table className="min-w-[1080px] w-full text-left">
              <thead className="bg-[#f0f3fb]">
                <tr>
                  {[
                    "User ID",
                    "Name",
                    "Email",
                    "Role",
                    "Status",
                    "Created date",
                    "Actions",
                  ].map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="px-6 py-4 text-xs font-extrabold uppercase tracking-[0.08em] text-stone-600"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee7d9] bg-white">
                {visibleUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-14 text-center text-sm font-medium text-stone-500"
                    >
                      No matching users. Try a different search term or filter.
                    </td>
                  </tr>
                ) : null}
                {visibleUsers.map((user) => {
                  const blocked = isBlockedStatus(user.status);
                  const nextStatus = blocked ? "active" : "blocked";

                  return (
                    <tr key={user.id} className="hover:bg-stone-50/70">
                      <td className="px-6 py-5 font-mono text-sm font-bold text-stone-600">
                        {formatUserId(user.id)}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#fff0a8] text-sm font-bold text-[#5f592f]">
                            {getUserInitials(user)}
                          </span>
                          <span className="text-lg font-medium text-stone-950">
                            {user.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-lg text-stone-600">
                        {user.email || "Not available"}
                      </td>
                      <td className="px-6 py-5">
                        <RolePill role={user.role} />
                      </td>
                      <td className="px-6 py-5">
                        <UserStatusPill status={user.status} />
                      </td>
                      <td className="px-6 py-5 text-base font-medium text-stone-500">
                        {getCompactDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/users/${encodeURIComponent(user.id)}`}
                            className="flex h-9 w-9 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-100 hover:text-stone-950"
                            aria-label={`View ${user.name}`}
                            title="View detail"
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setEditErrorMessage("");
                              setEditingUser(user);
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-100 hover:text-stone-950"
                            aria-label={`Edit ${user.name}`}
                            title="Edit user"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                type: "status",
                                user,
                                nextStatus,
                              })
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-md text-stone-500 transition hover:bg-amber-50 hover:text-amber-700"
                            aria-label={`${blocked ? "Unblock" : "Block"} ${user.name}`}
                            title={blocked ? "Unblock account" : "Block account"}
                          >
                            {blocked ? (
                              <Unlock className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <Lock className="h-4 w-4" aria-hidden="true" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmAction({ type: "delete", user })}
                            className="flex h-9 w-9 items-center justify-center rounded-md text-stone-500 transition hover:bg-red-50 hover:text-red-600"
                            aria-label={`Delete ${user.name}`}
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-[#d8d2c7] px-6 py-7 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-medium text-stone-600">
              Showing{" "}
              <span className="font-bold text-stone-950">
                {visibleStart} - {visibleEnd}
              </span>{" "}
              of {filteredUsers.length} total user
              {filteredUsers.length === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-4 md:justify-end">
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
                disabled={safeCurrentPage === 1}
                className="flex h-10 w-10 items-center justify-center rounded-md text-stone-300 transition hover:bg-stone-100 hover:text-stone-600 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-stone-300"
                aria-label="Previous users page"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <span className="flex h-12 min-w-12 items-center justify-center rounded-lg bg-[#746f35] px-4 text-base font-bold text-white">
                {safeCurrentPage}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={safeCurrentPage === totalPages}
                className="flex h-10 w-10 items-center justify-center rounded-md text-stone-300 transition hover:bg-stone-100 hover:text-stone-600 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-stone-300"
                aria-label="Next users page"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      )}

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
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={confirmLabel}
        destructive={confirmAction?.type === "delete"}
        loading={confirmLoading}
        onClose={() => {
          if (!confirmLoading) {
            setConfirmAction(null);
          }
        }}
        onConfirm={handleConfirmAction}
      />

      {confirmLoading ? (
        <div className="sr-only" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing action
        </div>
      ) : null}
    </div>
  );
}
