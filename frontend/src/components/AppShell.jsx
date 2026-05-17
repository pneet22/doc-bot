import {
  ClipboardList,
  FileArchive,
  FilePlus2,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  ShieldCheck
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

const baseLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/chat", label: "Chat", icon: MessageSquareText }
];

const adminLinks = [
  { to: "/documents/upload", label: "Upload", icon: FilePlus2 },
  { to: "/audit-logs", label: "Audit Logs", icon: ClipboardList }
];

export default function AppShell() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const links = isAdmin ? [...baseLinks, ...adminLinks] : baseLinks;

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-slate-100 text-ink">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-slate-200 bg-white px-5 py-6 lg:block">
        <NavLink to="/dashboard" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-vault text-white">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-lg font-semibold">TrustVault AI</p>
            <p className="text-sm text-slate-500">Secure document RAG</p>
          </div>
        </NavLink>

        <nav className="mt-10 space-y-2">
          {links.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        <div className="absolute bottom-6 left-5 right-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-vault">
              <FileArchive size={20} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.username}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500">{user?.role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <NavLink to="/dashboard" className="flex items-center gap-2 font-semibold">
            <ShieldCheck size={22} className="text-vault" />
            TrustVault AI
          </NavLink>
          <button type="button" onClick={handleLogout} className="rounded-lg p-2 text-slate-600">
            <LogOut size={20} />
          </button>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto">
          {links.map((item) => (
            <MobileNavItem key={item.to} {...item} />
          ))}
        </nav>
      </header>

      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${
          isActive ? "bg-vault text-white" : "text-slate-600 hover:bg-slate-100 hover:text-ink"
        }`
      }
    >
      <Icon size={19} />
      {label}
    </NavLink>
  );
}

function MobileNavItem({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
          isActive ? "bg-vault text-white" : "bg-slate-100 text-slate-700"
        }`
      }
    >
      <Icon size={16} />
      {label}
    </NavLink>
  );
}
