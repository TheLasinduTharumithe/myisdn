"use client";

import { ReactNode, useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/lib/auth";

interface DashboardShellProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  navbarSticky?: boolean;
  children: ReactNode;
}

export default function DashboardShell({
  title,
  description,
  actions,
  navbarSticky = true,
  children,
}: DashboardShellProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <div className="relative min-h-screen p-3 sm:p-4 lg:p-6">
      <div className="mx-auto grid max-w-[1480px] gap-5 lg:grid-cols-[290px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <Sidebar role={user.role} />
        </div>

        {open ? (
          <div className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden">
            <div className="h-full max-w-xs p-4">
              <Sidebar role={user.role} onNavigate={() => setOpen(false)} />
            </div>
            <button
              type="button"
              className="absolute inset-0 -z-10"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            />
          </div>
        ) : null}

        <main className="min-w-0 space-y-4">
          <Navbar onMenuClick={() => setOpen(true)} sticky={navbarSticky} />
          <section className="admin-hero p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="page-eyebrow">Workspace</p>
                <h1 className="page-title mt-3">{title}</h1>
                {description ? <p className="page-subtitle mt-3 max-w-3xl">{description}</p> : null}
              </div>
              {actions ? (
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-start [&>*]:w-full sm:[&>*]:w-auto">
                  {actions}
                </div>
              ) : null}
            </div>
          </section>
          {children}
        </main>
      </div>
    </div>
  );
}
