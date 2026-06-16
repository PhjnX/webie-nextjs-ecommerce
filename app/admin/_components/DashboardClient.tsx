"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  DollarSign,
  ShoppingBag,
  Users,
} from "lucide-react";
import {
  formatAdminCurrency,
  getAdminStats,
  type AdminStats,
} from "@/services/admin";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "./AdminUi";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected admin error.";
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

  const cards = useMemo(() => {
    if (!stats) {
      return [];
    }

    return [
      {
        label: "Total users",
        value: stats.totalUsers.toLocaleString("en"),
        icon: Users,
        accent: "bg-sky-50 text-sky-700",
      },
      {
        label: "Total orders",
        value: stats.totalOrders.toLocaleString("en"),
        icon: ShoppingBag,
        accent: "bg-stone-100 text-stone-700",
      },
      {
        label: "Total revenue",
        value: formatAdminCurrency(stats.totalRevenue),
        icon: DollarSign,
        accent: "bg-emerald-50 text-emerald-700",
      },
      {
        label: "Pending orders",
        value: stats.pendingOrders.toLocaleString("en"),
        icon: Clock3,
        accent: "bg-amber-50 text-amber-700",
      },
      {
        label: "Completed orders",
        value: stats.completedOrders.toLocaleString("en"),
        icon: CheckCircle2,
        accent: "bg-teal-50 text-teal-700",
      },
    ];
  }, [stats]);

  const isEmpty =
    stats &&
    stats.totalUsers === 0 &&
    stats.totalOrders === 0 &&
    stats.totalRevenue === 0 &&
    stats.pendingOrders === 0 &&
    stats.completedOrders === 0;

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
    <div className="space-y-6">
      {isEmpty ? (
        <EmptyPanel
          title="No activity yet"
          description="Users, orders, and revenue will appear here when the store has activity."
        />
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-md ${card.accent}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mt-5 text-sm font-semibold text-stone-500">
                {card.label}
              </p>
              <p className="mt-2 break-words text-2xl font-bold text-stone-950">
                {card.value}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-stone-950">
                Order health
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Pending and completed order mix.
              </p>
            </div>
            <span className="rounded-full border border-stone-200 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
              Live
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-md bg-amber-50 p-5">
              <p className="text-sm font-semibold text-amber-700">Pending</p>
              <p className="mt-2 text-3xl font-bold text-amber-900">
                {stats.pendingOrders}
              </p>
            </div>
            <div className="rounded-md bg-emerald-50 p-5">
              <p className="text-sm font-semibold text-emerald-700">
                Completed
              </p>
              <p className="mt-2 text-3xl font-bold text-emerald-900">
                {stats.completedOrders}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-stone-950">Revenue summary</h2>
          <p className="mt-1 text-sm text-stone-500">
            Gross revenue reported by the admin API.
          </p>
          <p className="mt-8 break-words text-4xl font-bold text-stone-950">
            {formatAdminCurrency(stats.totalRevenue)}
          </p>
        </div>
      </section>
    </div>
  );
}
