"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Power,
  PowerOff,

  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import SearchBar from "@/components/SearchBar";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import { TableSkeleton, CardSkeleton } from "@/components/LoadingSkeleton";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/use-users";
import api from "@/lib/axios";
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
import type { UserItem } from "@/lib/api/user";
import { UserStatus } from "@/constants/prisma-enums";
import { formatBusinessRole } from "@/lib/format-business-role";

/**
 * Level configuration defining all available Level options in the form.
 * Each entry specifies:
 * - value: the display value used in the form
 * - label: user-facing label
 * - dbLevel: the level value stored in database (mapped to Prisma UserLevel enum)
 * - role: authorization role automatically assigned
 * - scope: fixed scope for this level (always auto-set, never manual)
 *   "ALL" = All Regions (region not required)
 *   "REGION" = Own Region (region required)
 */
const LEVEL_CONFIG = [
  // ── Supervisor group (Role: SUPERVISOR) ──
  // SGM, Starlight, PO: ALL REGION (locked)
  { value: "SGM", label: "SGM", dbLevel: "PO", role: "SUPERVISOR", scope: "ALL" as const },
  { value: "STARLIGHT", label: "Starlight", dbLevel: "PIC", role: "SUPERVISOR", scope: "ALL" as const },
  { value: "PO", label: "PO", dbLevel: "PO", role: "SUPERVISOR", scope: "ALL" as const },
  // PIC: OWN REGION (locked)
  { value: "PIC", label: "PIC", dbLevel: "PIC", role: "SUPERVISOR", scope: "REGION" as const },

  // ── Admin group (Role: ADMIN) ──
  { value: "ADMIN_PO", label: "Admin PO", dbLevel: "PO", role: "ADMIN", scope: "ALL" as const },
  { value: "ADMIN_PIC", label: "Admin PIC", dbLevel: "PIC", role: "ADMIN", scope: "REGION" as const },

  // ── Permitter group (Role: PERMITTER) ──
  { value: "PERMITTER", label: "Permitter", dbLevel: "PERMITTER", role: "PERMITTER", scope: "REGION" as const },

  // ── SPG group (Role: SPG) ──
  { value: "SPG", label: "SPG", dbLevel: "SPG", role: "SPG", scope: "REGION" as const },
  { value: "TL", label: "Team Leader", dbLevel: "TEAM_LEADER", role: "SPG", scope: "REGION" as const },
];

/** Reverse map: DB (role, level, scope) → form level display value */
function findFormLevelByDbLevel(dbLevel: string, role?: string, scope?: string): string {
  // 1. Try exact value match first (e.g., "PIC" → "PIC")
  const exactMatch = LEVEL_CONFIG.find((l) => l.value === dbLevel);
  if (exactMatch) return exactMatch.value;

  // 2. Try matching by (role, dbLevel, scope) for disambiguation
  if (role && scope) {
    const roleScopeMatch = LEVEL_CONFIG.find(
      (l) => l.role === role && l.dbLevel === dbLevel && l.scope === scope
    );
    if (roleScopeMatch) return roleScopeMatch.value;
  }

  // 3. Fallback to first dbLevel match
  const dbMatch = LEVEL_CONFIG.find((l) => l.dbLevel === dbLevel);
  return dbMatch?.value ?? dbLevel;
}

/** Get level config for a given form level value */
function getLevelConfig(levelValue: string) {
  return LEVEL_CONFIG.find((l) => l.value === levelValue);
}

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: UserStatus.PENDING, label: "Pending" },
  { value: UserStatus.ACTIVE, label: "Active" },
  { value: UserStatus.REJECTED, label: "Rejected" },
] as const;

interface UserFormData {
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: string;
  level: string;
  scope: string;
  businessRole: string;
  regionId: string;
  isActive: boolean;
}

const emptyForm: UserFormData = {
  name: "",
  username: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  role: "PERMITTER",
  level: "PERMITTER",
  scope: "REGION",
  regionId: "",
  businessRole: "PERMITTER",
  isActive: true,
};

/** Display a user's status with appropriate icon and color */
function StatusBadge({ status, isActive }: { status: string; isActive?: boolean }) {
  // If status is ACTIVE but user is deactivated, show as Nonaktif
  const effectiveStatus =
    status === UserStatus.ACTIVE && isActive === false ? "NONAKTIF" : status;

  const colors: Record<string, string> = {
    [UserStatus.PENDING]: "bg-amber-100 text-amber-700",
    [UserStatus.ACTIVE]: "bg-green-100 text-green-700",
    [UserStatus.REJECTED]: "bg-red-100 text-red-700",
    NONAKTIF: "bg-gray-100 text-gray-600",
  };
  const icons: Record<string, React.ReactNode> = {
    [UserStatus.PENDING]: <Clock className="h-3.5 w-3.5" />,
    [UserStatus.ACTIVE]: <CheckCircle className="h-3.5 w-3.5" />,
    [UserStatus.REJECTED]: <XCircle className="h-3.5 w-3.5" />,
    NONAKTIF: <PowerOff className="h-3.5 w-3.5" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colors[effectiveStatus] || "bg-gray-100 text-gray-600"
      }`}
    >
      {icons[effectiveStatus]}
      {effectiveStatus === "NONAKTIF" ? "Nonaktif" : effectiveStatus}
    </span>
  );
}

export default function UsersPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { canCreateUser, canUpdateUser, canDeleteUser, canReadUser, canApproveUser } = usePermissions();
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

  const [statusFilter, setStatusFilter] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectUserId, setRejectUserId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

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

  const filteredUsers = safeUsers.filter((u) => {
    const matchesSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.username ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function openCreateForm() {
    setEditId(null);
    const defaultLevel = "PERMITTER";
    const config = getLevelConfig(defaultLevel);
    setFormData({
      ...emptyForm,
      level: defaultLevel,
      businessRole: config?.label ?? "Permitter",
      role: config?.role ?? "PERMITTER",
      scope: config?.scope ?? "REGION",
      regionId: "", // Start empty; user fills in if needed
    });
    setFormError("");
    setFormOpen(true);
  }

  function openEditForm(user: UserItem) {
    setEditId(user.id);
    // Map stored DB level back to the closest form level display value
    const formLevel = findFormLevelByDbLevel(user.level, user.role, user.scope);
    const config = getLevelConfig(formLevel);
    setFormData({
      name: user.name,
      username: user.username || "",
      email: user.email,
      phone: user.phone || "",
      password: "",
      confirmPassword: "",
      role: config?.role ?? user.role,
      level: formLevel,
      businessRole: config?.label ?? user.businessRole ?? formLevel,
      scope: user.scope,
      regionId: user.regionId,
      isActive: user.isActive,
    });
    setFormError("");
    setFormOpen(true);
  }

  function openDetailDialog(user: UserItem) {
    setSelectedUser(user);
    setDetailDialogOpen(true);
  }

  function openRejectDialog(userId: string) {
    setRejectUserId(userId);
    setRejectionReason("");
    setRejectError("");
    setRejectDialogOpen(true);
  }

  async function handleSubmit() {
    setFormError("");

    const levelConfig = getLevelConfig(formData.level);
    if (!levelConfig) {
      setFormError("Invalid role selected");
      return;
    }

    const effectiveScope = levelConfig.scope;
    const needsRegion = effectiveScope === "REGION";

    if (!editId) {
      // ── CREATE mode: simplified form ──
      if (!formData.email) {
        setFormError("Email is required");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setFormError("Please enter a valid email address");
        return;
      }

      // Quick client-side uniqueness check against loaded users
      if (safeUsers.some((u) => u.email.toLowerCase() === formData.email.toLowerCase())) {
        setFormError("This email is already registered");
        return;
      }
      if (needsRegion && !formData.regionId) {
        setFormError("Region is required for this role");
        return;
      }

      // Auto-generate fields
      const autoName = formData.email.split("@")[0];
      const autoUsername = formData.email;
      const autoPassword = "12345678";

      try {
        await createMutation.mutateAsync({
          name: autoName,
          username: autoUsername,
          email: formData.email,
          role: levelConfig.role,
          level: levelConfig.dbLevel,
          businessRole: levelConfig.label,
          scope: effectiveScope,
          regionId: needsRegion ? formData.regionId : currentSession.user.regionId,
          isActive: formData.isActive,
          password: autoPassword,
        });
        setFormOpen(false);
        refetch();
      } catch {
        // Error handled by mutation
      }
    } else {
      // ── EDIT mode: simplified validation ──
      if (!formData.email) {
        setFormError("Email is required");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setFormError("Please enter a valid email address");
        return;
      }
      // Check uniqueness if email changed (skip if same as current)
      if (safeUsers.some((u) => u.id !== editId && u.email.toLowerCase() === formData.email.toLowerCase())) {
        setFormError("This email is already registered");
        return;
      }
      if (needsRegion && !formData.regionId) {
        setFormError("Region is required for this role");
        return;
      }

      // Auto-generate name from email prefix (consistent with CREATE flow)
      const autoName = formData.email.split("@")[0];

      try {
        const updatePayload: Record<string, unknown> = {
          name: autoName,
          email: formData.email,
          role: levelConfig.role,
          level: levelConfig.dbLevel,
          businessRole: levelConfig.label,
          scope: effectiveScope,
          regionId: needsRegion ? formData.regionId : currentSession.user.regionId,
          isActive: formData.isActive,
        };

        await updateMutation.mutateAsync({ id: editId, data: updatePayload });
        setFormOpen(false);
        refetch();
      } catch {
        // Error handled by mutation
      }
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
    refetch();
  }

  async function handleApprove(userId: string) {
    try {
      await api.patch(`/users/${userId}/approve`, { action: "approve" });
      refetch();
    } catch {
      // Error handled by toast
    }
  }

  async function handleConfirmReject() {
    if (!rejectUserId) return;

    try {
      await api.patch(`/users/${rejectUserId}/approve`, {
        action: "reject",
        rejectionReason: rejectionReason || undefined,
      });
      setRejectDialogOpen(false);
      setRejectUserId(null);
      setRejectionReason("");
      refetch();
    } catch {
      setRejectError("Gagal menolak pengguna. Silakan coba lagi.");
    }
  }

  async function handleToggleActive(userId: string, currentActive: boolean) {
    try {
      await updateMutation.mutateAsync({ id: userId, data: { isActive: !currentActive } });
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

        {/* Status Filter Tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? "bg-sgm-red text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border"
              }`}
            >
              {tab.label}
            </button>
          ))}
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
            {/* Status Info Card */}
            <details className="group mb-4 rounded-xl border bg-white p-4 text-sm text-gray-600">
              <summary className="flex cursor-pointer items-center gap-2 font-medium text-gray-700">
                <span className="text-xs text-gray-400 transition-transform group-open:rotate-90">▶</span>
                Status Information
              </summary>
              <div className="mt-3 space-y-2 pl-4">
                <p>
                  <span className="font-medium text-green-700">Active</span>
                  {" "}→ User dapat login dan menggunakan sistem seperti biasa.
                </p>
                <p>
                  <span className="font-medium text-amber-700">Nonaktif</span>
                  {" "}→ User tidak dapat login maupun mengakses sistem.
                </p>
                <p className="mt-2 border-t pt-2 text-xs text-gray-400">
                  Gunakan tombol Nonaktifkan/Aktifkan pada kolom Action untuk mengubah status user tanpa menghapus data.
                </p>
              </div>
            </details>

            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-xl border bg-white md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-500">
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => openDetailDialog(user)}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatBusinessRole(user.businessRole, user.role, user.level)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={user.status} isActive={user.isActive} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {canApproveUser && user.status === UserStatus.PENDING && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleApprove(user.id)}
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openRejectDialog(user.id)}
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            </>
                          )}
                          {canUpdateUser && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleActive(user.id, user.isActive)}
                                title={user.isActive ? "Nonaktifkan" : "Aktifkan"}
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
                <div
                  key={user.id}
                  className="rounded-xl border bg-white p-4 shadow-sm cursor-pointer"
                  onClick={() => openDetailDialog(user)}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{user.name}</span>
                    <StatusBadge status={user.status} isActive={user.isActive} />
                  </div>
                  <div className="space-y-1 text-sm text-gray-500">
                    <p><span className="font-medium text-gray-700">Email:</span> {user.email}</p>
                    <p><span className="font-medium text-gray-700">Role:</span> {formatBusinessRole(user.businessRole, user.role, user.level)}</p>
                  </div>
                  <div className="mt-3 flex gap-2 border-t pt-3" onClick={(e) => e.stopPropagation()}>
                    {canApproveUser && user.status === UserStatus.PENDING && (
                      <>
                        <Button variant="outline" size="sm" className="flex-1 text-xs text-green-600" onClick={() => handleApprove(user.id)}>
                          <CheckCircle className="mr-1 h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 text-xs text-red-600" onClick={() => openRejectDialog(user.id)}>
                          <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                        </Button>
                      </>
                    )}
                    {canUpdateUser && (
                      <>
                        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => openEditForm(user)}>
                          <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleToggleActive(user.id, user.isActive)}>
                          {user.isActive ? <PowerOff className="mr-1 h-3.5 w-3.5" /> : <Power className="mr-1 h-3.5 w-3.5" />}
                          {user.isActive ? "Nonaktifkan" : "Aktifkan"}
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
            {!editId ? (
              // ── CREATE: simplified form ──
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-11"
                    placeholder="user@company.com"
                  />
                  <p className="text-xs text-gray-400">Name will be auto-generated from the email prefix.</p>
                </div>
              </>
            ) : (
              // ── EDIT: simplified form (same as CREATE) ──
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-11"
                    placeholder="user@company.com"
                  />
                  <p className="text-xs text-gray-400">Name will be auto-generated from the email prefix.</p>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Role</Label>
              <select
                value={formData.level}
                onChange={(e) => {
                  const newLevel = e.target.value;
                  const config = getLevelConfig(newLevel);
                  if (config) {
                    setFormData({
                      ...formData,
                      level: newLevel,
                      role: config.role,
                      scope: config.scope,
                      regionId: config.scope === "ALL" ? "" : formData.regionId,
                    });
                  }
                }}
                className="h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:border-sgm-red focus:ring-2 focus:ring-sgm-red-light"
              >
                {LEVEL_CONFIG.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {(() => {
              const levelConfig = getLevelConfig(formData.level);
              if (!levelConfig) return null;
              const isAllRegion = levelConfig.scope === "ALL";

              return (
                <div className="space-y-2">
                  <Label>Region</Label>
                  {isAllRegion ? (
                    <div className="flex h-11 w-full cursor-not-allowed select-none items-center rounded-xl border bg-gray-100 px-3 text-sm text-gray-500">
                      All Region
                    </div>
                  ) : (
                    <select
                      value={formData.regionId}
                      onChange={(e) => setFormData({ ...formData, regionId: e.target.value })}
                      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:border-sgm-red focus:ring-2 focus:ring-sgm-red-light ${
                        !formData.regionId ? "border-red-300" : ""
                      }`}
                    >
                      <option value="">Select Region</option>
                      {regions?.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })()}

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

      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={(open) => !open && setRejectDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Pengguna</DialogTitle>
            <DialogDescription>
              Masukkan alasan penolakan (opsional). Pengguna akan mendapat notifikasi penolakan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Alasan Penolakan (opsional)</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Data tidak lengkap"
                className="min-h-[100px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-400">
                {rejectionReason.length}/500 karakter
              </p>
            </div>

            {rejectError && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {rejectError}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Batal</Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Tolak Pengguna
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

      {/* User Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={(open) => !open && setDetailDialogOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about this user.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-2">
              {/* Basic Info */}
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Name</p>
                    <p className="font-medium text-gray-900">{selectedUser.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Username</p>
                    <p className="text-gray-900">{selectedUser.username || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-medium text-gray-500">Email</p>
                    <p className="text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Role</p>
                    <p className="font-medium text-gray-900">{formatBusinessRole(selectedUser.businessRole, selectedUser.role, selectedUser.level)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Authorization</p>
                    <p className="text-gray-900">{selectedUser.role}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-medium text-gray-500">Status</p>
                    <StatusBadge status={selectedUser.status} isActive={selectedUser.isActive} />
                  </div>
                </div>
              </div>

              {/* Approval Audit Info */}
              {(selectedUser.approvedBy || selectedUser.rejectedBy) && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Approval Audit
                  </p>
                  <div className="space-y-2 text-sm">
                    {selectedUser.approvedBy && (
                      <>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Approved By</p>
                          <p className="text-gray-900">{selectedUser.approvedBy}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Approved At</p>
                          <p className="text-gray-900">
                            {selectedUser.approvedAt
                              ? new Date(selectedUser.approvedAt).toLocaleString("id-ID")
                              : "-"}
                          </p>
                        </div>
                      </>
                    )}
                    {selectedUser.rejectedBy && (
                      <>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Rejected By</p>
                          <p className="text-gray-900">{selectedUser.rejectedBy}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Rejected At</p>
                          <p className="text-gray-900">
                            {selectedUser.rejectedAt
                              ? new Date(selectedUser.rejectedAt).toLocaleString("id-ID")
                              : "-"}
                          </p>
                        </div>
                        {selectedUser.rejectionReason && (
                          <div>
                            <p className="text-xs font-medium text-gray-500">Rejection Reason</p>
                            <p className="text-gray-900">{selectedUser.rejectionReason}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
