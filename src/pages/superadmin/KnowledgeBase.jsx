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
    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${map[status] || map.pending}`}>
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
    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${map[s] || map.RED}`}>
      {s}
    </span>
  );
};

/* ─── RULE DETAIL MODAL ─── */
const RuleDetailModal = ({ open, rule, onClose, onApprove, onEdit, onDelete, onMerge, userId }) => {
  const [otherRule, setOtherRule] = useState(null);
  const [loadingOther, setLoadingOther] = useState(false);

  useEffect(() => {
    const fetchOther = async () => {
      if (open && rule?.status === 'merge_suggestion' && rule?.merge_with && userId) {
        setLoadingOther(true);
        try {
          const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/${rule.merge_with}`, {
            headers: { 'x-user-id': userId }
          });
          const data = await res.json();
          if (data.success) setOtherRule(data.rule);
        } catch (e) {
          console.error('Failed to fetch merge-with rule:', e);
        } finally {
          setLoadingOther(false);
        }
      } else {
        setOtherRule(null);
      }
    };
    fetchOther();
  }, [open, rule, userId]);

  if (!open || !rule) return null;

  const isMergeSuggestion = rule.status === 'merge_suggestion';
  const isApproved = rule.status === 'approved';

  const Section = ({ icon: Icon, title, children }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">{title}</p>
      </div>
      {children}
    </div>
  );

  const InfoRow = ({ label, value }) => (
    <div className="flex items-center justify-between py-3.5 border-b border-border/10 last:border-0">
      <span className="text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">{label}</span>
      <span className="text-xs font-black text-foreground/90">{value ?? '—'}</span>
    </div>
  );

  const RuleCard = ({ r, isMain = true }) => (
    <div className={`p-8 rounded-[2rem] border-2 ${isMain ? 'bg-card border-border/40' : 'bg-muted/5 border-primary/20'} space-y-6 flex-1 min-w-[300px]`}>
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-black text-primary/60 bg-primary/5 border border-primary/20 px-3 py-1 rounded-full uppercase tracking-widest">
            {r.rule_id}
          </span>
          <StatusBadge status={r.status} />
          {r.on_fail && <SeverityBadge severity={r.on_fail.verdict} />}
        </div>
        <h2 className="text-2xl font-black tracking-tight text-foreground">
          {r.rule_name?.replace(/_/g, ' ')}
        </h2>
        <p className="text-sm text-muted-foreground font-medium leading-relaxed">
          {r.description}
        </p>
      </div>

      <Section icon={FileText} title="Source Text">
        <div className="p-6 rounded-[1.5rem] bg-muted/10 border-l-4 border-primary/30">
          <p className="text-xs font-medium text-foreground/70 leading-relaxed italic">
            &quot;{r.source_text}&quot;
          </p>
        </div>
      </Section>

      <Section icon={Database} title="Metadata">
        <div className="px-1">
          <InfoRow label="Source Doc" value={r.source_doc} />
          <InfoRow label="Disease" value={r.disease} />
          <InfoRow label="Source" value={r.source?.replace(/_/g, ' ')} />
        </div>
      </Section>

      <Section icon={Code2} title="Configuration">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Check Type</p>
            <p className="text-[10px] font-bold font-mono">{r.check_type}</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Field</p>
            <p className="text-[10px] font-bold font-mono">{r.field}</p>
          </div>
        </div>
      </Section>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-card border-2 border-border/40 rounded-[2.5rem] w-full ${isMergeSuggestion ? 'max-w-6xl' : 'max-w-2xl'} shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col overflow-hidden`}>
        
        {/* Header */}
        <div className="px-10 pt-10 pb-6 relative flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight text-foreground">
              {isMergeSuggestion ? 'Merge Suggestion' : 'Rule Details'}
            </h2>
            {isMergeSuggestion && rule.merge_reason && (
              <p className="text-sm font-bold text-violet-500 bg-violet-500/10 px-3 py-1 rounded-lg inline-block">
                Reason: {rule.merge_reason}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-border/60 flex items-center justify-center hover:bg-muted transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-10 py-6 scrollbar-none">
          {isMergeSuggestion ? (
            <div className="flex flex-col md:flex-row gap-8 items-stretch">
              <RuleCard r={rule} isMain={true} />
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-violet-500 text-white flex items-center justify-center shadow-lg shadow-violet-500/20 z-10">
                  <Merge className="w-6 h-6" />
                </div>
              </div>
              {loadingOther ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 animate-pulse opacity-40">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-widest mt-4">Fetching Target Rule...</p>
                </div>
              ) : otherRule ? (
                <RuleCard r={otherRule} isMain={false} />
              ) : (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border/40 rounded-[2rem] p-10 opacity-40">
                  <p className="text-sm font-bold">Target Rule Not Found ({rule.merge_with})</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-10">
              {rule.source_text && (
                <Section icon={FileText} title="Source Text">
                  <div className="p-8 rounded-[2rem] bg-muted/10 border-l-4 border-primary/30 relative">
                    <p className="text-sm font-medium text-foreground/70 leading-relaxed italic">
                      &quot;{rule.source_text}&quot;
                    </p>
                  </div>
                </Section>
              )}

              <Section icon={Database} title="Metadata">
                <div className="px-1">
                  <InfoRow label="Source Doc" value={rule.source_doc} />
                  <InfoRow label="Disease" value={rule.disease} />
                  <InfoRow label="Source" value={rule.source?.replace(/_/g, ' ')} />
                  <InfoRow label="Chunk IDs" value={rule.linked_chunk_ids?.join(', ')} />
                  <InfoRow label="Is Merge" value={rule.is_merge ? 'Yes' : 'No'} />
                </div>
              </Section>

              <Section icon={Code2} title="Configuration">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-muted/20 border border-border/40">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Check Type</p>
                    <p className="text-xs font-bold font-mono">{rule.check_type}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/20 border border-border/40">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Field</p>
                    <p className="text-xs font-bold font-mono">{rule.field}</p>
                  </div>
                </div>
              </Section>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-10 py-8 border-t border-border/10 bg-muted/5 flex items-center gap-4">
          {isMergeSuggestion ? (
            <>
              <Button
                onClick={() => { onMerge(otherRule?.rule_id || rule.merge_with, [rule.rule_id], `Merged rule based on suggestion`); onClose(); }}
                disabled={!otherRule}
                className="h-12 px-8 rounded-2xl font-black text-sm bg-violet-500 hover:bg-violet-600 text-white shadow-xl shadow-violet-500/20 transition-all active:scale-95 flex items-center gap-2"
              >
                <Merge className="w-4 h-4" /> Merge Suggestion
              </Button>
              <Button
                onClick={() => { onEdit(rule); onClose(); }}
                variant="outline"
                className="h-12 px-8 rounded-2xl font-black text-sm border-2 border-border/60 hover:bg-muted transition-all active:scale-95 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" /> Edit Suggestion
              </Button>
            </>
          ) : (
            <>
              {!isApproved && rule.status === 'pending' && (
                <Button
                  onClick={() => { onApprove(rule.rule_id); onClose(); }}
                  className="h-12 px-8 rounded-2xl font-black text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Approve
                </Button>
              )}
              <Button
                onClick={() => { onEdit(rule); onClose(); }}
                variant="outline"
                className="h-12 px-8 rounded-2xl font-black text-sm border-2 border-border/60 hover:bg-muted transition-all active:scale-95 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" /> Edit Rule
              </Button>
            </>
          )}
          <Button
            onClick={() => { onDelete([rule.rule_id]); onClose(); }}
            variant="outline"
            className="h-12 px-6 rounded-2xl font-black text-sm border-2 border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all active:scale-95 ml-auto flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete
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

const RuleComparisonCard = ({ r, isMain = true }) => {
  const Section = ({ icon: Icon, title, children }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="w-3.5 h-3.5" />
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/70">{title}</p>
      </div>
      {children}
    </div>
  );

  const InfoRow = ({ label, value }) => (
    <div className="flex items-center justify-between py-2 border-b border-border/10 last:border-0">
      <span className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/40">{label}</span>
      <span className="text-[10px] font-black text-foreground/80">{value ?? '—'}</span>
    </div>
  );

  return (
    <div className={`p-6 rounded-[2rem] border-2 ${isMain ? 'bg-card border-primary/20 ring-4 ring-primary/5' : 'bg-muted/5 border-border/40'} space-y-5 flex-1 min-w-[320px] transition-all`}>
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] font-black text-primary/60 bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-lg uppercase tracking-widest">
            {r.rule_id}
          </span>
          <StatusBadge status={r.status} />
          {r.on_fail && <SeverityBadge severity={r.on_fail.verdict} />}
        </div>
        <h3 className="text-lg font-black tracking-tight text-foreground leading-tight">
          {r.rule_name?.replace(/_/g, ' ')}
        </h3>
        <p className="text-xs text-muted-foreground font-medium leading-relaxed line-clamp-3">
          {r.description}
        </p>
      </div>

      <Section icon={FileText} title="Source Text">
        <div className="p-4 rounded-2xl bg-muted/10 border-l-4 border-primary/30">
          <p className="text-[11px] font-medium text-foreground/70 leading-relaxed italic line-clamp-4">
            &quot;{r.source_text}&quot;
          </p>
        </div>
      </Section>

      <Section icon={Database} title="Metadata">
        <div className="px-1">
          <InfoRow label="Source Doc" value={r.source_doc} />
          <InfoRow label="Disease" value={r.disease} />
          <InfoRow label="Source" value={r.source?.replace(/_/g, ' ')} />
        </div>
      </Section>

      <Section icon={Code2} title="Configuration">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2.5 rounded-xl bg-muted/20 border border-border/40">
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">Check Type</p>
            <p className="text-[10px] font-bold font-mono">{r.check_type}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/20 border border-border/40">
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">Field</p>
            <p className="text-[10px] font-bold font-mono">{r.field}</p>
          </div>
        </div>
      </Section>
    </div>
  );
};

/* ─── MERGE RULES DIALOG ─── */
const MergeRulesDialog = ({ open, ruleA, selectedRuleIds, rules, onMerge, onCancel, loading, userId }) => {
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (ruleA && selectedRuleIds.length > 1) {
      const otherIds = selectedRuleIds.filter(id => id !== ruleA.rule_id);
      setDescription(`Merged rule from ${ruleA.rule_id} and ${otherIds.join(', ')}`);
    }
  }, [ruleA, selectedRuleIds]);

  if (!open || !ruleA || selectedRuleIds.length < 2) return null;

  const otherRules = rules.filter(r => selectedRuleIds.includes(r.rule_id) && r.rule_id !== ruleA.rule_id);
  const otherIds = otherRules.map(r => r.rule_id);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border-2 border-border/40 rounded-[2.5rem] w-full max-w-[90vw] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[95vh]">
        {/* Header */}
        <div className="px-10 pt-10 pb-6 border-b-2 border-border/10 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <Merge className="w-8 h-8 text-violet-500" />
              Manual Merge Review
            </h2>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
              Merging {selectedRuleIds.length} Rules into Target: <span className="text-primary font-black">{ruleA.rule_id}</span>
            </p>
          </div>
          <button onClick={onCancel} className="w-12 h-12 rounded-full border-2 border-border/60 flex items-center justify-center hover:bg-muted transition-all active:scale-95">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-10 py-8 scrollbar-none space-y-10">
          <div className="flex flex-col md:flex-row gap-6 items-stretch overflow-x-auto pb-4 scrollbar-none">
            <RuleComparisonCard r={ruleA} isMain={true} />
            {otherRules.map(r => (
              <RuleComparisonCard key={r.rule_id} r={r} isMain={false} />
            ))}
          </div>

          <div className="p-8 rounded-[2.5rem] bg-muted/10 border-2 border-border/40 space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Merged Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a combined description for the merged rule..."
              className="w-full h-32 bg-white border-2 border-border/40 rounded-3xl p-6 text-sm font-medium focus:border-primary/40 focus:outline-none focus:ring-4 ring-primary/5 transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-8 border-t-2 border-border/10 bg-muted/5 flex items-center gap-4">
          <Button variant="outline" onClick={onCancel} disabled={loading} className="h-14 px-8 rounded-2xl font-black border-2 border-border/60 hover:bg-muted transition-all">
            Cancel
          </Button>
          <div className="ml-auto flex items-center gap-4">
            <Button 
              onClick={() => onMerge(ruleA.rule_id, otherIds, description)} 
              disabled={loading} 
              className="h-14 px-10 rounded-2xl font-black bg-violet-500 hover:bg-violet-600 text-white shadow-xl shadow-violet-500/20 transition-all active:scale-95 gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Merge className="w-5 h-5" />}
              Confirm Merge
            </Button>
            <Button 
              onClick={() => onMerge(ruleA.rule_id, otherIds, description, true)} 
              disabled={loading} 
              className="h-14 px-10 rounded-2xl font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 transition-all active:scale-95 gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              Merge & Approve
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── AI MERGE ANALYSIS MODAL ─── */
const AIMergeAnalysisModal = ({ open, ruleIds, rules, userId, onCancel, onConfirmMerge }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [merging, setMerging] = useState(false);
  const [mergedDescription, setMergedDescription] = useState('');

  useEffect(() => {
    const runAnalysis = async () => {
      if (!open || ruleIds.length < 2 || !userId) return;
      setLoading(true);
      setError('');
      setAnalysis(null);
      try {
        const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/merge-analysis`, {
          method: 'POST',
          headers: { 
            'x-user-id': userId,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            rule_id_a: ruleIds[0],
            rule_id_bs: ruleIds.slice(1)
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Analysis failed');
        setAnalysis(data);
        if (data.should_merge && data.merged_rule_draft) {
          setMergedDescription(data.merged_rule_draft.description);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    runAnalysis();
  }, [open, ruleIds, userId]);

  if (!open) return null;

  const selectedRules = rules.filter(r => ruleIds.includes(r.rule_id));
  const ruleA = selectedRules.find(r => r.rule_id === ruleIds[0]);
  const otherRules = selectedRules.filter(r => r.rule_id !== ruleIds[0]);

  const handleAction = async (shouldApprove = false) => {
    setMerging(true);
    try {
      await onConfirmMerge(ruleIds[0], ruleIds.slice(1), mergedDescription, shouldApprove);
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border-2 border-border/40 rounded-[2.5rem] w-full max-w-[95vw] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 max-h-[95vh]">
        {/* Header */}
        <div className="px-10 pt-10 pb-6 border-b-2 border-border/10 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <Zap className="w-8 h-8 text-primary fill-primary/20" />
              AI Semantic Merge Analysis
            </h2>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
              Comparing {ruleIds.length} Rules for Semantic Redundancy
            </p>
          </div>
          <button onClick={onCancel} className="w-12 h-12 rounded-full border-2 border-border/60 flex items-center justify-center hover:bg-muted transition-all active:scale-95">
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-40">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center relative mb-6">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <Zap className="w-6 h-6 text-primary absolute animate-pulse" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Running Neural Semantic Comparison...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center py-40 text-red-500">
            <AlertCircle className="w-16 h-16 mb-4" />
            <p className="text-xl font-black text-center">{error}</p>
            <Button onClick={onCancel} variant="outline" className="mt-8 rounded-2xl h-12 px-8 font-black">Close Analysis</Button>
          </div>
        ) : analysis ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-10 py-8 scrollbar-none space-y-10">
              {/* Verdict Section */}
              <div className="flex flex-col lg:flex-row gap-6">
                <div className={`flex-1 p-8 rounded-[2.5rem] border-2 flex items-center justify-between ${analysis.should_merge ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">AI Verdict</p>
                    <div className={`text-3xl font-black flex items-center gap-3 ${analysis.should_merge ? 'text-emerald-600' : 'text-red-600'}`}>
                      {analysis.should_merge ? (
                        <><CheckCircle2 className="w-8 h-8" /> Recommended</>
                      ) : (
                        <><ShieldX className="w-8 h-8" /> Not Recommended</>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Confidence</p>
                    <p className="text-4xl font-black tracking-tighter text-primary">{Math.round((analysis.confidence || 0) * 100)}%</p>
                  </div>
                </div>
                
                <div className="flex-[1.5] p-8 rounded-[2.5rem] bg-violet-500/5 border-2 border-violet-500/10 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-violet-500/60">Reasoning</p>
                  <p className="text-sm font-medium leading-relaxed text-foreground/80 italic">
                    "{analysis.reason}"
                  </p>
                </div>
              </div>

              {/* Rules Side-by-Side */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Rules Comparison</p>
                <div className="flex flex-col md:flex-row gap-6 items-stretch overflow-x-auto pb-4 scrollbar-none">
                  <RuleComparisonCard r={ruleA} isMain={true} />
                  {otherRules.map(r => (
                    <RuleComparisonCard key={r.rule_id} r={r} isMain={false} />
                  ))}
                </div>
              </div>

              {/* Merged Description */}
              {analysis.should_merge && (
                <div className="p-8 rounded-[2.5rem] bg-muted/10 border-2 border-border/40 space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Edit2 className="w-4 h-4" />
                    Merged Description Draft
                  </label>
                  <textarea
                    value={mergedDescription}
                    onChange={(e) => setMergedDescription(e.target.value)}
                    className="w-full h-32 bg-white border-2 border-border/40 rounded-3xl p-6 text-sm font-medium focus:border-primary/40 focus:outline-none focus:ring-4 ring-primary/5 transition-all"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-10 py-8 border-t-2 border-border/10 bg-muted/5 flex items-center gap-4">
              <Button variant="outline" onClick={onCancel} className="h-14 px-8 rounded-2xl font-black border-2 border-border/60 hover:bg-muted">
                Discard Analysis
              </Button>
              <div className="ml-auto flex items-center gap-4">
                <Button 
                  onClick={() => handleAction(false)} 
                  disabled={merging}
                  className="h-14 px-10 rounded-2xl font-black bg-violet-500 hover:bg-violet-600 text-white shadow-xl shadow-violet-500/20 gap-2 transition-all active:scale-95"
                >
                  {merging ? <Loader2 className="w-5 h-5 animate-spin" /> : <Merge className="w-5 h-5" />}
                  Confirm Merge
                </Button>
                <Button 
                  onClick={() => handleAction(true)} 
                  disabled={merging}
                  className="h-14 px-10 rounded-2xl font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 gap-2 transition-all active:scale-95"
                >
                  {merging ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  Merge & Approve
                </Button>
              </div>
            </div>
          </div>
        ) : null}
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
  const [mergeModal, setMergeModal]       = useState({ open: false, ruleA: null });
  const [detailModal, setDetailModal]     = useState({ open: false, rule: null }); // ← NEW
  const [aiMergeModal, setAiMergeModal]   = useState(false);

  const fetchRules = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const url = `${BASE_URL}/admin/rules/${DISEASE}`;
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
  }, [userId]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const filteredByStatus = rules.filter(r => r.status === statusFilter);
  const totalPages = Math.ceil(filteredByStatus.length / RULES_PER_PAGE);
  const paginatedRules = filteredByStatus.slice((currentPage - 1) * RULES_PER_PAGE, currentPage * RULES_PER_PAGE);

  const handleApprove = async (ruleId) => {
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/${ruleId}/approve`, {
        method: 'PATCH',
        headers: { 'x-user-id': userId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Approve failed');
      setRules(prev => prev.map(r => r.rule_id === ruleId ? { ...r, status: 'approved' } : r));
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

  const handleMerge = async (ruleIdA, ruleIdBs, mergedDescription, shouldApprove = false) => {
    setBulkLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/merge`, {
        method: 'POST',
        headers: { 'x-user-id': userId, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          rule_id_a: ruleIdA,
          rule_id_bs: ruleIdBs,
          merged_description: mergedDescription
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Merge failed');
      
      if (shouldApprove) {
        await handleApprove(ruleIdA);
      }

      fetchRules();
      setMergeModal({ open: false, ruleA: null });
      setAiMergeModal(false);
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
      setRules(prev => prev.map(r => selectedRuleIds.includes(r.rule_id) ? { ...r, status: 'approved' } : r));
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
        selectedRuleIds={selectedRuleIds}
        rules={rules}
        userId={userId}
        onMerge={handleMerge}
        onCancel={() => setMergeModal({ open: false, ruleA: null })}
        loading={bulkLoading}
      />

      <AIMergeAnalysisModal
        open={aiMergeModal}
        ruleIds={selectedRuleIds}
        rules={rules}
        userId={userId}
        onCancel={() => setAiMergeModal(false)}
        onConfirmMerge={handleMerge}
      />

      {/* ── Rule Detail Modal (NEW) ── */}
      <RuleDetailModal
        open={detailModal.open}
        rule={detailModal.rule}
        userId={userId}
        onClose={() => setDetailModal({ open: false, rule: null })}
        onApprove={handleApprove}
        onEdit={(rule) => setEditModal({ open: true, rule })}
        onDelete={(ruleIds) => setDeleteConfirm({ open: true, ruleIds })}
        onMerge={handleMerge}
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
            {['pending', 'approved', 'merge_suggestion'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                  ${statusFilter === s ? 'bg-background text-primary shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {s.replace('_', ' ')}
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
          { label: 'Approved Rules',  value: rules.filter(r => r.status === 'approved').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Merge Suggestions', value: rules.filter(r => r.status === 'merge_suggestion').length, icon: Merge, color: 'text-violet-500', bg: 'bg-violet-500/10' },
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
                {loading ? '...' : filteredByStatus.length} Items
              </span>
            </CardTitle>

            {selectedRuleIds.length > 0 && (
              <div className="flex items-center gap-3 animate-in slide-in-from-right-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-2">
                  {selectedRuleIds.length} Selected
                </span>
                <Button
                  onClick={() => setAiMergeModal(true)}
                  disabled={selectedRuleIds.length < 2 || bulkLoading}
                  className="h-10 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-violet-500 hover:bg-violet-600 text-white gap-2 shadow-lg shadow-violet-500/20"
                >
                  <Zap className="w-3.5 h-3.5" /> AI Merge Analysis
                </Button>
                <Button
                  onClick={() => {
                    const ruleA = rules.find(r => r.rule_id === selectedRuleIds[0]);
                    setMergeModal({ open: true, ruleA });
                  }}
                  disabled={selectedRuleIds.length < 2 || bulkLoading}
                  className="h-10 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-primary hover:bg-primary/90 text-white gap-2 shadow-lg shadow-primary/20"
                >
                  <Merge className="w-3.5 h-3.5" /> Manual Merge
                </Button>
                <Button
                  onClick={handleBulkApprove}
                  disabled={bulkLoading || statusFilter === 'approved'}
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
                <Button
                  onClick={() => setSelectedRuleIds([])}
                  variant="ghost"
                  className="h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  Clear
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
          ) : filteredByStatus.length === 0 ? (
            <div className="py-32 flex flex-col items-center gap-6 text-center opacity-40">
              <div className="w-20 h-20 bg-muted rounded-[2.5rem] flex items-center justify-center shadow-inner">
                <BookOpen className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <p className="font-black text-lg">No Rules Found</p>
                <p className="text-sm font-medium">No rules match the current status filter.</p>
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
                          {rule.status === 'merge_suggestion' && rule.merge_with && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest bg-violet-500/10 text-violet-600 border border-violet-500/20 flex items-center gap-1">
                              <Merge className="w-2.5 h-2.5" /> {rule.merge_with}
                            </span>
                          )}
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
                      {rule.status === 'merge_suggestion' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setDetailModal({ open: true, rule }); }}
                          className="h-9 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl border-violet-500/20 text-violet-600 hover:bg-violet-500 hover:text-white transition-all shadow-sm"
                        >
                          Compare & Merge
                        </Button>
                      ) : rule.status === 'pending' && (
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
        {!loading && filteredByStatus.length > RULES_PER_PAGE && (
          <div className="px-8 py-6 border-t-2 border-border/5 bg-muted/5 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              Showing <span className="text-foreground">{(currentPage-1)*RULES_PER_PAGE + 1}</span> to <span className="text-foreground">{Math.min(currentPage*RULES_PER_PAGE, filteredByStatus.length)}</span> of <span className="text-foreground">{filteredByStatus.length}</span> Rules
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