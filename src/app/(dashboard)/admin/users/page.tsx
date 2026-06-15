'use client';

import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import { Search, Shield, X, AlertTriangle, Lock, UserCircle2 } from 'lucide-react';
import { apiFetcher, apiMutate } from '@/lib/api/fetcher';

interface Role { id: string; name: string }
interface AdminUser {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  version: number;
  lastLoginAt: string | null;
  role: { id: string; name: string };
  employee?: {
    id: string; staffId: string; jobTitle: string; branch: string | null;
    department?: { id: string; name: string; code: string } | null;
  } | null;
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

export default function AdminUsersPage() {
  const { data: users, error, isLoading, mutate } =
    useSWR<AdminUser[]>('/api/admin/users', apiFetcher, { refreshInterval: 30_000 });
  const { data: roles } = useSWR<Role[]>('/api/admin/roles', apiFetcher);

  const [filterRole, setFilterRole] = useState<string>('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const filtered = useMemo(() => {
    let list = users ?? [];
    if (filterRole) list = list.filter(u => u.role.id === filterRole);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(u =>
        u.name.toLowerCase().includes(s)
        || u.email.toLowerCase().includes(s)
        || u.employee?.staffId?.toLowerCase().includes(s),
      );
    }
    return list;
  }, [users, filterRole, search]);

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Users</h1>
          <p className="text-slate-500 text-[14px] mt-2">
            Reassign roles per user. Changes are atomic — every assignment writes an audit entry and bumps the user's session version.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, staff ID…"
              aria-label="Search users"
              className="w-full h-[40px] pl-9 pr-4 rounded-[12px] border border-slate-200 text-[13px] text-slate-900 bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            aria-label="Filter by role"
            className="h-[40px] px-4 rounded-[12px] border border-slate-200 text-[13px] text-slate-900 bg-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All roles</option>
            {(roles ?? []).map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
          </select>
        </div>

        <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">User</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Role</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Department</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Staff ID</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && <tr><td colSpan={6} className="px-6 py-12 text-center text-[13px] text-slate-500">Loading users…</td></tr>}
              {error && <tr><td colSpan={6} className="px-6 py-12 text-center text-[13px] text-rose-700">Could not load: {error.message}</td></tr>}
              {!isLoading && !error && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-[13px] text-slate-500">No users match.</td></tr>
              )}
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold">
                        {initials(u.name)}
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-700">
                      <Shield className="w-3 h-3" />
                      {u.role.name}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-[12px] text-slate-700">
                    {u.employee?.department?.name ?? '—'}
                  </td>
                  <td className="px-6 py-3 text-[12px] font-mono text-slate-700">{u.employee?.staffId ?? '—'}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setEditing(u)}
                      aria-label={`Change role for ${u.name}`}
                      className="h-[34px] px-3 rounded-[10px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold uppercase tracking-widest"
                    >
                      Change Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <RoleChangeModal
          user={editing}
          roles={roles ?? []}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            await mutate();
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function RoleChangeModal({ user, roles, onClose, onSaved }: {
  user: AdminUser;
  roles: Role[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [roleId, setRoleId] = useState(user.role.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changed = roleId !== user.role.id;
  const isLastSuperAdminCandidate =
    user.role.name === 'SUPER_ADMIN' && roles.find(r => r.id === roleId)?.name !== 'SUPER_ADMIN';

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await apiMutate(`/api/admin/users/${user.id}/role`, 'PATCH', { roleId });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-[24px] w-full max-w-[440px] shadow-premium overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">Change Role</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">{user.name} · {user.email}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-md text-slate-400 hover:bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-[12px] bg-slate-50 border border-slate-100">
            <UserCircle2 className="w-5 h-5 text-slate-400" />
            <div className="text-[12px]">
              <span className="text-slate-500">Current:</span>{' '}
              <span className="font-bold text-slate-900">{user.role.name}</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest" htmlFor="role-select">New role</label>
            <select
              id="role-select"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="mt-2 w-full h-[44px] px-4 rounded-[12px] border border-slate-200 text-[13px] text-slate-900 bg-white focus:outline-none focus:border-indigo-500"
            >
              {roles.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
            </select>
          </div>

          {isLastSuperAdminCandidate && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-[10px] bg-amber-50 border border-amber-100 text-[11px] text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>If this is the last active SUPER_ADMIN, the change will be rejected with <span className="font-mono font-bold">LAST_SUPER_ADMIN_PROTECTED</span>.</span>
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
            disabled={!changed || busy}
            className="h-[40px] px-5 rounded-[12px] bg-slate-900 hover:bg-black text-white text-[11px] font-bold uppercase tracking-widest disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
