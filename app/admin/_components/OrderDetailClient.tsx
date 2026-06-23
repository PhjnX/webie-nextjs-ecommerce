"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  RefreshCcw,
  Save,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import {
  formatAdminCurrency,
  formatAdminDate,
  getAdminOrder,
  getAdminStatusLabel,
  type AdminOrder,
  updateAdminOrderStatus,
} from "@/services/admin";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
  Notice,
} from "./AdminUi";

const baseStatusOptions = [
  "pending",
  "processing",
  "completed",
  "cancelled",
  "paid",
];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected admin error.";
}

function StatusPill({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();
  const success = ["completed", "paid", "success", "delivered"].includes(
    normalizedStatus,
  );
  const danger = ["cancelled", "canceled", "failed", "unpaid"].includes(
    normalizedStatus,
  );
  const warning = ["pending"].includes(normalizedStatus);
  const className = success
    ? "bg-emerald-50 text-emerald-700"
    : danger
      ? "bg-red-50 text-red-700"
      : warning
        ? "bg-amber-50 text-amber-700"
        : "bg-blue-50 text-blue-700";

  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full px-3 text-xs font-bold ${className}`}
    >
      {getAdminStatusLabel(status)}
    </span>
  );
}

function DetailCard({
  children,
  icon,
  title,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-[#c9cfdd] bg-white p-7 shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <span className="text-[#2457c8]">{icon}</span>
        <h2 className="text-2xl font-extrabold text-[#20242b]">{title}</h2>
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
}

function DetailField({
  children,
  label,
  link = false,
}: {
  children: React.ReactNode;
  label: string;
  link?: boolean;
}) {
  return (
    <div>
      <dt className="text-sm font-extrabold uppercase tracking-[0.13em] text-[#4f5565]">
        {label}
      </dt>
      <dd
        className={`mt-2 break-words text-xl leading-snug ${
          link ? "font-semibold text-[#1d57d8]" : "font-medium text-[#20242b]"
        }`}
      >
        {children || <span className="italic text-[#4f5565]">Not available</span>}
      </dd>
    </div>
  );
}

export default function OrderDetailClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionErrorMessage, setActionErrorMessage] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const nextOrder = await getAdminOrder(orderId);

      setOrder(nextOrder);
      setSelectedStatus(nextOrder?.orderStatus ?? "");
    } catch (error) {
      setOrder(null);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void loadOrder();
    }, 0);

    return () => {
      window.clearTimeout(loadId);
    };
  }, [loadOrder]);

  const statusOptions = Array.from(
    new Set([
      ...baseStatusOptions,
      ...(order?.orderStatus ? [order.orderStatus] : []),
    ]),
  );

  const handleStatusSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!order || savingStatus || !selectedStatus) {
      return;
    }

    setSavingStatus(true);
    setSuccessMessage("");
    setActionErrorMessage("");

    try {
      const result = await updateAdminOrderStatus(order.id, selectedStatus);
      const nextOrder = {
        ...order,
        orderStatus: selectedStatus,
        ...(result.order ?? {}),
      };

      setOrder(nextOrder);
      setSelectedStatus(nextOrder.orderStatus);
      setSuccessMessage(result.message || "Order status updated successfully.");
    } catch (error) {
      setActionErrorMessage(getErrorMessage(error));
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) {
    return <LoadingPanel label="Loading order detail" />;
  }

  if (errorMessage) {
    return <ErrorPanel message={errorMessage} onRetry={loadOrder} />;
  }

  if (!order) {
    return (
      <EmptyPanel
        title="Order not found"
        description="The requested order could not be loaded from the admin API."
      />
    );
  }

  return (
    <div className="space-y-7">
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

      <section className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <Link
            href="/admin/orders"
            className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#1d57d8] transition hover:text-[#1745a8]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to order list
          </Link>
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="break-words text-4xl font-extrabold leading-tight text-[#20242b]">
              Order #{order.id}
            </h1>
            <StatusPill status={order.orderStatus} />
          </div>
          <p className="mt-2 text-base text-[#4f5565]">
            Created on {formatAdminDate(order.createdAt)}
          </p>
        </div>

        <div className="w-full rounded-lg border border-[#c9cfdd] bg-white px-5 py-4 text-right shadow-sm sm:w-auto sm:min-w-[168px]">
          <p className="text-sm font-extrabold uppercase tracking-[0.13em] text-[#4f5565]">
            Total price
          </p>
          <p className="mt-2 whitespace-nowrap text-3xl font-extrabold text-[#1f4fc3]">
            {formatAdminCurrency(order.totalAmount)}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-7 xl:grid-cols-2">
        <DetailCard
          icon={<UserRound className="h-6 w-6" aria-hidden="true" />}
          title="Customer information"
        >
          <dl className="space-y-5">
            <DetailField label="Name">{order.customerName}</DetailField>
            <DetailField label="Email" link>
              {order.customerEmail}
            </DetailField>
            <DetailField label="Phone">{order.customerPhone}</DetailField>
            <DetailField label="Address">{order.customerAddress}</DetailField>
          </dl>
        </DetailCard>

        <DetailCard
          icon={<ShoppingCart className="h-6 w-6" aria-hidden="true" />}
          title="Order information"
        >
          <dl className="space-y-5">
            <DetailField label="Order ID">#{order.id}</DetailField>
            <DetailField label="Current status">
              <StatusPill status={order.orderStatus} />
            </DetailField>
            <DetailField label="Created date">
              {formatAdminDate(order.createdAt)}
            </DetailField>
            <DetailField label="Updated date">
              {formatAdminDate(order.updatedAt)}
            </DetailField>
          </dl>
        </DetailCard>
      </section>

      <section className="overflow-hidden rounded-lg border border-[#c9cfdd] bg-white shadow-sm">
        <div className="flex flex-col gap-4 bg-[#f8fafc] px-7 py-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold text-[#20242b]">
              Ordered products
            </h2>
            <p className="mt-1 text-sm font-semibold text-[#4f5565]">
              {order.items.length.toLocaleString("en")} item
              {order.items.length === 1 ? "" : "s"}
            </p>
          </div>
          <p className="text-2xl font-extrabold text-[#20242b]">
            {formatAdminCurrency(order.totalAmount)}
          </p>
        </div>

        {order.items.length === 0 ? (
          <div className="mt-5">
            <EmptyPanel
              title="No products available"
              description="This order does not include item details in the admin API response."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[42%]" />
                <col className="w-[22%]" />
                <col className="w-[18%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead className="border-y border-[#c9cfdd] bg-[#f8fafc]">
                <tr>
                  <th
                    scope="col"
                    className="px-7 py-3 text-xs font-extrabold uppercase tracking-[0.15em] text-[#4f5565]"
                  >
                    Product
                  </th>
                  <th
                    scope="col"
                    className="px-7 py-3 text-xs font-extrabold uppercase tracking-[0.15em] text-[#4f5565]"
                  >
                    SKU
                  </th>
                  <th
                    scope="col"
                    className="px-7 py-3 text-center text-xs font-extrabold uppercase tracking-[0.15em] text-[#4f5565]"
                  >
                    Quantity
                  </th>
                  <th
                    scope="col"
                    className="px-7 py-3 text-right text-xs font-extrabold uppercase tracking-[0.15em] text-[#4f5565]"
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-7 py-5 align-middle">
                      <div className="flex items-center gap-5">
                        {item.imageUrl ? (
                          <span
                            className="h-14 w-14 flex-none rounded border border-[#c9cfdd] bg-slate-100 bg-cover bg-center"
                            style={{
                              backgroundImage: `url(${JSON.stringify(item.imageUrl)})`,
                            }}
                            aria-hidden="true"
                          />
                        ) : (
                          <span className="h-14 w-14 flex-none rounded border border-[#c9cfdd] bg-slate-100" />
                        )}
                        <span className="min-w-0 break-words text-base font-semibold text-[#20242b]">
                          {item.productName}
                        </span>
                      </div>
                    </td>
                    <td className="px-7 py-5 align-middle text-base text-[#4f5565]">
                      {item.sku || "Not available"}
                    </td>
                    <td className="px-7 py-5 text-center align-middle text-base font-semibold text-[#20242b]">
                      {item.quantity}
                    </td>
                    <td className="px-7 py-5 text-right align-middle text-base font-extrabold text-[#20242b]">
                      {formatAdminCurrency(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-[#c9cfdd] bg-white px-7 py-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#eaf0ff] text-[#2457c8]">
              <RefreshCcw className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-2xl font-extrabold text-[#20242b]">
                Update order status
              </h2>
              <p className="mt-1 text-base text-[#4f5565]">
                Current status:{" "}
                <span className="font-semibold text-[#1d57d8]">
                  {getAdminStatusLabel(order.orderStatus)}
                </span>
              </p>
            </div>
          </div>

          <form
            onSubmit={handleStatusSubmit}
            className="grid w-full grid-cols-1 gap-4 sm:grid-cols-[minmax(220px,280px)_180px] lg:w-auto"
          >
            <label>
              <span className="sr-only">Order status</span>
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                className="h-12 w-full rounded-md border border-[#c9cfdd] bg-white px-4 text-base font-medium text-[#20242b] outline-none transition focus:border-[#2457c8] focus:ring-2 focus:ring-[#dbe4ff]"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {getAdminStatusLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={savingStatus || selectedStatus === order.orderStatus}
              className="inline-flex h-12 items-center justify-center gap-3 rounded-md bg-[#2457c8] px-5 text-base font-extrabold text-white transition hover:bg-[#1d4cae] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingStatus ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-5 w-5" aria-hidden="true" />
              )}
              Save status
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
