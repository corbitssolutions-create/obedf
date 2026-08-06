"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import heroLogin from "../../public/heroes/bycli.jpeg";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

type Branch = {
  _id: string;
  code: string;
  name: string;
  status: "Active" | "Inactive";
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [branch, setBranch] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchesError, setBranchesError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    // Fetch active branches for the dropdown
    async function loadBranches() {
      setBranchesLoading(true);
      setBranchesError("");
      try {
        // Public endpoint — no token required, safe to call before login
        const res = await fetch(`${API_BASE}/api/branches/public`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || data.message || "Failed to load branches");
        }

        // Response shape: { success: true, branches: [...] }
        const list: Branch[] = data.branches || data.data || [];
        setBranches(list);

        // Preselect head office if present, else first branch
        const headOffice = list.find((b) => (b as any).isHeadOffice);
        setBranch((headOffice || list[0])?.name || "");
      } catch (err: any) {
        setBranchesError(err.message || "Could not load branches");
      } finally {
        setBranchesLoading(false);
      }
    }

    loadBranches();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password, branch }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Invalid credentials");
      }

      // Store auth session
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user || { email, fullName: "Admin User", role: "Super Admin" }));

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please check your credentials.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="ff-login min-h-screen w-full lg:grid lg:grid-cols-2 bg-[var(--ff-bg)]">
      {/* ---------- LEFT: HERO IMAGE PANEL ---------- */}
      <div className="relative h-[38vh] min-h-[260px] w-full overflow-hidden lg:h-screen lg:min-h-0">
        <Image
          src={heroLogin}
          alt="FreightFlow truck driving on the highway at sunset"
          fill
          priority
          className="object-cover"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
      </div>

      {/* ---------- RIGHT: FORM PANEL ---------- */}
      <div className="flex w-full items-center justify-center px-6 py-10 sm:px-10 lg:h-screen lg:px-16 xl:px-24">
        <div className="w-full max-w-sm">
          <h1 className="font-[var(--ff-font-display)] text-2xl font-bold text-[var(--ff-navy)] sm:text-[28px]">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-[var(--ff-slate)]">
            Sign in to your account
          </p>

          {errorMsg && (
            <div className="mt-4 rounded-lg bg-red-50 p-3.5 text-sm font-semibold text-red-600 border border-red-100">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-[var(--ff-navy)]"
              >
                Username 
                {/* (Email) */}
              </label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="ff-input"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-[var(--ff-navy)]"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="ff-input pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ff-slate)] hover:text-[var(--ff-navy)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ff-blue)] rounded"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="branch"
                className="text-sm font-medium text-[var(--ff-navy)]"
              >
                Branch
              </label>
              <div className="relative">
                <select
                  id="branch"
                  name="branch"
                  required
                  disabled={branchesLoading || !!branchesError}
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="ff-input appearance-none pr-9 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {branchesLoading && <option value="">Loading branches…</option>}
                  {!branchesLoading && branchesError && (
                    <option value="">Unable to load branches</option>
                  )}
                  {!branchesLoading &&
                    !branchesError &&
                    branches.map((b) => (
                      <option key={b._id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                </select>
                <ChevronDownIcon />
              </div>
              {branchesError && (
                <p className="text-xs text-red-600 mt-0.5">{branchesError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="ff-submit mt-2"
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        .ff-login {
          --ff-navy: #0e1c30;
          --ff-blue: #1d4ed8;
          --ff-green: #4caf3a;
          --ff-slate: #55617a;
          --ff-bg: #ffffff;
          --ff-border: #dbe1ea;
          --ff-font-display: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
          --ff-font-body: "Inter", ui-sans-serif, system-ui, sans-serif;
          font-family: var(--ff-font-body);
        }

        .ff-input {
          width: 100%;
          border: 1px solid var(--ff-border);
          border-radius: 10px;
          padding: 0.7rem 0.9rem;
          font-size: 0.9375rem;
          color: var(--ff-navy);
          background: #fff;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .ff-input::placeholder {
          color: #9aa4b5;
        }
        .ff-input:focus {
          outline: none;
          border-color: var(--ff-blue);
          box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.15);
        }

        .ff-submit {
          width: 100%;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #fff;
          background: var(--ff-blue);
          transition: background 0.15s ease, transform 0.05s ease;
        }
        .ff-submit:hover:not(:disabled) {
          background: #1a43b8;
        }
        .ff-submit:active:not(:disabled) {
          transform: translateY(1px);
        }
        .ff-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .ff-submit:focus-visible {
          outline: 2px solid #fff;
          outline-offset: -4px;
        }
      `}</style>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M6.6 6.6C4.2 8.1 2.5 10.4 2 12c1 3 4.5 7 10 7 1.7 0 3.2-.35 4.5-.95M9.9 4.24A9.7 9.7 0 0 1 12 4c5.5 0 9 4 10 7-.36 1.1-1.02 2.4-2 3.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ff-slate)]"
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}