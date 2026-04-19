import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Pill, ArrowLeftRight, History,
  Users, Settings, LogOut, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/medicines", label: "Medicines", icon: Pill },
  { to: "/stock-entry", label: "Stock Entry", icon: ArrowLeftRight },
  { to: "/history", label: "Stock History", icon: History },
  { to: "/users", label: "Users", icon: Users, adminOnly: true },
  { to: "/settings", label: "Settings", icon: Settings },
];

const AppSidebar = () => {
  const { user, logout } = useAuth();
  const { getLowStockMedicines } = useData();
  const location = useLocation();
  const lowStockCount = getLowStockMedicines().length;

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex flex-col items-center gap-3 px-6 py-6 border-b border-sidebar-border">
        <div className="flex h-20 w-20 items-center justify-center">
          <img src="/siddha_hospital_logo.png" alt="Siddha Hospital" className="h-full w-full object-contain" />
        </div>
        <div className="text-center w-full">
          <h1 className="text-sm font-bold tracking-tight leading-tight">Sri Sairam Siddha</h1>
          <h1 className="text-sm font-bold tracking-tight leading-tight">Medical College &</h1>
          <h1 className="text-sm font-bold tracking-tight leading-tight">Research Centre</h1>
          <p className="text-xs opacity-50 mt-1">Stock Management System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          if (item.adminOnly && user?.role !== "admin") return null;
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <div className="mx-3 mb-3 rounded-lg bg-warning/20 p-3 text-warning-foreground">
          <div className="flex items-center gap-2 text-xs font-semibold text-warning">
            <AlertTriangle className="h-4 w-4" />
            {lowStockCount} Low Stock Alert{lowStockCount > 1 ? "s" : ""}
          </div>
        </div>
      )}

      {/* User footer */}
      <div className="border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{user?.username}</p>
            <p className="text-xs capitalize opacity-60">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg p-2 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
