"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Camera, ChevronDown, LogOut, Menu, Search, ShoppingCart, Store } from "lucide-react";
import { IMAGE_INPUT_ACCEPT, fileToBase64, getAvatarPreview, getImageValidationText } from "@/lib/avatar64";
import { useAuth } from "@/lib/auth";
import { ROLE_LABELS, getDashboardPath } from "@/lib/utils";
import { updateUserAvatar } from "@/services/user.service";
import StatusBadge from "@/components/StatusBadge";

interface NavbarProps {
  onMenuClick?: () => void;
  sticky?: boolean;
}

export default function Navbar({ onMenuClick, sticky = true }: NavbarProps) {
  const { user, logoutUser, refreshUserProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [keyword, setKeyword] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const avatar = getAvatarPreview(user?.avatar64, user?.fullName);
  const cartHref = user?.role === "customer" ? "/customer/cart" : getDashboardPath(user?.role ?? "customer");
  const searchTarget = user ? cartHref : "/login";

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (!menuOpen) {
      return;
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  async function handleAvatarFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user) {
      return;
    }

    try {
      setAvatarError("");
      setAvatarLoading(true);
      const avatar64 = await fileToBase64(file);
      await updateUserAvatar(user.id, avatar64);
      await refreshUserProfile(user.id);
      setMenuOpen(false);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Unable to update profile image.");
    } finally {
      setAvatarLoading(false);
      event.target.value = "";
    }
  }

  return (
    <header
      className={`${sticky ? "sticky top-0 z-40" : "relative z-10"} rounded-[1.5rem] border border-slate-200 bg-white/95 px-3 py-3 shadow-sm backdrop-blur sm:px-4 lg:px-6`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {user ? (
            <button
              type="button"
              onClick={onMenuClick}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 lg:hidden"
            >
              <Menu size={20} />
            </button>
          ) : null}
          <Link href={user ? getDashboardPath(user.role) : "/"} className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-[#f57224] to-[#ff8a00] text-white shadow-sm sm:h-11 sm:w-11">
              <Store size={20} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">ISDN</p>
              <p className="hidden text-xs font-medium text-slate-500 sm:block">
                IslandLink Sales Distribution Network
              </p>
            </div>
          </Link>
        </div>

        <div className="hidden flex-1 px-4 lg:block">
          <div className="mx-auto flex max-w-2xl items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 shadow-sm">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Search products, orders, stock updates..."
              className="w-full bg-transparent px-3 py-3.5 text-sm text-slate-700 outline-none"
            />
            <button type="button" className="btn-primary px-4 py-2.5 text-sm" onClick={() => router.push(searchTarget)}>
              {user ? "Search" : "Browse"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 sm:inline-flex"
          >
            <Bell size={18} />
          </button>
          {user?.role === "customer" ? (
            <Link
              href="/customer/cart"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-orange-200 hover:text-[#f57224] sm:h-11 sm:w-11"
            >
              <ShoppingCart size={18} />
            </Link>
          ) : null}
          {user ? (
            <div className="relative" ref={menuRef}>
              <input
                ref={fileInputRef}
                type="file"
                accept={IMAGE_INPUT_ACCEPT}
                className="hidden"
                onChange={handleAvatarFileChange}
              />
              <button
                type="button"
                onClick={() => {
                  setAvatarError("");
                  setMenuOpen((current) => !current);
                }}
                className="flex max-w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-2.5 py-2 shadow-sm transition hover:border-orange-200 sm:gap-3 sm:px-3"
              >
                {avatar.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar.src} alt={user.fullName} className="h-9 w-9 rounded-full object-cover ring-2 ring-orange-100 sm:h-10 sm:w-10" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-[#f57224] sm:h-10 sm:w-10">
                    {avatar.fallback}
                  </div>
                )}
                <div className="hidden min-w-0 text-left sm:block">
                  <p className="truncate text-sm font-bold text-slate-900">{user.fullName}</p>
                  <StatusBadge label={ROLE_LABELS[user.role]} />
                </div>
                <ChevronDown size={16} className="hidden text-slate-400 sm:block" />
              </button>

              {menuOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.85rem)] z-50 w-[min(20rem,calc(100vw-2rem))] rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
                  <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                    {avatar.src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatar.src} alt={user.fullName} className="h-14 w-14 rounded-full object-cover ring-2 ring-orange-100" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-base font-bold text-[#f57224]">
                        {avatar.fallback}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-slate-900">{user.fullName}</p>
                      <p className="truncate text-sm text-slate-500">{user.email}</p>
                      <div className="mt-2">
                        <StatusBadge label={ROLE_LABELS[user.role]} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Link
                      href={getDashboardPath(user.role)}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-[#f57224]"
                    >
                      View Profile
                    </Link>
                    <button
                      type="button"
                      disabled={avatarLoading}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-[#f57224] disabled:opacity-60"
                    >
                      <span className="flex items-center gap-2">
                        <Camera size={16} />
                        {avatarLoading ? "Updating image..." : "Update Profile Image"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await logoutUser();
                        router.push("/login");
                      }}
                      className="flex w-full items-center justify-between rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                    >
                      <span className="flex items-center gap-2">
                        <LogOut size={16} />
                        Logout
                      </span>
                    </button>
                  </div>

                  {avatarError ? <p className="notice-error mt-4">{avatarError}</p> : null}
                  <p className="mt-4 text-xs leading-6 text-slate-500">{getImageValidationText()}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/customer/products" className="btn-secondary px-4 py-2.5 text-sm">
                Browse
              </Link>
              <Link href="/login" className="btn-outline px-4 py-2.5 text-sm">
                Login
              </Link>
              <Link href="/register" className="btn-primary px-4 py-2.5 text-sm">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 lg:hidden">
        <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 shadow-sm">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search"
            className="w-full bg-transparent px-3 py-3 text-sm text-slate-700 outline-none"
          />
        </div>
      </div>
    </header>
  );
}
