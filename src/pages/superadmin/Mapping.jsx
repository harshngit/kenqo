import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Map, ChevronDown, ChevronRight, Plus, Edit2, Save, X,
  Loader2, AlertCircle, RefreshCw, CheckCircle2,
  ToggleLeft, ToggleRight, Layers, Hash, AlertTriangle, Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import { useSelector } from 'react-redux';

const BASE_URL = 'https://kenqo-api-409744260053.asia-south1.run.app';
const DISEASE  = 'lymphedema';

// snake_case → "Human Readable"
const toLabel = (s) => {
  if (typeof s !== 'string') return String(s || '');
  return s
    .replace(/_/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

const toSnakeCase = (s) => {
  return (s || '')
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map(x => x.toLowerCase())
    .join('_');
};

// ─── Agent colour palette (cycles by agent id) ────────────────────────────────
const AGENT_PALETTE = [
  { ring: 'ring-blue-500/30',    icon: 'bg-blue-500/15 text-blue-500',    dot: 'bg-blue-500',    bar: 'bg-blue-500'    },
  { ring: 'ring-violet-500/30',  icon: 'bg-violet-500/15 text-violet-500',dot: 'bg-violet-500',  bar: 'bg-violet-500'  },
  { ring: 'ring-emerald-500/30', icon: 'bg-emerald-500/15 text-emerald-500',dot:'bg-emerald-500', bar: 'bg-emerald-500' },
  { ring: 'ring-amber-500/30',   icon: 'bg-amber-500/15 text-amber-500',  dot: 'bg-amber-500',   bar: 'bg-amber-500'   },
  { ring: 'ring-rose-500/30',    icon: 'bg-rose-500/15 text-rose-500',    dot: 'bg-rose-500',    bar: 'bg-rose-500'    },
  { ring: 'ring-cyan-500/30',    icon: 'bg-cyan-500/15 text-cyan-500',    dot: 'bg-cyan-500',    bar: 'bg-cyan-500'    },
  { ring: 'ring-orange-500/30',  icon: 'bg-orange-500/15 text-orange-500',dot: 'bg-orange-500',  bar: 'bg-orange-500'  },
];
const palette = (idx) => AGENT_PALETTE[idx % AGENT_PALETTE.length];

// ─── Field chip ───────────────────────────────────────────────────────────────
function FieldChip({ name, active, onToggle, toggling }) {
  return (
    <div className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
      active
        ? 'bg-card border-border/50 text-foreground hover:border-primary/30'
        : 'bg-muted/40 border-border/30 text-muted-foreground line-through opacity-60'
    }`}>
      <span className="font-mono">{toLabel(name)}</span>
      <button
        onClick={() => onToggle(name, !active)}
        disabled={toggling === name}
        className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        title={active ? 'Deactivate field' : 'Activate field'}
      >
        {toggling === name
          ? <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          : active
            ? <ToggleRight className="w-3.5 h-3.5 text-emerald-500" />
            : <ToggleLeft className="w-3.5 h-3.5 text-muted-foreground" />
        }
      </button>
    </div>
  );
}

// ─── Edit Fields Dialog ────────────────────────────────────────────────────────
function EditFieldsDialog({ open, agent, onClose, onSave, isSaving, saveError }) {
  const [fields, setFields] = useState([]);
  const [newField, setNewField] = useState('');

  useEffect(() => {
    if (agent) {
      setFields(agent.fields.map((f) => f.name));
    }
  }, [agent]);

  const addField = () => {
    const trimmed = newField.trim();
    if (!trimmed) return;
    
    // Convert to snake_case
    const snake = toSnakeCase(trimmed);
    
    if (fields.includes(snake)) {
      setNewField('');
      return;
    }
    
    setFields([...fields, snake]);
    setNewField('');
  };

  const removeField = (name) => {
    setFields(fields.filter((f) => f !== name));
  };

  const handleSave = () => {
    onSave(fields);
  };

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xl rounded-3xl p-0 overflow-hidden flex flex-col max-h-[90vh] border-none shadow-2xl">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-border/40 shrink-0 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.08) 0%, transparent 100%)' }}>
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Layers className="w-24 h-24" />
          </div>
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-inner shrink-0">
                <Edit2 className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="font-black text-xl tracking-tight">
                  Edit Fields — {agent.agent_name}
                </DialogTitle>
                <p className="text-sm text-muted-foreground font-medium mt-0.5">
                  Manage the extraction fields mapped to this agent.
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-8 py-6 flex-1 overflow-y-auto space-y-6">
          {/* Input Area */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">
              Add New Field
            </label>
            <div className="flex gap-2 p-1.5 rounded-2xl bg-muted/30 border border-border/60 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
              <input
                value={newField}
                onChange={(e) => setNewField(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addField())}
                placeholder="Type field name (e.g. Patient Name)..."
                className="flex-1 bg-transparent px-3 text-sm font-medium focus:outline-none placeholder:text-muted-foreground/50"
              />
              <Button 
                onClick={addField} 
                disabled={!newField.trim()}
                className="rounded-xl font-black text-xs h-10 px-5 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Field
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/60 italic ml-1">
              Names will be automatically converted to snake_case (e.g. &quot;Patient Name&quot; → &quot;patient_name&quot;)
            </p>
          </div>

          {/* List Area */}
          <div className="space-y-3">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em]">
                Current Fields
              </label>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                {fields.length} {fields.length === 1 ? 'Field' : 'Fields'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-h-[200px] p-4 rounded-2xl border-2 border-dashed border-border/40 bg-muted/5 content-start">
              {fields.length > 0 ? (
                fields.map((f) => (
                  <div 
                    key={f} 
                    className="group flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-background border border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-all shadow-sm animate-in zoom-in-95 duration-200"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Hash className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary/50" />
                      <span className="text-xs font-mono font-bold truncate tracking-tight">{f}</span>
                    </div>
                    <button
                      onClick={() => removeField(f)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground/30 gap-3">
                  <Layers className="w-12 h-12 opacity-10" />
                  <p className="text-xs font-medium italic">No fields assigned. Add one above.</p>
                </div>
              )}
            </div>
          </div>

          {saveError && (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-xs text-destructive font-bold animate-in shake duration-300">
              <AlertCircle className="w-4 h-4 shrink-0" />{saveError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-border/40 bg-muted/10 flex justify-between items-center shrink-0">
          <button 
            onClick={onClose} 
            disabled={isSaving} 
            className="text-sm font-black text-muted-foreground hover:text-foreground transition-colors px-2"
          >
            Cancel
          </button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="rounded-2xl font-black text-sm h-12 px-8 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 gap-2 transition-all active:scale-95"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving Changes…' : 'Save Mappings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Assign Field Modal ───────────────────────────────────────────────────────
function AssignFieldModal({ open, field, agents, onClose, onAssign, isAssigning }) {
  if (!open || !field) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="px-8 pt-8 pb-6 border-b border-border/40 bg-primary/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12">
            <Map className="w-20 h-20" />
          </div>
          <DialogHeader className="relative z-10">
            <DialogTitle className="font-black text-2xl tracking-tight">Assign Field</DialogTitle>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              Select an agent to map the field <span className="text-primary font-black font-mono">&quot;{typeof field === 'string' ? field : field.name}&quot;</span>
            </p>
          </DialogHeader>
        </div>

        <div className="px-8 py-6 max-h-[50vh] overflow-y-auto space-y-3 scrollbar-none">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Available Agents (Sections)</p>
          <div className="grid grid-cols-1 gap-2">
            {agents.map(([agentId, agent], idx) => {
              const p = AGENT_PALETTE[idx % AGENT_PALETTE.length];
              return (
                <button
                  key={agentId}
                  onClick={() => onAssign(agentId, typeof field === 'string' ? field : field.name)}
                  disabled={isAssigning}
                  className="group flex items-center justify-between p-4 rounded-2xl border-2 border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all text-left active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${p.icon} flex items-center justify-center font-black text-sm shrink-0 shadow-inner group-hover:scale-110 transition-transform`}>
                      {agentId}
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">{agent.agent_name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                        {agent.fields.length} Fields Mapped
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-8 py-6 border-t border-border/40 bg-muted/10">
          <Button variant="outline" onClick={onClose} disabled={isAssigning} className="w-full h-12 rounded-2xl font-black border-border/60">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Agent Accordion Card ─────────────────────────────────────────────────────
function AgentCard({ agentId, agent, idx, superadminId, onUpdate, onToggle, showToast }) {
  const [open, setOpen] = useState(false);
  const [togglingField, setTogglingField] = useState(null); // field name being toggled
  const [togglingAgent, setTogglingAgent] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const p = palette(idx);
  const activeFields  = agent.fields.filter((f) => f.active);
  const inactiveFields = agent.fields.filter((f) => !f.active);

  // Toggle a single field via the mapping update API
  const handleFieldToggle = async (fieldName, newActive) => {
    setTogglingField(fieldName);
    try {
      const updatedFields = agent.fields.map((f) =>
        f.name === fieldName ? { ...f, active: newActive } : f
      );
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/mapping/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': superadminId },
        body: JSON.stringify({
          user_id: superadminId,
          fields: updatedFields.map((f) => f.name), // API wants string array
        }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data?.detail || data?.message || 'Toggle failed');
      onUpdate(agentId, { ...agent, fields: updatedFields });
      showToast(`"${toLabel(fieldName)}" ${newActive ? 'activated' : 'deactivated'}`);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setTogglingField(null);
    }
  };

  // Toggle the whole agent
  const handleAgentToggle = async () => {
    setTogglingAgent(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/mapping/${agentId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': superadminId },
        body: JSON.stringify({ user_id: superadminId, active: !agent.active }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data?.detail || data?.message || 'Toggle failed');
      onUpdate(agentId, { ...agent, active: !agent.active });
      showToast(`Agent "${agent.agent_name}" ${!agent.active ? 'activated' : 'deactivated'}`);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setTogglingAgent(false);
    }
  };

  // Save all fields (full replace)
  const handleSaveFields = async (newFieldNames) => {
    setIsSaving(true); setSaveError(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/mapping/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': superadminId },
        body: JSON.stringify({ user_id: superadminId, fields: newFieldNames }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data?.detail || data?.message || 'Save failed');
      const updatedFields = newFieldNames.map((name) => ({ name, active: true }));
      onUpdate(agentId, { ...agent, fields: updatedFields });
      setEditOpen(false);
      showToast(`Agent "${agent.agent_name}" fields updated`);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className={`rounded-3xl border-2 overflow-hidden transition-all duration-300 group ${
        agent.active 
          ? open ? 'border-primary/30 bg-card shadow-xl shadow-primary/5' : 'border-border/50 bg-card shadow-sm hover:border-primary/20 hover:shadow-md'
          : 'border-border/20 bg-muted/20 opacity-70 grayscale'
      }`}>
        {/* Accordion header */}
        <div
          className="flex items-center gap-5 px-6 py-5 cursor-pointer select-none"
          onClick={() => setOpen((v) => !v)}
        >
          {/* Colour icon */}
          <div className={`w-14 h-14 rounded-2xl ${p.icon} flex items-center justify-center shrink-0 font-black text-lg shadow-inner relative overflow-hidden group-hover:scale-105 transition-transform duration-300`}>
             <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
             {agentId}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <p className={`font-black text-lg tracking-tight ${agent.active ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                {agent.agent_name}
              </p>
              {/* Active / inactive badge */}
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm ${
                agent.active
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-muted text-muted-foreground border-border/50'
              }`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${agent.active ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                {agent.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <Hash className="w-3.5 h-3.5 opacity-50" />
                {agent.fields.length} {agent.fields.length === 1 ? 'Field' : 'Fields'}
                {inactiveFields.length > 0 && (
                  <span className="flex items-center gap-1 ml-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                    <AlertTriangle className="w-3 h-3" />
                    {inactiveFields.length} inactive
                  </span>
                )}
              </div>
              
              {/* Mini field bar */}
              <div className="flex gap-1 items-center bg-muted/30 px-2 py-1 rounded-lg">
                {agent.fields.slice(0, 8).map((f) => (
                  <span key={f.name} className={`w-2 h-2 rounded-full transition-all duration-500 ${f.active ? p.dot : 'bg-muted-foreground/30'}`} />
                ))}
                {agent.fields.length > 8 && (
                  <span className="text-[10px] font-black text-muted-foreground/60 ml-1">+{agent.fields.length - 8}</span>
                )}
              </div>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Edit fields */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="h-10 px-4 text-xs rounded-xl font-black gap-2 hover:bg-primary hover:text-white border-primary/20 text-primary transition-all active:scale-95 shadow-sm"
            >
              <Edit2 className="w-4 h-4" /> Edit Mapping
            </Button>

            {/* Agent toggle */}
            <button
              onClick={handleAgentToggle}
              disabled={togglingAgent}
              className={`p-2.5 rounded-xl transition-all duration-300 ${
                agent.active ? 'bg-emerald-500/10 hover:bg-emerald-500/20' : 'bg-muted hover:bg-muted-foreground/10'
              }`}
            >
              {togglingAgent
                ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                : agent.active
                  ? <ToggleRight className="w-6 h-6 text-emerald-500" />
                  : <ToggleLeft className="w-6 h-6 text-muted-foreground" />
              }
            </button>

            {/* Chevron */}
            <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${open ? 'bg-primary/10 text-primary rotate-180' : 'text-muted-foreground hover:bg-muted'}`}>
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Progress bar line */}
        <div className="h-1 bg-muted/30 mx-6 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-out ${p.bar}`}
            style={{ width: agent.fields.length ? `${(activeFields.length / agent.fields.length) * 100}%` : '0%' }}
          />
        </div>

        {/* Accordion body */}
        <div className={`grid transition-all duration-500 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="px-8 pb-8 pt-6 space-y-6 bg-muted/5">
              {agent.fields.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground/40 italic">
                  <Layers className="w-10 h-10 opacity-20" />
                  <p className="text-sm">No fields mapped to this agent.</p>
                  <Button variant="link" size="sm" onClick={() => setEditOpen(true)} className="font-bold text-primary">
                    Add First Field
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Active fields */}
                  {activeFields.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-3 ml-1">
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                          Active Fields
                        </p>
                        <div className="h-px flex-1 bg-border/40" />
                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          {activeFields.length}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activeFields.map((f) => (
                          <FieldChip
                            key={f.name}
                            name={f.name}
                            active={true}
                            onToggle={handleFieldToggle}
                            toggling={togglingField}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inactive fields */}
                  {inactiveFields.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-3 ml-1">
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                          Inactive Fields
                        </p>
                        <div className="h-px flex-1 bg-border/40" />
                        <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          {inactiveFields.length}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {inactiveFields.map((f) => (
                          <FieldChip
                            key={f.name}
                            name={f.name}
                            active={false}
                            onToggle={handleFieldToggle}
                            toggling={togglingField}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit dialog */}
      <EditFieldsDialog
        open={editOpen}
        agent={agent}
        onClose={() => { setEditOpen(false); setSaveError(null); }}
        onSave={handleSaveFields}
        isSaving={isSaving}
        saveError={saveError}
      />
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const SuperAdminMapping = () => {
  const authUser = useSelector((s) => s.auth?.user);
  const superadminId = authUser?.user_id || authUser?.id || '';

  const [mapping, setMapping]       = useState(null);
  const [unassigned, setUnassigned] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [assignModal, setAssignModal] = useState({ open: false, field: null });
  const [isAssigning, setIsAssigning] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchMapping = useCallback(async () => {
    setIsFetching(true); setFetchError(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/mapping`, {
        headers: { 'Content-Type': 'application/json', 'x-user-id': superadminId },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.detail || data?.message || 'Failed to load mapping');
      setMapping(data.mapping);
      setUnassigned(data.unassigned_fields || []);
    } catch (e) {
      setFetchError(e.message);
    } finally {
      setIsFetching(false);
    }
  }, [superadminId]);

  const handleAssignField = async (agentId, fieldName) => {
    const agent = mapping.agent_field_mapping[agentId];
    if (!agent) return;

    const newFieldNames = [...agent.fields.map(f => f.name), fieldName];
    setIsAssigning(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/mapping/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': superadminId },
        body: JSON.stringify({ user_id: superadminId, fields: newFieldNames }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.detail || data?.message || 'Assignment failed');
      
      showToast(`Field "${fieldName}" assigned to ${agent.agent_name}`);
      setAssignModal({ open: false, field: null });
      fetchMapping();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  useEffect(() => { fetchMapping(); }, [fetchMapping]);

  // Optimistic update from child
  const handleAgentUpdate = (agentId, updatedAgent) => {
    setMapping((prev) => ({
      ...prev,
      agent_field_mapping: {
        ...prev.agent_field_mapping,
        [agentId]: updatedAgent,
      },
    }));
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const agents = mapping ? Object.entries(mapping.agent_field_mapping) : [];
  const totalFields  = agents.reduce((sum, [, a]) => sum + a.fields.length, 0);
  const activeAgents = agents.filter(([, a]) => a.active).length;
  const activeFields = agents.reduce((sum, [, a]) => sum + a.fields.filter((f) => f.active).length, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right-10 duration-300 border
          ${toast.type === 'error' ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span className="text-sm font-black">{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
            <Map className="w-3.5 h-3.5" /> Field Mapping
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Agent Field Mapping
          </h1>
          {mapping && (
            <div className="flex items-center gap-3 text-muted-foreground text-sm font-medium">
              <span className="bg-muted px-2 py-0.5 rounded-md font-mono text-[11px]">v{mapping.version}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>Updated {mapping.last_updated}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="capitalize text-primary font-bold">{DISEASE}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <Button
            variant="outline"
            onClick={fetchMapping}
            disabled={isFetching}
            className="h-11 px-5 rounded-2xl font-black text-sm gap-2 border-border/60 hover:bg-muted transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isFetching && (
        <div className="py-32 flex flex-col items-center gap-6 animate-pulse">
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center relative">
            <Map className="w-8 h-8 text-primary" />
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-3xl animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-black text-lg">Synchronizing Mappings</p>
            <p className="text-sm text-muted-foreground">Connecting to intelligence engine...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {!isFetching && fetchError && (
        <div className="py-24 flex flex-col items-center gap-6 animate-in zoom-in-95">
          <div className="w-20 h-20 bg-destructive/10 rounded-[2.5rem] flex items-center justify-center shadow-inner">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <div className="text-center space-y-2">
            <p className="font-black text-xl text-destructive">Connection Failed</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto font-medium">{fetchError}</p>
          </div>
          <Button onClick={fetchMapping} className="rounded-2xl px-8 h-12 font-black bg-destructive hover:bg-destructive/90 shadow-xl shadow-destructive/20 transition-all active:scale-95">
            Retry Connection
          </Button>
        </div>
      )}

      {/* Content */}
      {!isFetching && !fetchError && mapping && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'Intelligence Agents', value: agents.length,  icon: Layers, color: 'text-foreground', bg: 'bg-foreground/5' },
              { label: 'Active Pipeline',    value: activeAgents,   icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Extraction Fields',  value: totalFields,    icon: Hash, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Active Mappings',    value: activeFields,   icon: Map, color: 'text-violet-500', bg: 'bg-violet-500/10' },
            ].map((s) => (
              <Card key={s.label} className="border-2 border-border/40 rounded-[2rem] shadow-sm hover:shadow-md transition-all overflow-hidden relative group">
                <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500 ${s.color}`}>
                  <s.icon className="w-16 h-16" />
                </div>
                <CardContent className="p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">{s.label}</p>
                  <p className={`text-3xl font-black tracking-tighter ${s.color}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Agent Accordion List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between ml-1">
              <div className="flex items-center gap-3">
                <h2 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Agent Registry</h2>
                <div className="h-px w-12 bg-border" />
              </div>
              <p className="text-[10px] font-medium text-muted-foreground italic bg-muted/30 px-3 py-1 rounded-full">
                Expand an agent to manage individual field visibility
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {agents.map(([agentId, agent], idx) => (
                <AgentCard
                  key={agentId}
                  agentId={agentId}
                  agent={agent}
                  idx={idx}
                  superadminId={superadminId}
                  onUpdate={handleAgentUpdate}
                  showToast={showToast}
                />
              ))}
            </div>
          </div>

          {/* Unassigned Fields */}
          <Card className={`border-2 rounded-[2.5rem] shadow-lg overflow-hidden transition-all duration-500 ${
            unassigned.length > 0 ? 'border-amber-500/30' : 'border-emerald-500/20'
          }`}>
            <CardHeader className={`px-8 py-6 border-b-2 ${
              unassigned.length > 0
                ? 'border-amber-500/10 bg-amber-500/5'
                : 'border-emerald-500/10 bg-emerald-500/5'
            }`}>
              <CardTitle className="text-lg font-black flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl ${unassigned.length > 0 ? 'bg-amber-500/20 text-amber-600' : 'bg-emerald-500/20 text-emerald-600'}`}>
                    {unassigned.length > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <span>Unassigned Fields Repository</span>
                </div>
                <span className={`text-xs font-black px-4 py-1.5 rounded-full shadow-inner ${
                  unassigned.length > 0
                    ? 'bg-amber-500/20 text-amber-700'
                    : 'bg-emerald-500/20 text-emerald-700'
                }`}>
                  {unassigned.length} {unassigned.length === 1 ? 'Field' : 'Fields'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {unassigned.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-4 text-center animate-in fade-in duration-700">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center shadow-inner group">
                    <Check className="w-10 h-10 text-emerald-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-black text-emerald-700">Complete Mapping Coverage</p>
                    <p className="text-sm text-muted-foreground font-medium">Every extraction field is currently mapped to an active agent.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 ml-1">
                    <p className="text-sm font-bold text-amber-700/80">
                      The following fields are defined in the schema but missing from agent mappings:
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {unassigned.map((field) => (
                      <button
                        key={typeof field === 'string' ? field : field.name}
                        onClick={() => setAssignModal({ open: true, field })}
                        className="px-4 py-2.5 rounded-2xl border-2 border-amber-500/20 bg-white text-xs font-mono font-bold text-amber-700 shadow-sm hover:border-amber-500/40 hover:scale-105 transition-all active:scale-95 cursor-pointer"
                      >
                        {toLabel(typeof field === 'string' ? field : field.name)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <AssignFieldModal
        open={assignModal.open}
        field={assignModal.field}
        agents={agents}
        onClose={() => setAssignModal({ open: false, field: null })}
        onAssign={handleAssignField}
        isAssigning={isAssigning}
      />
    </div>
  );
};

export default SuperAdminMapping;