"use client";

import { useEffect, useState } from "react";
import {
  Package, CheckCircle2, Clock, XCircle,
  Truck, UserRound, ClipboardCheck, BarChart3,
} from "lucide-react";
import { apiGet } from "@/lib/api";

interface StatsData {
  totalWaybills: number;
  deliveredWaybills: number;
  outstandingWaybills: number;
  failedWaybills: number;
  totalVehicles: number;
  activeVehicles: number;
  totalDrivers: number;
  activeDrivers: number;
  podsOutstanding: number;
  successRate: string;
}

export default function DashboardStats() {
  const [stats, setStats]   = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    apiGet<{ success: boolean; data: StatsData }>("/api/dashboard/stats")
      .then((res) => { if (res.success) setStats(res.data); })
      .catch((e) => setError(e.message ?? "Could not load stats"))
      .finally(() => setLoading(false));
  }, []);

  const val = (v?: number | string) => {
    if (loading) return "…";
    if (v === undefined || v === null) return "0";
    return v.toString();
  };

  const cards = [
    {
      title: "Waybills",
      value: val(stats?.totalWaybills),
      subtitle: "Total Waybills",
      icon: Package,
      iconBg: "bg-blue-50",   iconColor: "text-blue-600",
      footerType: "trend",    change: "+12%", changeColor: "text-emerald-500",
    },
    {
      title: "Delivered",
      value: val(stats?.deliveredWaybills),
      subtitle: "Total Delivered",
      icon: CheckCircle2,
      iconBg: "bg-emerald-50", iconColor: "text-emerald-600",
      footerType: "trend",     change: "+6%",  changeColor: "text-emerald-500",
    },
    {
      title: "Outstanding",
      value: val(stats?.outstandingWaybills),
      subtitle: "Total Outstanding",
      valueColor: "text-red-500",
      icon: Clock,
      iconBg: "bg-orange-50",  iconColor: "text-orange-500",
      footerType: "trend",     change: "-5%",  changeColor: "text-red-500",
    },
    {
      title: "Failed",
      value: val(stats?.failedWaybills),
      subtitle: "Total Failed",
      valueColor: "text-red-500",
      icon: XCircle,
      iconBg: "bg-red-50",     iconColor: "text-red-500",
      footerType: "trend",     change: "-2%",  changeColor: "text-red-500",
    },
    {
      title: "Vehicles In Road",
      value: val(stats?.activeVehicles ?? stats?.totalVehicles),
      subtitle: "Active Vehicles",
      icon: Truck,
      iconBg: "bg-blue-50",   iconColor: "text-blue-600",
      footerType: "status",   statusLabel: "Active", statusDotColor: "bg-blue-500",
    },
    {
      title: "Drivers Active",
      value: val(stats?.activeDrivers ?? stats?.totalDrivers),
      subtitle: "Active Drivers",
      icon: UserRound,
      iconBg: "bg-blue-50",   iconColor: "text-blue-600",
      footerType: "status",   statusLabel: "Active", statusDotColor: "bg-blue-500",
    },
    {
      title: "PODs Outstanding",
      value: val(stats?.podsOutstanding),
      subtitle: "Total PODs",
      icon: ClipboardCheck,
      iconBg: "bg-purple-50", iconColor: "text-purple-600",
      footerType: "status",   statusLabel: "Pending", statusDotColor: "bg-orange-500",
    },
    {
      title: "Deliveries %",
      value: val(stats?.successRate),
      subtitle: "Success Rate",
      icon: BarChart3,
      iconBg: "bg-blue-50",   iconColor: "text-blue-600",
      footerType: "trend",    change: "+3%",  changeColor: "text-emerald-500",
    },
  ];

  return (
    <section className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111827] sm:text-[30px]">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 sm:text-[15px]">
          Overview of your logistics operations
        </p>
        {error && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            {error} — Make sure the backend server is running on port 5000.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index}
              className="flex min-h-[170px] flex-col justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-4 shadow-sm transition-all duration-300 hover:shadow-md sm:min-h-[190px] sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-semibold text-gray-600 sm:text-[15px]">
                    {item.title}
                  </h4>
                  <h2 className={`mt-2 text-3xl font-bold leading-none sm:mt-3 sm:text-[42px] ${(item as any).valueColor || "text-[#111827]"}`}>
                    {item.value}
                  </h2>
                  <p className="mt-2 text-xs font-medium text-gray-400 sm:text-[14px]">
                    {item.subtitle}
                  </p>
                </div>
                {Icon && (
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14 ${item.iconBg}`}>
                    <Icon size={22} strokeWidth={2.3} className={`${item.iconColor} sm:hidden`} />
                    <Icon size={26} strokeWidth={2.3} className={`hidden ${item.iconColor} sm:block`} />
                  </div>
                )}
              </div>
              <div className="mt-4 border-t border-gray-100" />
              <div className="flex items-center justify-between pt-3">
                <span className="text-xs font-medium text-gray-500 sm:text-[14px]">Today</span>
                {item.footerType === "trend" && (
                  <span className={`text-xs font-bold sm:text-[14px] ${(item as any).changeColor}`}>
                    {(item as any).change}
                  </span>
                )}
                {item.footerType === "status" && (
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${(item as any).statusDotColor}`} />
                    <span className="text-xs font-bold text-gray-700 sm:text-[14px]">
                      {(item as any).statusLabel}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
