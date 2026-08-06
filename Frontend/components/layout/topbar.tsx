"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Bell, Menu, ChevronDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Topbar({
  collapsed,
  setCollapsed,
  setMobileOpen,
}: Props) {
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        // ignore
      }
    }

    // Close dropdown on click outside
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const getInitials = (name: string) => {
    if (!name) return "AD";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="h-16 bg-white shadow-sm px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 relative z-20">
      
      {/* Left side: Hamburger and Mobile Logo */}
      <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden shrink-0">
        <button
          onClick={() => {
            if (window.innerWidth < 1024) {
              setMobileOpen(true);
            } else {
              setCollapsed(!collapsed);
            }
          }}
          className="p-2 rounded-lg hover:bg-gray-100 transition shrink-0"
          aria-label="Toggle Menu"
        >
          <Menu size={22} className="text-gray-700" />
        </button>

        {/* Mobile-only logo */}
        <div className="lg:hidden flex items-center gap-2 shrink-0 select-none">
          <Image 
            src="/logo/icon.png" 
            alt="FreightFlow" 
            width={32} 
            height={32} 
            priority
            className="object-contain"
          />
          <span className="font-['Space_Grotesk'] font-bold text-gray-900 text-sm tracking-tight sm:text-base">
            FreightFlow
          </span>
        </div>
      </div>

      {/* Right side: Notifications & User profile */}
      <div className="flex items-center gap-3 sm:gap-5 shrink-0">
        
        <button className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition shrink-0">
          <Bell size={19} />
        </button>

        {/* User profile dropdown container */}
        <div className="relative" ref={dropdownRef}>
          <div 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition shrink-0 select-none"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm shadow-blue-500/10">
              {user ? getInitials(user.fullName) : "AD"}
            </div>

            <span className="font-medium text-sm text-gray-800 hidden sm:inline-block truncate max-w-[120px]">
              {user ? user.fullName : "Admin User"}
            </span>

            <ChevronDown size={16} className="text-gray-500 shrink-0 transition-transform duration-200" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
          </div>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg border border-gray-100 py-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Signed in as</p>
                <p className="text-sm font-bold text-gray-800 truncate mt-0.5">{user?.fullName || "Admin User"}</p>
                <p className="text-xs text-gray-500 truncate">{user?.role || "Super Admin"}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 font-medium flex items-center gap-2 transition"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>

      </div>

    </header>
  );
}
