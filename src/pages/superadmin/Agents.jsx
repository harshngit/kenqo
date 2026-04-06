import { useState, useEffect, useCallback } from 'react';
import {
  Activity, Settings, X, Save, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle2, RefreshCw, Bot,
  UserCircle2, Layers3, ShieldCheck, Braces, Loader2,
  Layers, Map, Hash, AlertTriangle, Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import { useSelector } from 'react-redux';

/* ─────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────── */
const BASE_URL = 'https://kenqo-api-409744260053.asia-south1.run.app';
const DISEASE  = 'lymphedema';

/* ─────────────────────────────────────────────
   AGENT CARD SKELETON  (list loader)
───────────────────────────────────────────── */
const AgentCardSkeleton = () => (
  <div className="border border-border/40 rounded-2xl p-5 bg-card space-y-4">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-36 rounded" />
          <Skeleton className="h-2.5 w-20 rounded" />
        </div>
      </div>
      <Skeleton className="h-5 w-9 rounded-full" />
    </div>
    <div className="space-y-1.5">
      <Skeleton className="h-2.5 w-full rounded" />
      <Skeleton className="h-2.5 w-4/5 rounded" />
      <Skeleton className="h-2.5 w-3/5 rounded" />
    </div>
    <div className="flex items-center justify-between pt-1">
      <Skeleton className="h-3 w-14 rounded" />
      <Skeleton className="h-7 w-24 rounded-lg" />
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   STATS SKELETON
───────────────────────────────────────────── */
const StatsSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-card border border-border/50 rounded-2xl p-4 space-y-2">
        <Skeleton className="h-2.5 w-20 rounded" />
        <Skeleton className="h-7 w-10 rounded" />
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────────
   CONFIGURE MODAL
───────────────────────────────────────────── */
const PROMPT_FIELDS = [
  { key: 'system_persona',          label: 'System Persona',          Icon: UserCircle2,  accent: 'text-sky-500',     bg: 'bg-sky-500/10'    },
  { key: 'dual_layer_task',         label: 'Dual Layer Task',         Icon: Layers3,      accent: 'text-violet-500',  bg: 'bg-violet-500/10' },
  { key: 'operational_constraints', label: 'Operational Constraints', Icon: ShieldCheck,  accent: 'text-amber-500',   bg: 'bg-amber-500/10'  },
  { key: 'output_schema',           label: 'Output Schema',           Icon: Braces,       accent: 'text-emerald-500', bg: 'bg-emerald-500/10'},
];

const ConfigureModal = ({ agentId, disease, userId, token, onClose, onSaved }) => {
  const [agent,      setAgent]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState(null);
  const [saveError,  setSaveError]  = useState(null);
  const [saved,      setSaved]      = useState(false);
  const [expanded,   setExpanded]   = useState({ system_persona: true });
  const [edits,      setEdits]      = useState({});

  /* fetch single agent */
  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const res = await fetch(`${BASE_URL}/admin/config/${disease}/agents/${agentId}`, {
          headers: { 'x-user-id': userId, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const a = data.agent ?? data;
        setAgent(a);
        setEdits({
          system_persona:          a.system_persona          ?? '',
          dual_layer_task:         a.dual_layer_task         ?? '',
          operational_constraints: a.operational_constraints ?? '',
          output_schema:           a.output_schema           ?? '',
        });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [agentId, disease, userId, token]);

  /* save */
  const handleSave = async () => {
    setSaving(true); setSaveError(null); setSaved(false);
    try {
      const res = await fetch(`${BASE_URL}/admin/config/${disease}/agents/${agentId}`, {
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
      onSaved?.(agentId, edits);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (key) =>
    setExpanded(p => ({ ...p, [key]: !p[key] }));

  return (
    <Dialog open={true} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl rounded-3xl p-0 overflow-hidden flex flex-col max-h-[90vh] border-none shadow-2xl">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-border/40 shrink-0 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.08) 0%, transparent 100%)' }}>
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Settings className="w-24 h-24" />
          </div>
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-inner shrink-0">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="font-black text-xl tracking-tight">
                  {loading ? 'Loading agent…' : `Configure — ${agent?.agent_name ?? `Agent ${agentId}`}`}
                </DialogTitle>
                <p className="text-sm text-muted-foreground font-medium mt-0.5">
                  ID #{agentId} · {disease}
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-8 py-6 flex-1 overflow-y-auto space-y-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Fetching agent configuration…</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Failed to load agent: {error}</span>
            </div>
          )}

          {!loading && !error && (
            <>
              {saved && (
                <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 text-sm font-bold animate-in fade-in duration-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Agent updated successfully!
                </div>
              )}
              {saveError && (
                <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm font-bold animate-in shake duration-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Save failed: {saveError}
                </div>
              )}

              <div className="space-y-3">
                {PROMPT_FIELDS.map(({ key, label, Icon, accent, bg }) => (
                  <div key={key} className="border border-border/40 rounded-2xl overflow-hidden bg-card transition-all">
                    <button
                      className="w-full flex items-center justify-between px-5 py-4 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
                      onClick={() => toggleSection(key)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${bg}`}>
                          <Icon className={`w-4 h-4 ${accent}`} />
                        </div>
                        <span className="text-sm font-black">{label}</span>
                        {edits[key] && (
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            edited
                          </span>
                        )}
                      </div>
                      <div className={`transition-transform duration-300 ${expanded[key] ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </button>
                    {expanded[key] && (
                      <div className="p-4 bg-background animate-in slide-in-from-top-2 duration-300">
                        <textarea
                          rows={6}
                          className="w-full text-xs font-mono bg-muted/10 border border-border/40 rounded-xl p-4 text-foreground resize-none focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/40 placeholder:text-muted-foreground/30 transition-all leading-relaxed"
                          value={edits[key] ?? ''}
                          onChange={e => setEdits(p => ({ ...p, [key]: e.target.value }))}
                          placeholder={`Enter ${label.toLowerCase()}…`}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && (
          <div className="px-8 py-6 border-t border-border/40 bg-muted/10 flex justify-between items-center shrink-0">
            <button
              onClick={onClose}
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
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

/* ─────────────────────────────────────────────
   TOGGLE SWITCH
───────────────────────────────────────────── */
const ToggleSwitch = ({ active, loading, onClick }) => (
  <button
    onClick={onClick}
    disabled={loading}
    title={active ? 'Click to deactivate' : 'Click to activate'}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200 shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary/50
      ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
      ${active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200
        ${active ? 'translate-x-4' : 'translate-x-0.5'}`}
    />
  </button>
);

/* ─────────────────────────────────────────────
   AGENT CARD
───────────────────────────────────────────── */
const AgentCard = ({ agent, isToggling, onToggle, onConfigure }) => {
  const isActive = agent.active;

  return (
    <Card className={`border rounded-2xl overflow-hidden transition-all duration-300
      ${isActive ? 'border-border/50 shadow-sm' : 'border-border/30 opacity-70'}`}>
      <CardContent className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2.5 rounded-xl shrink-0 transition-colors
              ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground'}`}>
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-sm text-foreground truncate">{agent.agent_name}</p>
                <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground shrink-0">
                  #{agent.agent_id}
                </span>
              </div>
            </div>
          </div>

          <ToggleSwitch
            active={isActive}
            loading={isToggling}
            onClick={() => onToggle(agent.agent_id, isActive)}
          />
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-3">
          {agent.description || 'No description provided.'}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest
            ${isActive ? 'text-emerald-500' : 'text-muted-foreground'}`}>
            {isToggling ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> Updating…</>
            ) : isActive ? (
              <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active</>
            ) : (
              <><span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Inactive</>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onConfigure(agent.agent_id)}
            className="h-7 px-3 text-xs rounded-lg hover:bg-primary/10 hover:text-primary font-bold gap-1.5"
          >
            <Settings className="w-3 h-3" /> Configure
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
const SuperAdminAgents = () => {
  const { user, token } = useSelector((s) => s.auth);
  const userId = user?.id ?? user?.user_id ?? user?.sub ?? '';

  const [agents,           setAgents]           = useState([]);
  const [pageLoading,      setPageLoading]      = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [pageError,        setPageError]        = useState(null);
  const [togglingIds,      setTogglingIds]      = useState(new Set());
  const [modalAgentId,     setModalAgentId]     = useState(null);

  /* ── fetch all agents ── */
  const fetchAgents = useCallback(async () => {
    setPageLoading(true);
    setPageError(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/agents`, {
        headers: {
          'x-user-id': userId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAgents(data.agents ?? []);
    } catch (e) {
      setPageError(e.message);
    } finally {
      setPageLoading(false);
      setIsInitialLoading(false);
    }
  }, [userId, token]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  /* ── toggle ── */
  const handleToggle = async (agentId, currentActive) => {
    if (togglingIds.has(agentId)) return;

    const newActive = !currentActive;
    // optimistic
    setAgents(p => p.map(a => a.agent_id === agentId ? { ...a, active: newActive } : a));
    setTogglingIds(p => new Set([...p, agentId]));

    try {
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/agents/${agentId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ user_id: userId, active: newActive }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      // revert on failure
      setAgents(p => p.map(a => a.agent_id === agentId ? { ...a, active: currentActive } : a));
    } finally {
      setTogglingIds(p => { const n = new Set(p); n.delete(agentId); return n; });
    }
  };

  /* ────────────────────────────────────────────
     INITIAL PAGE LOADER
  ──────────────────────────────────────────── */
  if (isInitialLoading) {
    return (
      <div className="h-[calc(100vh-5.5rem)] lg:h-[calc(100vh-3rem)] flex flex-col items-center justify-center animate-in fade-in duration-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center relative">
            <Activity className="w-8 h-8 text-primary" />
            <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-2xl animate-spin" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold tracking-tight">Loading Extraction Agents</h2>
            <p className="text-xs text-muted-foreground mt-1">Please wait while we fetch system agents...</p>
          </div>
        </div>
      </div>
    );
  }

  /* ────────────────────────────────────────────
     STATS
  ──────────────────────────────────────────── */
  const activeCount = agents.filter(a => a.active).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      {/* Subsequent Loading Overlay */}
      {pageLoading && !isInitialLoading && (
        <div className="fixed inset-0 z-[100] bg-background/40 backdrop-blur-[1px] flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-card border border-border/50 shadow-2xl rounded-2xl p-6 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-bold tracking-tight">Updating agents list...</p>
          </div>
        </div>
      )}

      {/* Configure Modal */}
      {modalAgentId !== null && (
        <ConfigureModal
          agentId={modalAgentId}
          disease={DISEASE}
          userId={userId}
          token={token}
          onClose={() => setModalAgentId(null)}
          onSaved={(id, updates) =>
            setAgents(p => p.map(a => a.agent_id === id ? { ...a, ...updates } : a))
          }
        />
      )}

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
            <Activity className="w-3.5 h-3.5" /> Agent Management
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Extraction Agents
          </h1>
          <div className="flex items-center gap-3 text-muted-foreground text-sm font-medium">
            <span>Configure and monitor AI extraction agents</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="capitalize text-primary font-bold">{DISEASE}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <Button
            variant="outline"
            onClick={fetchAgents}
            disabled={pageLoading}
            className="h-11 px-5 rounded-2xl font-black text-sm gap-2 border-border/60 hover:bg-muted transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${pageLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {pageError && (
        <div className="py-24 flex flex-col items-center gap-6 animate-in zoom-in-95">
          <div className="w-20 h-20 bg-destructive/10 rounded-[2.5rem] flex items-center justify-center shadow-inner">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <div className="text-center space-y-2">
            <p className="font-black text-xl text-destructive">Connection Failed</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto font-medium">{pageError}</p>
          </div>
          <Button onClick={fetchAgents} className="rounded-2xl px-8 h-12 font-black bg-destructive hover:bg-destructive/90 shadow-xl shadow-destructive/20 transition-all active:scale-95">
            Retry Connection
          </Button>
        </div>
      )}

      {/* ── Stats ── */}
      {!pageError && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Total Agents', value: agents.length,               icon: Bot,     color: 'text-foreground', bg: 'bg-foreground/5' },
            { label: 'Active Pipeline', value: activeCount,               icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Inactive Agents', value: agents.length - activeCount,  icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'System Status',   value: 'Optimal',                icon: Activity, color: 'text-primary', bg: 'bg-primary/10' },
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
      )}

      {/* ── Agent Grid ── */}
      {!pageError && (
        <>
          {/* section header */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              All Agents — {agents.length}
            </p>
            <p className="text-[10px] text-muted-foreground/50 font-medium">
              Click <span className="font-bold text-primary">Configure</span> to edit prompts
            </p>
          </div>

          {agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground border border-dashed border-border/40 rounded-2xl">
              <Bot className="w-10 h-10 opacity-25" />
              <p className="text-sm font-medium">No agents found for <strong>{DISEASE}</strong></p>
              <Button variant="outline" size="sm" onClick={fetchAgents} className="rounded-xl gap-2 font-bold">
                <RefreshCw className="w-3.5 h-3.5" /> Try again
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.map(agent => (
                <AgentCard
                  key={agent.agent_id}
                  agent={agent}
                  isToggling={togglingIds.has(agent.agent_id)}
                  onToggle={handleToggle}
                  onConfigure={setModalAgentId}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SuperAdminAgents;