"use client";

import Sates from "@/components/dash/dashstate";
import Del from "@/components/dash/today-delv";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Sates />
      <Del />
    </div>
  );
}
