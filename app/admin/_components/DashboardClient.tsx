"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  RefreshCw,
  ShoppingBag,
  Truck,
  type LucideIcon,
  Users,
  XCircle,
} from "lucide-react";
import {
  formatAdminCurrency,
  formatAdminDate,
  getAdminStats,
  type AdminStats,
} from "@/services/admin";
import {
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
  StatusBadge,
} from "./AdminUi";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected admin error.";
}

function getPercent(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function formatCompactNumber(value: number) {
  return value.toLocaleString("en");
}

function MetricCard({
  label,
  value,
  description,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  accent: string;
  icon: LucideIcon;
}) {
  return (
    <article className="rounded-lg border border-[#eee7d9] bg-white p-5 shadow-[0_10px_30px_rgba(37,32,12,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-stone-500">{label}</p>
          <p className="mt-3 break-words text-3xl font-extrabold tracking-tight text-stone-950">
            {value}
          </p>
        </div>
        <span
          className={`flex h-11 w-11 flex-none items-center justify-center rounded-md ${accent}`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-5 text-sm font-medium leading-6 text-stone-500">
        {description}
      </p>
    </article>
  );
}

export default function DashboardClient() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadStats = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      setStats(await getAdminStats());
    } catch (error) {
      setStats(null);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void loadStats();
    }, 0);

    return () => {
      window.clearTimeout(loadId);
    };
  }, [loadStats]);

  const metrics = useMemo(() => {
    if (!stats) {
      return [];
    }

    return [
      {
        label: "Total users",
        value: formatCompactNumber(stats.totalUsers),
        description: `${formatCompactNumber(stats.verifiedUsers)} verified, ${formatCompactNumber(stats.activeUsers)} active`,
        icon: Users,
        accent: "bg-[#f0f3fb] text-stone-700",
      },
      {
        label: "Total orders",
        value: formatCompactNumber(stats.totalOrders),
        description: `${formatCompactNumber(stats.pendingOrders)} pending, ${formatCompactNumber(stats.processingOrders)} processing`,
        icon: ShoppingBag,
        accent: "bg-stone-100 text-stone-700",
      },
      {
        label: "Total revenue",
        value: formatAdminCurrency(stats.totalRevenue),
        description: `${formatAdminCurrency(stats.revenueThisMonth)} this month`,
        icon: DollarSign,
        accent: "bg-emerald-50 text-emerald-700",
      },
      {
        label: "Paid orders",
        value: formatCompactNumber(stats.paidOrders),
        description: `${getPercent(stats.paidOrders, stats.totalOrders)}% of all orders`,
        icon: CreditCard,
        accent: "bg-[#fff7dd] text-[#746f35]",
      },
    ];
  }, [stats]);

  const isEmpty =
    stats &&
    stats.totalUsers === 0 &&
    stats.totalOrders === 0 &&
    stats.totalRevenue === 0 &&
    stats.latestOrders.length === 0;

  if (loading) {
    return <LoadingPanel label="Loading dashboard statistics" />;
  }

  if (errorMessage) {
    return <ErrorPanel message={errorMessage} onRetry={loadStats} />;
  }

  if (!stats) {
    return (
      <EmptyPanel
        title="No dashboard data"
        description="Dashboard statistics are not available yet."
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#746f35]">
            Admin overview
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-950 md:text-4xl">
            Webie store dashboard
          </h1>
          <p className="mt-3 text-base leading-7 text-stone-500">
            Monitor users, orders, revenue, and the newest purchases from the
            admin API.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadStats()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#d8d2c7] bg-white px-4 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      {isEmpty ? (
        <EmptyPanel
          title="No activity yet"
          description="Users, orders, and revenue will appear here when the store has activity."
        />
      ) : null}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
        <div className="space-y-6">
          <article className="rounded-lg border border-[#eee7d9] bg-white p-6 shadow-[0_12px_34px_rgba(37,32,12,0.05)]">
            <p className="text-sm font-bold text-stone-500">Revenue snapshot</p>
            <p className="mt-4 break-words text-4xl font-extrabold tracking-tight text-stone-950">
              {formatAdminCurrency(stats.totalRevenue)}
            </p>
            <dl className="mt-6 border-t border-[#eee7d9] pt-5">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-sm font-semibold text-stone-500">
                  This month
                </dt>
                <dd className="text-lg font-extrabold text-[#746f35]">
                  {formatAdminCurrency(stats.revenueThisMonth)}
                </dd>
              </div>
            </dl>
            <p className="mt-5 text-sm leading-6 text-stone-500">
              Revenue is reported by the upstream admin statistics endpoint.
            </p>
          </article>

          <article className="rounded-lg border border-[#eee7d9] bg-white p-6 shadow-[0_12px_34px_rgba(37,32,12,0.05)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-stone-950">
                  Order status
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Breakdown across {formatCompactNumber(stats.totalOrders)} orders.
                </p>
              </div>
              <span className="rounded-full border border-[#d8d2c7] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-stone-500">
                Live
              </span>
            </div>

            <div className="mt-6 divide-y divide-[#eee7d9]">
              {[
                {
                  label: "Pending",
                  value: stats.pendingOrders,
                  icon: Clock3,
                  className: "bg-amber-50 text-amber-700",
                  barClassName: "bg-amber-400",
                },
                {
                  label: "Paid",
                  value: stats.paidOrders,
                  icon: BadgeCheck,
                  className: "bg-emerald-50 text-emerald-700",
                  barClassName: "bg-emerald-500",
                },
                {
                  label: "Processing",
                  value: stats.processingOrders,
                  icon: Truck,
                  className: "bg-sky-50 text-sky-700",
                  barClassName: "bg-sky-400",
                },
                {
                  label: "Completed",
                  value: stats.completedOrders,
                  icon: CheckCircle2,
                  className: "bg-teal-50 text-teal-700",
                  barClassName: "bg-teal-500",
                },
                {
                  label: "Cancelled",
                  value: stats.cancelledOrders,
                  icon: XCircle,
                  className: "bg-red-50 text-red-600",
                  barClassName: "bg-red-400",
                },
              ].map((item) => {
                const Icon = item.icon;
                const percent = getPercent(item.value, stats.totalOrders);

                return (
                  <div key={item.label} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 flex-none items-center justify-center rounded-md ${item.className}`}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <p className="font-semibold text-stone-700">
                            {item.label}
                          </p>
                          <p className="font-bold text-stone-950">
                            {formatCompactNumber(item.value)}{" "}
                            <span className="font-medium text-stone-400">
                              ({percent}%)
                            </span>
                          </p>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
                          <div
                            className={`h-full rounded-full ${item.barClassName}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </div>

        <article className="rounded-lg border border-[#eee7d9] bg-white shadow-[0_12px_34px_rgba(37,32,12,0.05)]">
          <div className="flex flex-col gap-4 border-b border-[#eee7d9] p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-stone-950">
                Latest orders
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Most recent purchases returned by the stats endpoint.
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d8d2c7] px-3 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
            >
              View all
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {stats.latestOrders.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <h3 className="text-lg font-bold text-stone-950">
                No recent orders
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">
                Latest orders will appear here when customers place orders.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-left">
                <thead className="bg-[#f8f8fc]">
                  <tr>
                    {["Order", "Customer", "Amount", "Status", "Created"].map(
                      (column) => (
                        <th
                          key={column}
                          scope="col"
                          className="px-5 py-3 text-xs font-extrabold uppercase tracking-[0.1em] text-stone-500"
                        >
                          {column}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee7d9]">
                  {stats.latestOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-stone-50/70">
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/orders/${encodeURIComponent(order.id)}`}
                          className="font-mono text-sm font-bold text-stone-800 transition hover:text-[#746f35]"
                        >
                          #{order.id}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-stone-950">
                          {order.customerName}
                        </p>
                        <p className="mt-1 max-w-[260px] truncate text-sm text-stone-500">
                          {order.customerEmail || "No email"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm font-extrabold text-stone-950">
                        {formatAdminCurrency(order.totalAmount)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={order.orderStatus} />
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-stone-500">
                        {formatAdminDate(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
