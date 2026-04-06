import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Settings, FileText, Plus, Save, CheckCircle2, AlertCircle,
  RefreshCw, Loader2, X, Edit2, Trash2, ChevronDown, ChevronUp,
  GripVertical, ToggleLeft, ToggleRight, UserCircle2, ShieldCheck,
  Layers3, Bot, Tag, Anchor, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { useSelector } from 'react-redux';

/* ─────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────── */
const BASE_URL = 'https://kenqo-api-409744260053.asia-south1.run.app';
const DISEASE  = 'lymphedema';

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const toLabel = (s) => {
  if (typeof s !== 'string') return String(s || '');
  return s
    .replace(/_/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

const PROMPT_FIELDS = [
  { key: 'system_persona',          label: 'System Persona',          Icon: UserCircle2, accent: 'text-sky-500',    bg: 'bg-sky-500/10'    },
  { key: 'dual_layer_task',         label: 'Dual Layer Task',         Icon: Layers3,     accent: 'text-violet-500', bg: 'bg-violet-500/10' },
  { key: 'operational_constraints', label: 'Operational Constraints', Icon: ShieldCheck, accent: 'text-amber-500',  bg: 'bg-amber-500/10'  },
  { key: 'output_schema',           label: 'Output Schema',           Icon: Sparkles,    accent: 'text-rose-500',   bg: 'bg-rose-500/10'   },
];

const DOC_TYPE_COLORS = [
  'text-primary bg-primary/10 border-primary/20',
  'text-blue-500 bg-blue-500/10 border-blue-500/20',
  'text-purple-500 bg-purple-500/10 border-purple-500/20',
  'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  'text-amber-500 bg-amber-500/10 border-amber-500/20',
  'text-rose-500 bg-rose-500/10 border-rose-500/20',
  'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
  'text-orange-500 bg-orange-500/10 border-orange-500/20',
];
const getColor = (idx) => DOC_TYPE_COLORS[idx % DOC_TYPE_COLORS.length];

/* ─────────────────────────────────────────────
   SKELETON LOADERS
───────────────────────────────────────────── */
const PromptSectionSkeleton = () => (
  <div className="border border-border/40 rounded-2xl overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 bg-muted/20">
      <div className="flex items-center gap-3">
        <Skeleton className="w-7 h-7 rounded-lg" />
        <Skeleton className="h-4 w-36 rounded" />
      </div>
      <Skeleton className="w-5 h-5 rounded" />
    </div>
  </div>
);

const DocTypeSkeleton = () => (
  <div className="border border-border/40 rounded-2xl p-4 space-y-3 bg-card animate-pulse">
    <div className="flex items-center gap-3">
      <Skeleton className="w-8 h-8 rounded-xl" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-32 rounded" />
        <Skeleton className="h-2.5 w-48 rounded" />
      </div>
      <Skeleton className="h-5 w-9 rounded-full" />
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-6 w-16 rounded-lg" />
      <Skeleton className="h-6 w-16 rounded-lg" />
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   AGENT BADGE (draggable)
───────────────────────────────────────────── */
const AgentBadge = ({ agentId, agentName, docTypeName, onDragStart }) => (
  <div
    draggable
    onDragStart={(e) => {
      e.dataTransfer.effectAllowed = 'move';
      onDragStart(e, { agentId, fromDocType: docTypeName });
    }}
    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold cursor-grab active:cursor-grabbing select-none hover:bg-primary/20 transition-colors"
    title={`Drag to move Agent #${agentId} to another document type`}
  >
    <GripVertical className="w-3 h-3 opacity-50" />
    <Bot className="w-3 h-3" />
    <span>{agentName || `#${agentId}`}</span>
  </div>
);

/* ─────────────────────────────────────────────
   ADD / EDIT DOC TYPE MODAL
───────────────────────────────────────────── */
const DocTypeModal = ({ docType, allAgents, userId, token, onClose, onSaved }) => {
  const isEdit = !!docType;
  const [form, setForm] = useState({
    name:        docType?.name        ?? '',
    description: docType?.description ?? '',
    active:      docType?.active      ?? true,
    anchors:     docType?.anchors     ?? [],
    agents:      docType?.agents      ?? [],
  });
  const [newAnchor, setNewAnchor] = useState('');
  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState(null);

  const toggleAgent = (id) =>
    setForm(f => ({
      ...f,
      agents: f.agents.includes(id)
        ? f.agents.filter(a => a !== id)
        : [...f.agents, id],
    }));

  const addAnchor = () => {
    if (!newAnchor.trim()) return;
    if (form.anchors.includes(newAnchor.trim())) {
      setNewAnchor('');
      return;
    }
    setForm(f => ({ ...f, anchors: [...f.anchors, newAnchor.trim()] }));
    setNewAnchor('');
  };

  const removeAnchor = (val) =>
    setForm(f => ({ ...f, anchors: f.anchors.filter(a => a !== val) }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/classifier/document-types`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          user_id: userId,
          document_type: {
            name:        form.name.trim(),
            description: form.description.trim(),
            active:      form.active,
            anchors:     form.anchors,
            agents:      form.agents,
          },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onSaved({
        name:        form.name.trim(),
        description: form.description.trim(),
        active:      form.active,
        anchors:     form.anchors,
        agents:      form.agents,
      });
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-background border border-border/60 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <p className="font-black text-lg tracking-tight">{isEdit ? `Edit: ${toLabel(docType.name)}` : 'New Document Type'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm font-bold animate-in shake duration-300">
              <AlertCircle className="w-5 h-5 shrink-0" />{error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.1em]">Name *</label>
            <input
              className="w-full h-12 px-4 rounded-xl border border-border/60 bg-muted/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:font-normal"
              value={isEdit ? toLabel(form.name) : form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Prescription"
              disabled={isEdit}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.1em]">Description</label>
            <textarea
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-border/60 bg-muted/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none leading-relaxed"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Physician letterhead + signature block + diagnosis codes + items ordered + NPI"
            />
          </div>

          {/* Anchors */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.1em] flex items-center gap-2">
                <Anchor className="w-3.5 h-3.5" />
                Classification Anchors
              </label>
              <span className="text-[10px] text-muted-foreground font-medium italic">Unique text patterns for classification</span>
            </div>
            
            <div className="flex gap-2 p-1.5 rounded-2xl bg-muted/20 border border-border/40 group focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/5 transition-all">
              <input
                className="flex-1 h-10 px-3 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/50"
                value={newAnchor}
                onChange={e => setNewAnchor(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAnchor())}
                placeholder="Type anchor (e.g. 'Prescription Date')..."
              />
              <Button 
                onClick={addAnchor} 
                disabled={!newAnchor.trim()}
                className="h-10 px-4 rounded-xl font-black text-xs gap-2 bg-primary hover:bg-primary/90 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add Anchor
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[50px] p-3.5 rounded-2xl border-2 border-dashed border-border/30 bg-muted/5">
              {form.anchors.length > 0 ? (
                form.anchors.map(a => (
                  <div key={a} className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background border border-border/60 text-xs font-bold hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all shadow-sm animate-in zoom-in-95">
                    <Tag className="w-3 h-3 opacity-40 group-hover:opacity-100" />
                    <span className="font-mono">{a}</span>
                    <button 
                      onClick={() => removeAnchor(a)} 
                      className="ml-1 p-0.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="w-full flex flex-col items-center justify-center py-2 text-muted-foreground/40 gap-1">
                  <Anchor className="w-6 h-6 opacity-20" />
                  <p className="text-[10px] italic">No anchors yet. Add text that is unique to this doc type.</p>
                </div>
              )}
            </div>
          </div>

          {/* Agents */}
          {allAgents.length > 0 && (
            <div className="space-y-3">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.1em] flex items-center gap-2">
                <Bot className="w-3.5 h-3.5" />
                Assigned Agents
              </label>
              <div className="flex flex-wrap gap-2.5">
                {allAgents.map(ag => {
                  const selected = form.agents.includes(ag.agent_id);
                  return (
                    <button
                      key={ag.agent_id}
                      onClick={() => toggleAgent(ag.agent_id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-black transition-all shadow-sm
                        ${selected
                          ? 'bg-primary/10 border-primary/40 text-primary ring-2 ring-primary/5'
                          : 'bg-muted/30 border-border/40 text-muted-foreground hover:border-primary/20 hover:text-foreground grayscale hover:grayscale-0 opacity-70 hover:opacity-100'}`}
                    >
                      <Bot className="w-3.5 h-3.5" />
                      #{ag.agent_id} {ag.agent_name}
                      {selected && <CheckCircle2 className="w-3.5 h-3.5 fill-primary text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active toggle */}
          <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${form.active ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-muted/20 border-border/40'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${form.active ? 'bg-emerald-500/20 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-sm font-black ${form.active ? 'text-emerald-700' : 'text-foreground'}`}>Include in Pipeline</p>
                <p className="text-[11px] text-muted-foreground font-medium">Activate this document type for real-time classification</p>
              </div>
            </div>
            <button
              onClick={() => setForm(f => ({ ...f, active: !f.active }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all shadow-inner
                ${form.active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform
                ${form.active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-border/50 bg-muted/5 shrink-0">
          <button onClick={onClose} className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors px-2">Cancel</button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-11 px-8 rounded-xl text-sm font-black gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   CLASSIFIER PROMPT EDITOR (accordion)
───────────────────────────────────────────── */
const PromptEditor = ({ promptData, userId, token, onChange }) => {
  const [expanded, setExpanded] = useState({ system_persona: true });
  const [edits,    setEdits]    = useState({ ...promptData });
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState(null);

  // sync if promptData changes from parent (after fetch)
  useEffect(() => { setEdits({ ...promptData }); }, [promptData]);

  const handleSave = async () => {
    setSaving(true); setSaved(false); setError(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/classifier/prompt`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ user_id: userId, updates: edits }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaved(true);
      onChange?.(edits);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* banners */}
      {saved && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" /> Classifier prompt updated successfully!
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {PROMPT_FIELDS.map(({ key, label, Icon, accent, bg }) => (
        <div key={key} className="border border-border/40 rounded-2xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-3.5 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
            onClick={() => setExpanded(p => ({ ...p, [key]: !p[key] }))}
          >
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${bg}`}>
                <Icon className={`w-3.5 h-3.5 ${accent}`} />
              </div>
              <span className="text-sm font-bold">{label}</span>
            </div>
            {expanded[key] ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {expanded[key] && (
            <div className="p-4 bg-background">
              <textarea
                rows={8}
                className="w-full text-xs font-mono bg-muted/20 border border-border/40 rounded-xl p-3 text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
                value={edits[key] ?? ''}
                onChange={e => setEdits(p => ({ ...p, [key]: e.target.value }))}
                placeholder={`Enter ${label.toLowerCase()}…`}
              />
            </div>
          )}
        </div>
      ))}

      <div className="flex justify-end pt-1">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-9 px-5 rounded-xl text-sm font-bold gap-2 bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20"
        >
          {saving
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
            : <><Save className="w-3.5 h-3.5" /> Save Prompt Changes</>}
        </Button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   DOCUMENT TYPE CARD (drag-drop target + source)
───────────────────────────────────────────── */
const DocTypeCard = ({
  docType, colorClass, allAgents, agentMap,
  userId, token,
  onToggle, onEdit, onDelete,
  onAgentDragStart, onAgentDrop,
  isTogglingName,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const isActive = docType.active;

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const payload = JSON.parse(e.dataTransfer.getData('application/json'));
      if (payload.fromDocType !== docType.name) {
        onAgentDrop(payload, docType.name);
      }
    } catch {}
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border rounded-2xl p-4 bg-card transition-all duration-200 group
        ${isActive ? 'border-border/50 shadow-sm' : 'border-border/30 opacity-65'}
        ${isDragOver ? 'border-primary/60 bg-primary/5 shadow-md shadow-primary/10 scale-[1.01]' : ''}`}
    >
      {/* Top row */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${colorClass}`}>
          <FileText className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-sm font-bold text-foreground">{toLabel(docType.name)}</p>
            {!isActive && (
              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                inactive
              </span>
            )}
          </div>
          {docType.description && (
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 italic">
              {docType.description}
            </p>
          )}
        </div>
        {/* Toggle */}
        <button
          onClick={() => onToggle(docType.name, isActive)}
          disabled={isTogglingName === docType.name}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 mt-0.5
            ${isTogglingName === docType.name ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
            ${isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform
            ${isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* Anchors */}
      {docType.anchors?.length > 0 && (
        <div className="mb-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1.5 flex items-center gap-1">
            <Anchor className="w-2.5 h-2.5" /> Anchors
          </p>
          <div className="flex flex-wrap gap-1">
            {docType.anchors.map(anchor => (
              <span key={anchor} className="text-[10px] font-semibold px-2 py-0.5 bg-muted/60 rounded-md text-muted-foreground font-mono">
                {anchor}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Agents zone */}
      <div className="mb-3">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1.5 flex items-center gap-1">
          <Bot className="w-2.5 h-2.5" /> Agents
          <span className="text-[9px] text-muted-foreground/40 font-normal normal-case tracking-normal ml-1">— drag to reassign</span>
        </p>
        <div className="min-h-[32px] flex flex-wrap gap-1.5 p-2 rounded-xl border border-dashed border-border/40 bg-muted/10 transition-colors">
          {docType.agents?.length > 0 ? (
            docType.agents.map(agId => (
              <AgentBadge
                key={agId}
                agentId={agId}
                agentName={agentMap[agId]?.agent_name}
                docTypeName={docType.name}
                onDragStart={(e, payload) => {
                  e.dataTransfer.setData('application/json', JSON.stringify(payload));
                  onAgentDragStart(payload);
                }}
              />
            ))
          ) : (
            <span className="text-[10px] text-muted-foreground/40 italic px-1">
              {isDragOver ? 'Drop agent here' : 'No agents assigned — drop here'}
            </span>
          )}
          {isDragOver && docType.agents?.length > 0 && (
            <span className="text-[10px] text-primary/60 italic px-1 animate-pulse">Drop to add agent</span>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-1">
        <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest
          ${isActive ? 'text-emerald-500' : 'text-muted-foreground'}`}>
          {isTogglingName === docType.name
            ? <><Loader2 className="w-3 h-3 animate-spin" /> Updating…</>
            : isActive
              ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active</>
              : <><span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Inactive</>}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost" size="sm"
            onClick={() => onEdit(docType)}
            className="h-7 px-2.5 text-xs rounded-lg hover:bg-primary/10 hover:text-primary font-bold gap-1"
          >
            <Edit2 className="w-3 h-3" /> Edit
          </Button>
          <Button
            variant="ghost" size="sm"
            onClick={() => onDelete(docType.name)}
            className="h-7 px-2.5 text-xs rounded-lg hover:bg-destructive/10 hover:text-destructive font-bold gap-1"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   DELETE CONFIRM MODAL
───────────────────────────────────────────── */
const DeleteModal = ({ name, userId, token, onClose, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState(null);

  const handleDelete = async () => {
    setDeleting(true); setError(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/classifier/document-types`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ user_id: userId, name }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onDeleted(name);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-background border border-border/60 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-destructive/10">
            <Trash2 className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="font-bold text-sm">Delete Document Type</p>
            <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Are you sure you want to delete <strong className="text-foreground">{name}</strong>?
        </p>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm mb-3">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} className="h-9 px-4 rounded-xl text-sm font-bold">Cancel</Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="h-9 px-4 rounded-xl text-sm font-bold gap-2 bg-destructive hover:bg-destructive/90 text-white"
          >
            {deleting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting…</> : <><Trash2 className="w-3.5 h-3.5" /> Delete</>}
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
const SuperAdminClassifier = () => {
  const { user, token } = useSelector((s) => s.auth);
  const userId = user?.id ?? user?.user_id ?? user?.sub ?? '';

  const [classifier,    setClassifier]   = useState(null);
  const [agents,        setAgents]       = useState([]);
  const [loading,       setLoading]      = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error,         setError]        = useState(null);
  const [activeTab,     setActiveTab]    = useState('types'); // 'types' | 'prompt'
  const [togglingName,  setTogglingName] = useState(null);
  const [docTypeModal,  setDocTypeModal] = useState(null);   // null | 'new' | {docType obj}
  const [deleteModal,   setDeleteModal]  = useState(null);   // null | name string
  const [draggingAgent, setDraggingAgent]= useState(null);
  const [toast,         setToast]         = useState(null);    // null | { message, type }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── build agent name map ── */
  const agentMap = Object.fromEntries(agents.map(a => [a.agent_id, a]));

  /* ── fetch classifier ── */
  const fetchClassifier = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/classifier`, {
        headers: {
          'x-user-id': userId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setClassifier(data.classifier ?? data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  }, [userId, token]);

  /* ── fetch agents for names ── */
  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/agents`, {
        headers: {
          'x-user-id': userId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setAgents(data.agents ?? []);
    } catch {}
  }, [userId, token]);

  useEffect(() => {
    fetchClassifier();
    fetchAgents();
  }, [fetchClassifier, fetchAgents]);

  /* ── toggle doc type ── */
  const handleToggle = async (name, currentActive) => {
    if (togglingName) return;
    const newActive = !currentActive;
    setTogglingName(name);
    // optimistic
    setClassifier(c => ({
      ...c,
      document_types: c.document_types.map(dt =>
        dt.name === name ? { ...dt, active: newActive } : dt
      ),
    }));
    try {
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/classifier/document-types/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ user_id: userId, name, active: newActive }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      // revert
      setClassifier(c => ({
        ...c,
        document_types: c.document_types.map(dt =>
          dt.name === name ? { ...dt, active: currentActive } : dt
        ),
      }));
    } finally {
      setTogglingName(null);
    }
  };

  /* ── save doc type (add/edit) ── */
  const handleDocTypeSaved = (updatedDocType) => {
    setClassifier(c => {
      const exists = c.document_types.some(dt => dt.name === updatedDocType.name);
      return {
        ...c,
        document_types: exists
          ? c.document_types.map(dt => dt.name === updatedDocType.name ? updatedDocType : dt)
          : [...c.document_types, updatedDocType],
      };
    });
  };

  /* ── delete doc type ── */
  const handleDocTypeDeleted = (name) => {
    setClassifier(c => ({
      ...c,
      document_types: c.document_types.filter(dt => dt.name !== name),
    }));
  };

  /* ── drag-drop agents between doc types ── */
  const handleAgentDrop = async (payload, targetDocTypeName) => {
    const { agentId, fromDocType } = payload;
    if (!classifier) return;
    setDraggingAgent(null);

    const targetDocType = classifier.document_types.find(d => d.name === targetDocTypeName);
    const sourceDocType = classifier.document_types.find(d => d.name === fromDocType);
    
    if (!targetDocType || !sourceDocType) return;
    if (targetDocType.agents?.includes(agentId)) return;

    setTogglingName(targetDocTypeName);
    try {
      // 1. Calculate updated agent arrays
      const updatedSourceAgents = (sourceDocType.agents || []).filter(id => id !== agentId);
      const updatedTargetAgents = [...(targetDocType.agents || []), agentId];

      // 2. Update local state optimistically
      setClassifier(prev => ({
        ...prev,
        document_types: prev.document_types.map(dt => {
          if (dt.name === fromDocType) return { ...dt, agents: updatedSourceAgents };
          if (dt.name === targetDocTypeName) return { ...dt, agents: updatedTargetAgents };
          return dt;
        })
      }));

      // 3. API calls to update both source and target document types
      // We use the same endpoint but different names in the body
      const headers = {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      await Promise.all([
        // Update Target
        fetch(`${BASE_URL}/admin/config/${DISEASE}/classifier/agents`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ user_id: userId, name: targetDocTypeName, agents: updatedTargetAgents }),
        }).then(r => { if (!r.ok) throw new Error(`Failed to update ${targetDocTypeName}`); return r; }),
        
        // Update Source
        fetch(`${BASE_URL}/admin/config/${DISEASE}/classifier/agents`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ user_id: userId, name: fromDocType, agents: updatedSourceAgents }),
        }).then(r => { if (!r.ok) throw new Error(`Failed to update ${fromDocType}`); return r; })
      ]);

      showToast(`Agent #${agentId} moved to ${toLabel(targetDocTypeName)}`);
    } catch (e) {
      console.error('Drag Drop Error:', e);
      showToast(e.message || 'Failed to reassign agent', 'error');
      fetchClassifier(); // Revert on error by re-fetching
    } finally {
      setTogglingName(null);
    }
  };

  /* ─────────────────────────────────────────
     LOADING STATE
  ───────────────────────────────────────── */
  if (isInitialLoading) {
    return (
      <div className="h-[calc(100vh-5.5rem)] lg:h-[calc(100vh-3rem)] flex flex-col items-center justify-center animate-in fade-in duration-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center relative">
            <Settings className="w-8 h-8 text-primary" />
            <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-2xl animate-spin" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold tracking-tight">Loading Classifier</h2>
            <p className="text-xs text-muted-foreground mt-1">Fetching document classification rules...</p>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────
     MAIN RENDER
  ───────────────────────────────────────── */
  const docTypes = classifier?.document_types ?? [];
  const promptData = classifier?.classifier_prompt ?? {};
  const activeCount = docTypes.filter(d => d.active).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[300] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-right-10 duration-300 border
          ${toast.type === 'error' ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Subsequent Loading Overlay */}
      {loading && !isInitialLoading && (
        <div className="fixed inset-0 z-[100] bg-background/40 backdrop-blur-[1px] flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-card border border-border/50 shadow-2xl rounded-2xl p-6 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-bold tracking-tight">Updating classifier list...</p>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {docTypeModal !== null && (
        <DocTypeModal
          docType={docTypeModal === 'new' ? null : docTypeModal}
          allAgents={agents}
          userId={userId}
          token={token}
          onClose={() => setDocTypeModal(null)}
          onSaved={handleDocTypeSaved}
        />
      )}
      {deleteModal && (
        <DeleteModal
          name={deleteModal}
          userId={userId}
          token={token}
          onClose={() => setDeleteModal(null)}
          onDeleted={handleDocTypeDeleted}
        />
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
            <Settings className="w-3.5 h-3.5" />
            Classification Engine
          </div>
          <h1 className="text-2xl font-black tracking-tight">Classifier</h1>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground text-sm">Document classification configuration</p>
            <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {DISEASE}
            </span>
            {classifier?.version && (
              <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-mono text-muted-foreground">
                v{classifier.version}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button variant="outline" onClick={fetchClassifier} className="h-9 px-3 rounded-xl text-sm font-bold gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button
            onClick={() => { setActiveTab('types'); setDocTypeModal('new'); }}
            className="h-9 px-4 rounded-xl text-sm font-bold gap-2 bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20"
          >
            <Plus className="w-3.5 h-3.5" /> Add Document Type
          </Button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">Failed to load classifier: {error}</span>
          <button onClick={fetchClassifier} className="text-xs font-bold underline underline-offset-2 hover:opacity-70 shrink-0">Retry</button>
        </div>
      )}

      {/* ── Meta stats ── */}
      {!error && classifier && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Doc Types',    value: docTypes.length,               color: 'text-foreground'       },
            { label: 'Active',       value: activeCount,                    color: 'text-emerald-500'      },
            { label: 'Inactive',     value: docTypes.length - activeCount,  color: 'text-muted-foreground' },
            { label: 'Last Updated', value: classifier.last_updated ?? '—', color: 'text-primary text-base' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border/50 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-1.5">{s.label}</p>
              <p className={`text-2xl font-black leading-none ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      {!error && classifier && (
        <>
          <div className="flex gap-1 p-1 bg-muted/30 rounded-xl w-fit border border-border/40">
            {[
              { key: 'types',  label: 'Document Types', icon: FileText },
              { key: 'prompt', label: 'Classifier Prompt', icon: Settings },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                  ${activeTab === key
                    ? 'bg-background text-primary shadow-sm border border-border/50'
                    : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* ── DOCUMENT TYPES TAB ── */}
          {activeTab === 'types' && (
            <div className="space-y-4">
              {/* drag instruction */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 border border-primary/15 rounded-xl text-xs text-primary/80 font-medium">
                <GripVertical className="w-3.5 h-3.5 shrink-0" />
                <span>
                  <strong>Drag agent badges</strong> between document type cards to reassign them. Changes save automatically.
                </span>
              </div>

              {docTypes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground border border-dashed border-border/40 rounded-2xl">
                  <FileText className="w-10 h-10 opacity-25" />
                  <p className="text-sm font-medium">No document types configured yet</p>
                  <Button variant="outline" size="sm" onClick={() => setDocTypeModal('new')} className="rounded-xl gap-2 font-bold">
                    <Plus className="w-3.5 h-3.5" /> Add First Document Type
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {docTypes.map((dt, idx) => (
                    <DocTypeCard
                      key={dt.name}
                      docType={dt}
                      colorClass={getColor(idx)}
                      allAgents={agents}
                      agentMap={agentMap}
                      userId={userId}
                      token={token}
                      onToggle={handleToggle}
                      onEdit={(d) => setDocTypeModal(d)}
                      onDelete={(name) => setDeleteModal(name)}
                      onAgentDragStart={setDraggingAgent}
                      onAgentDrop={handleAgentDrop}
                      isTogglingName={togglingName}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PROMPT TAB ── */}
          {activeTab === 'prompt' && (
            <PromptEditor
              promptData={promptData}
              userId={userId}
              token={token}
              onChange={(updates) => setClassifier(c => ({ ...c, classifier_prompt: { ...c.classifier_prompt, ...updates } }))}
            />
          )}
        </>
      )}
    </div>
  );
};

export default SuperAdminClassifier;