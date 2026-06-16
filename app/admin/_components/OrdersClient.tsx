"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Search } from "lucide-react";
import {
  formatAdminCurrency,
  formatAdminDate,
  getAdminOrders,
  getAdminStatusLabel,
  type AdminOrder,
  updateAdminOrderStatus,
} from "@/services/admin";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
  Notice,
  StatusBadge,
} from "./AdminUi";
import OrderStatusDialog from "./OrderStatusDialog";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected admin error.";
}

function matchesOrder(order: AdminOrder, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [order.id, order.customerName, order.customerEmail]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(normalizedQuery));
}

export default function OrdersClient() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionErrorMessage, setActionErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [statusDialogError, setStatusDialogError] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      setOrders(await getAdminOrders());
    } catch (error) {
      setOrders([]);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void loadOrders();
    }, 0);

    return () => {
      window.clearTimeout(loadId);
    };
  }, [loadOrders]);

  const statusOptions = useMemo(() => {
    const options = new Set(["pending", "processing", "completed", "cancelled", "paid"]);

    for (const order of orders) {
      if (order.orderStatus) {
        options.add(order.orderStatus);
      }
    }

    return Array.from(options);
  }, [orders]);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const statusMatches =
          statusFilter === "all" || order.orderStatus === statusFilter;

        return statusMatches && matchesOrder(order, searchTerm);
      }),
    [orders, searchTerm, statusFilter],
  );

  const handleUpdateStatus = async (status: string) => {
    if (!selectedOrder || savingStatus) {
      return;
    }

    setSavingStatus(true);
    setStatusDialogError("");
    setSuccessMessage("");
    setActionErrorMessage("");

    try {
      const result = await updateAdminOrderStatus(selectedOrder.id, status);
      const nextOrder = {
        ...selectedOrder,
        orderStatus: status,
        ...(result.order ?? {}),
      };

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === selectedOrder.id ? nextOrder : order,
        ),
      );
      setSelectedOrder(null);
      setSuccessMessage(result.message || "Order status updated successfully.");
    } catch (error) {
      setStatusDialogError(getErrorMessage(error));
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) {
    return <LoadingPanel label="Loading orders" />;
  }

  if (errorMessage) {
    return <ErrorPanel message={errorMessage} onRetry={loadOrders} />;
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

      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <div>
            <h2 className="text-lg font-bold text-stone-950">Order list</h2>
            <p className="mt-1 text-sm text-stone-500">
              {orders.length.toLocaleString("en")} total order
              {orders.length === 1 ? "" : "s"}
            </p>
          </div>

          <label className="relative w-full lg:w-80">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search order, customer, email"
              className="h-11 w-full rounded-md border border-stone-200 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
            />
          </label>

          <label className="w-full lg:w-56">
            <span className="sr-only">Filter by order status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 w-full rounded-md border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
            >
              <option value="all">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {getAdminStatusLabel(status)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {orders.length === 0 ? (
        <EmptyPanel
          title="No orders found"
          description="Orders returned by the admin API will appear here."
        />
      ) : filteredOrders.length === 0 ? (
        <EmptyPanel
          title="No matching orders"
          description="Try a different search term or status filter."
        />
      ) : (
        <section className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1080px] w-full divide-y divide-stone-200 text-left">
              <thead className="bg-stone-50">
                <tr>
                  {[
                    "Order ID",
                    "Customer name",
                    "Email",
                    "Total amount",
                    "Payment status",
                    "Order status",
                    "Created date",
                    "Actions",
                  ].map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-stone-500"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/70">
                    <td className="px-4 py-4 text-sm font-semibold text-stone-900">
                      #{order.id}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-stone-900">
                      {order.customerName}
                    </td>
                    <td className="px-4 py-4 text-sm text-stone-600">
                      {order.customerEmail || "Not available"}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-stone-900">
                      {formatAdminCurrency(order.totalAmount)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={order.paymentStatus} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={order.orderStatus} />
                    </td>
                    <td className="px-4 py-4 text-sm text-stone-600">
                      {formatAdminDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/admin/orders/${encodeURIComponent(order.id)}`}
                          className="flex h-9 w-9 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-100 hover:text-stone-950"
                          aria-label={`View order ${order.id}`}
                          title="View order detail"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setStatusDialogError("");
                            setSelectedOrder(order);
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-100 hover:text-stone-950"
                          aria-label={`Update order ${order.id} status`}
                          title="Update order status"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <OrderStatusDialog
        key={selectedOrder ? `${selectedOrder.id}:${selectedOrder.orderStatus}` : "closed"}
        open={Boolean(selectedOrder)}
        order={selectedOrder}
        saving={savingStatus}
        errorMessage={statusDialogError}
        onClose={() => {
          if (!savingStatus) {
            setSelectedOrder(null);
          }
        }}
        onSubmit={handleUpdateStatus}
      />
    </div>
  );
}
