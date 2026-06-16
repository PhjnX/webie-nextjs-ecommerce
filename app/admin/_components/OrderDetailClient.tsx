"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import {
  formatAdminCurrency,
  formatAdminDate,
  getAdminOrder,
  getAdminStatusLabel,
  type AdminOrder,
  updateAdminOrderStatus,
} from "@/services/admin";
import {
  DetailItem,
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
  Notice,
  StatusBadge,
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
    <div className="space-y-5">
      <div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition hover:text-stone-950"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to order list
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
                Order #{order.id}
              </h2>
              <StatusBadge status={order.orderStatus} />
            </div>
            <p className="mt-2 text-sm text-stone-500">
              Created {formatAdminDate(order.createdAt)}
            </p>
          </div>
          <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-400">
              Total price
            </p>
            <p className="mt-1 text-xl font-bold text-stone-950">
              {formatAdminCurrency(order.totalAmount)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="text-lg font-bold text-stone-950">
            Customer information
          </h2>
          <dl className="mt-4 space-y-3">
            <DetailItem label="Name" value={order.customerName} />
            <DetailItem label="Email" value={order.customerEmail} />
            <DetailItem label="Phone" value={order.customerPhone} />
            <DetailItem label="Address" value={order.customerAddress} />
          </dl>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="text-lg font-bold text-stone-950">
            Order information
          </h2>
          <dl className="mt-4 space-y-3">
            <DetailItem label="Order ID" value={`#${order.id}`} />
            <DetailItem label="Current status" value={<StatusBadge status={order.orderStatus} />} />
            <DetailItem label="Created date" value={formatAdminDate(order.createdAt)} />
            <DetailItem label="Updated date" value={formatAdminDate(order.updatedAt)} />
          </dl>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="text-lg font-bold text-stone-950">
            Payment information
          </h2>
          <dl className="mt-4 space-y-3">
            <DetailItem label="Payment status" value={<StatusBadge status={order.paymentStatus} />} />
            <DetailItem label="Payment method" value={order.paymentMethod} />
            <DetailItem label="Total price" value={formatAdminCurrency(order.totalAmount)} />
          </dl>
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-950">
              Ordered products
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              {order.items.length.toLocaleString("en")} item
              {order.items.length === 1 ? "" : "s"}
            </p>
          </div>
          <p className="text-xl font-bold text-stone-950">
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
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[760px] w-full divide-y divide-stone-200 text-left">
              <thead className="bg-stone-50">
                <tr>
                  {["Product", "SKU", "Quantity", "Unit price", "Total"].map(
                    (column) => (
                      <th
                        key={column}
                        scope="col"
                        className="px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-stone-500"
                      >
                        {column}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <span
                            className="h-12 w-12 flex-none rounded-md border border-stone-200 bg-stone-100 bg-cover bg-center"
                            style={{
                              backgroundImage: `url(${JSON.stringify(item.imageUrl)})`,
                            }}
                            aria-hidden="true"
                          />
                        ) : (
                          <span className="h-12 w-12 flex-none rounded-md border border-stone-200 bg-stone-100" />
                        )}
                        <span className="text-sm font-semibold text-stone-900">
                          {item.productName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-stone-600">
                      {item.sku || "Not available"}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-stone-900">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-4 text-sm text-stone-600">
                      {formatAdminCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-stone-900">
                      {formatAdminCurrency(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-950">
              Update order status
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Current status: {getAdminStatusLabel(order.orderStatus)}
            </p>
          </div>

          <form
            onSubmit={handleStatusSubmit}
            className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[minmax(220px,1fr)_auto] lg:max-w-xl"
          >
            <label>
              <span className="sr-only">Order status</span>
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                className="h-11 w-full rounded-md border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              Save status
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
