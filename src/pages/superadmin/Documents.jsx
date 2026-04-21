import { useSelector } from 'react-redux';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import {
  FileText, Search, CheckCircle2, Clock, Users,
  ArrowUpRight, Upload, Trash2, AlertCircle, X, Loader2, MessageSquare, Save, Edit2, Eye, Download, ChevronDown
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '../../components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const BASE_URL = 'https://kenqo-api-409744260053.asia-south1.run.app'; // ← replace with your API base URL

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const getAuthorityLabel = (value) => {
  const v = Number(value);
  const labels = {
    1: 'Very High',
    2: 'High',
    3: 'Medium',
    4: 'Low',
    5: 'Very Low'
  };
  return labels[v] || 'Very Low';
};

// Maps API status → UI badge
const StatusBadge = ({ status, stepMessage }) => {
  if (status === 'complete' || status === 'completed') {
    return (
      <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">
        <CheckCircle2 className="w-4 h-4" />
        Completed
      </div>
    );
  }
  if (status === 'processing' || status === 'uploading') {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2 bg-amber-500/10 text-amber-600 border border-amber-500/20 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">
          <Clock className="w-4 h-4 animate-spin" style={{ animationDuration: '2s' }} />
          {status === 'uploading' ? 'Uploading' : 'Processing'}
        </div>
        {stepMessage && (
          <span className="text-[9px] text-muted-foreground/60 font-medium max-w-[200px] text-right truncate">{stepMessage}</span>
        )}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 bg-red-500/10 text-red-600 border border-red-500/20 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">
      <AlertCircle className="w-4 h-4" />
      Failed
    </div>
  );
};

/* ─── DELETE CONFIRM DIALOG ─── */
const DeleteConfirmDialog = ({ open, title, description, onConfirm, onCancel, loading }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border-2 border-border/40 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center shadow-inner">
            <Trash2 className="w-10 h-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} disabled={loading} className="flex-1 h-12 rounded-2xl font-black border-border/60">
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading} className="flex-1 h-12 rounded-2xl font-black bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/20 transition-all active:scale-95">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─── DOCUMENT VIEWER MODAL ─── */
const DocumentViewerModal = ({ open, doc, onClose }) => {
  if (!open || !doc) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-card border-2 border-border/40 rounded-[2.5rem] w-full max-w-5xl h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-8 py-6 border-b-2 border-border/10 flex items-center justify-between bg-muted/5">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black tracking-tight truncate">{doc.filename}</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                {doc.disease} — {doc.doc_type || 'General Document'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href={doc.doc_url} 
              download={doc.filename}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-6 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <Download className="w-4 h-4" /> Download
            </a>
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-2xl border-2 border-border/40 flex items-center justify-center hover:bg-muted transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Body */}
        <div className="flex-1 bg-muted/20 relative">
          {doc.doc_url ? (
            <iframe
              src={`${doc.doc_url}#toolbar=0&navpanes=0&scrollbar=1`}
              className="w-full h-full border-none"
              title={doc.filename}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 opacity-40">
              <AlertCircle className="w-12 h-12" />
              <p className="font-black text-lg uppercase tracking-widest">Document URL Not Available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── UPLOAD MODAL ─────────────────────────────────────────────────────────────
const UploadModal = ({ superAdminId, onClose, onUploaded }) => {
  const [file, setFile] = useState(null);
  const [disease, setDisease] = useState('lymphedema');
  const [docType, setDocType] = useState('');
  const [payerScope, setPayerScope] = useState('UNIVERSAL');
  const [authorityLevel, setAuthorityLevel] = useState('');
  const [options, setOptions] = useState({ doc_types: [], payer_scopes: [], authority_levels: [] });
  const [isFetchingOptions, setIsFetchingOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();

  // Prompts integration
  const [prompts, setPrompts] = useState({ chunk_summary: '', rules_extraction: '' });
  const [isFetchingPrompts, setIsFetchingPrompts] = useState(false);
  const [editMode, setEditMode] = useState({ chunk_summary: false, rules_extraction: false });

  const fetchOptions = useCallback(async () => {
    if (!superAdminId) return;
    setIsFetchingOptions(true);
    try {
      const response = await fetch(`${BASE_URL}/admin/documents/options`, {
        headers: { 'x-user-id': superAdminId },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOptions({
          doc_types: data.doc_types || [],
          payer_scopes: data.payer_scopes || [],
          authority_levels: data.authority_levels || [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch options', err);
    } finally {
      setIsFetchingOptions(false);
    }
  }, [superAdminId]);

  const fetchPrompts = useCallback(async () => {
    if (!superAdminId) return;
    setIsFetchingPrompts(true);
    try {
      const response = await fetch(`${BASE_URL}/admin/prompts/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': superAdminId,
        },
        body: JSON.stringify({
          user_id: superAdminId,
          prompt_names: ['chunk_summary', 'rules_extraction'],
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPrompts({
          chunk_summary: data.prompts?.chunk_summary || '',
          rules_extraction: data.prompts?.rules_extraction || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch prompts', err);
    } finally {
      setIsFetchingPrompts(false);
    }
  }, [superAdminId]);

  useEffect(() => {
    fetchOptions();
    fetchPrompts();
  }, [fetchOptions, fetchPrompts]);

  const handleUpdatePrompt = async (key) => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/admin/prompts/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': superAdminId,
        },
        body: JSON.stringify({
          user_id: superAdminId,
          prompts: [
            {
              prompt_name: key,
              prompt_text: prompts[key],
            },
          ],
        }),
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data?.message || 'Update failed');
      }
      setEditMode((prev) => ({ ...prev, [key]: false }));
    } catch (err) {
      setError(`Prompt update failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!file || !disease.trim() || !docType || !payerScope || !authorityLevel) {
      setError('PDF file, disease, document type, payer scope, and authority level are required.');
      return;
    }
    if (!superAdminId) {
      setError('Missing authentication ID.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('disease', disease.trim().toLowerCase());
      fd.append('user_id', superAdminId);
      fd.append('doc_type', docType.trim());
      fd.append('payer_scope', payerScope);
      fd.append('authority_level', authorityLevel);

      const res = await fetch(`${BASE_URL}/admin/documents/upload`, {
        method: 'POST',
        headers: { 'x-user-id': superAdminId },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Upload failed');
      onUploaded({ ...data, disease: disease.trim().toLowerCase(), doc_type: docType.trim(), authority_level: authorityLevel });
      onClose();
    } catch (e) {
      setError(e.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border-2 border-border/40 rounded-[2.5rem] p-8 w-full max-w-4xl shadow-2xl space-y-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight">Upload Policy Document</h2>
            <p className="text-sm text-muted-foreground font-medium">Ingest new intelligence with custom extraction prompts</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl border-2 border-border/40 flex items-center justify-center hover:bg-muted transition-all active:scale-95 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: File & Basic Info */}
          <div className="space-y-6">
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-border/60 hover:border-primary/40 rounded-[2rem] p-10 flex flex-col items-center gap-4 cursor-pointer transition-all group bg-muted/5 shadow-inner"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              {file ? (
                <div className="text-center">
                  <p className="font-black text-sm truncate max-w-[240px]">{file.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 font-bold">{formatFileSize(file.size)}</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-black text-base">Choose PDF Policy</p>
                  <p className="text-[11px] text-muted-foreground mt-1 font-medium">Drag and drop document here</p>
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files[0] || null)}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Disease <span className="text-red-500">*</span></label>
                <Input
                  placeholder="e.g. lymphedema"
                  value={disease}
                  onChange={(e) => setDisease(e.target.value)}
                  className="h-12 bg-card border-2 border-border/40 focus:border-primary/40 rounded-2xl text-sm font-black shadow-sm transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Document Type <span className="text-red-500">*</span></label>
                <div className="relative">
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="w-full h-12 px-4 bg-card border-2 border-border/40 focus:outline-none focus:ring-0 focus:border-primary/40 rounded-2xl text-sm font-black appearance-none cursor-pointer shadow-sm transition-all">
                  <SelectValue placeholder="Select document type..." />
                </SelectTrigger>
                <SelectContent>
                  {options.doc_types.filter((opt) => String(opt || '').trim()).map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Payer Scope <span className="text-red-500">*</span></label>
                  <div className="relative">
                  <Select value={payerScope} onValueChange={setPayerScope}>
                    <SelectTrigger className="w-full h-12 px-4 bg-card border-2 border-border/40 focus:outline-none focus:ring-0 focus:border-primary/40 rounded-2xl text-sm font-black appearance-none cursor-pointer shadow-sm transition-all">
                      <SelectValue placeholder="Select payer scope..." />
                    </SelectTrigger>
                    <SelectContent>
                      {options.payer_scopes.filter((opt) => String(opt || '').trim()).map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Authority Level <span className="text-red-500">*</span></label>
                  <div className="relative">
                  <Select value={authorityLevel} onValueChange={setAuthorityLevel}>
                    <SelectTrigger className="w-full h-12 px-4 bg-card border-2 border-border/40 focus:outline-none focus:ring-0 focus:border-primary/40 rounded-2xl text-sm font-black appearance-none cursor-pointer shadow-sm transition-all">
                      <SelectValue placeholder="Select authority level..." />
                    </SelectTrigger>
                    <SelectContent>
                      {options.authority_levels.filter((optValue) => String(optValue || '').trim()).map(optValue => (
                        <SelectItem key={optValue} value={String(optValue)}>
                          {optValue} — {getAuthorityLabel(optValue)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-500/10 text-red-600 border-2 border-red-500/20 px-5 py-4 rounded-2xl text-xs font-black animate-in shake">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Prompts Editing */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <MessageSquare className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Extraction Prompts</p>
            </div>

            {isFetchingPrompts ? (
              <div className="py-20 flex flex-col items-center gap-3 animate-pulse opacity-40">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest">Loading Prompts...</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Chunk Summary Prompt */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Chunk Summary</span>
                    <button
                      onClick={() => setEditMode(p => ({ ...p, chunk_summary: !p.chunk_summary }))}
                      className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                    >
                      {editMode.chunk_summary ? 'Close' : 'Edit'}
                    </button>
                  </div>
                  <div className="relative group">
                    <textarea
                      value={prompts.chunk_summary}
                      onChange={(e) => setPrompts(p => ({ ...p, chunk_summary: e.target.value }))}
                      disabled={!editMode.chunk_summary}
                      className={`w-full h-32 bg-muted/10 border-2 border-border/40 rounded-2xl p-4 text-[11px] font-medium leading-relaxed font-mono resize-none transition-all outline-none ${
                        editMode.chunk_summary ? 'border-primary/40 bg-white ring-4 ring-primary/5' : 'text-muted-foreground/60'
                      }`}
                    />
                    {editMode.chunk_summary && (
                      <Button
                        onClick={() => handleUpdatePrompt('chunk_summary')}
                        className="absolute bottom-3 right-3 h-8 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                      >
                        <Save className="w-3 h-3 mr-1.5" /> Update
                      </Button>
                    )}
                  </div>
                </div>

                {/* Rules Extraction Prompt */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Rules Extraction</span>
                    <button
                      onClick={() => setEditMode(p => ({ ...p, rules_extraction: !p.rules_extraction }))}
                      className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                    >
                      {editMode.rules_extraction ? 'Close' : 'Edit'}
                    </button>
                  </div>
                  <div className="relative group">
                    <textarea
                      value={prompts.rules_extraction}
                      onChange={(e) => setPrompts(p => ({ ...p, rules_extraction: e.target.value }))}
                      disabled={!editMode.rules_extraction}
                      className={`w-full h-32 bg-muted/10 border-2 border-border/40 rounded-2xl p-4 text-[11px] font-medium leading-relaxed font-mono resize-none transition-all outline-none ${
                        editMode.rules_extraction ? 'border-primary/40 bg-white ring-4 ring-primary/5' : 'text-muted-foreground/60'
                      }`}
                    />
                    {editMode.rules_extraction && (
                      <Button
                        onClick={() => handleUpdatePrompt('rules_extraction')}
                        className="absolute bottom-3 right-3 h-8 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                      >
                        <Save className="w-3 h-3 mr-1.5" /> Update
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1 h-14 rounded-2xl font-black border-border/60 hover:bg-muted text-base transition-all">
            Discard
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || isFetchingOptions || !file || !disease.trim() || !docType || !payerScope || !authorityLevel} 
            className="flex-1 h-14 rounded-2xl font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 text-base gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            {loading ? 'Processing...' : (isFetchingOptions ? 'Loading options...' : 'Upload & Start Analysis')}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const SuperAdminDocuments = () => {
  // Get current logged-in user id from redux store
  const authUser = useSelector((state) => state.auth?.user);
  const superAdminId = authUser?.user_id || authUser?.id || '';

  const [documents, setDocuments]     = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState('');
  const [showUpload, setShowUpload]   = useState(false);
  const [deletingId, setDeletingId]   = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, documentId: null, filename: '' });
  const [viewerDoc, setViewerDoc]     = useState(null); // ← NEW: document viewer state

  // Polling map: { [document_id]: intervalId }
  const pollingMap = useRef({});

  // ── Background builds after ingestion ──
  const triggerPostIngestionBuilds = useCallback(async (disease) => {
    if (!disease || !superAdminId) return;
    const diseaseLower = disease.toLowerCase();
    
    console.log(`Triggering background post-ingestion builds for ${diseaseLower}...`);
    
    const hcpcsUrl = `${BASE_URL}/admin/config/${diseaseLower}/build-hcpcs-reference`;
    const mergeUrl = `${BASE_URL}/admin/rules/${diseaseLower}/build-merge-suggestions`;
    
    const headers = {
      'x-user-id': superAdminId,
      'Content-Type': 'application/json',
    };
    const body = JSON.stringify({ user_id: superAdminId });

    // Fire and forget in parallel
    Promise.all([
      fetch(hcpcsUrl, { method: 'POST', headers, body }),
      fetch(mergeUrl, { method: 'POST', headers, body })
    ]).then(() => {
      console.log(`Successfully triggered background builds for ${diseaseLower}`);
    }).catch((err) => {
      console.error(`Failed to trigger background builds for ${diseaseLower}:`, err);
    });
  }, [superAdminId]);

  // ── Fetch full list ──
  const fetchDocuments = useCallback(async () => {
    if (!superAdminId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/admin/documents/?disease=lymphedema`, {
        headers: { 'x-user-id': superAdminId },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error('Failed to load documents');
      setDocuments(data.documents || []);
      setFetchError('');
    } catch (e) {
      setFetchError(e.message || 'Could not load documents.');
    } finally {
      setLoading(false);
    }
  }, [superAdminId]);

  useEffect(() => {
    fetchDocuments();
    return () => {
      // Clean up all polling intervals on unmount
      Object.values(pollingMap.current).forEach(clearInterval);
    };
  }, [fetchDocuments]);

  // ── Poll a single document status ──
  const startPolling = useCallback((documentId) => {
    if (pollingMap.current[documentId]) return; // already polling

    const interval = setInterval(async () => {
      try {
        const res  = await fetch(`${BASE_URL}/admin/documents/${documentId}/status`, {
          headers: { 'x-user-id': superAdminId },
        });
        const data = await res.json();
        if (!data.success) return;

        setDocuments((prev) =>
          prev.map((d) =>
            d.document_id === documentId
              ? {
                  ...d,
                  status:       data.status,
                  step:         data.step,
                  step_message: data.step_message,
                  chunks_added: data.chunks_added,
                  rules_added:  data.rules_added,
                  error_message: data.error_message,
                }
              : d
          )
        );

        // Stop polling when terminal state reached
        if (data.status === 'complete' || data.status === 'failed') {
          clearInterval(pollingMap.current[documentId]);
          delete pollingMap.current[documentId];

          if (data.status === 'complete') {
            // Trigger background builds after successful ingestion
            setDocuments(prev => {
              const doc = prev.find(d => d.document_id === documentId);
              if (doc && doc.disease) {
                triggerPostIngestionBuilds(doc.disease);
              }
              return prev;
            });
          }
        }
      } catch {
        // silently ignore polling errors
      }
    }, 4000); // poll every 4 s

    pollingMap.current[documentId] = interval;
  }, [superAdminId]);

  // Auto-start polling for any in-progress docs after list fetch
  useEffect(() => {
    documents.forEach((doc) => {
      if (doc.status === 'processing' || doc.status === 'uploading') {
        startPolling(doc.document_id);
      }
    });
  }, [documents, startPolling]);

  // ── Handle upload success ──
  const handleUploaded = (uploadResponse) => {
    // Optimistically add the new document
    const newDoc = {
      document_id:  uploadResponse.document_id,
      filename:     uploadResponse.filename,
      disease:      uploadResponse.disease || '',
      doc_type:     uploadResponse.doc_type || '',
      authority_level: uploadResponse.authority_level || '',
      status:       uploadResponse.status || 'uploading',
      step:         0,
      step_message: '',
      chunks_added: 0,
      rules_added:  0,
      error_message: null,
      created_at:   new Date().toISOString(),
    };
    setDocuments((prev) => [newDoc, ...prev]);
    startPolling(uploadResponse.document_id);
  };

  // ── Delete document ──
  const handleDelete = async () => {
    const documentId = deleteConfirm.documentId;
    if (!documentId) return;
    
    setDeletingId(documentId);
    try {
      const res = await fetch(`${BASE_URL}/admin/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id':    superAdminId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: superAdminId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');

      // Stop polling if running
      if (pollingMap.current[documentId]) {
        clearInterval(pollingMap.current[documentId]);
        delete pollingMap.current[documentId];
      }
      setDocuments((prev) => prev.filter((d) => d.document_id !== documentId));
      setDeleteConfirm({ open: false, documentId: null, filename: '' });
    } catch (e) {
      setFetchError(e.message || 'Could not delete document.');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Filtered list ──
  const filteredDocuments = documents.filter((doc) => {
    const q = searchQuery.toLowerCase();
    return (
      (doc.filename   || '').toLowerCase().includes(q) ||
      (doc.disease    || '').toLowerCase().includes(q) ||
      (doc.doc_type   || '').toLowerCase().includes(q)
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <DeleteConfirmDialog
        open={deleteConfirm.open}
        title="Delete Document"
        description={`Are you sure you want to delete "${deleteConfirm.filename}"? This will also remove all associated rules and chunks. This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, documentId: null, filename: '' })}
        loading={!!deletingId}
      />
      {showUpload && (
        <UploadModal
          superAdminId={superAdminId}
          onClose={() => setShowUpload(false)}
          onUploaded={handleUploaded}
        />
      )}
      <DocumentViewerModal
        open={!!viewerDoc}
        doc={viewerDoc}
        onClose={() => setViewerDoc(null)}
      />

      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
            <FileText className="w-3.5 h-3.5" /> Document Central
          </div>
          <h1 className="text-3xl font-black tracking-tight">All Documents</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Monitor and manage all processed medical documentation
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <Button
            onClick={() => setShowUpload(true)}
            className="h-11 px-6 rounded-2xl font-black text-sm gap-2 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95"
          >
            <Upload className="w-4 h-4" /> Upload Document
          </Button>
        </div>
      </div>

      {/* ── Search & Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-3 relative group">
          <Search className="absolute left-5 top-[30px] -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-all text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <Input
            placeholder="Search documents by name, disease, or type…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-14 h-14 bg-card border-2 border-border/40 focus:border-primary/40 rounded-[1.25rem] transition-all shadow-sm focus:shadow-md text-sm font-medium placeholder:text-muted-foreground/40"
          />
        </div>
        <Card className="border-2 border-border/40 rounded-[1.25rem] shadow-sm hover:shadow-md transition-all overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-primary">
            <FileText className="w-16 h-16" />
          </div>
          <CardContent className="p-4 flex flex-col justify-center h-full relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Total Files</p>
            <p className="text-3xl font-black tracking-tighter text-primary">{filteredDocuments.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Error banner ── */}
      {fetchError && (
        <div className="flex items-center gap-3 bg-red-500/10 text-red-600 border border-red-500/20 px-5 py-4 rounded-2xl text-sm font-bold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {fetchError}
          <button onClick={fetchDocuments} className="ml-auto underline underline-offset-2 text-xs font-black hover:opacity-70 transition-opacity">
            Retry
          </button>
        </div>
      )}

      {/* ── Documents List ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between ml-1">
          <div className="flex items-center gap-3">
            <h2 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Latest Documents</h2>
            <div className="h-px w-12 bg-border" />
          </div>
          <p className="text-[10px] font-medium text-muted-foreground italic bg-muted/30 px-3 py-1 rounded-full">
            Recent activity and processing status
          </p>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center gap-4 border-2 border-dashed border-border/40 rounded-[2.5rem] bg-muted/5">
            <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center shadow-inner">
              <Clock className="w-8 h-8 text-primary animate-spin" style={{ animationDuration: '2s' }} />
            </div>
            <p className="font-black text-muted-foreground animate-pulse">Synchronizing documents…</p>
          </div>
        ) : !superAdminId ? (
          <div className="py-24 flex flex-col items-center gap-6 border-2 border-dashed border-border/40 rounded-[2.5rem] bg-amber-500/5">
            <div className="w-20 h-20 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center shadow-inner">
              <Users className="w-10 h-10 text-amber-500" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-black text-xl text-amber-600">Waiting for Authentication</p>
              <p className="text-sm text-muted-foreground/60 font-medium max-w-xs mx-auto">
                Unable to retrieve your user ID. Please check your login status.
              </p>
            </div>
            <Button onClick={() => window.location.reload()} variant="outline" className="rounded-2xl px-8 h-12 font-black border-amber-500/20 text-amber-600 hover:bg-amber-500/5 transition-all active:scale-95">
              Refresh Page
            </Button>
          </div>
        ) : filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.document_id}
                className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-card border-2 border-border/40 hover:border-primary/20 rounded-[2rem] transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 shadow-sm"
              >
                {/* Left: icon + info */}
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-inner shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <FileText className="w-7 h-7 text-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-black text-lg tracking-tight group-hover:text-primary transition-colors leading-tight">
                      {doc.filename || '—'}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      {(doc.disease || doc.doc_type) && (
                        <span className="bg-primary/5 text-primary border-2 border-primary/10 font-black px-3 py-1 rounded-xl text-[10px] uppercase tracking-widest shadow-sm">
                          {doc.doc_type
                            ? doc.doc_type.replace('_', ' ')
                            : doc.disease}
                        </span>
                      )}
                      {doc.disease && doc.doc_type && (
                        <span className="bg-muted/40 text-muted-foreground border border-border/40 font-bold px-3 py-1 rounded-xl text-[10px] uppercase tracking-widest">
                          {doc.disease}
                        </span>
                      )}
                      {doc.authority_level && (
                        <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 font-black px-3 py-1 rounded-xl text-[10px] uppercase tracking-widest shadow-sm">
                          {getAuthorityLabel(doc.authority_level)}
                        </span>
                      )}
                      <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/60">
                        {doc.chunks_added > 0 && (
                          <>
                            <span>{doc.chunks_added} chunks</span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                          </>
                        )}
                        {doc.rules_added > 0 && (
                          <>
                            <span>{doc.rules_added} rules</span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                          </>
                        )}
                        <span>{formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: user + status + actions */}
                <div className="flex items-center justify-between md:justify-end gap-6 mt-6 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 border-border/40">
                  <div className="flex items-center gap-4">
                    <StatusBadge status={doc.status} stepMessage={doc.step_message} />

                    {/* Delete */}
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={deletingId === doc.document_id}
                      onClick={() => setDeleteConfirm({ open: true, documentId: doc.document_id, filename: doc.filename })}
                      className="w-10 h-10 rounded-xl border-border/60 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all active:scale-95 shadow-sm"
                    >
                      {deletingId === doc.document_id
                        ? <Clock className="w-4 h-4 animate-spin" style={{ animationDuration: '1s' }} />
                        : <Trash2 className="w-4 h-4" />}
                    </Button>

                    {/* View */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setViewerDoc(doc)}
                      className="w-10 h-10 rounded-xl border-border/60 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all active:scale-95 shadow-sm"
                    >
                      <Eye className="w-5 h-5" />
                    </Button>

                    {/* Details */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-10 h-10 rounded-xl border-border/60 hover:bg-muted transition-all active:scale-95 shadow-sm"
                    >
                      <ArrowUpRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 flex flex-col items-center gap-6 animate-in zoom-in-95 border-2 border-dashed border-border/40 rounded-[2.5rem] bg-muted/5">
            <div className="w-20 h-20 bg-muted rounded-[2.5rem] flex items-center justify-center shadow-inner opacity-20">
              <Search className="w-10 h-10" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-black text-xl text-muted-foreground">No documents found</p>
              <p className="text-sm text-muted-foreground/60 font-medium max-w-xs mx-auto">
                Try adjusting your search terms or filters to find what you are looking for.
              </p>
            </div>
            <Button
              onClick={() => setSearchQuery('')}
              variant="outline"
              className="rounded-2xl px-8 h-12 font-black border-border/60 transition-all active:scale-95"
            >
              Clear Search
            </Button>
          </div>
        )}
      </div>
    </div>
  </>
);
};

export default SuperAdminDocuments;
