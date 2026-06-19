"use client";

import React, { useState } from 'react';
import {
  MapPin, Plus, Edit3, Trash2, AlertTriangle, CheckCircle2,
  Building2, Power, Crosshair,
} from 'lucide-react';
import { useApi } from '@/lib/api/use-api';
import { apiMutate } from '@/lib/api/fetcher';
import { useAccess } from '@/context/AccessContext';
import { Modal } from '@/components/common/Modal';

interface Hub {
  id: string;
  name: string;
  code: string;
}

interface WorkSite {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  radiusMeters: number;
  isActive: boolean;
  hubId: string | null;
  hub: Hub | null;
  createdAt: string;
  updatedAt: string;
}

export default function WorkSitesPage() {
  const { userRole } = useAccess();
  const canManage = userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN';

  const [createOpen, setCreateOpen]   = useState(false);
  const [editing,    setEditing]      = useState<WorkSite | null>(null);
  const [showAll,    setShowAll]      = useState(false);

  const { data: sites = [], refresh } = useApi<WorkSite[]>(
    `/api/work-sites${showAll ? '?includeInactive=true' : ''}`,
  );
  const { data: hubs = [] } = useApi<Hub[]>('/api/hubs');

  if (!canManage) {
    return (
      <div className="section-breathing max-w-[900px] mx-auto p-8">
        <div className="bg-white rounded-[20px] border border-slate-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Not authorized</h3>
          <p className="text-[13px] text-slate-500">Work site management requires HR / SUPER_ADMIN.</p>
        </div>
      </div>
    );
  }

  const handleToggleActive = async (site: WorkSite) => {
    try {
      await apiMutate(`/api/work-sites/${site.id}`, 'PATCH', { isActive: !site.isActive });
      await refresh();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  };

  return (
    <div className="section-breathing max-w-[1400px] mx-auto animate-in space-y-10">

      <div className="bg-white rounded-[24px] p-8 border border-slate-200/60 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />
                Work Sites
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none mb-3">
              Geo-Fenced Locations
            </h1>
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[600px]">
              Define the lat/lng + radius of each office. Clock-in / clock-out validates against the nearest active site. Out-of-bounds punches need an explicit reason.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="bg-slate-900 hover:bg-black text-white flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider shadow-md"
          >
            <Plus className="w-4 h-4" />
            New Site
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {sites.length} site{sites.length === 1 ? '' : 's'}
        </span>
        <label className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="w-3.5 h-3.5 accent-indigo-600"
          />
          Show deactivated
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map(site => (
          <SiteCard
            key={site.id}
            site={site}
            onEdit={() => setEditing(site)}
            onToggleActive={() => handleToggleActive(site)}
          />
        ))}
        {sites.length === 0 && (
          <div className="col-span-full bg-white rounded-[20px] border border-slate-200 p-12 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No work sites configured</h3>
            <p className="text-[13px] text-slate-500 max-w-[400px] mx-auto">
              Without active sites, attendance clock-in is unrestricted. Add at least one to start enforcing geo-fence.
            </p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest"
            >
              <Plus className="w-3.5 h-3.5" /> Create First Site
            </button>
          </div>
        )}
      </div>

      <SiteFormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => { setCreateOpen(false); refresh(); }}
        hubs={hubs}
      />
      <SiteFormModal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); refresh(); }}
        hubs={hubs}
        existing={editing ?? undefined}
      />
    </div>
  );
}

function SiteCard({
  site, onEdit, onToggleActive,
}: {
  site: WorkSite;
  onEdit: () => void;
  onToggleActive: () => void;
}) {
  return (
    <div className={`p-5 rounded-[20px] border space-y-3 ${
      site.isActive ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-bold text-slate-900 truncate">{site.name}</h3>
          {site.hub && (
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500">
              <Building2 className="w-3 h-3" />
              {site.hub.name}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit site"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onToggleActive}
            aria-label={site.isActive ? 'Deactivate site' : 'Reactivate site'}
            title={site.isActive ? 'Deactivate' : 'Reactivate'}
            className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 ${
              site.isActive ? 'text-rose-500' : 'text-emerald-600'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {site.address && (
        <p className="text-[12px] text-slate-500 leading-relaxed">{site.address}</p>
      )}

      <div className="grid grid-cols-2 gap-3 text-[11px]">
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Coordinates</div>
          <div className="font-bold text-slate-700">
            {site.lat.toFixed(5)}, {site.lng.toFixed(5)}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Radius</div>
          <div className="font-bold text-slate-700">{site.radiusMeters} m</div>
        </div>
      </div>

      <a
        href={`https://www.openstreetmap.org/?mlat=${site.lat}&mlon=${site.lng}#map=18/${site.lat}/${site.lng}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest"
      >
        View on map →
      </a>
    </div>
  );
}

function SiteFormModal({
  isOpen, onClose, onSaved, hubs, existing,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  hubs: Hub[];
  existing?: WorkSite;
}) {
  const editing = !!existing;
  const [name,    setName]    = useState('');
  const [address, setAddress] = useState('');
  const [lat,     setLat]     = useState<number>(6.5244); // Lagos default
  const [lng,     setLng]     = useState<number>(3.3792);
  const [radius,  setRadius]  = useState<number>(150);
  const [hubId,   setHubId]   = useState<string>('');
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    setName(existing?.name ?? '');
    setAddress(existing?.address ?? '');
    setLat(existing?.lat ?? 6.5244);
    setLng(existing?.lng ?? 3.3792);
    setRadius(existing?.radiusMeters ?? 150);
    setHubId(existing?.hubId ?? '');
    setError(null);
  }, [isOpen, existing]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported in this browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(6)));
        setLng(Number(pos.coords.longitude.toFixed(6)));
        setLocating(false);
      },
      (err) => {
        setError(`Could not get location: ${err.message}`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = {
        name,
        address:      address || null,
        lat,
        lng,
        radiusMeters: radius,
        hubId:        hubId || null,
      };
      if (editing) {
        await apiMutate(`/api/work-sites/${existing!.id}`, 'PATCH', payload);
      } else {
        await apiMutate('/api/work-sites', 'POST', payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.message ?? 'Could not save site');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Work Site' : 'New Work Site'} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Name">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lagos HQ"
            aria-label="Name"
            className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-bold outline-none focus:border-indigo-500"
          />
        </Field>

        <Field label="Address (optional)">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="6 Idejo Street, Victoria Island"
            aria-label="Address"
            className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] outline-none focus:border-indigo-500"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude">
            <input
              type="number" step="0.000001" required
              value={lat}
              onChange={(e) => setLat(parseFloat(e.target.value))}
              aria-label="Latitude"
              className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-bold outline-none focus:border-indigo-500"
            />
          </Field>
          <Field label="Longitude">
            <input
              type="number" step="0.000001" required
              value={lng}
              onChange={(e) => setLng(parseFloat(e.target.value))}
              aria-label="Longitude"
              className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] font-bold outline-none focus:border-indigo-500"
            />
          </Field>
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={locating}
          className="w-full h-10 flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60"
        >
          <Crosshair className="w-3.5 h-3.5" />
          {locating ? 'Locating…' : 'Use my current location'}
        </button>

        <Field label={`Radius (${radius} m)`}>
          <input
            type="range" min={20} max={2000} step={10}
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value, 10))}
            aria-label="Radius"
            className="w-full accent-indigo-600"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            150 m fits a typical office building. Larger for campuses; smaller for shared spaces.
          </p>
        </Field>

        <Field label="Hub (optional)">
          <select
            value={hubId}
            onChange={(e) => setHubId(e.target.value)}
            aria-label="Hub"
            className="w-full h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] outline-none focus:border-indigo-500"
          >
            <option value="">— None —</option>
            {hubs.map(h => (
              <option key={h.id} value={h.id}>{h.name} ({h.code})</option>
            ))}
          </select>
        </Field>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <span className="text-[12px] font-medium text-rose-700">{error}</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} disabled={busy}
            className="flex-1 h-11 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60">
            Cancel
          </button>
          <button type="submit" disabled={busy || !name.trim()}
            className="flex-1 h-11 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60">
            {busy ? 'Saving…' : editing ? 'Save Changes' : 'Create Site'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}
