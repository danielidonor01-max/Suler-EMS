'use client';

import React, { useRef, useState } from 'react';
import useSWR from 'swr';
import {
  FileText, Download, Trash2, UploadCloud, AlertCircle, CheckCircle2,
  Loader2, FileImage, FileSpreadsheet, FileArchive,
} from 'lucide-react';
import { apiFetcher } from '@/lib/api/fetcher';
import { Select } from '@/components/forms/Select';

/**
 * Employee HR documents panel — list, upload, download, delete.
 *
 * Two modes:
 *   readonly=true  → owner view. List + download only. No upload/delete buttons.
 *   readonly=false → HR view. Full CRUD.
 *
 * Backend already handles the auth split (owner-can-view, HR-can-manage),
 * so this prop is a UI hint, not a security boundary.
 */

interface DocRow {
  id:          string;
  kind:        string;
  fileName:    string;
  mimeType:    string;
  sizeBytes:   number;
  description: string | null;
  createdAt:   string;
  uploadedBy:  { id: string; name: string; email: string } | null;
}

interface Props {
  employeeId: string;
  readonly?:  boolean;
}

const KIND_OPTIONS = [
  { label: 'Resume',       value: 'RESUME' },
  { label: 'Certificate',  value: 'CERTIFICATE' },
  { label: 'ID Card',      value: 'ID_CARD' },
  { label: 'Contract',     value: 'CONTRACT' },
  { label: 'Tax document', value: 'TAX_DOC' },
  { label: 'Other',        value: 'OTHER' },
];

const KIND_LABEL: Record<string, string> = Object.fromEntries(
  KIND_OPTIONS.map(o => [o.value, o.label]),
);

const MAX_MB = 4;

function iconFor(mime: string) {
  if (mime.startsWith('image/')) return FileImage;
  if (mime.includes('spreadsheet') || mime.includes('excel')) return FileSpreadsheet;
  if (mime.includes('zip') || mime.includes('compressed')) return FileArchive;
  return FileText;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function DocumentsPanel({ employeeId, readonly = false }: Props) {
  const listUrl = `/api/employees/${employeeId}/documents`;
  const { data: docs = [], mutate, isLoading, error } = useSWR<DocRow[]>(listUrl, apiFetcher);

  const [uploading, setUploading] = useState(false);
  const [kind, setKind] = useState('RESUME');
  const [description, setDescription] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    setFlash(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('kind', kind);
      if (description.trim()) form.append('description', description.trim());

      const res = await fetch(listUrl, { method: 'POST', body: form, credentials: 'include' });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message ?? `Upload failed (${res.status})`);

      setDescription('');
      if (fileInput.current) fileInput.current.value = '';
      await mutate();
      setFlash(`Uploaded ${file.name}.`);
      setTimeout(() => setFlash(null), 3000);
    } catch (err: any) {
      setUploadError(err?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId: string) {
    setUploadError(null);
    try {
      const res = await fetch(`${listUrl}/${docId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message ?? `Delete failed (${res.status})`);
      }
      setConfirmDeleteId(null);
      await mutate();
      setFlash('Document removed.');
      setTimeout(() => setFlash(null), 3000);
    } catch (err: any) {
      setUploadError(err?.message ?? 'Delete failed');
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        <FileText className="w-4 h-4 text-slate-400" />
        <div className="flex-1">
          <h2 className="text-[13px] font-bold text-slate-900 tracking-tight">HR Documents</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {readonly
              ? 'Documents uploaded by HR for this employee. Contact HR to add or update.'
              : `Upload contracts, IDs, certificates. PDF, images, DOC/DOCX, XLSX, TXT — up to ${MAX_MB} MB per file.`}
          </p>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {docs.length} {docs.length === 1 ? 'file' : 'files'}
        </span>
      </div>

      {flash && (
        <div className="mx-6 mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="text-[12px] font-medium text-emerald-700">{flash}</span>
        </div>
      )}
      {uploadError && (
        <div className="mx-6 mt-4 flex items-start gap-2 px-3 py-2 rounded-xl bg-rose-50 border border-rose-100">
          <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
          <span className="text-[12px] font-medium text-rose-700">{uploadError}</span>
        </div>
      )}

      {!readonly && (
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Document type"
              value={kind}
              onChange={setKind}
              options={KIND_OPTIONS}
            />
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                placeholder="e.g. Signed 2026 employment contract"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <label
            className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition ${
              uploading
                ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-wait'
                : 'border-slate-200 hover:border-indigo-400 hover:bg-white text-slate-600 hover:text-indigo-600'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[12px] font-bold uppercase tracking-widest">Uploading…</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span className="text-[12px] font-bold uppercase tracking-widest">Choose file</span>
              </>
            )}
            <input
              ref={fileInput}
              type="file"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
            />
          </label>
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {isLoading && (
          <div className="px-6 py-8 text-center text-[12px] text-slate-400">Loading…</div>
        )}
        {!isLoading && error && (
          <div className="px-6 py-8 text-center text-[12px] text-rose-500">
            Could not load documents. {(error as Error)?.message}
          </div>
        )}
        {!isLoading && !error && docs.length === 0 && (
          <div className="px-6 py-10 text-center">
            <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <div className="text-[12px] font-medium text-slate-500">No documents yet.</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {readonly ? 'HR will upload documents here as they become available.' : 'Upload the first document above.'}
            </div>
          </div>
        )}
        {docs.map((doc) => {
          const Icon = iconFor(doc.mimeType);
          const isConfirming = confirmDeleteId === doc.id;
          return (
            <div key={doc.id} className="px-6 py-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-slate-900 truncate">{doc.fileName}</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-700 shrink-0">
                    {KIND_LABEL[doc.kind] ?? doc.kind}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
                  <span>{formatSize(doc.sizeBytes)}</span>
                  <span>·</span>
                  <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  {doc.uploadedBy && (
                    <>
                      <span>·</span>
                      <span className="truncate">Uploaded by {doc.uploadedBy.name}</span>
                    </>
                  )}
                </div>
                {doc.description && (
                  <div className="text-[11px] text-slate-500 mt-1 italic truncate">{doc.description}</div>
                )}
              </div>
              <a
                href={`${listUrl}/${doc.id}/download`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-widest"
              >
                <Download className="w-3 h-3" />
                Download
              </a>
              {!readonly && (
                isConfirming ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-3 py-1.5 text-slate-500 hover:text-slate-900 text-[10px] font-bold uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setConfirmDeleteId(doc.id); setUploadError(null); }}
                    aria-label="Delete document"
                    className="inline-flex items-center justify-center w-8 h-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
