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
    <Dialog open={true} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xl rounded-3xl p-0 overflow-hidden flex flex-col max-h-[90vh] border-none shadow-2xl">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-border/40 shrink-0 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.08) 0%, transparent 100%)' }}>
          <div className="absolute top-0 right-0 p-8 opacity-5">
            {isEdit ? <Edit2 className="w-24 h-24" /> : <Plus className="w-24 h-24" />}
          </div>
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-inner shrink-0">
                {isEdit ? <Edit2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
              </div>
              <div>
                <DialogTitle className="font-black text-xl tracking-tight">
                  {isEdit ? 'Edit Doc Type' : 'Add Doc Type'}
                </DialogTitle>
                <p className="text-sm text-muted-foreground font-medium mt-0.5">
                  {isEdit ? `Modify configuration for ${toLabel(docType.name)}` : 'Define a new category for document routing.'}
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-8 py-6 flex-1 overflow-y-auto space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Document Type Name</label>
            <input
              className="w-full h-12 px-4 rounded-2xl border-2 border-border/40 bg-muted/5 text-sm font-mono focus:outline-none focus:border-primary/40 shadow-inner transition-all"
              value={isEdit ? toLabel(form.name) : form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. medical_report"
              disabled={isEdit}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 flex items-center justify-between">
              Anchors (Keywords)
              <span className="text-muted-foreground/40 normal-case font-medium">Add keywords that help identify this doc type</span>
            </label>
            <div className="flex flex-wrap gap-2 p-4 rounded-2xl border-2 border-border/40 bg-muted/5 shadow-inner min-h-[100px] transition-all focus-within:border-primary/40">
              {form.anchors.map((a, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary border-2 border-primary/20 shadow-sm animate-in zoom-in-95">
                  <span className="text-xs font-black">{a}</span>
                  <button onClick={() => removeAnchor(a)} className="hover:text-destructive transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <input
                className="bg-transparent border-none outline-none text-sm font-medium placeholder:text-muted-foreground/30 flex-1 min-w-[120px]"
                placeholder="Type and press Enter..."
                value={newAnchor}
                onChange={e => setNewAnchor(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAnchor())}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Assigned Extraction Agents</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allAgents.map(ag => {
                const selected = form.agents.includes(ag.agent_id);
                return (
                  <button
                    key={ag.agent_id}
                    onClick={() => toggleAgent(ag.agent_id)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all duration-300 ${
                      selected ? 'border-primary/40 bg-primary/5 shadow-md' : 'border-border/40 bg-muted/5 hover:border-border'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${selected ? 'bg-white' : 'bg-muted'}`}>
                      <Bot className={`w-5 h-5 ${selected ? 'text-primary' : 'text-muted-foreground/40'}`} />
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-black tracking-tight ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>{ag.agent_name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">ID #{ag.agent_id}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 border-2 border-destructive/20 rounded-2xl text-xs text-destructive font-black animate-in shake">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-border/40 bg-muted/10 flex justify-between items-center shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="text-sm font-black text-muted-foreground hover:text-foreground transition-colors px-2"
          >
            Cancel
          </button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-2xl font-black text-sm h-12 px-8 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 gap-2 transition-all active:scale-95"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : isEdit ? 'Update Type' : 'Create Type'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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

  const sections = [
    { key: 'system_persona',          label: 'System Persona',    icon: UserCircle2, color: 'text-primary',   bg: 'bg-primary/10' },
    { key: 'dual_layer_task',         label: 'Classification Task', icon: Layers3,     color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { key: 'operational_constraints', label: 'Constraints',         icon: ShieldCheck, color: 'text-amber-500',  bg: 'bg-amber-500/10' },
    { key: 'output_schema',           label: 'Output Structure',    icon: Sparkles,    color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {sections.map(({ key, label, icon: Icon, color, bg }) => (
          <div key={key} className="border-2 border-border/40 rounded-[1.5rem] overflow-hidden bg-card transition-all">
            <button
              className="w-full flex items-center justify-between px-6 py-4 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
              onClick={() => setExpanded(p => ({ ...p, [key]: !p[key] }))}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <span className="text-sm font-black tracking-tight">{label}</span>
                {edits[key] !== promptData[key] && (
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-sm">
                    Edited
                  </span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground/40 transition-transform duration-500 ${expanded[key] ? 'rotate-180' : ''}`} />
            </button>
            {expanded[key] && (
              <div className="p-5 bg-background animate-in slide-in-from-top-2 duration-300">
                <textarea
                  rows={6}
                  className="w-full text-xs font-mono bg-muted/10 border-2 border-border/40 rounded-2xl p-4 text-foreground resize-none focus:outline-none focus:border-primary/40 shadow-inner placeholder:text-muted-foreground/30 transition-all leading-relaxed"
                  value={edits[key] || ''}
                  onChange={e => setEdits(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={`Enter ${label.toLowerCase()} logic…`}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 pt-4">
        {saved && (
          <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-2xl text-emerald-600 text-xs font-black animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-5 h-5" />
            Classifier configuration updated successfully!
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-destructive/10 border-2 border-destructive/20 rounded-2xl text-destructive text-xs font-black animate-in shake">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}
        <Button
          onClick={handleSave}
          disabled={saving || JSON.stringify(edits) === JSON.stringify(promptData)}
          className="w-full h-14 rounded-[1.5rem] font-black text-sm bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 gap-3 transition-all active:scale-[0.98]"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Synchronizing Engine…' : 'Save Classifier Config'}
        </Button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   DOCUMENT TYPE CARD (drag-drop target + source)
───────────────────────────────────────────── */
function DocTypeCard({ docType, colorClass, agentMap, onToggle, onEdit, onDelete, onAgentDragStart, onAgentDrop, isTogglingName }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const isActive = docType.active !== false;

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const payload = JSON.parse(e.dataTransfer.getData('application/json'));
      onAgentDrop(payload, docType.name);
    } catch {}
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`group relative rounded-[2rem] border-2 p-6 transition-all duration-300 ${
        isDragOver ? 'border-primary bg-primary/5 scale-[1.02] shadow-2xl' :
        isActive ? 'bg-card border-border/40 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5' :
        'bg-muted/10 border-border/20 opacity-60 grayscale-[0.5]'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 shadow-inner transition-transform duration-500 group-hover:scale-110 ${colorClass}`}>
            <FileText className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-lg tracking-tight truncate group-hover:text-primary transition-colors leading-tight">{toLabel(docType.name)}</h3>
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest truncate">{docType.name}</p>
          </div>
        </div>
        <button
          onClick={() => onToggle(docType.name, isActive)}
          disabled={isTogglingName === docType.name}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all shadow-inner shrink-0 mt-1
            ${isTogglingName === docType.name ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
            ${isActive ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}
        >
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform
            ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Anchors */}
      {docType.anchors?.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-2.5 flex items-center gap-2">
            <Anchor className="w-3.5 h-3.5" /> Identification Anchors
          </p>
          <div className="flex flex-wrap gap-2">
            {docType.anchors.map(anchor => (
              <span key={anchor} className="text-[11px] font-bold px-3 py-1 bg-muted/50 rounded-xl text-muted-foreground border border-border/40 font-mono shadow-sm">
                {anchor}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Agents zone */}
      <div className="mb-5">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-2.5 flex items-center gap-2">
          <Bot className="w-3.5 h-3.5" /> Extraction Agents
        </p>
        <div className={`min-h-[48px] flex flex-wrap gap-2 p-3 rounded-2xl border-2 border-dashed transition-all duration-300 ${
          isDragOver ? 'border-primary/40 bg-primary/10' : 'border-border/40 bg-muted/5 group-hover:bg-muted/10'
        }`}>
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
            <span className="text-[11px] text-muted-foreground/40 italic px-2 py-1">
              {isDragOver ? 'Drop agent here' : 'No agents assigned — drop here'}
            </span>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-5 border-t border-border/10">
        <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
          isActive
            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
            : 'bg-muted text-muted-foreground border-border/50'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
          {isTogglingName === docType.name ? 'Updating…' : isActive ? 'Active' : 'Inactive'}
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
          <Button
            variant="outline" size="sm"
            onClick={() => onEdit(docType)}
            className="h-9 px-4 text-xs rounded-xl border-primary/20 text-primary hover:bg-primary hover:text-white font-black transition-all active:scale-95 shadow-sm"
          >
            <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => onDelete(docType.name)}
            className="h-9 px-4 text-xs rounded-xl border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white font-black transition-all active:scale-95 shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

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
    <Dialog open={true} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden flex flex-col border-none shadow-2xl">
        <div className="px-8 pt-8 pb-6 border-b border-border/40 shrink-0 relative overflow-hidden bg-destructive/5">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Trash2 className="w-24 h-24" />
          </div>
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center shadow-inner shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="font-black text-xl tracking-tight text-destructive">
                  Delete Doc Type
                </DialogTitle>
                <p className="text-sm text-muted-foreground font-medium mt-0.5">
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-8 py-6 space-y-4">
          <p className="text-sm font-medium text-foreground/70 leading-relaxed">
            Are you sure you want to delete <strong className="text-foreground font-black">{toLabel(name)}</strong>? This will remove all associated routing logic.
          </p>
          {error && (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-xs font-black animate-in shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="px-8 py-6 border-t border-border/40 bg-muted/10 flex justify-between items-center shrink-0">
          <button
            onClick={onClose}
            className="text-sm font-black text-muted-foreground hover:text-foreground transition-colors px-2"
          >
            Cancel
          </button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-2xl font-black text-sm h-12 px-8 bg-destructive hover:bg-destructive/90 text-white shadow-xl shadow-destructive/25 gap-2 transition-all active:scale-95"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {deleting ? 'Deleting…' : 'Delete Type'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
        fetch(`${BASE_URL}/admin/config/${DISEASE}/classifier/document-types`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            user_id: userId,
            document_type: {
              ...targetDocType,
              agents: updatedTargetAgents
            }
          }),
        }).then(r => { if (!r.ok) throw new Error(`Failed to update ${targetDocTypeName}`); return r; }),
        
        // Update Source
        fetch(`${BASE_URL}/admin/config/${DISEASE}/classifier/document-types`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            user_id: userId,
            document_type: {
              ...sourceDocType,
              agents: updatedSourceAgents
            }
          }),
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[300] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right-10 duration-300 border
          ${toast.type === 'error' ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span className="text-sm font-black">{toast.message}</span>
        </div>
      )}

      {/* Subsequent Loading Overlay */}
      {loading && !isInitialLoading && (
        <div className="fixed inset-0 z-[100] bg-background/40 backdrop-blur-[1px] flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-card border-2 border-border/50 shadow-2xl rounded-3xl p-8 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm font-black tracking-tight">Updating classification engine...</p>
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
            <Settings className="w-3.5 h-3.5" /> Intelligence Engine
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Document Classifier
          </h1>
          <div className="flex items-center gap-3 text-muted-foreground text-sm font-medium">
            <span>Configure routing logic and document types</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="capitalize text-primary font-bold">{DISEASE}</span>
            {classifier?.version && (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="bg-muted px-2 py-0.5 rounded-md font-mono text-[11px]">v{classifier.version}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <Button
            variant="outline"
            onClick={fetchClassifier}
            disabled={loading}
            className="h-11 px-5 rounded-2xl font-black text-sm gap-2 border-border/60 hover:bg-muted transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => { setActiveTab('types'); setDocTypeModal('new'); }}
            className="h-11 px-6 rounded-2xl font-black text-sm gap-2 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Doc Type
          </Button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="py-24 flex flex-col items-center gap-6 animate-in zoom-in-95">
          <div className="w-20 h-20 bg-destructive/10 rounded-[2.5rem] flex items-center justify-center shadow-inner">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <div className="text-center space-y-2">
            <p className="font-black text-xl text-destructive">Connection Failed</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto font-medium">{error}</p>
          </div>
          <Button onClick={fetchClassifier} className="rounded-2xl px-8 h-12 font-black bg-destructive hover:bg-destructive/90 shadow-xl shadow-destructive/20 transition-all active:scale-95">
            Retry Connection
          </Button>
        </div>
      )}

      {/* ── Meta stats ── */}
      {!error && classifier && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Document Types', value: docTypes.length,               icon: FileText, color: 'text-foreground', bg: 'bg-foreground/5' },
            { label: 'Active Pipeline', value: activeCount,                    icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Inactive Types',   value: docTypes.length - activeCount,  icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'Last Deployed',   value: classifier.last_updated ?? '—', icon: RefreshCw, color: 'text-primary', bg: 'bg-primary/10' },
          ].map((s) => (
            <Card key={s.label} className="border-2 border-border/40 rounded-[2rem] shadow-sm hover:shadow-md transition-all overflow-hidden relative group">
              <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500 ${s.color}`}>
                <s.icon className="w-16 h-16" />
              </div>
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">{s.label}</p>
                <p className={`text-3xl font-black tracking-tighter ${s.color} truncate`}>{s.value}</p>
              </CardContent>
            </Card>
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