"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserForm from "@/components/UserForm";
import UserTable from "@/components/UserTable";
import { useAuth } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/utils";
import { addUser, deleteUser, deleteUsers, getAllUsers, updateUser } from "@/services/user.service";
import { AppUser, UserFormInput, UserRole } from "@/types";

const roles: Array<UserRole | "all"> = ["all", "customer", "rdc", "logistics", "ho", "admin"];

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [formResetKey, setFormResetKey] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setLoading(true);
      setError("");
      setUsers(await getAllUsers());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    setSelectedUserIds((current) => current.filter((userId) => users.some((userItem) => userItem.id === userId)));
  }, [users]);

  const filteredUsers = useMemo(
    () =>
      users.filter((item) => {
        const matchesSearch = `${item.fullName} ${item.email}`
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesRole = roleFilter === "all" || item.role === roleFilter;
        return matchesSearch && matchesRole;
      }),
    [roleFilter, search, users],
  );
  const canBulkDelete = user?.role === "admin";
  const selectableVisibleIds = filteredUsers
    .filter((item) => item.id !== user?.id)
    .map((item) => item.id);
  const selectedVisibleCount = selectableVisibleIds.filter((userId) =>
    selectedUserIds.includes(userId),
  ).length;
  const allVisibleSelected =
    selectableVisibleIds.length > 0 && selectedVisibleCount === selectableVisibleIds.length;

  async function handleSubmit(values: UserFormInput) {
    try {
      setSaving(true);
      setError("");

      if (selectedUser) {
        await updateUser(selectedUser.id, values);
        setMessage(`Updated ${values.fullName} successfully.`);
      } else {
        await addUser(values);
        setMessage(`Created ${values.fullName} successfully.`);
        setFormResetKey((current) => current + 1);
      }

      setSelectedUser(null);
      await refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save user.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(target: AppUser) {
    if (target.id === user?.id) {
      setError("You cannot delete the currently signed-in user.");
      return;
    }

    if (!window.confirm(`Delete ${target.fullName}? This removes the Firestore user record.`)) {
      return;
    }

    try {
      setDeletingId(target.id);
      setError("");
      await deleteUser(target.id);
      setMessage(
        `Deleted ${target.fullName} from Firestore. Firebase Authentication deletion requires a secure backend admin process.`,
      );
      if (selectedUser?.id === target.id) {
        setSelectedUser(null);
      }
      setSelectedUserIds((current) => current.filter((userId) => userId !== target.id));
      await refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete user.");
    } finally {
      setDeletingId("");
    }
  }

  async function handleBulkDelete() {
    if (!canBulkDelete) {
      return;
    }

    const deletableIds = selectedUserIds.filter((userId) => userId !== user?.id);
    if (!deletableIds.length) {
      setError("Select at least one user before using bulk delete.");
      return;
    }

    if (
      !window.confirm(
        `Delete ${deletableIds.length} selected user record(s)? This removes the Firestore user documents only.`,
      )
    ) {
      return;
    }

    try {
      setBulkDeleting(true);
      setError("");
      await deleteUsers(deletableIds);
      setSelectedUserIds([]);
      if (selectedUser && deletableIds.includes(selectedUser.id)) {
        setSelectedUser(null);
      }
      setMessage(
        `Deleted ${deletableIds.length} selected user record(s) from Firestore. Firebase Authentication deletion still requires a secure backend admin process.`,
      );
      await refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete selected users.");
    } finally {
      setBulkDeleting(false);
    }
  }

  function toggleUserSelection(userId: string) {
    if (userId === user?.id) {
      return;
    }

    setSelectedUserIds((current) =>
      current.includes(userId) ? current.filter((item) => item !== userId) : [...current, userId],
    );
  }

  function toggleAllVisibleSelection() {
    if (!canBulkDelete) {
      return;
    }

    setSelectedUserIds((current) => {
      if (allVisibleSelected) {
        return current.filter((userId) => !selectableVisibleIds.includes(userId));
      }

      return [...new Set([...current, ...selectableVisibleIds])];
    });
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "ho"]}>
      <DashboardShell
        title="User Management"
        description="Create, update, search, and manage user records for customers and internal staff."
      >
        <section className="surface-soft rounded-[2rem] p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="page-eyebrow">User Directory</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Manage platform users from one workspace</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Add new accounts, edit user records, and control role assignments across the system.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedUser(null);
                setFormResetKey((current) => current + 1);
              }}
              className="btn-primary"
            >
              <Plus size={16} />
              Add User
            </button>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px]">
            <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email"
                className="w-full bg-transparent px-3 py-4 text-slate-900 outline-none"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as UserRole | "all")}
              className="select-field"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role === "all" ? "All Roles" : ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </div>

          {canBulkDelete ? (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 ring-1 ring-orange-200">
                {selectedUserIds.length} selected
              </span>
              <button
                type="button"
                onClick={() => setSelectedUserIds([])}
                disabled={selectedUserIds.length === 0}
                className="btn-outline !px-4 !py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X size={15} />
                Clear Selection
              </button>
              <button
                type="button"
                onClick={() => void handleBulkDelete()}
                disabled={selectedUserIds.length === 0 || bulkDeleting}
                className="btn-danger !px-4 !py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={15} />
                {bulkDeleting ? "Deleting..." : "Delete Selected"}
              </button>
            </div>
          ) : null}
        </section>

        {message ? <p className="notice-success">{message}</p> : null}
        {error ? <p className="notice-error">{error}</p> : null}
        <p className="notice-info">
          User deletion removes the Firestore document. Full Firebase Authentication deletion is typically handled through a secure admin backend.
        </p>

        {loading ? (
          <LoadingState label="Loading users..." />
        ) : (
          <div className="grid items-start gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <UserForm
              mode={selectedUser ? "edit" : "create"}
              resetSignal={formResetKey}
              initialValues={
                selectedUser
                  ? {
                      id: selectedUser.id,
                      fullName: selectedUser.fullName,
                      email: selectedUser.email,
                      role: selectedUser.role,
                      phone: selectedUser.phone ?? "",
                      address: selectedUser.address ?? "",
                      avatar64: selectedUser.avatar64 ?? "",
                      rdcId: selectedUser.rdcId,
                    }
                  : undefined
              }
              loading={saving}
              onCancel={
                selectedUser
                  ? () => {
                      setSelectedUser(null);
                      setFormResetKey((current) => current + 1);
                    }
                  : undefined
              }
              onSubmit={handleSubmit}
            />

            {filteredUsers.length === 0 ? (
              <EmptyState
                title="No users found"
                description="Try changing the search term or role filter, or create a new user from the form."
              />
            ) : (
              <UserTable
                users={filteredUsers}
                currentUserId={user?.id}
                deletingId={deletingId}
                selectable={canBulkDelete}
                selectedUserIds={selectedUserIds}
                onToggleUserSelection={toggleUserSelection}
                onToggleAllSelection={toggleAllVisibleSelection}
                onEdit={setSelectedUser}
                onDelete={(target) => void handleDelete(target)}
              />
            )}
          </div>
        )}
      </DashboardShell>
    </ProtectedRoute>
  );
}
