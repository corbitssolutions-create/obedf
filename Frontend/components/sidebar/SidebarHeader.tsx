"use client";

import Link from "next/link";

interface Props {
  collapsed: boolean;
}

export default function SidebarHeader({ collapsed }: Props) {
  return (
    <div
      className={`flex h-[76px] shrink-0 items-center border-b border-white/[0.08] ${
        collapsed ? "justify-center px-1.5" : "px-3.5"
      }`}
    >
      <Link href="/dashboard" className="flex items-center justify-center w-full">
        {collapsed ? (
          /* Collapsed sidebar: larger, vibrant icon.png mark */
          <img
            src="/logo/icon.png"
            alt="Freight Flow"
            className="h-11 w-11 object-contain shrink-0 transition-transform duration-200 hover:scale-105"
          />
        ) : (
          /* Expanded sidebar: bold, prominent logo-s.png wordmark */
          <img
            src="/logo/logo-s.png"
            alt="Freight Flow"
            className="h-[52px] max-w-[220px] object-contain transition-transform duration-200 hover:scale-[1.02]"
          />
        )}
      </Link>
    </div>
  );
}


