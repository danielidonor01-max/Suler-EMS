'use client';

import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import { Shield, ShieldCheck, Users, Check, X, Lock, AlertTriangle, Plus, Pencil, Trash2 } from 'lucide-react';
import { apiFetcher, apiMutate } from '@/lib/api/fetcher';

interface Permission { id: string; code: string; name: string }
interface Role {
  id: string; name: string; description?: string | null;
  permissions: Permission[];
  _count: { users: number };
}

const SYSTEM_ROLES = new Set(['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE_MANAGER', 'MANAGER', 'EMPLOYEE']);

/**
 * Permission code → category. The seed groups by colon prefix (workforce:*,
 * leave:*, payroll:*, finance:*, etc.) so we use that.
 */
function categorize(code: string): string {
  const [head] = code.split(':');
  return head.toUpperCase();
}

export default function RolesAdminPage() {
  const { data: roles, error: rolesError, isLoading: rolesLoading, mutate: refetchRoles } =
    useSWR<Role[]>('/api/admin/roles', apiFetcher, { refreshInterval: 30_000 });
  const { data: permissions, isLoading: permsLoading } =
    useSWR<Permission[]>('/api/admin/permissions', apiFetcher);

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState<Role | null>(null);

  // Default to first role once loaded.
  React.useEffect(() => {
    if (!selectedRoleId && roles && roles.length > 0) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  const selectedRole = useMemo(
    () => roles?.find(r => r.id === selectedRoleId),
    [roles, selectedRoleId],
  );

  const grantedCodes = useMemo(
    () => new Set(selectedRole?.permissions.map(p => p.code) ?? []),
    [selectedRole],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>();
    (permissions ?? []).forEach(p => {
      const cat = categorize(p.code);
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [permissions]);

  async function toggle(permission: Permission) {
    if (!selectedRole) return;
    const granted = grantedCodes.has(permission.code);
    const key = `${selectedRole.id}:${permission.code}`;
    setBusyKey(key);
    setBannerError(null);
    try {
      const url = `/api/admin/roles/${selectedRole.id}/permissions/${permission.code}`;
      await apiMutate(url, granted ? 'DELETE' : 'POST');
      await refetchRoles();
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Roles & Permissions</h1>
          <p className="text-slate-500 text-[14px] mt-2">
            Edit permissions on each role, or create custom roles. System role names (SUPER_ADMIN, HR_ADMIN, FINANCE_MANAGER, MANAGER, EMPLOYEE) cannot be renamed or deleted.
          </p>
        </div>

        {bannerError && (
          <div className="px-4 py-3 rounded-[12px] bg-rose-50 border border-rose-100 text-[12px] text-rose-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{bannerError}</span>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Role list */}
          <div className="col-span-12 md:col-span-3">
            <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <h2 className="text-[12px] font-bold text-slate-700 uppercase tracking-widest">Roles</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  aria-label="Create new role"
                  className="h-7 px-2 rounded-md bg-slate-900 hover:bg-black text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  New
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {rolesLoading && <div className="px-4 py-6 text-[12px] text-slate-500">Loading…</div>}
                {rolesError && <div className="px-4 py-6 text-[12px] text-rose-700">Failed: {rolesError.message}</div>}
                {(roles ?? []).map(r => {
                  const active = r.id === selectedRoleId;
                  const isSystem = SYSTEM_ROLES.has(r.name);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRoleId(r.id)}
                      aria-label={`Select role ${r.name}`}
                      className={`w-full px-4 py-3 text-left flex items-center justify-between gap-2 hover:bg-slate-50 ${active ? 'bg-indigo-50/60' : ''}`}
                    >
                      <div>
                        <div className={`text-[13px] font-bold ${active ? 'text-indigo-900' : 'text-slate-900'}`}>{r.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{r.permissions.length} perms · {r._count.users} users</div>
                      </div>
                      {isSystem && <Lock className="w-3.5 h-3.5 text-slate-400" aria-label="System role — name protected" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Permission matrix */}
          <div className="col-span-12 md:col-span-9">
            <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <h2 className="text-[13px] font-bold text-slate-900 tracking-tight">
                    {selectedRole ? selectedRole.name : 'Select a role'}
                  </h2>
                  {selectedRole && SYSTEM_ROLES.has(selectedRole.name) && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600">System</span>
                  )}
                </div>
                {selectedRole && (
                  <div className="flex items-center gap-3">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {selectedRole._count.users} assigned
                    </div>
                    {!SYSTEM_ROLES.has(selectedRole.name) && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditing(selectedRole)}
                          aria-label="Rename role"
                          className="h-7 px-2 rounded-md text-slate-600 hover:bg-slate-100 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(selectedRole)}
                          aria-label="Delete role"
                          className="h-7 px-2 rounded-md text-rose-700 hover:bg-rose-50 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4">
                {permsLoading && <div className="px-2 py-6 text-[12px] text-slate-500">Loading permissions…</div>}
                {!permsLoading && grouped.length === 0 && <div className="px-2 py-6 text-[12px] text-slate-500">No permissions defined</div>}

                <div className="space-y-6">
                  {grouped.map(([category, perms]) => {
                    const granted = perms.filter(p => grantedCodes.has(p.code)).length;
                    return (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{category}</h3>
                          <span className="text-[10px] font-bold text-slate-400">{granted}/{perms.length}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {perms.map(p => {
                            const isGranted = grantedCodes.has(p.code);
                            const key = `${selectedRole?.id}:${p.code}`;
                            const busy = busyKey === key;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                disabled={!selectedRole || busy}
                                onClick={() => toggle(p)}
                                aria-label={`${isGranted ? 'Revoke' : 'Grant'} ${p.name}`}
                                className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-[12px] border transition-all text-left disabled:opacity-60 ${
                                  isGranted
                                    ? 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100'
                                    : 'bg-white border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className={`text-[12px] font-bold truncate ${isGranted ? 'text-emerald-900' : 'text-slate-900'}`}>{p.name}</div>
                                  <div className="text-[10px] font-medium text-slate-500 truncate">{p.code}</div>
                                </div>
                                {isGranted
                                  ? <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                  : <X className="w-4 h-4 text-slate-300 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {creating && (
        <RoleEditorModal
          mode="create"
          onClose={() => setCreating(false)}
          onSaved={async (created) => {
            await refetchRoles();
            if (created) setSelectedRoleId(created.id);
            setCreating(false);
          }}
        />
      )}

      {editing && (
        <RoleEditorModal
          mode="rename"
          role={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            await refetchRoles();
            setEditing(null);
          }}
        />
      )}

      {deleting && (
        <DeleteRoleModal
          role={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={async () => {
            await refetchRoles();
            if (deleting && selectedRoleId === deleting.id) setSelectedRoleId(null);
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}

function RoleEditorModal({ mode, role, onClose, onSaved }: {
  mode: 'create' | 'rename';
  role?: Role;
  onClose: () => void;
  onSaved: (created?: Role) => void;
}) {
  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameValid = /^[A-Z][A-Z0-9_]*$/.test(name) && name.length >= 2 && name.length <= 40;

  async function save() {
    setBusy(true);
    setError(null);
    try {
      if (mode === 'create') {
        const created = await apiMutate<{ name: string; description?: string }, Role>(
          '/api/admin/roles', 'POST', { name: name.trim(), description: description.trim() || undefined },
        );
        onSaved(created);
      } else if (role) {
        await apiMutate<{ name?: string; description?: string | null }, Role>(
          `/api/admin/roles/${role.id}`, 'PATCH', { name: name.trim(), description: description.trim() || null },
        );
        onSaved();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-[24px] w-full max-w-[440px] shadow-premium overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
            {mode === 'create' ? 'Create Role' : 'Rename Role'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-md text-slate-400 hover:bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest" htmlFor="role-name">Name (UPPER_SNAKE_CASE)</label>
            <input aria-label="Name (UPPER_SNAKE_CASE)"
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="e.g. DEPT_LEAD"
              className={`mt-2 w-full h-[44px] px-4 rounded-[12px] border text-[13px] font-mono text-slate-900 bg-white focus:outline-none ${name && !nameValid ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'}`}
            />
            {name && !nameValid && (
              <p className="mt-1.5 text-[11px] text-rose-700">Must start with a letter; use only A–Z, 0–9, underscore.</p>
            )}
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest" htmlFor="role-desc">Description (optional)</label>
            <input aria-label="Description (optional)"
              id="role-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this role does"
              className="mt-2 w-full h-[44px] px-4 rounded-[12px] border border-slate-200 text-[13px] text-slate-900 bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          {mode === 'create' && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-[10px] bg-sky-50 border border-sky-100 text-[11px] text-sky-800">
              <Shield className="w-4 h-4 shrink-0 mt-0.5" />
              <span>The new role starts with <strong>zero permissions</strong>. Grant access on the matrix after creation.</span>
            </div>
          )}
          {error && (
            <div className="px-3 py-2.5 rounded-[10px] bg-rose-50 border border-rose-100 text-[11px] text-rose-700">
              {error}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/40">
          <button type="button" onClick={onClose} className="h-[40px] px-4 rounded-[12px] text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!nameValid || busy}
            className="h-[40px] px-5 rounded-[12px] bg-slate-900 hover:bg-black text-white text-[11px] font-bold uppercase tracking-widest disabled:opacity-50"
          >
            {busy ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteRoleModal({ role, onClose, onDeleted }: {
  role: Role;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasUsers = role._count.users > 0;

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await apiMutate(`/api/admin/roles/${role.id}`, 'DELETE');
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-[24px] w-full max-w-[420px] shadow-premium overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-rose-700 tracking-tight">Delete Role</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-md text-slate-400 hover:bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-[13px] text-slate-700">
            Delete <span className="font-bold font-mono">{role.name}</span>?
          </p>
          {hasUsers ? (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-[10px] bg-amber-50 border border-amber-100 text-[11px] text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>{role._count.users}</strong> user(s) still hold this role. Reassign them via <span className="font-mono">/admin/users</span> first — the server will reject the delete otherwise (<span className="font-mono font-bold">ROLE_IN_USE</span>).
              </span>
            </div>
          ) : (
            <p className="text-[12px] text-slate-500">
              No users hold this role. Deletion is permanent; audit entries are preserved.
            </p>
          )}
          {error && (
            <div className="px-3 py-2.5 rounded-[10px] bg-rose-50 border border-rose-100 text-[11px] text-rose-700">{error}</div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/40">
          <button type="button" onClick={onClose} className="h-[40px] px-4 rounded-[12px] text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy || hasUsers}
            className="h-[40px] px-5 rounded-[12px] bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold uppercase tracking-widest disabled:opacity-50"
          >
            {busy ? 'Deleting…' : 'Delete Role'}
          </button>
        </div>
      </div>
    </div>
  );
}
