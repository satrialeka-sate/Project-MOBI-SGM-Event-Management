"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Power,
  PowerOff,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import SearchBar from "@/components/SearchBar";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import { TableSkeleton, CardSkeleton } from "@/components/LoadingSkeleton";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/use-users";
import { usePermissions } from "@/hooks/use-permissions";
import { useRegions } from "@/hooks/use-regions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FormSection from "@/components/FormSection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "PERMITTER", label: "Permitter" },
  { value: "SPG", label: "SPG" },
];

const LEVEL_OPTIONS = [
  { value: "PO", label: "PO" },
  { value: "PIC", label: "PIC" },
  { value: "TEAM_LEADER", label: "Team Leader" },
  { value: "SPG", label: "SPG" },
  { value: "PERMITTER", label: "Permitter" },
];

const SCOPE_OPTIONS = [
  { value: "ALL", label: "All Regions" },
  { value: "REGION", label: "Own Region" },
];

interface UserFormData {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  level: string;
  scope: string;
  regionId: string;
  isActive: boolean;
}

const emptyForm: UserFormData = {
  name: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "PERMITTER",
  level: "PERMITTER",
  scope: "REGION",
  regionId: "",
  isActive: true,
};

export default function UsersPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { canCreateUser, canUpdateUser, canDeleteUser, canReadUser } = usePermissions();
  const { data: users, isLoading, isError, refetch } = useUsers();
  const { data: regions } = useRegions();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserFormData>(emptyForm);
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  if (authStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user) return null;

  const currentSession = session;
  const safeUsers = users ?? [];

  const filteredUsers = safeUsers.filter((u) =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.username ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function openCreateForm() {
    setEditId(null);
    setFormData({
      ...emptyForm,
      regionId: currentSession.user.regionId,
    });
    setFormError("");
    setFormOpen(true);
  }

  function openEditForm(user: NonNullable<typeof safeUsers>[number]) {
    setEditId(user.id);
    setFormData({
      name: user.name,
      username: user.username || "",
      email: user.email,
      password: "",
      confirmPassword: "",
      role: user.role,
      level: user.level,
      scope: user.scope,
      regionId: user.regionId,
      isActive: user.isActive,
    });
    setFormError("");
    setFormOpen(true);
  }

  async function handleSubmit() {
    setFormError("");

    // Validation
    if (!formData.name || !formData.username || !formData.email || !formData.role || !formData.level || !formData.scope || !formData.regionId) {
      setFormError("All fields are required");
      return;
    }

    if (!editId && formData.password.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }

    if (!editId && formData.password !== formData.confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    try {
      if (editId) {
        const updateData: Record<string, unknown> = {
          name: formData.name,
          username: formData.username,
          email: formData.email,
          role: formData.role,
          level: formData.level,
          scope: formData.scope,
          regionId: formData.regionId,
          isActive: formData.isActive,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await updateMutation.mutateAsync({ id: editId, data: updateData as any });
      } else {
        await createMutation.mutateAsync({
          name: formData.name,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          level: formData.level,
          scope: formData.scope,
          regionId: formData.regionId,
          isActive: formData.isActive,
        });
      }
      setFormOpen(false);
      refetch();
    } catch {
      // Error handled by mutation
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
    refetch();
  }

  async function handleToggleActive(userId: string, currentActive: boolean) {
    try {
      await updateMutation.mutateAsync({ id: userId, data: { isActive: !currentActive } });
      refetch();
    } catch {
      // Error handled by mutation
    }
  }

  async function handleResetPassword(userId: string) {
    const newPassword = "12345678";
    try {
      await updateMutation.mutateAsync({ id: userId, data: { password: newPassword } });
      refetch();
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-gray-900 md:text-2xl">Users</h1>
          {canCreateUser && (
            <Button onClick={openCreateForm} className="h-11 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          )}
        </div>

        <div className="mb-4">
          <SearchBar
            value={search}
            onChange={(v) => setSearch(v)}
            placeholder="Search name, email, or username..."
          />
        </div>

        {isLoading ? (
          <>
            <TableSkeleton />
            <CardSkeleton />
          </>
        ) : isError ? (
          <ErrorState message="Failed to load users" onRetry={() => refetch()} />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            title="No users found"
            description={search ? "Try a different search term." : "Create the first user to get started."}
            actionLabel={search ? undefined : (canCreateUser ? "Create User" : undefined)}
            actionHref={search ? undefined : undefined}
            actionOnClick={search ? undefined : openCreateForm}
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-xl border bg-white md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-500">
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Username</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Level</th>
                    <th className="px-6 py-3">Active</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.username || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.level}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
                            user.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                          }`}
                          title={user.isActive ? "Active" : "Inactive"}
                        >
                          {user.isActive ? (
                            <Power className="h-3.5 w-3.5" />
                          ) : (
                            <PowerOff className="h-3.5 w-3.5" />
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          {canUpdateUser && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleActive(user.id, user.isActive)}
                                title={user.isActive ? "Deactivate" : "Activate"}
                              >
                                {user.isActive ? (
                                  <PowerOff className="h-4 w-4 text-amber-500" />
                                ) : (
                                  <Power className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleResetPassword(user.id)}
                                title="Reset password to 12345678"
                              >
                                <Key className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditForm(user)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {canDeleteUser && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(user.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 md:hidden">
              {filteredUsers.map((user) => (
                <div key={user.id} className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{user.name}</span>
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
                        user.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {user.isActive ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-500">
                    <p><span className="font-medium text-gray-700">User:</span> {user.username || user.email}</p>
                    <p><span className="font-medium text-gray-700">Role:</span> {user.role} · {user.level}</p>
                  </div>
                  <div className="mt-3 flex gap-2 border-t pt-3">
                    {canUpdateUser && (
                      <>
                        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => openEditForm(user)}>
                          <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleToggleActive(user.id, user.isActive)}>
                          {user.isActive ? <PowerOff className="mr-1 h-3.5 w-3.5" /> : <Power className="mr-1 h-3.5 w-3.5" />}
                          {user.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </>
                    )}
                    {canDeleteUser && (
                      <Button variant="outline" size="sm" className="flex-1 text-xs text-red-500" onClick={() => setDeleteId(user.id)}>
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => !open && setFormOpen(false)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit User" : "Create User"}</DialogTitle>
            <DialogDescription>
              {editId ? "Update user details." : "Create a new user account."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-11"
                placeholder="Full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="h-11"
                placeholder="Username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-11"
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password {editId && "(leave blank to keep current)"}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="h-11 pr-10"
                  placeholder={editId ? "New password" : "Min 8 characters"}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!editId && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="h-11"
                  placeholder="Repeat password"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Role</Label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:border-sgm-red focus:ring-2 focus:ring-sgm-red-light"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Level</Label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:border-sgm-red focus:ring-2 focus:ring-sgm-red-light"
                >
                  {LEVEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Scope</Label>
                <select
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                  className="h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:border-sgm-red focus:ring-2 focus:ring-sgm-red-light"
                >
                  {SCOPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Region</Label>
                <select
                  value={formData.regionId}
                  onChange={(e) => setFormData({ ...formData, regionId: e.target.value })}
                  className="h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:border-sgm-red focus:ring-2 focus:ring-sgm-red-light"
                >
                  <option value="">Select Region</option>
                  {regions?.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-sgm-red focus:ring-sgm-red"
              />
              <Label htmlFor="isActive" className="text-sm font-normal">Active</Label>
            </div>

            {formError && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {formError}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure? This action cannot be undone. All associated data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
