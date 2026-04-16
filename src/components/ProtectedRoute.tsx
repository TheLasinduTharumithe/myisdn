"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import LoadingState from "@/components/LoadingState";
import { useAuth } from "@/lib/auth";
import { getDashboardPath } from "@/lib/utils";
import { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(getDashboardPath(user.role));
    }
  }, [allowedRoles, loading, pathname, router, user]);

  if (loading || !user) {
    return <LoadingState label="Checking your access..." />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <LoadingState label="Redirecting to your dashboard..." />;
  }

  return <>{children}</>;
}
