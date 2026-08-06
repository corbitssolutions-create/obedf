"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import SidebarHeader from "./SidebarHeader";
import SidebarItem from "./SidebarItem";
import SidebarGroup from "./SidebarGroup";
import menu from "@/config/menu";

interface Props {
  collapsed: boolean;
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({ collapsed, mobileOpen, setMobileOpen }: Props) {
  const router = useRouter();

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <>
      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ── Sidebar panel ── */}
      <aside
        className={`
          sidebar-scroll
          fixed left-0 top-0 z-50 flex h-screen flex-col
          bg-gradient-to-b from-[#060D24] to-[#0B1535]
          text-white shadow-2xl
          transition-all duration-300 ease-in-out
          overflow-y-auto overflow-x-hidden
          ${collapsed ? "lg:w-[72px]" : "lg:w-64"}
          w-72
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <SidebarHeader collapsed={collapsed} />

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-3 py-3">
          {menu.map((item) =>
            item.href ? (
              /* Top-level leaf: Dashboard, Reports */
              <SidebarItem
                key={item.href}
                title={item.title}
                href={item.href}
                depth={0}
                icon={item.icon}
                collapsed={collapsed}
                onNavigate={closeMobile}
              />
            ) : (
              /* Expandable group */
              <SidebarGroup
                key={item.title}
                item={item}
                depth={0}
                collapsed={collapsed}
                onNavigate={closeMobile}
                storageKey={item.title}
              />
            )
          )}
        </nav>

        {/* Logout */}
        <div className="shrink-0 border-t border-white/[0.07] p-3">
          <button
            onClick={handleLogout}
            className={`
              group relative flex h-10 w-full items-center rounded-lg
              text-red-400/80 transition-all duration-200
              hover:bg-red-500/10 hover:text-red-400
              ${collapsed ? "justify-center px-0" : "gap-3 px-3.5"}
            `}
          >
            <LogOut size={17} strokeWidth={2} className="shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}

            {/* Collapsed tooltip */}
            {collapsed && (
              <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg bg-[#0A1230] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 lg:block">
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
