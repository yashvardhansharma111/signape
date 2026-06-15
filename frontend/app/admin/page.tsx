"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type AdminUser, type PendingUser } from "@/lib/api";
import type { UserRole } from "@/lib/auth";
import { Users, Clock, CheckCircle, XCircle, X, Eye, EyeOff, RefreshCw } from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Super Admin",
  signage:    "Digital Signage",
  occupancy:  "Room Occupancy",
  both:       "Both Dashboards",
};

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  superadmin: { bg: "#042B19",  text: "#fff",    border: "#042B19" },
  signage:    { bg: "#DBEAFE",  text: "#1d4ed8", border: "#1d4ed8" },
  occupancy:  { bg: "#F3E8FF",  text: "#7c3aed", border: "#7c3aed" },
  both:       { bg: "#FEF9C3",  text: "#854d0e", border: "#ca8a04" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active:   { bg: "#DCFCE7", text: "#16a34a" },
  inactive: { bg: "#FEE2E2", text: "#dc2626" },
  pending:  { bg: "#FEF9C3", text: "#854d0e" },
};

// ── Activate modal ────────────────────────────────────────────────────────────

function ActivateModal({ user, onClose, onDone }: {
  user: PendingUser;
  onClose: () => void;
  onDone: (u: AdminUser) => void;
}) {
  const [role, setRole]       = useState<UserRole>("signage");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError("");
    try { onDone(await api.activateUser(user.id, { role, password })); }
    catch (e) { setError(e instanceof Error ? e.message : "Activation failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "#E5E7EB" }}>
          <h3 className="font-semibold text-[#042B19]">Activate Account</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="rounded-xl p-4" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
            <p className="font-semibold text-[#042B19]">{user.displayName || "—"}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600">Assign dashboard access</p>
            <div className="space-y-2">
              {(["signage", "occupancy", "both"] as UserRole[]).map((r) => {
                const rc = ROLE_COLORS[r];
                return (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className="flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition"
                    style={{ borderColor: role === r ? "#16a34a" : "#E5E7EB", backgroundColor: role === r ? "#F0FDF4" : "#fff" }}>
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0`}
                      style={{ borderColor: role === r ? "#16a34a" : "#D1D5DB" }}>
                      {role === r && <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#16a34a" }} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#042B19]">{ROLE_LABELS[r]}</p>
                        <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: rc.bg, color: rc.text }}>{r}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {r === "signage" ? "Access digital signage dashboard only"
                          : r === "occupancy" ? "Access room occupancy dashboard only"
                          : "Access both dashboards"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600">Temporary password</p>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full rounded-lg border px-4 py-3 pr-12 text-sm text-[#042B19] focus:outline-none focus:ring-2 focus:ring-[#042B19]"
                style={{ borderColor: "#E5E7EB" }} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">Sent to user via email. They must change it on first login.</p>
          </div>
          {error && <div className="rounded-lg px-4 py-2 text-sm" style={{ backgroundColor: "#FEF2F2", color: "#B91C1C" }}>{error}</div>}
        </div>
        <div className="flex gap-3 border-t px-6 py-4" style={{ borderColor: "#E5E7EB" }}>
          <button type="button" onClick={onClose}
            className="flex-1 rounded-lg border border-[#E5E7EB] py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="button" onClick={handleActivate} disabled={loading}
            className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#16a34a" }}>
            {loading ? "Activating..." : "Activate & Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Role change modal ─────────────────────────────────────────────────────────

function RoleModal({ user, onClose, onDone }: {
  user: AdminUser;
  onClose: () => void;
  onDone: (u: AdminUser) => void;
}) {
  const [role, setRole]     = useState<UserRole>((user.role as UserRole) ?? "signage");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true); setError("");
    try { onDone(await api.setUserRole(user.id, role)); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "#E5E7EB" }}>
          <h3 className="font-semibold text-[#042B19]">Change Role</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5">
          <p className="mb-1 text-sm font-medium text-[#042B19]">{user.displayName || user.email}</p>
          <p className="mb-4 text-xs text-gray-400">{user.email}</p>
          <div className="space-y-2">
            {(["signage", "occupancy", "both"] as UserRole[]).map((r) => {
              const rc = ROLE_COLORS[r];
              return (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className="flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 transition"
                  style={{ borderColor: role === r ? "#16a34a" : "#E5E7EB", backgroundColor: role === r ? "#F0FDF4" : "#fff" }}>
                  <div className="h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: role === r ? "#16a34a" : "#D1D5DB" }}>
                    {role === r && <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#16a34a" }} />}
                  </div>
                  <span className="flex-1 text-left">
                    <span className="text-sm font-semibold text-[#042B19]">{ROLE_LABELS[r]}</span>
                  </span>
                  <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: rc.bg, color: rc.text }}>{r}</span>
                </button>
              );
            })}
          </div>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </div>
        <div className="flex gap-3 border-t px-6 py-4" style={{ borderColor: "#E5E7EB" }}>
          <button type="button" onClick={onClose}
            className="flex-1 rounded-lg border border-[#E5E7EB] py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="button" onClick={handleSave} disabled={loading}
            className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#16a34a" }}>
            {loading ? "Saving..." : "Save Role"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab]                         = useState<"all" | "pending">("all");
  const [allUsers, setAllUsers]               = useState<AdminUser[]>([]);
  const [pendingUsers, setPendingUsers]       = useState<PendingUser[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [activatingUser, setActivatingUser]   = useState<PendingUser | null>(null);
  const [editingRoleUser, setEditingRoleUser] = useState<AdminUser | null>(null);
  const [search, setSearch]                   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [all, pending] = await Promise.all([api.getAdminUsers(), api.getPendingUsers()]);
      setAllUsers(all);
      setPendingUsers(pending);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleActivated = (activated: AdminUser) => {
    setPendingUsers((p) => p.filter((u) => u.id !== activated.id));
    setAllUsers((p) => {
      const exists = p.find((u) => u.id === activated.id);
      return exists ? p.map((u) => u.id === activated.id ? activated : u) : [activated, ...p];
    });
    setActivatingUser(null);
  };

  const handleRoleUpdated = (updated: AdminUser) => {
    setAllUsers((p) => p.map((u) => u.id === updated.id ? updated : u));
    setEditingRoleUser(null);
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    try {
      const updated = await api.toggleUserStatus(user.id, newStatus);
      setAllUsers((p) => p.map((u) => u.id === user.id ? updated : u));
    } catch (e) { console.error(e); }
  };

  // Filtered list for All Users tab
  const filteredUsers = allUsers.filter((u) =>
    !search ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.displayName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const total    = allUsers.length;
  const pending  = pendingUsers.length;
  const active   = allUsers.filter((u) => u.status === "active").length;
  const inactive = allUsers.filter((u) => u.status === "inactive").length;

  return (
    <div>
      {activatingUser && (
        <ActivateModal user={activatingUser} onClose={() => setActivatingUser(null)} onDone={handleActivated} />
      )}
      {editingRoleUser && (
        <RoleModal user={editingRoleUser} onClose={() => setEditingRoleUser(null)} onDone={handleRoleUpdated} />
      )}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="mt-1 text-white/60">Manage access requests, roles and account status</p>
        </div>
        <button type="button" onClick={() => void load()}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total Users", value: total,    icon: Users,       color: "#60a5fa" },
          { label: "Pending",     value: pending,  icon: Clock,       color: "#fbbf24" },
          { label: "Active",      value: active,   icon: CheckCircle, color: "#34d399" },
          { label: "Inactive",    value: inactive, icon: XCircle,     color: "#f87171" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-5" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white/60">{label}</p>
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs + content */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
        {/* Tab bar */}
        <div className="flex items-center justify-between border-b px-4" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="flex">
            {([
              { key: "all",     label: `All Users (${total})` },
              { key: "pending", label: `Pending Requests (${pending})` },
            ] as const).map(({ key, label }) => (
              <button key={key} type="button" onClick={() => setTab(key)}
                className="px-5 py-4 text-sm font-semibold transition"
                style={{
                  color: tab === key ? "#fff" : "rgba(255,255,255,0.45)",
                  borderBottom: tab === key ? "2px solid #16a34a" : "2px solid transparent",
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Search (All Users only) */}
          {tab === "all" && (
            <input
              type="text"
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none"
              style={{ backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.15)" }}
            />
          )}
        </div>

        {/* Tab content */}
        <div className="p-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-white/50">Loading...</p>
          ) : tab === "pending" ? (
            /* ── Pending Requests ── */
            pendingUsers.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle className="mx-auto mb-3 h-10 w-10 text-green-400 opacity-40" />
                <p className="text-white/50">No pending requests</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.35)" }}>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Requested</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((user) => (
                      <tr key={user.id} className="border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                        <td className="px-4 py-4 font-medium text-white">{user.displayName || "—"}</td>
                        <td className="px-4 py-4 text-white/65">{user.email}</td>
                        <td className="px-4 py-4 text-white/50">{user.phone || "—"}</td>
                        <td className="px-4 py-4 text-xs text-white/40">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-4 text-right">
                          <button type="button" onClick={() => setActivatingUser(user)}
                            className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                            style={{ backgroundColor: "#16a34a" }}>
                            Activate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* ── All Users ── */
            filteredUsers.length === 0 ? (
              <p className="py-8 text-center text-sm text-white/50">No users found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.35)" }}>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Role / Access</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const role      = user.role ?? "signage";
                      const status    = user.status ?? "active";
                      const rc        = ROLE_COLORS[role] ?? ROLE_COLORS.signage;
                      const sc        = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
                      const isSA      = role === "superadmin";

                      return (
                        <tr key={user.id} className="border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                          {/* User info */}
                          <td className="px-4 py-4">
                            <p className="font-semibold text-white">{user.displayName || "—"}</p>
                            <p className="text-xs text-white/50">{user.email}</p>
                            {user.phone && <p className="text-xs text-white/35">{user.phone}</p>}
                          </td>

                          {/* Role */}
                          <td className="px-4 py-4">
                            {isSA ? (
                              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
                                style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff" }}>
                                Super Admin
                              </span>
                            ) : (
                              <button type="button" onClick={() => setEditingRoleUser(user)}
                                className="group inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition hover:opacity-80 cursor-pointer"
                                style={{ backgroundColor: rc.bg, color: rc.text, border: `1.5px solid ${rc.border}` }}
                                title="Click to change role">
                                {ROLE_LABELS[role] ?? role}
                                <span className="opacity-0 group-hover:opacity-100 transition text-xs">✏</span>
                              </button>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4">
                            <span className="rounded-full px-3 py-1 text-xs font-semibold capitalize"
                              style={{ backgroundColor: sc.bg, color: sc.text }}>
                              {status}
                              {user.firstTimeLogin && status === "active" && (
                                <span className="ml-1 text-[10px] opacity-70">(first login)</span>
                              )}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {!isSA && status !== "pending" && (
                                <button type="button" onClick={() => handleToggleStatus(user)}
                                  className="rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
                                  style={{
                                    borderColor: status === "active" ? "#dc2626" : "#16a34a",
                                    color:       status === "active" ? "#dc2626" : "#16a34a",
                                  }}>
                                  {status === "active" ? "Deactivate" : "Activate"}
                                </button>
                              )}
                              {status === "pending" && !isSA && (
                                <button type="button"
                                  onClick={() => setActivatingUser({
                                    id: user.id, email: user.email,
                                    displayName: user.displayName, phone: user.phone,
                                    createdAt: user.createdAt,
                                  })}
                                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                                  style={{ backgroundColor: "#16a34a" }}>
                                  Activate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
