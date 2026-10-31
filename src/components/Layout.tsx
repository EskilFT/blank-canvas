import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Users, Calendar, Clock, Home, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const adminNav = [
  { to: "/", label: "Oversikt", icon: Home },
  { to: "/ansatte", label: "Ansatte", icon: Users },
  { to: "/vakter", label: "Vaktplan", icon: Calendar },
  { to: "/fravaer", label: "Fravær", icon: Clock },
  { to: "/innstillinger", label: "Innstillinger", icon: Settings },
];

const employeeNav = [
  { to: "/", label: "Oversikt", icon: Home },
  { to: "/fravaer", label: "Mitt fravær", icon: Clock },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, signOut } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) navigate({ to: "/login" });
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.975 0.008 75)" }}>
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-40" />
      </div>
    );
  }

  if (!user) return null;

  const nav = adminNav;

  return (
    <div className="flex min-h-screen" style={{ background: "oklch(0.975 0.008 75)" }}>
      <aside className="w-52 bg-white border-r border-[oklch(0.9_0.008_75)] flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-[oklch(0.9_0.008_75)]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[oklch(0.16_0.01_60)] flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight" style={{ color: "oklch(0.16 0.01 60)" }}>ShiftPlan</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-[oklch(0.95_0.01_75)] font-medium text-[oklch(0.16_0.01_60)]"
                    : "text-[oklch(0.48_0.01_60)] hover:bg-[oklch(0.97_0.008_75)] hover:text-[oklch(0.16_0.01_60)]"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-[oklch(0.9_0.008_75)]">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs truncate" style={{ color: "oklch(0.48 0.01 60)" }}>{user.email}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: "oklch(0.16 0.01 60)" }}>{isAdmin ? "Administrator" : "Ansatt"}</p>
          </div>
          <button
            onClick={async () => { await signOut(); navigate({ to: "/login" }); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors"
            style={{ color: "oklch(0.48 0.01 60)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.97 0.008 75)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <LogOut className="w-3.5 h-3.5" /> Logg ut
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
