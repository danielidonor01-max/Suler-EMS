'use client';

import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import { Search, Shield, AlertTriangle, Lock, UserCircle2, ChevronLeft, ChevronRight, Fingerprint, Loader2 } from 'lucide-react';
import { apiFetcher, apiMutate } from '@/lib/api/fetcher';
import { Select } from '@/components/forms/Select';
import { Modal } from '@/components/common/Modal';

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

  const [pageSize, setPageSize] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, filterRole, users?.length]);

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

  const limit = parseInt(pageSize);
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / limit);
  const activePage = Math.max(1, Math.min(currentPage, totalPages || 1));

  const startIndex = (activePage - 1) * limit;
  const endIndex = Math.min(startIndex + limit, totalItems);

  const paginatedUsers = useMemo(() => {
    return filtered.slice(startIndex, startIndex + limit);
  }, [filtered, startIndex, limit]);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (activePage > 3) {
        pages.push(-1); // ellipsis
      }
      const start = Math.max(2, activePage - 1);
      const end = Math.min(totalPages - 1, activePage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (activePage < totalPages - 2) {
        pages.push(-2); // ellipsis
      }
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

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
          <Select
            value={filterRole}
            onChange={setFilterRole}
            placeholder="All roles"
            options={[
              { label: 'All roles', value: '' },
              ...(roles ?? []).map(r => ({ label: r.name, value: r.id }))
            ]}
            className="w-48"
          />
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
              {paginatedUsers.map(u => (
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

          {/* Enterprise Pagination: Tighter Segmented Treatment */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-bold text-slate-400 tracking-tight">
                Showing <span className="text-slate-900 font-bold">{totalItems === 0 ? 0 : startIndex + 1}–{endIndex}</span> of <span className="text-slate-900 font-bold">{totalItems}</span> records
              </span>
              <div className="h-4 w-px bg-slate-200" />
              <Select 
                variant="minimal"
                value={pageSize}
                onChange={(val) => {
                  setPageSize(val);
                  setCurrentPage(1);
                }}
                options={[
                  { label: 'Rows: 10', value: '10' },
                  { label: 'Rows: 25', value: '25' },
                  { label: 'Rows: 50', value: '50' }
                ]}
                className="w-32"
              />
            </div>

            <div className="flex items-center gap-1">
              <button 
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={activePage === 1}
                className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all shadow-sm disabled:opacity-30 disabled:hover:bg-transparent"
              >
                 <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center">
                 {getPageNumbers().map((p, idx) => {
                   if (p < 0) {
                     return <span key={`ellipsis-${idx}`} className="px-2 text-slate-300 text-[11px] font-bold">...</span>;
                   }
                   return (
                     <button
                       key={p}
                       type="button"
                       onClick={() => setCurrentPage(p)}
                       className={`w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-bold transition-all ${
                         p === activePage ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'
                       }`}
                     >
                       {p}
                     </button>
                   );
                 })}
              </div>
              <button 
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={activePage === totalPages || totalPages === 0}
                className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all shadow-sm disabled:opacity-30 disabled:hover:bg-transparent"
              >
                 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
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
    <Modal
      isOpen
      onClose={() => { if (!busy) onClose(); }}
      title="Modify Authority Scope"
      subtitle={`${user.name} · ${user.email}`}
      size="sm"
    >
      <div className="space-y-6">
        <div className="p-5 bg-slate-900 rounded-[20px] text-white space-y-3">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-indigo-400" />
            <h4 className="text-[12px] font-bold uppercase tracking-widest">IAM Authority Scope</h4>
          </div>
          <p className="text-[12px] text-slate-400 leading-relaxed font-medium">
            Modifying the role will instantly re-render the workspace for this user and affect their permission matrix.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Select New Role Designation</label>
          <Select
            options={roles.map(r => ({ label: r.name, value: r.id }))}
            value={roleId}
            onChange={setRoleId}
          />
        </div>

        {isLastSuperAdminCandidate && (
          <div className="flex items-start gap-2 p-4 rounded-xl bg-amber-50 border border-amber-100 text-[11px] text-amber-800 leading-relaxed font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>If this is the last active <span className="font-bold">SUPER_ADMIN</span>, the change will be rejected with <span className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded text-[10px]">LAST_SUPER_ADMIN_PROTECTED</span>.</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-4 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-700 leading-relaxed font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={save}
            disabled={!changed || busy}
            className="bg-slate-900 hover:bg-slate-950 text-white w-full h-[52px] rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply Role Mutation'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="w-full h-[48px] text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
