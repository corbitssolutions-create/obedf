"use client";

import Link from "next/link";

interface Props {
  collapsed: boolean;
}

export default function SidebarHeader({ collapsed }: Props) {
  return (
    <div
      className={`flex h-[70px] shrink-0 items-center border-b border-white/[0.07] ${
        collapsed ? "justify-center px-2" : "px-4"
      }`}
    >
      <Link href="/dashboard" className="flex items-center justify-center">
        {collapsed ? (
          /* Collapsed sidebar: show icon.png */
          <img
            src="/logo/icon.png"
            alt="Freight Flow"
            className="h-9 w-9 object-contain shrink-0"
          />
        ) : (
          /* Expanded sidebar: show logo-s.png */
          <img
            src="/logo/logo-s.png"
            alt="Freight Flow"
            className="h-10 max-w-[200px] object-contain"
          />
        )}
      </Link>
    </div>
  );
}

