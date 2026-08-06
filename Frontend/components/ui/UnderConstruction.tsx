import { HardHat } from "lucide-react";

interface Props {
  module: string;
}

export default function UnderConstruction({ module }: Props) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-blue-100 bg-white px-10 py-12 text-center shadow-lg">
        {/* Icon */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600">
          <HardHat className="h-8 w-8 text-white" strokeWidth={1.8} />
        </div>

        {/* Heading */}
        <h2 className="mb-1 text-xl font-bold text-gray-900">Under Construction</h2>
        <p className="mb-6 text-sm text-gray-500">
          This module is currently under development.
        </p>

        {/* Detail rows */}
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50 text-left">
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Module
            </span>
            <span className="text-sm font-semibold text-gray-800">{module}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Status
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Coming Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
