"use client";

import Link from "next/link";
import { PackageCheck, ClipboardCheck, Truck, ArrowRight, Layers } from "lucide-react";

export default function CollectionsPage() {
  const collectionModules = [
    {
      title: "Collection Manifest",
      description: "Create and manage collection manifests for scheduled customer pickup runs.",
      href: "/operations/collections/collection-manifest",
      icon: PackageCheck,
      color: "bg-blue-500",
      badge: "Manifest Creation",
    },
    {
      title: "Collection Manifest Debrief",
      description: "Scan waybills & parcels to debrief and reconcile completed pickup runs.",
      href: "/operations/collections/collection-debrief",
      icon: ClipboardCheck,
      color: "bg-emerald-500",
      badge: "Debrief & Audit",
    },
    {
      title: "Adhoc Collection",
      description: "Schedule, dispatch, and track unscheduled or urgent customer pickup requests.",
      href: "/operations/collections/adhoc-collection",
      icon: Truck,
      color: "bg-amber-500",
      badge: "Adhoc Pickups",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/60 p-6 font-sans">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Collections Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Streamline customer pickups, collection manifests, debriefs, and adhoc requests.
            </p>
          </div>
        </div>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {collectionModules.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between hover:border-blue-300"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${item.color} text-white flex items-center justify-center shadow-sm`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                Open {item.title} <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
