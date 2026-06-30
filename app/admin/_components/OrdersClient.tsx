"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Search,
  ShoppingBag,
} from "lucide-react";
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

const ORDERS_PER_PAGE = 5;

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

function formatCompactNumber(value: number) {
  return value.toLocaleString("en");
}

export default function OrdersClient() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionErrorMessage, setActionErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
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
  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / ORDERS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visibleOrders = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ORDERS_PER_PAGE;

    return filteredOrders.slice(startIndex, startIndex + ORDERS_PER_PAGE);
  }, [filteredOrders, safeCurrentPage]);
  const visibleStart =
    filteredOrders.length === 0
      ? 0
      : (safeCurrentPage - 1) * ORDERS_PER_PAGE + 1;
  const visibleEnd = Math.min(
    safeCurrentPage * ORDERS_PER_PAGE,
    filteredOrders.length,
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

      <section className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-4 xl:grid-cols-[330px_1fr] xl:items-end">
        <article className="rounded-lg border border-[#eee7d9] bg-white p-5 shadow-[0_10px_30px_rgba(37,32,12,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-bold text-stone-500">Total orders</p>
              <p className="mt-3 break-words text-3xl font-extrabold tracking-tight text-stone-950">
                {formatCompactNumber(orders.length)}
              </p>
            </div>
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-md bg-stone-100 text-stone-700">
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-5 text-sm font-medium leading-6 text-stone-500">
            {formatCompactNumber(filteredOrders.length)} showing after search and filter
          </p>
        </article>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_240px] xl:justify-self-end xl:w-full xl:max-w-[760px]">
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
              placeholder="Search order, customer, email"
              className="h-12 w-full rounded-md border border-[#eee7d9] bg-white pl-12 pr-4 text-base text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#d8d2c7] focus:ring-2 focus:ring-[#eee7d9]"
            />
          </label>

          <label className="w-full">
            <span className="sr-only">Filter by order status</span>
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
                {visibleOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/70">
                    <td className="px-6 py-5 text-sm font-semibold text-stone-900">
                      #{order.id}
                    </td>
                    <td className="px-6 py-5 text-sm font-semibold text-stone-900">
                      {order.customerName}
                    </td>
                    <td className="px-6 py-5 text-sm text-stone-600">
                      {order.customerEmail || "Not available"}
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-stone-900">
                      {formatAdminCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={order.orderStatus} />
                    </td>
                    <td className="px-6 py-5 text-sm text-stone-600">
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

          <div className="flex flex-col gap-4 border-t border-[#d8d2c7] px-6 py-7 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-medium text-stone-600">
              Showing{" "}
              <span className="font-bold text-stone-950">
                {visibleStart} - {visibleEnd}
              </span>{" "}
              of {filteredOrders.length} total order
              {filteredOrders.length === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-4 md:justify-end">
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
                disabled={safeCurrentPage === 1}
                className="flex h-10 w-10 items-center justify-center rounded-md text-stone-300 transition hover:bg-stone-100 hover:text-stone-600 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-stone-300"
                aria-label="Previous orders page"
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
                aria-label="Next orders page"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
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
