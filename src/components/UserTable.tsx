"use client";

import { Edit3, Trash2 } from "lucide-react";
import { getAvatarPreview } from "@/lib/avatar64";
import { cn, formatDate, getRdcLabel, ROLE_LABELS } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";
import { AppUser } from "@/types";

interface UserTableProps {
  users: AppUser[];
  currentUserId?: string;
  deletingId?: string;
  selectable?: boolean;
  selectedUserIds?: string[];
  onToggleUserSelection?: (userId: string) => void;
  onToggleAllSelection?: () => void;
  onEdit: (user: AppUser) => void;
  onDelete: (user: AppUser) => void;
}

export default function UserTable({
  users,
  currentUserId,
  deletingId,
  selectable = false,
  selectedUserIds = [],
  onToggleUserSelection,
  onToggleAllSelection,
  onEdit,
  onDelete,
}: UserTableProps) {
  const selectableUserIds = users
    .filter((user) => user.id !== currentUserId)
    .map((user) => user.id);
  const selectedVisibleCount = selectableUserIds.filter((userId) => selectedUserIds.includes(userId)).length;
  const allVisibleSelected = selectableUserIds.length > 0 && selectedVisibleCount === selectableUserIds.length;
  const partiallySelected = selectedVisibleCount > 0 && !allVisibleSelected;

  return (
    <div className="table-shell self-start">
      <div className="space-y-3 p-4 md:hidden">
        {users.map((user) => {
          const avatar = getAvatarPreview(user.avatar64, user.fullName);
          const isCurrentUser = currentUserId === user.id;
          const isSelected = selectedUserIds.includes(user.id);

          return (
            <article
              key={user.id}
              className={cn(
                "rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm",
                isSelected && "border-orange-200 bg-orange-50/70",
              )}
            >
              <div className="flex items-start gap-3">
                {selectable ? (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isCurrentUser}
                    onChange={() => onToggleUserSelection?.(user.id)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#f57224] focus:ring-[#f57224]"
                    aria-label={`Select ${user.fullName}`}
                  />
                ) : null}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {avatar.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatar.src}
                      alt={user.fullName}
                      className="h-11 w-11 rounded-full object-cover ring-2 ring-orange-100"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-[#f57224]">
                      {avatar.fallback}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{user.fullName}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge label={ROLE_LABELS[user.role]} />
                {isCurrentUser ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    Current user
                  </span>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Phone</p>
                  <p className="mt-1 text-slate-900">{user.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">RDC</p>
                  <p className="mt-1 text-slate-900">{getRdcLabel(user.rdcId)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Created</p>
                  <p className="mt-1 text-slate-900">{formatDate(user.createdAt)}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={() => onEdit(user)} className="btn-outline w-full justify-center !px-3 !py-2 !text-xs">
                  <Edit3 size={14} />
                  Edit
                </button>
                <button
                  type="button"
                  disabled={Boolean(deletingId) || isCurrentUser}
                  onClick={() => onDelete(user)}
                  className="btn-danger w-full justify-center !px-3 !py-2 !text-xs disabled:opacity-60"
                  title={isCurrentUser ? "You cannot delete the currently signed-in user." : "Delete user"}
                >
                  <Trash2 size={14} />
                  {deletingId === user.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              {selectable ? (
                <th className="px-5 py-4 font-medium">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    ref={(element) => {
                      if (element) {
                        element.indeterminate = partiallySelected;
                      }
                    }}
                    disabled={selectableUserIds.length === 0}
                    onChange={() => onToggleAllSelection?.()}
                    className="h-4 w-4 rounded border-slate-300 text-[#f57224] focus:ring-[#f57224]"
                    aria-label="Select all visible users"
                  />
                </th>
              ) : null}
              <th className="px-5 py-4 font-medium">User</th>
              <th className="px-5 py-4 font-medium">Role</th>
              <th className="px-5 py-4 font-medium">Phone</th>
              <th className="px-5 py-4 font-medium">RDC</th>
              <th className="px-5 py-4 font-medium">Created</th>
              <th className="px-5 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const avatar = getAvatarPreview(user.avatar64, user.fullName);
              const isCurrentUser = currentUserId === user.id;
              const isSelected = selectedUserIds.includes(user.id);

              return (
                <tr
                  key={user.id}
                  className={cn(
                    "border-b border-slate-100 text-slate-700 last:border-transparent",
                    isSelected && "bg-orange-50/70",
                  )}
                >
                  {selectable ? (
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isCurrentUser}
                        onChange={() => onToggleUserSelection?.(user.id)}
                        className="h-4 w-4 rounded border-slate-300 text-[#f57224] focus:ring-[#f57224]"
                        aria-label={`Select ${user.fullName}`}
                      />
                    </td>
                  ) : null}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {avatar.src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatar.src}
                          alt={user.fullName}
                          className="h-11 w-11 rounded-full object-cover ring-2 ring-orange-100"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-[#f57224]">
                          {avatar.fallback}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">{user.fullName}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge label={ROLE_LABELS[user.role]} />
                  </td>
                  <td className="px-5 py-4">{user.phone || "-"}</td>
                  <td className="px-5 py-4">{getRdcLabel(user.rdcId)}</td>
                  <td className="px-5 py-4">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => onEdit(user)} className="btn-outline !px-3 !py-2 !text-xs">
                        <Edit3 size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(deletingId) || isCurrentUser}
                        onClick={() => onDelete(user)}
                        className="btn-danger !px-3 !py-2 !text-xs disabled:opacity-60"
                        title={isCurrentUser ? "You cannot delete the currently signed-in user." : "Delete user"}
                      >
                        <Trash2 size={14} />
                        {deletingId === user.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
