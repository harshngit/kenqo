import { useState, useEffect, useCallback } from 'react';
import {
  Upload, ArrowUpRight, FileText, ChevronDown, Activity,
  BookOpen, CheckCircle2, AlertCircle, Layers, Settings2, RefreshCw,
  Trash2, ShieldCheck, ShieldAlert, MoreVertical, Edit2, Check, X,
  ExternalLink, Split, Merge, Loader2, Filter, Tag, Code2,
  ClipboardList, Hash, Calendar, Database, Zap, Info, ChevronRight,
  ListChecks, ShieldX, ShieldCheckIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useSelector } from 'react-redux';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const BASE_URL = 'https://kenqo-api-409744260053.asia-south1.run.app';
const DISEASE = 'lymphedema';

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const map = {
    approved: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
    pending:  'bg-amber-500/10 text-amber-600 border border-amber-500/20',
    disabled: 'bg-muted text-muted-foreground border border-border/50',
    merge_suggestion: 'bg-violet-500/10 text-violet-600 border border-violet-500/20',
  };
  return (
    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm ${map[status] || map.pending}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

const SeverityBadge = ({ severity }) => {
  const s = severity?.toUpperCase() || 'RED';
  const map = {
    RED:    'bg-red-500/10 text-red-600 border border-red-500/20',
    YELLOW: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
    PASS:   'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
  };
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md tracking-wider border shadow-sm ${map[s] || map.RED}`}>
      {s}
    </span>
  );
};

/* ─── RULE DETAIL MODAL ─── */
const RuleDetailModal = ({ open, rule, onClose, onApprove, onEdit, onDelete }) => {
  if (!open || !rule) return null;

  const Section = ({ icon: Icon, title, color = 'text-primary', children }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-xl bg-primary/10 ${color}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      </div>
      {children}
    </div>
  );

  const InfoRow = ({ label, value, mono = false }) => (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border/20 last:border-0">
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 shrink-0 mt-0.5">{label}</span>
      <span className={`text-xs font-bold text-foreground/80 text-right max-w-[60%] break-words ${mono ? 'font-mono text-[11px]' : ''}`}>
        {value ?? '—'}
      </span>
    </div>
  );

  const hcpcs = rule.applicable_hcpcs || [];
  const showAllHcpcs = hcpcs.length <= 6 || hcpcs[0] === 'ALL';

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border-2 border-border/40 rounded-t-[2.5rem] md:rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-300 max-h-[92vh] flex flex-col">

        {/* ── Sticky Header ── */}
        <div className="flex items-start justify-between px-8 pt-7 pb-5 border-b-2 border-border/10 shrink-0">
          <div className="space-y-2 flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[10px] font-black font-mono text-primary/60 bg-primary/5 border border-primary/10 px-2.5 py-1 rounded-lg">{rule.rule_id}</span>
              <StatusBadge status={rule.status} />
              {rule.on_fail && <SeverityBadge severity={rule.on_fail.verdict} />}
              {rule.llm_judgement && (
                <span className="text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest bg-violet-500/10 text-violet-600 border border-violet-500/20">
                  LLM Judge
                </span>
              )}
            </div>
            <h2 className="text-xl font-black tracking-tight capitalize leading-snug">
              {rule.rule_name?.replace(/_/g, ' ')}
            </h2>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              {rule.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl border-2 border-border/40 flex items-center justify-center hover:bg-muted transition-all active:scale-95 shrink-0 mt-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="overflow-y-auto flex-1 px-8 py-6 space-y-7">

          {/* Check Type & Field */}
          <Section icon={Code2} title="Rule Configuration">
            <div className="bg-muted/20 rounded-3xl border-2 border-border/30 divide-y divide-border/20 overflow-hidden">
              <InfoRow label="Check Type" value={rule.check_type} mono />
              <InfoRow label="Field" value={rule.field} mono />
              <InfoRow label="LLM Judgement" value={rule.llm_judgement ? 'Yes' : 'No'} />
              <InfoRow label="Body Area Specific" value={rule.body_area_specific ? 'Yes' : 'No'} />
              {rule.precondition && <InfoRow label="Precondition" value={rule.precondition} mono />}
            </div>
          </Section>

          {/* Stored Message */}
          {rule.stored_message && (
            <Section icon={Info} title="Stored Message">
              <div className="bg-muted/20 rounded-3xl border-2 border-border/30 p-4">
                <p className="text-sm font-medium text-foreground/70 leading-relaxed">{rule.stored_message}</p>
              </div>
            </Section>
          )}

          {/* Parameters */}
          {rule.parameters && Object.keys(rule.parameters).length > 0 && (
            <Section icon={Settings2} title="Parameters">
              <div className="bg-muted/20 rounded-3xl border-2 border-border/30 p-5 overflow-x-auto">
                <pre className="text-xs font-mono text-foreground/70 whitespace-pre-wrap break-words">
                  {JSON.stringify(rule.parameters, null, 2)}
                </pre>
              </div>
            </Section>
          )}

          {/* On Pass / On Fail */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* On Pass */}
            {rule.on_pass && (
              <div className="p-5 rounded-3xl bg-emerald-500/5 border-2 border-emerald-500/15 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">On Pass</p>
                </div>
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60">Verdict</span>
                  <p className="text-sm font-black text-emerald-600">{rule.on_pass.verdict}</p>
                  {rule.on_pass.message && (
                    <>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60 block mt-2">Message</span>
                      <p className="text-xs font-medium text-foreground/70 leading-relaxed">{rule.on_pass.message}</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* On Fail */}
            {rule.on_fail && (
              <div className="p-5 rounded-3xl bg-red-500/5 border-2 border-red-500/15 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-600">On Fail</p>
                </div>
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-red-500/60">Verdict</span>
                  <p className="text-sm font-black text-red-600">{rule.on_fail.verdict}</p>
                  {(rule.on_fail.carc || rule.on_fail.rarc) && (
                    <div className="flex gap-3 mt-1">
                      {rule.on_fail.carc && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-1.5 text-center">
                          <p className="text-[8px] font-black uppercase text-red-400">CARC</p>
                          <p className="text-sm font-black text-red-600">{rule.on_fail.carc}</p>
                        </div>
                      )}
                      {rule.on_fail.rarc && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-1.5 text-center">
                          <p className="text-[8px] font-black uppercase text-red-400">RARC</p>
                          <p className="text-sm font-black text-red-600">{rule.on_fail.rarc}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {rule.on_fail.message && (
                    <>
                      <span className="text-[9px] font-black uppercase tracking-widest text-red-500/60 block mt-2">Message</span>
                      <p className="text-xs font-medium text-foreground/70 leading-relaxed">{rule.on_fail.message}</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* HCPCS Codes */}
          <Section icon={Hash} title={`Applicable HCPCS (${hcpcs.length})`}>
            <div className="flex flex-wrap gap-2">
              {hcpcs[0] === 'ALL' ? (
                <span className="px-4 py-2 rounded-2xl bg-primary/10 text-primary border border-primary/20 text-xs font-black tracking-wider">
                  ALL HCPCS Codes
                </span>
              ) : (
                hcpcs.map((code) => (
                  <span key={code} className="px-3 py-1.5 rounded-xl bg-muted/40 border border-border/40 text-xs font-mono font-bold text-foreground/70">
                    {code}
                  </span>
                ))
              )}
            </div>
          </Section>

          {/* Relevance Tags */}
          {rule.relevance_tags?.length > 0 && (
            <Section icon={Tag} title="Relevance Tags">
              <div className="flex flex-wrap gap-2">
                {rule.relevance_tags.map((tag) => (
                  <span key={tag} className="px-3 py-1.5 rounded-xl bg-muted/30 border border-border/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {tag.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Source Text */}
          {rule.source_text && (
            <Section icon={FileText} title="Source Text">
              <div className="bg-muted/20 rounded-3xl border-2 border-border/30 p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/30 rounded-l-3xl" />
                <p className="text-xs font-medium text-foreground/60 leading-relaxed pl-4 italic">
                  "{rule.source_text}"
                </p>
              </div>
            </Section>
          )}

          {/* Metadata */}
          <Section icon={Database} title="Metadata">
            <div className="bg-muted/20 rounded-3xl border-2 border-border/30 divide-y divide-border/20 overflow-hidden">
              <InfoRow label="Source Doc" value={rule.source_doc} mono />
              <InfoRow label="Disease" value={rule.disease} />
              <InfoRow label="Source" value={rule.source?.replace(/_/g, ' ')} />
              <InfoRow label="Chunk IDs" value={rule.linked_chunk_ids?.join(', ')} mono />
              <InfoRow label="Is Merge" value={rule.is_merge ? 'Yes' : 'No'} />
              {rule.merged_from?.length > 0 && (
                <InfoRow label="Merged From" value={rule.merged_from.join(', ')} mono />
              )}
              <InfoRow label="Created" value={new Date(rule.created_at).toLocaleString()} />
              <InfoRow label="Updated" value={new Date(rule.updated_at).toLocaleString()} />
            </div>
          </Section>
        </div>

        {/* ── Sticky Footer Actions ── */}
        <div className="px-8 py-5 border-t-2 border-border/10 bg-muted/5 flex items-center gap-3 shrink-0">
          {rule.status === 'pending' && (
            <Button
              onClick={() => { onApprove(rule.rule_id); onClose(); }}
              className="h-11 px-6 rounded-2xl font-black text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
            </Button>
          )}
          <Button
            onClick={() => { onEdit(rule); onClose(); }}
            variant="outline"
            className="h-11 px-6 rounded-2xl font-black text-sm border-border/60 hover:bg-muted transition-all active:scale-95"
          >
            <Edit2 className="w-4 h-4 mr-2" /> Edit Rule
          </Button>
          <Button
            onClick={() => { onDelete([rule.rule_id]); onClose(); }}
            variant="outline"
            className="h-11 px-5 rounded-2xl font-black text-sm border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all active:scale-95 ml-auto"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─── DELETE CONFIRM DIALOG ─── */
const DeleteConfirmDialog = ({ open, title, description, onConfirm, onCancel, loading }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
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

/* ─── EDIT RULE DIALOG ─── */
const EditRuleDialog = ({ open, rule, onSave, onCancel, loading, userId }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (rule) {
      setFormData({
        description: rule.description || '',
        llm_judgement: rule.llm_judgement || false,
        stored_message: rule.stored_message || '',
        check_type: rule.check_type || 'VALUE_IN_LIST',
        parameters: rule.parameters || {},
        on_fail: rule.on_fail || { verdict: 'RED', carc: '', rarc: '', message: '' },
        on_pass: rule.on_pass || { verdict: 'PASS', message: '' }
      });
    }
  }, [rule]);

  if (!open || !rule) return null;

  const handleSave = () => {
    onSave(rule.rule_id, { ...formData, user_id: userId });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border-2 border-border/40 rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight">Edit Rule</h2>
            <p className="text-sm text-muted-foreground font-mono">{rule.rule_id} — {rule.rule_name}</p>
          </div>
          <button onClick={onCancel} className="w-10 h-10 rounded-xl border border-border/60 flex items-center justify-center hover:bg-muted transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full h-24 bg-muted/20 border-2 border-border/40 rounded-2xl p-4 text-sm font-medium focus:border-primary/40 focus:outline-none"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Check Type</label>
            <input
              value={formData.check_type}
              onChange={(e) => setFormData({ ...formData, check_type: e.target.value })}
              className="w-full h-12 bg-muted/20 border-2 border-border/40 rounded-2xl px-4 text-sm font-medium focus:border-primary/40 focus:outline-none"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stored Message</label>
            <input
              value={formData.stored_message}
              onChange={(e) => setFormData({ ...formData, stored_message: e.target.value })}
              className="w-full h-12 bg-muted/20 border-2 border-border/40 rounded-2xl px-4 text-sm font-medium focus:border-primary/40 focus:outline-none"
            />
          </div>

          {/* On Fail Config */}
          <div className="space-y-4 p-5 rounded-3xl bg-red-500/5 border-2 border-red-500/10">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-500">On Fail Configuration</p>
            <div className="space-y-3">
              <input
                placeholder="Verdict (RED/YELLOW)"
                value={formData.on_fail?.verdict}
                onChange={(e) => setFormData({ ...formData, on_fail: { ...formData.on_fail, verdict: e.target.value } })}
                className="w-full h-10 bg-background border-2 border-border/40 rounded-xl px-3 text-xs font-bold"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="CARC"
                  value={formData.on_fail?.carc || ''}
                  onChange={(e) => setFormData({ ...formData, on_fail: { ...formData.on_fail, carc: e.target.value } })}
                  className="w-full h-10 bg-background border-2 border-border/40 rounded-xl px-3 text-xs font-bold"
                />
                <input
                  placeholder="RARC"
                  value={formData.on_fail?.rarc || ''}
                  onChange={(e) => setFormData({ ...formData, on_fail: { ...formData.on_fail, rarc: e.target.value } })}
                  className="w-full h-10 bg-background border-2 border-border/40 rounded-xl px-3 text-xs font-bold"
                />
              </div>
              <textarea
                placeholder="Failure Message"
                value={formData.on_fail?.message}
                onChange={(e) => setFormData({ ...formData, on_fail: { ...formData.on_fail, message: e.target.value } })}
                className="w-full h-20 bg-background border-2 border-border/40 rounded-xl p-3 text-xs font-medium"
              />
            </div>
          </div>

          {/* On Pass Config */}
          <div className="space-y-4 p-5 rounded-3xl bg-emerald-500/5 border-2 border-emerald-500/10">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">On Pass Configuration</p>
            <div className="space-y-3">
              <input
                placeholder="Verdict (PASS)"
                value={formData.on_pass?.verdict}
                onChange={(e) => setFormData({ ...formData, on_pass: { ...formData.on_pass, verdict: e.target.value } })}
                className="w-full h-10 bg-background border-2 border-border/40 rounded-xl px-3 text-xs font-bold"
              />
              <textarea
                placeholder="Success Message"
                value={formData.on_pass?.message}
                onChange={(e) => setFormData({ ...formData, on_pass: { ...formData.on_pass, message: e.target.value } })}
                className="w-full h-20 bg-background border-2 border-border/40 rounded-xl p-3 text-xs font-medium"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onCancel} disabled={loading} className="flex-1 h-12 rounded-2xl font-black border-border/60">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1 h-12 rounded-2xl font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─── MERGE RULES DIALOG ─── */
const MergeRulesDialog = ({ open, ruleA, ruleB, onMerge, onCancel, loading, userId }) => {
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (ruleA && ruleB) {
      setDescription(`Merged rule from ${ruleA.rule_id} and ${ruleB.rule_id}`);
    }
  }, [ruleA, ruleB]);

  if (!open || !ruleA || !ruleB) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border-2 border-border/40 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 bg-violet-500/10 rounded-[2.5rem] flex items-center justify-center shadow-inner">
            <Merge className="w-10 h-10 text-violet-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight">Merge Rules</h2>
            <p className="text-sm text-muted-foreground font-medium">
              Merging <span className="text-primary font-bold">{ruleB.rule_id}</span> into <span className="text-primary font-bold">{ruleA.rule_id}</span>.
              Rule B will be disabled and Rule A will inherit all linked chunks.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Merged Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Combined description..."
            className="w-full h-24 bg-muted/20 border-2 border-border/40 rounded-2xl p-4 text-sm font-medium focus:border-primary/40 focus:outline-none"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} disabled={loading} className="flex-1 h-12 rounded-2xl font-black border-border/60">
            Cancel
          </Button>
          <Button onClick={() => onMerge(ruleA.rule_id, ruleB.rule_id, description)} disabled={loading} className="flex-1 h-12 rounded-2xl font-black bg-violet-500 hover:bg-violet-600 text-white shadow-xl shadow-violet-500/20 transition-all active:scale-95">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Merge Rules'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
const SuperAdminKnowledgeBase = () => {
  const authUser = useSelector((state) => state.auth?.user);
  const userId = authUser?.user_id || authUser?.id || '';

  const [rules, setRules]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedDisease, setSelectedDisease] = useState('Lymphedema');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const RULES_PER_PAGE = 5;

  // Selection for bulk actions
  const [selectedRuleIds, setSelectedRuleIds] = useState([]);
  const [bulkLoading, setBulkLoading]         = useState(false);
  
  // Dialog states
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, ruleIds: [] });
  const [editModal, setEditModal]         = useState({ open: false, rule: null });
  const [mergeModal, setMergeModal]       = useState({ open: false, ruleA: null, ruleB: null });
  const [detailModal, setDetailModal]     = useState({ open: false, rule: null }); // ← NEW

  const fetchRules = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const url = `${BASE_URL}/admin/rules/${DISEASE}${statusFilter ? `?status=${statusFilter}` : ''}`;
      const res = await fetch(url, {
        headers: { 'x-user-id': userId }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load rules');
      setRules(data.rules || data.rule || []);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId, statusFilter]);

  useEffect(() => {
    fetchRules();
    setCurrentPage(1);
  }, [fetchRules]);

  const totalPages = Math.ceil(rules.length / RULES_PER_PAGE);
  const paginatedRules = rules.slice((currentPage - 1) * RULES_PER_PAGE, currentPage * RULES_PER_PAGE);

  const handleApprove = async (ruleId) => {
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/${ruleId}/approve`, {
        method: 'PATCH',
        headers: { 'x-user-id': userId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Approve failed');
      setRules(prev => prev.filter(r => r.rule_id !== ruleId));
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDisable = async (ruleId) => {
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/${ruleId}/disable`, {
        method: 'PATCH',
        headers: { 'x-user-id': userId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Disable failed');
      setRules(prev => prev.map(r => r.rule_id === ruleId ? { ...r, status: 'disabled' } : r));
    } catch (e) {
      setError(e.message);
    }
  };

  const handleEdit = async (ruleId, updateData) => {
    setBulkLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/${ruleId}`, {
        method: 'PUT',
        headers: { 'x-user-id': userId, 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Update failed');
      setRules(prev => prev.map(r => r.rule_id === ruleId ? { ...r, ...updateData } : r));
      setEditModal({ open: false, rule: null });
    } catch (e) {
      setError(e.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleMerge = async (ruleIdA, ruleIdB, mergedDescription) => {
    setBulkLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/merge`, {
        method: 'POST',
        headers: { 'x-user-id': userId, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          rule_id_a: ruleIdA,
          rule_id_b: ruleIdB,
          merged_description: mergedDescription
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Merge failed');
      fetchRules();
      setMergeModal({ open: false, ruleA: null, ruleB: null });
      setSelectedRuleIds([]);
    } catch (e) {
      setError(e.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedRuleIds.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/bulk-approve`, {
        method: 'PATCH',
        headers: { 'x-user-id': userId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, rule_ids: selectedRuleIds })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Bulk approve failed');
      setRules(prev => prev.filter(r => !selectedRuleIds.includes(r.rule_id)));
      setSelectedRuleIds([]);
    } catch (e) {
      setError(e.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/bulk-delete`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, rule_ids: deleteConfirm.ruleIds })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Bulk delete failed');
      setRules(prev => prev.filter(r => !deleteConfirm.ruleIds.includes(r.rule_id)));
      setSelectedRuleIds(prev => prev.filter(id => !deleteConfirm.ruleIds.includes(id)));
      setDeleteConfirm({ open: false, ruleIds: [] });
    } catch (e) {
      setError(e.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelect = (ruleId) => {
    setSelectedRuleIds(prev =>
      prev.includes(ruleId) ? prev.filter(id => id !== ruleId) : [...prev, ruleId]
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <DeleteConfirmDialog
        open={deleteConfirm.open}
        title="Delete Rules"
        description={`Are you sure you want to delete ${deleteConfirm.ruleIds.length} selected rules? This cannot be undone.`}
        onConfirm={handleBulkDelete}
        onCancel={() => setDeleteConfirm({ open: false, ruleIds: [] })}
        loading={bulkLoading}
      />

      <EditRuleDialog
        open={editModal.open}
        rule={editModal.rule}
        userId={userId}
        onSave={handleEdit}
        onCancel={() => setEditModal({ open: false, rule: null })}
        loading={bulkLoading}
      />

      <MergeRulesDialog
        open={mergeModal.open}
        ruleA={mergeModal.ruleA}
        ruleB={mergeModal.ruleB}
        userId={userId}
        onMerge={handleMerge}
        onCancel={() => setMergeModal({ open: false, ruleA: null, ruleB: null })}
        loading={bulkLoading}
      />

      {/* ── Rule Detail Modal (NEW) ── */}
      <RuleDetailModal
        open={detailModal.open}
        rule={detailModal.rule}
        onClose={() => setDetailModal({ open: false, rule: null })}
        onApprove={handleApprove}
        onEdit={(rule) => setEditModal({ open: true, rule })}
        onDelete={(ruleIds) => setDeleteConfirm({ open: true, ruleIds })}
      />

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
            <BookOpen className="w-3.5 h-3.5" /> Intelligence Repository
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Knowledge Base
          </h1>
          <div className="flex items-center gap-3 text-muted-foreground text-sm font-medium">
            <span className="capitalize text-primary font-bold">{selectedDisease}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>Medicare FFS</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="text-muted-foreground/60 italic">Rules Manager</span>
          </div>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-2xl border border-border/40">
            {['pending', 'approved', 'disabled'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                  ${statusFilter === s ? 'bg-background text-primary shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {s}
              </button>
            ))}
          </div>
          <Button onClick={fetchRules} variant="outline" className="h-11 px-5 rounded-2xl font-black border-border/60">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 text-red-600 border border-red-500/20 px-5 py-4 rounded-2xl text-sm font-bold animate-in slide-in-from-top-4">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Rules',     value: rules.length, icon: BookOpen, color: 'text-foreground', bg: 'bg-foreground/5' },
          { label: 'Pending Review',  value: rules.filter(r => r.status === 'pending').length, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Active Pipeline', value: rules.filter(r => r.status === 'approved').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'System Status',   value: 'Optimal', icon: Activity, color: 'text-primary', bg: 'bg-primary/10' },
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

      {/* ── Rules List ── */}
      <Card className="border-2 border-border/40 rounded-[2.5rem] shadow-lg overflow-hidden transition-all duration-500 bg-card">
        <CardHeader className="px-8 py-6 border-b-2 border-border/10 bg-muted/5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                <BookOpen className="w-5 h-5" />
              </div>
              <span>Rules Directory</span>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary/60">
                {loading ? '...' : rules.length} Total
              </span>
            </CardTitle>

            {selectedRuleIds.length > 0 && (
              <div className="flex items-center gap-3 animate-in slide-in-from-right-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-2">
                  {selectedRuleIds.length} Selected
                </span>
                {selectedRuleIds.length === 2 && (
                  <Button
                    onClick={() => {
                      const ruleA = rules.find(r => r.rule_id === selectedRuleIds[0]);
                      const ruleB = rules.find(r => r.rule_id === selectedRuleIds[1]);
                      setMergeModal({ open: true, ruleA, ruleB });
                    }}
                    disabled={bulkLoading}
                    className="h-10 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-violet-500 hover:bg-violet-600 text-white gap-2 shadow-lg shadow-violet-500/20"
                  >
                    <Merge className="w-3.5 h-3.5" /> Merge
                  </Button>
                )}
                <Button
                  onClick={handleBulkApprove}
                  disabled={bulkLoading}
                  className="h-10 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <Check className="w-3.5 h-3.5" /> Approve
                </Button>
                <Button
                  onClick={() => setDeleteConfirm({ open: true, ruleIds: selectedRuleIds })}
                  disabled={bulkLoading}
                  variant="outline"
                  className="h-10 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-32 flex flex-col items-center gap-4 animate-pulse">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Synchronizing Intelligence...</p>
            </div>
          ) : rules.length === 0 ? (
            <div className="py-32 flex flex-col items-center gap-6 text-center opacity-40">
              <div className="w-20 h-20 bg-muted rounded-[2.5rem] flex items-center justify-center shadow-inner">
                <BookOpen className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <p className="font-black text-lg">No Rules Found</p>
                <p className="text-sm font-medium">Try changing the status filter or disease.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y-2 divide-border/5">
              {paginatedRules.map((rule) => {
                const isSelected = selectedRuleIds.includes(rule.rule_id);
                return (
                  <div
                    key={rule.rule_id}
                    className={`group px-8 py-6 flex items-start gap-6 transition-all duration-300
                      ${isSelected ? 'bg-primary/[0.03]' : 'hover:bg-primary/[0.01]'}`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelect(rule.rule_id)}
                      className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0
                        ${isSelected ? 'bg-primary border-primary shadow-lg shadow-primary/20 scale-110' : 'border-border/60 hover:border-primary/40'}`}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white stroke-[4]" />}
                    </button>

                    {/* Clickable content area → opens detail modal */}
                    <div
                      className="flex-1 min-w-0 space-y-3 cursor-pointer"
                      onClick={() => setDetailModal({ open: true, rule })}
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[11px] font-black text-primary/40 group-hover:text-primary transition-colors font-mono">
                          {rule.rule_id}
                        </span>
                        <h3 className="font-black text-base tracking-tight text-foreground/90 truncate">
                          {rule.rule_name?.replace(/_/g, ' ') || 'Untitled Rule'}
                        </h3>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={rule.status} />
                          <SeverityBadge severity={rule.on_fail?.verdict} />
                          {rule.llm_judgement && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest bg-violet-500/10 text-violet-600 border border-violet-500/20">
                              LLM
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-foreground/70 leading-relaxed font-medium line-clamp-2">
                        {rule.description}
                      </p>

                      <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{rule.source_doc}</span>
                        </div>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" />
                          <span>{rule.linked_chunk_ids?.length || 0} Chunks</span>
                        </div>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" />
                          <span>{rule.applicable_hcpcs?.[0] === 'ALL' ? 'All HCPCS' : `${rule.applicable_hcpcs?.length || 0} HCPCS`}</span>
                        </div>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span>{new Date(rule.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                      {rule.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleApprove(rule.rule_id); }}
                          className="h-9 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl border-emerald-500/20 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                        >
                          Approve
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setEditModal({ open: true, rule }); }}
                        className="h-9 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl border-border/60 hover:bg-muted transition-all shadow-sm"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); setDetailModal({ open: true, rule }); }}
                        className="w-9 h-9 rounded-xl border-border/60 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all"
                        title="View details"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, ruleIds: [rule.rule_id] }); }}
                        className="w-9 h-9 rounded-xl border-border/60 hover:bg-red-500/10 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        {/* Pagination Footer */}
        {!loading && rules.length > RULES_PER_PAGE && (
          <div className="px-8 py-6 border-t-2 border-border/5 bg-muted/5 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              Showing <span className="text-foreground">{(currentPage-1)*RULES_PER_PAGE + 1}</span> to <span className="text-foreground">{Math.min(currentPage*RULES_PER_PAGE, rules.length)}</span> of <span className="text-foreground">{rules.length}</span> Rules
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="h-9 px-4 rounded-xl border-border/60 font-black text-[10px] uppercase tracking-widest hover:bg-muted"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all
                      ${currentPage === i + 1 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-muted'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="h-9 px-4 rounded-xl border-border/60 font-black text-[10px] uppercase tracking-widest hover:bg-muted"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SuperAdminKnowledgeBase;