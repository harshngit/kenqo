import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  GitBranch,
  Search,
  CheckCircle2,
  Ban,
  Loader2,
  ArrowLeftRight,
  FileText,
  Layers,
  X,
  Merge,
  Eye,
  Edit2,
  Save,
  Trash2,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '../../components/ui/dialog';
import { toast } from 'sonner';

const BASE_URL = 'https://kenqo-api-409744260053.asia-south1.run.app';
const DISEASE = 'lymphedema';

const toTitleCase = (str) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const StatusBadge = ({ status }) => {
  const s = (status || 'pending').toLowerCase();
  const map = {
    approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    pending: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    disabled: 'bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20',
    merge_suggestion: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${map[s] || map.pending}`}>
      {s}
    </span>
  );
};

const VerdictBadge = ({ verdict }) => {
  const v = typeof verdict === 'object' ? verdict.verdict : verdict;
  const map = {
    RED: 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
    YELLOW: 'bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20',
    PASS: 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  };
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md tracking-wider ${map[v] || map.YELLOW}`}>
      {v || 'YELLOW'}
    </span>
  );
};

const BlockingSeverityDot = ({ severity }) => {
  if (!severity) return null;
  const map = {
    HARD_BLOCK: 'text-red-500',
    SOFT_BLOCK: 'text-amber-500',
    ADVISORY: 'text-blue-500',
  };
  return (
    <span 
      className={`cursor-help ${map[severity] || 'text-gray-400'}`} 
      title={severity.replace(/_/g, ' ')}
    >
      ●
    </span>
  );
};

const MergeRuleCard = ({ r }) => {
   const [expanded, setExpanded] = useState(false);
   if (!r) return null;
 
   return (
    <div className="min-w-[380px] max-w-[380px] h-fit">
      <div className="p-6 rounded-[2rem] border-2 border-border/40 bg-card shadow-sm flex flex-col transition-all duration-300">
        {/* SUMMARY LEVEL */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded">{r.rule_id}</span>
            <StatusBadge status={r.status} />
            <VerdictBadge verdict={r.on_fail} />
          </div>
        </div>

        <h3 className="text-sm font-mono font-black tracking-tight mb-2 truncate">{r.rule_name}</h3>
        <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{r.description}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded">{r.rule_type || '-'}</span>
          <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 px-2 py-0.5 rounded">{r.scope_level || '-'}</span>
          <span className="text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 px-2 py-0.5 rounded">{r.payer_scope || '-'}</span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
            <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">ON PASS</p>
            <p className="text-[10px] font-medium text-emerald-900/80 dark:text-emerald-400/80 leading-relaxed truncate">{r.on_pass?.message || 'No pass message'}</p>
          </div>
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
            <p className="text-[8px] font-black text-red-600 uppercase tracking-widest mb-1">ON FAIL</p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-medium text-red-900/80 dark:text-red-400/80 leading-relaxed truncate flex-1">{r.on_fail?.message || 'No fail message'}</p>
              <div className="flex gap-2 shrink-0">
                {r.on_fail?.carc && <span className="text-[8px] font-black bg-red-500/10 px-1.5 py-0.5 rounded text-red-600">{r.on_fail.carc}</span>}
                {r.on_fail?.rarc && <span className="text-[8px] font-black bg-red-500/10 px-1.5 py-0.5 rounded text-red-600">{r.on_fail.rarc}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-medium truncate flex-1">
            <FileText className="w-3 h-3" />
            <span className="truncate">{(r.source_doc || '').split('/').pop()}</span>
          </div>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1 shrink-0"
          >
            {expanded ? (
              <><ChevronUp className="w-3 h-3" /> Show Less</>
            ) : (
              <><ChevronDown className="w-3 h-3" /> Show More</>
            )}
          </button>
        </div>

        {/* EXPANDED LEVEL */}
        {expanded && (
          <div className="border-t border-border/10 mt-4 pt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/10 border border-border/20">
                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Check Type</p>
                <p className="text-[10px] font-black uppercase text-primary/80">{r.check_type || '-'}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/10 border border-border/20">
                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">LLM Required</p>
                <p className="text-[10px] font-black uppercase text-blue-600/80">{r.llm_judgement ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {r.stored_message && (
              <div className="p-3 rounded-xl bg-muted/10 border border-border/20">
                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Stored Message</p>
                <p className="text-[10px] font-medium leading-relaxed italic">"{r.stored_message}"</p>
              </div>
            )}

            <div className="p-3 rounded-xl bg-muted/10 border border-border/20">
              <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2">Parameters</p>
              <div className="space-y-2">
                {(() => {
                  const flattened = [];
                  const process = (obj, prefix = '') => {
                    Object.entries(obj || {}).forEach(([k, v]) => {
                      if (v == null) return;
                      const label = prefix ? `${prefix} - ${toTitleCase(k)}` : toTitleCase(k);
                      if (typeof v === 'object' && !Array.isArray(v)) process(v, label);
                      else flattened.push({ label, v });
                    });
                  };
                  process(r.parameters);
                  return flattened.length > 0 ? flattened.map((item, i) => (
                    <div key={i} className="flex justify-between items-start gap-4">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{item.label}</span>
                      <div className="text-right">
                        {Array.isArray(item.v) ? (
                          <div className="flex flex-wrap justify-end gap-1">
                            {item.v.map((val, idx) => (
                              <span key={idx} className="bg-primary/10 text-primary text-[8px] font-black px-1.5 py-0.5 rounded">{String(val)}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold">{item.v === true ? 'Yes' : item.v === false ? 'No' : String(item.v)}</span>
                        )}
                      </div>
                    </div>
                  )) : <p className="text-[9px] italic text-muted-foreground/40">No parameters</p>;
                })()}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 shadow-inner">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mb-2">Source Context</p>
              <p className="text-[11px] font-medium text-foreground/80 leading-relaxed italic">
                "{r.source_text}"
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-muted/10 border border-border/20 text-center">
                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Effective</p>
                <p className="text-[9px] font-bold">{r.effective_date || '-'}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/10 border border-border/20 text-center">
                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Confidence</p>
                <p className="text-[9px] font-bold">{Math.round((r.confidence_score || 0) * 100)}%</p>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/10 border border-border/20 text-center">
                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Version</p>
                <p className="text-[9px] font-bold">{r.version || '1.0'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SuperAdminRules = () => {
  const authUser = useSelector((state) => state.auth?.user);
  const userId = authUser?.user_id || authUser?.id || '';
  const [tab, setTab] = useState('pending');
  const [isLoading, setIsLoading] = useState(false);
  const [rules, setRules] = useState([]);
  const [rulesLoaded, setRulesLoaded] = useState(false);
  const [rulesSearch, setRulesSearch] = useState('');
  const [selected, setSelected] = useState({});
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRule, setDetailRule] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [mergeLoaded, setMergeLoaded] = useState(false);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeSuggestions, setMergeSuggestions] = useState([]);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [pollingBanner, setPollingBanner] = useState(false);
  
  const initialSuggestionCount = useRef(0);
  const rebuildStartTime = useRef(0);
  const pollingIntervalRef = useRef(null);

  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [manualMergeOpen, setManualMergeOpen] = useState(false);
  const [mergeDraft, setMergeDraft] = useState({ a: null, b: null, bs: [], desc: '', rules: [], aiDraft: null });
  const [chunksLoaded, setChunksLoaded] = useState(false);
  const [chunksLoading, setChunksLoading] = useState(false);
  const [chunks, setChunks] = useState([]);
  const [chunksSearch, setChunksSearch] = useState('');
  const [sourceDocFilter, setSourceDocFilter] = useState('all');
  const [ruleTypeFilter, setRuleTypeFilter] = useState('all');

  const uniqueSourceDocs = useMemo(() => {
    const docs = new Set();
    rules.forEach(r => {
      if (r.source_doc) docs.add(r.source_doc);
    });
    return Array.from(docs).sort();
  }, [rules]);

  const uniqueRuleTypes = useMemo(() => {
    const types = new Set();
    rules.forEach(r => {
      if (r.rule_type) types.add(r.rule_type);
    });
    return Array.from(types).sort();
  }, [rules]);

  const stats = useMemo(() => {
    const pending = rules.filter(r => (r.status || '').toLowerCase() === 'pending').length;
    const approved = rules.filter(r => (r.status || '').toLowerCase() === 'approved').length;
    const total = pending + approved;
    const suggestions = mergeSuggestions.length;
    return { total, pending, approved, suggestions };
  }, [rules, mergeSuggestions]);

  const loadRules = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}`, { headers: { 'x-user-id': userId } });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || 'Failed to load rules');
      const arr = json.rules || json.rule || json || [];
      setRules(Array.isArray(arr) ? arr : []);
      setRulesLoaded(true);
    } catch (e) {
      toast.error(e.message || 'Failed to load rules');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const loadMerge = useCallback(async () => {
    if (!userId) return;
    setMergeLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/merge-suggestions`, { headers: { 'x-user-id': userId } });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || 'Failed to load suggestions');
      setMergeSuggestions(json.suggestions || json || []);
      setMergeLoaded(true);
    } catch (e) {
      toast.error(e.message || 'Failed to load suggestions');
    } finally {
      setMergeLoading(false);
    }
  }, [userId]);

  const loadChunks = useCallback(async () => {
    if (!userId) return;
    setChunksLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/chunks`, { headers: { 'x-user-id': userId } });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || 'Failed to load chunks');
      setChunks(json.chunks || json || []);
      setChunksLoaded(true);
    } catch (e) {
      toast.error(e.message || 'Failed to load chunks');
    } finally {
      setChunksLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!rulesLoaded) loadRules();
  }, [rulesLoaded, loadRules]);

  useEffect(() => {
    if (tab === 'merge' && !mergeLoaded) loadMerge();
    if (tab === 'chunks' && !chunksLoaded) loadChunks();
  }, [tab, mergeLoaded, chunksLoaded, loadMerge, loadChunks]);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  const filteredRules = useMemo(() => {
    let arr = rules || [];
    const isStatusTab = ['pending', 'approved', 'disabled'].includes(tab);
    if (isStatusTab) {
      arr = arr.filter(r => (r.status || '').toLowerCase() === tab);
    }
    if (rulesSearch.trim()) {
      const q = rulesSearch.toLowerCase();
      arr = arr.filter(r =>
        (r.rule_name || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q)
      );
    }
    if (sourceDocFilter !== 'all') {
      arr = arr.filter(r => r.source_doc === sourceDocFilter);
    }
    if (ruleTypeFilter !== 'all') {
      arr = arr.filter(r => r.rule_type === ruleTypeFilter);
    }
    return arr;
  }, [rules, tab, rulesSearch, sourceDocFilter, ruleTypeFilter]);

  const toggleSelected = (id) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected]);

  const patchRule = async (ruleId, action) => {
    if (!userId) return;
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/${ruleId}/${action}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ user_id: userId }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || 'Action failed');
      setRules(prev => prev.map(r => r.rule_id === ruleId ? { ...r, status: action === 'approve' ? 'approved' : 'disabled' } : r));
      toast.success(action === 'approve' ? 'Rule approved' : 'Rule disabled');
    } catch (e) {
      toast.error(e.message || 'Request failed');
    }
  };

  const bulkApprove = async () => {
    if (!userId || selectedIds.length === 0) return;
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/bulk-approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ user_id: userId, rule_ids: selectedIds }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || 'Bulk approve failed');
      setRules(prev => prev.map(r => selectedIds.includes(r.rule_id) ? { ...r, status: 'approved' } : r));
      setSelected({});
      toast.success('Selected rules approved');
    } catch (e) {
      toast.error(e.message || 'Bulk approve failed');
    }
  };

  const openDetail = (rule) => {
    setDetailRule(rule);
    setEditForm(rule);
    setIsEditing(false);
    setDetailOpen(true);
  };

  const openEdit = (rule) => {
    setDetailRule(rule);
    setEditForm(rule);
    setIsEditing(true);
    setDetailOpen(true);
  };

  const handleUpdateRule = async () => {
    if (!userId || !detailRule?.rule_id) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/${detailRule.rule_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ ...editForm, user_id: userId }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || 'Update failed');
      setRules(prev => prev.map(r => r.rule_id === detailRule.rule_id ? { ...r, ...editForm } : r));
      setDetailRule({ ...detailRule, ...editForm });
      setIsEditing(false);
      toast.success('Rule updated successfully');
    } catch (e) {
      toast.error(e.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const rebuildSuggestions = async () => {
    if (!userId || isRebuilding) return;
    setIsRebuilding(true);
    initialSuggestionCount.current = (mergeSuggestions || []).length;
    rebuildStartTime.current = Date.now();
    
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/build-merge-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || 'Failed to start rebuild');
      }
      
      setPollingBanner(true);
      toast.success('Rebuild started — checking for new suggestions');

      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/merge-suggestions`, { 
            headers: { 'x-user-id': userId } 
          });
          const pollJson = await pollRes.json();
          
          if (pollRes.ok && pollJson?.success) {
            const newSuggestions = pollJson?.suggestions || pollJson || [];
            const timePassed = Date.now() - rebuildStartTime.current;
            const newCount = (newSuggestions || []).length;

            if (newCount !== initialSuggestionCount.current) {
              clearInterval(pollingIntervalRef.current);
              setMergeSuggestions(newSuggestions);
              setIsRebuilding(false);
              setPollingBanner(false);
              toast.success(`Merge suggestions updated — ${newCount} suggestions found`);
            } else if (timePassed >= 60000) {
              clearInterval(pollingIntervalRef.current);
              setIsRebuilding(false);
              setPollingBanner(false);
              toast.success('Build complete — no new suggestions found');
            }
          }
        } catch (e) {
          console.error('Polling failed', e);
        }
      }, 5000);

    } catch (e) {
      toast.error(e.message || 'Failed to rebuild');
      setIsRebuilding(false);
    }
  };

  const analyzeMultiMerge = async (ids) => {
    if (!userId || ids.length < 2) return;
    setAnalysisResult(null);
    setAnalysisOpen(true);
    
    // For the rules list in the analysis modal
    const mergeRules = rules.filter(r => ids.includes(r.rule_id));
    setMergeDraft({ a: ids[0], bs: ids.slice(1), desc: '', rules: mergeRules, aiDraft: null });

    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/merge-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ rule_id_a: ids[0], rule_id_bs: ids.slice(1) }),
      });
      const data = await res.json();
      setAnalysisResult(data);
    } catch (e) {
      toast.error('Analysis failed');
    }
  };

  const analyzeMerge = async (s) => {
    if (!userId) return;
    setAnalysisResult(null); 
    setAnalysisOpen(true);
    
    const fetchRule = async (id) => {
      let r = rules.find(rule => rule.rule_id === id);
      if (r) return r;
      try {
        const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/${id}`, { headers: { 'x-user-id': userId } });
        const json = await res.json();
        if (res.ok) return json.rule || json;
      } catch (e) {
        console.error(`Failed to fetch rule ${id}`, e);
      }
      return null;
    };

    const ruleA = await fetchRule(s.rule_id_a);
    const ruleB = await fetchRule(s.rule_id_b);
    const rulesList = [ruleA, ruleB].filter(Boolean);
    
    setMergeDraft(prev => ({ ...prev, a: s.rule_id_a, b: s.rule_id_b, bs: [s.rule_id_b], rules: rulesList, aiDraft: null }));
    
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/merge-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ rule_id_a: s.rule_id_a, rule_id_bs: [s.rule_id_b] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Analysis failed');
      setAnalysisResult(data);
    } catch (e) {
      toast.error(e.message || 'Analysis failed');
      setAnalysisOpen(false);
    }
  };

  const flagMerge = async (s) => {
    if (!userId) return;
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/flag-merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ user_id: userId, rule_id_a: s.rule_id_a, rule_id_b: s.rule_id_b }),
      });
      if (res.ok) {
        toast.success('Rules flagged for merge');
        loadRules();
      }
    } catch (e) {
      toast.error('Flag failed');
    }
  };

  const dismissMerge = async (s) => {
    if (!userId) return;
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/${s.rule_id_a}/dismiss-merge`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ user_id: userId }),
      });
      if (res.ok) {
        setMergeSuggestions(prev => prev.filter(item => item.rule_id_a !== s.rule_id_a));
        toast.success('Suggestion dismissed');
      }
    } catch (e) {
      toast.error('Dismiss failed');
    }
  };

  const startMerge = async (s) => {
    if (!userId) return;
    
    const fetchRule = async (id) => {
      let r = rules.find(rule => rule.rule_id === id);
      if (r) return r;
      try {
        const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/${id}`, { headers: { 'x-user-id': userId } });
        const json = await res.json();
        if (res.ok) return json.rule || json;
      } catch (e) {
        console.error(`Failed to fetch rule ${id}`, e);
      }
      return null;
    };

    const ruleA = await fetchRule(s.rule_id_a);
    const ruleB = await fetchRule(s.rule_id_b);
    const mergeList = [ruleA, ruleB].filter(Boolean);
    
    setMergeDraft({ a: s.rule_id_a, b: s.rule_id_b, bs: [s.rule_id_b], desc: '', rules: mergeList, aiDraft: null });
    setManualMergeOpen(true);
  };

  const openManualMerge = (selected) => {
    if (selected.length < 2) return;
    setMergeDraft({ a: selected[0].rule_id, bs: selected.slice(1).map(r => r.rule_id), desc: '', rules: selected, aiDraft: null });
    setManualMergeOpen(true);
  };

  const executeMerge = async (shouldApprove = false) => {
    if (!userId || !mergeDraft.a) return;
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({
          user_id: userId,
          rule_id_a: mergeDraft.a,
          rule_id_bs: mergeDraft.bs,
          merged_description: mergeDraft.desc || undefined,
          merged_rule_draft: mergeDraft.aiDraft || undefined
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Merge failed');
      
      const newRuleId = data.merged_rule_id || data.rule_id || mergeDraft.a;
      const mergeType = data.merge_type || 'merge';

      if (shouldApprove) {
        await fetch(`${BASE_URL}/admin/rules/${DISEASE}/${newRuleId}/approve`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
          body: JSON.stringify({ user_id: userId }),
        });
        toast.success(`Rules merged and approved via ${mergeType}`);
      } else {
        toast.success(`Rules merged via ${mergeType}`);
      }

      setManualMergeOpen(false);
      setAnalysisOpen(false);
      setSelected({});
      loadRules();
      if (tab === 'merge') loadMerge();
    } catch (e) {
      toast.error(e.message || 'Merge failed');
    }
  };

  const selectedRules = useMemo(() => rules.filter(r => selected[r.rule_id]), [rules, selected]);

  const rulesToolbar = (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div className="flex items-center gap-3 flex-1">
        {selectedIds.length >= 2 ? (
          <div className="flex items-center gap-3 animate-in slide-in-from-left-4 duration-300">
            <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mr-2">
              {selectedIds.length} Selected
            </div>
            <Button 
              onClick={() => analyzeMultiMerge(selectedIds)} 
              className="h-11 rounded-full px-6 bg-[#A855F7] hover:bg-[#9333EA] text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-purple-500/20"
            >
              <GitBranch className="w-4 h-4 mr-2" />
              AI Merge Analysis
            </Button>
            <Button 
              onClick={() => openManualMerge(selectedRules)}
              className="h-11 rounded-full px-6 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20"
            >
              <Merge className="w-4 h-4 mr-2" />
              Manual Merge
            </Button>
            <Button 
              onClick={bulkApprove}
              className="h-11 rounded-full px-6 bg-[#10B981] hover:bg-[#059669] text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve
            </Button>
            <Button 
              variant="outline"
              className="h-11 rounded-full px-6 border-[#EF4444] text-[#EF4444] hover:bg-red-50 font-black uppercase tracking-widest text-[10px]"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-1">
            <div className="relative w-72 max-w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by rule name..."
                value={rulesSearch}
                onChange={(e) => setRulesSearch(e.target.value)}
                className="pl-9 h-10 text-xs font-black"
              />
            </div>

            <div className="relative">
              <select
                value={sourceDocFilter}
                onChange={(e) => setSourceDocFilter(e.target.value)}
                className="h-10 pl-3 pr-9 bg-card border-2 border-border/40 rounded-xl text-xs font-black focus:outline-none focus:border-primary/40 transition-all cursor-pointer min-w-[160px] appearance-none"
              >
                <option value="all">All Source Docs</option>
                {uniqueSourceDocs.map(doc => (
                  <option key={doc} value={doc}>{doc.split('/').pop()}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={ruleTypeFilter}
                onChange={(e) => setRuleTypeFilter(e.target.value)}
                className="h-10 pl-3 pr-9 bg-card border-2 border-border/40 rounded-xl text-xs font-black focus:outline-none focus:border-primary/40 transition-all cursor-pointer min-w-[140px] appearance-none"
              >
                <option value="all">All Rule Types</option>
                {uniqueRuleTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
            </div>
          </div>
        )}
      </div>
      {selectedIds.length < 2 && (
        <Button onClick={bulkApprove} disabled={selectedIds.length === 0} className="h-11 rounded-xl font-black">
          <CheckCircle2 className="w-4 h-4" />
          Bulk Approve
          {selectedIds.length > 0 && (
            <span className="ml-2 text-[10px] font-black bg-white/20 px-1.5 py-0.5 rounded">{selectedIds.length}</span>
          )}
        </Button>
      )}
    </div>
  );

  const renderRuleCard = (r) => {
    const conf = typeof r.confidence_score === 'number' ? r.confidence_score : 0;
    const confPct = Math.round(conf * 100);
    const confColor = conf >= 0.9 ? 'bg-emerald-500' : conf >= 0.75 ? 'bg-amber-500' : 'bg-red-500';
    const sourceName = (r.source_doc || '').split('/').pop();
    const status = (r.status || '').toLowerCase();
    return (
      <Card key={r.rule_id} className="hover:border-primary/40">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">{r.rule_id}</span>
                <StatusBadge status={status} />
                <BlockingSeverityDot severity={r.blocking_severity} />
              </div>
              <div className="font-mono font-extrabold text-base tracking-tight truncate">{r.rule_name || 'unnamed_rule'}</div>
              <div className="text-sm text-muted-foreground mt-1 truncate">{r.description || 'No description'}</div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {r.rule_type && <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded">{r.rule_type}</span>}
                {r.scope_level && <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 px-2 py-0.5 rounded">{r.scope_level}</span>}
                {r.payer_scope && <span className="text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 px-2 py-0.5 rounded">{r.payer_scope}</span>}
                
                {/* New scope fields */}
                {r.scope_category && <span className="text-[10px] font-black uppercase tracking-widest bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 px-2 py-0.5 rounded">{r.scope_category}</span>}
                {r.scope_body_part && <span className="text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 px-2 py-0.5 rounded">{r.scope_body_part}</span>}
                {r.scope_fabrication && <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 px-2 py-0.5 rounded">{r.scope_fabrication}</span>}
                {r.scope_usage_time && <span className="text-[10px] font-black uppercase tracking-widest bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 px-2 py-0.5 rounded">{r.scope_usage_time}</span>}
                
                {r.on_fail && <VerdictBadge verdict={r.on_fail} />}
                {sourceName && (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground ml-1">
                    <FileText className="w-3.5 h-3.5" /> {sourceName}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${confColor}`} style={{ width: `${confPct}%` }} />
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 font-bold tracking-widest">{confPct}% confidence</div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={!!selected[r.rule_id]}
                  onChange={() => toggleSelected(r.rule_id)}
                  className="w-5 h-5 rounded border-2 border-border/60"
                />
                <Button
                  onClick={() => patchRule(r.rule_id, 'approve')}
                  variant="outline"
                  className="h-9 rounded-xl font-bold"
                  disabled={status === 'approved'}
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve
                </Button>
                <Button
                  onClick={() => patchRule(r.rule_id, 'disable')}
                  variant="ghost"
                  className="h-9 rounded-xl font-bold text-destructive hover:text-destructive"
                  disabled={status === 'disabled'}
                >
                  <Ban className="w-4 h-4" /> Disable
                </Button>
              </div>
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors" 
                  onClick={() => openDetail(r)}
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-lg hover:bg-amber-500/10 hover:text-amber-500 transition-colors" 
                  onClick={() => openEdit(r)}
                  title="Edit Rule"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderMergeCard = (s) => {
    const conf = s.confidence || s.merge_confidence || 0;
    const confPct = Math.round(conf * 100);
    const confColor = conf >= 0.9 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : conf >= 0.75 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-red-600 bg-red-50 border-red-200';
    
    return (
      <Card key={`${s.rule_id_a}-${s.rule_id_b}`} className="overflow-hidden border-2 border-border/40 hover:border-primary/30 transition-all rounded-[2.5rem]">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] items-stretch">
            {/* Rule A */}
            <div className="p-6 bg-muted/5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border/10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-widest">{s.rule_id_a}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Base Rule</span>
                </div>
                <div className="font-mono font-black text-sm text-foreground mb-1 truncate">{s.rule_name_a}</div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                  <FileText className="w-3 h-3" />
                  <span className="truncate">{(s.source_doc_a || '').split('/').pop()}</span>
                </div>
              </div>
            </div>

            {/* Divider Icon */}
            <div className="flex items-center justify-center p-4 lg:p-0 bg-muted/10 lg:w-16">
              <div className="w-10 h-10 rounded-full bg-background border-2 border-border/40 flex items-center justify-center shadow-sm">
                <ArrowLeftRight className="w-5 h-5 text-primary" />
              </div>
            </div>

            {/* Rule B */}
            <div className="p-6 bg-muted/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded uppercase tracking-widest">{s.rule_id_b}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Candidate Rule</span>
                </div>
                <div className="font-mono font-black text-sm text-foreground mb-1 truncate">{s.rule_name_b}</div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                  <FileText className="w-3 h-3" />
                  <span className="truncate">{(s.source_doc_b || '').split('/').pop()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions & Reason */}
          <div className="px-8 py-5 border-t-2 border-border/10 bg-card flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full border ${confColor}`}>
                  {confPct}% Merge Confidence
                </span>
              </div>
              <p className="text-xs font-medium text-muted-foreground leading-relaxed italic line-clamp-2">
                "{s.reason}"
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" className="h-10 rounded-xl font-black uppercase tracking-widest text-[10px] border-2" onClick={() => analyzeMerge(s)}>
                Analyse
              </Button>
              <Button variant="ghost" className="h-10 rounded-xl font-black uppercase tracking-widest text-[10px] text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => flagMerge(s)}>
                Flag
              </Button>
              <Button variant="ghost" className="h-10 rounded-xl font-black uppercase tracking-widest text-[10px] text-destructive hover:bg-destructive/5" onClick={() => dismissMerge(s)}>
                Dismiss
              </Button>
              <Button className="h-10 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20" onClick={() => startMerge(s)}>
                <Merge className="w-3.5 h-3.5" /> Merge Rules
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const filteredChunks = useMemo(() => {
    const q = chunksSearch.toLowerCase();
    return (chunks || []).filter(c =>
      !q ||
      (c.source_doc || '').toLowerCase().includes(q) ||
      (c.summary || '').toLowerCase().includes(q)
    );
  }, [chunks, chunksSearch]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
            <GitBranch className="w-3.5 h-3.5" /> Rules
          </div>
          <h1 className="text-3xl font-black tracking-tight">Coverage Rules</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Review extracted rules, verify merge suggestions, and inspect chunks.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Disease</span>
          <span className="text-xs font-bold px-2 py-1 rounded-lg bg-primary/10 text-primary">lymphedema</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Rules', val: stats.total, color: 'text-primary bg-primary/10 border-primary/20' },
          { label: 'Pending Approval', val: stats.pending, color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
          { label: 'Approved Rules', val: stats.approved, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Merge Suggestions', val: stats.suggestions, color: 'text-blue-600 bg-blue-500/10 border-blue-500/20' },
        ].map((stat, idx) => (
          <div key={idx} className={`p-4 rounded-[1.5rem] border-2 flex flex-col items-center justify-center text-center transition-all ${stat.color}`}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{stat.label}</p>
            <p className="text-3xl font-black tracking-tight">{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-muted/40 p-1 rounded-2xl w-fit">
        {['pending', 'approved', 'disabled', 'merge'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`h-10 px-5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-background shadow border border-border/60 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t === 'merge' ? 'Merge Suggestions' : t}
          </button>
        ))}
      </div>

      {['pending', 'approved', 'disabled'].includes(tab) && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">{rulesToolbar}</CardContent>
          </Card>

          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading rules...
            </div>
          )}

          {!isLoading && filteredRules.length === 0 && (
            <div className="text-sm text-muted-foreground">No rules found.</div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {filteredRules.map(renderRuleCard)}
          </div>
        </div>
      )}

      {tab === 'merge' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 flex flex-col gap-3">
              {pollingBanner && (
                <div className="w-full rounded-xl border-2 border-border/40 bg-primary/5 text-primary px-4 py-3 text-xs font-bold flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Building merge suggestions — checking for results...
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground font-medium">Cached suggestions from storage.</div>
                <Button 
                  onClick={rebuildSuggestions} 
                  disabled={isRebuilding} 
                  className="h-11 rounded-xl font-black min-w-[160px]"
                >
                  {isRebuilding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Building...
                    </>
                  ) : (
                    'Rebuild Suggestions'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {mergeLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading suggestions...
            </div>
          )}

          {!mergeLoading && mergeSuggestions.length === 0 && (
            <div className="text-sm text-muted-foreground">No merge suggestions available.</div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {mergeSuggestions.map(renderMergeCard)}
          </div>
        </div>
      )}

      {tab === 'chunks' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 flex items-center justify-between gap-3">
              <div className="relative w-96 max-w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search chunks by source or summary..."
                  value={chunksSearch}
                  onChange={(e) => setChunksSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Layers className="w-4 h-4" /> {filteredChunks.length} chunks
              </div>
            </CardContent>
          </Card>

          {chunksLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading chunks...
            </div>
          )}

          {!chunksLoading && filteredChunks.length === 0 && (
            <div className="text-sm text-muted-foreground">No chunks found.</div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {filteredChunks.map((c) => (
              <Card key={c.chunk_id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">{c.chunk_id}</div>
                      <div className="font-mono font-extrabold text-sm truncate">{(c.source_doc || '').split('/').pop()}</div>
                      <div className="text-sm text-muted-foreground mt-1 truncate">{c.summary || 'No summary'}</div>
                      <div className="text-[11px] text-muted-foreground mt-2">Chunk {c.chunk_index != null ? c.chunk_index + 1 : '-'} / {c.total_chunks || '-'}</div>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {(c.rule_ids || []).map((id) => (
                          <span key={id} className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {id}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={(open) => { setDetailOpen(open); if (!open) setIsEditing(false); }}>
        <DialogContent className="max-w-[95vw] xl:max-w-6xl 2xl:max-w-7xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl flex flex-col max-h-[85vh] z-[9999]">
          {/* Header */}
          <div className="bg-primary px-8 py-6 text-white relative overflow-hidden shrink-0">
            <div className="relative z-10 flex items-center justify-between gap-8">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                    {detailRule?.rule_id}
                  </div>
                  <StatusBadge status={detailRule?.status} />
                </div>
                {isEditing ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Rule Name</p>
                      <Input 
                        value={editForm.rule_name} 
                        onChange={(e) => setEditForm(prev => ({ ...prev, rule_name: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-10 text-xl font-black rounded-xl focus:bg-white/20 transition-all"
                        placeholder="e.g. documentation_requirement"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Clinical Description</p>
                      <textarea 
                        value={editForm.description} 
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-xs font-medium rounded-xl p-2.5 h-10 resize-none focus:bg-white/20 focus:outline-none transition-all w-full"
                        placeholder="What does this rule verify?"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="max-w-4xl">
                    <h2 className="text-3xl font-black tracking-tight leading-tight mb-1">{detailRule?.rule_name}</h2>
                    <p className="text-white/70 text-sm font-medium leading-relaxed">{detailRule?.description}</p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                {!isEditing ? (
                  <Button 
                    onClick={() => setIsEditing(true)} 
                    className="bg-white text-primary hover:bg-white/90 rounded-2xl h-12 px-6 font-black shadow-xl text-sm group"
                  >
                    <Edit2 className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Edit Configuration
                  </Button>
                ) : (
                  <Button 
                    onClick={handleUpdateRule} 
                    disabled={isSaving}
                    className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl h-12 px-6 font-black shadow-xl text-sm group"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                    Commit Changes
                  </Button>
                )}
              </div>
            </div>
            <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[30rem] h-[30rem] bg-white/10 rounded-full blur-[100px]" />
          </div>

          {/* Scrollable Body */}
          <div className="p-8 overflow-y-auto scrollbar-none bg-background flex-1">
            {isEditing ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Edit Mode: Scope Section */}
                <div className="space-y-6 bg-muted/5 p-5 rounded-[2rem] border-2 border-border/40">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center"><Layers className="w-3.5 h-3.5" /></div>
                    Clinical Scope
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { label: 'Scope Level', key: 'scope_level' },
                      { label: 'Payer Scope', key: 'payer_scope' },
                      { label: 'Category', key: 'scope_category' },
                      { label: 'Body Part', key: 'scope_body_part' },
                      { label: 'Fabrication', key: 'scope_fabrication' },
                      { label: 'Usage Time', key: 'scope_usage_time' },
                      { label: 'MAC Jurisdiction', key: 'mac_jurisdiction' },
                      { label: 'Rule Type', key: 'rule_type' },
                    ].map(field => (
                      <div key={field.key} className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">{field.label}</label>
                        <Input 
                          value={editForm[field.key] || ''} 
                          onChange={(e) => setEditForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="h-10 rounded-xl border-2 border-border/40 bg-card text-xs font-black focus:border-primary/40 transition-all"
                        />
                        {(!editForm[field.key]) && (
                          <p className="text-[9px] font-medium text-muted-foreground/60 italic mt-1 ml-1">Will be populated when a suitable document is uploaded</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Edit Mode: Logic Section */}
                <div className="space-y-6 bg-muted/5 p-5 rounded-[2rem] border-2 border-border/40">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5" /></div>
                    Rule Execution
                  </h3>
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Check Type</label>
                      <Input 
                        value={editForm.check_type || ''} 
                        onChange={(e) => setEditForm(prev => ({ ...prev, check_type: e.target.value }))}
                        className="h-10 rounded-xl border-2 border-border/40 bg-card text-xs font-black focus:border-primary/40 transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Blocking Severity</label>
                        <select 
                          value={editForm.blocking_severity || ''} 
                          onChange={(e) => setEditForm(prev => ({ ...prev, blocking_severity: e.target.value }))}
                          className="w-full h-10 px-3 rounded-xl border-2 border-border/40 bg-card text-xs font-black focus:border-primary/40 focus:outline-none transition-all"
                        >
                          <option value="">Select Severity</option>
                          <option value="HARD_BLOCK">HARD BLOCK</option>
                          <option value="SOFT_BLOCK">SOFT BLOCK</option>
                          <option value="ADVISORY">ADVISORY</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Verifiable From</label>
                        <select 
                          value={editForm.verifiable_from || ''} 
                          onChange={(e) => setEditForm(prev => ({ ...prev, verifiable_from: e.target.value }))}
                          className="w-full h-10 px-3 rounded-xl border-2 border-border/40 bg-card text-xs font-black focus:border-primary/40 focus:outline-none transition-all"
                        >
                          <option value="">Select Source</option>
                          <option value="PATIENT_RECORD">PATIENT RECORD</option>
                          <option value="PRESCRIPTION">PRESCRIPTION</option>
                          <option value="PAYER_PORTAL">PAYER PORTAL</option>
                          <option value="SYSTEM">SYSTEM</option>
                          <option value="MANUAL_REVIEW">MANUAL REVIEW</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Delta From Base</label>
                      <Input 
                        value={editForm.delta_from_base || ''} 
                        onChange={(e) => setEditForm(prev => ({ ...prev, delta_from_base: e.target.value || null }))}
                        className="h-10 rounded-xl border-2 border-border/40 bg-card text-xs font-black focus:border-primary/40 transition-all"
                        placeholder="Leave empty if no delta"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Stored Message</label>
                      <textarea 
                        value={editForm.stored_message || ''} 
                        onChange={(e) => setEditForm(prev => ({ ...prev, stored_message: e.target.value }))}
                        className="w-full h-24 rounded-xl border-2 border-border/40 bg-card p-3 text-xs font-bold resize-none focus:border-primary/40 transition-all shadow-inner"
                      />
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-2xl border-2 border-border/40 bg-primary/5">
                      <input 
                        type="checkbox" 
                        id="llm_check"
                        checked={!!editForm.llm_judgement} 
                        onChange={(e) => setEditForm(prev => ({ ...prev, llm_judgement: e.target.checked }))}
                        className="w-5 h-5 rounded-lg border-2 border-border/60 text-primary focus:ring-primary"
                      />
                      <label htmlFor="llm_check" className="text-[10px] font-black uppercase tracking-[0.15em] text-primary cursor-pointer">LLM Judgement Required</label>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Parameters</label>
                      <div className="space-y-4">
                        {(() => {
                          const inputs = [];
                          const params = editForm.parameters || {};

                          const renderInputs = (obj, path = []) => {
                            Object.entries(obj).forEach(([key, value]) => {
                              const currentPath = [...path, key];
                              const label = currentPath.map(toTitleCase).join(' - ');

                              if (value != null && typeof value === 'object' && !Array.isArray(value)) {
                                renderInputs(value, currentPath);
                              } else {
                                inputs.push(
                                  <div key={currentPath.join('.')} className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">{label}</label>
                                    {typeof value === 'boolean' ? (
                                      <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-border/40 bg-card">
                                        <input 
                                          type="checkbox" 
                                          checked={value} 
                                          onChange={(e) => {
                                            const newParams = { ...params };
                                            let curr = newParams;
                                            for (let i = 0; i < currentPath.length - 1; i++) {
                                              curr[currentPath[i]] = { ...curr[currentPath[i]] };
                                              curr = curr[currentPath[i]];
                                            }
                                            curr[currentPath[currentPath.length - 1]] = e.target.checked;
                                            setEditForm(prev => ({ ...prev, parameters: newParams }));
                                          }}
                                          className="w-4 h-4 rounded border-2 border-border/60 text-primary focus:ring-primary"
                                        />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{value ? 'Yes' : 'No'}</span>
                                      </div>
                                    ) : Array.isArray(value) ? (
                                      <Input 
                                        value={value.join(', ')} 
                                        onChange={(e) => {
                                          const arr = e.target.value.split(',').map(s => s.trim()).filter(s => s !== '');
                                          const newParams = { ...params };
                                          let curr = newParams;
                                          for (let i = 0; i < currentPath.length - 1; i++) {
                                            curr[currentPath[i]] = { ...curr[currentPath[i]] };
                                            curr = curr[currentPath[i]];
                                          }
                                          curr[currentPath[currentPath.length - 1]] = arr;
                                          setEditForm(prev => ({ ...prev, parameters: newParams }));
                                        }}
                                        className="h-10 rounded-xl border-2 border-border/40 bg-card text-xs font-black focus:border-primary/40 transition-all"
                                        placeholder="Comma-separated values"
                                      />
                                    ) : (
                                      <Input 
                                        value={value ?? ''} 
                                        type={typeof value === 'number' ? 'number' : 'text'}
                                        onChange={(e) => {
                                          const val = typeof value === 'number' ? parseFloat(e.target.value) : e.target.value;
                                          const newParams = { ...params };
                                          let curr = newParams;
                                          for (let i = 0; i < currentPath.length - 1; i++) {
                                            curr[currentPath[i]] = { ...curr[currentPath[i]] };
                                            curr = curr[currentPath[i]];
                                          }
                                          curr[currentPath[currentPath.length - 1]] = val;
                                          setEditForm(prev => ({ ...prev, parameters: newParams }));
                                        }}
                                        className="h-10 rounded-xl border-2 border-border/40 bg-card text-xs font-black focus:border-primary/40 transition-all"
                                      />
                                    )}
                                  </div>
                                );
                              }
                            });
                          };

                          renderInputs(params);

                          if (inputs.length === 0) {
                            return <p className="text-[10px] font-medium text-muted-foreground/60 italic p-4 bg-muted/20 rounded-xl border-2 border-dashed border-border/40 text-center">No parameters defined</p>;
                          }

                          return inputs;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit Mode: Verdicts Section */}
                <div className="space-y-6 bg-muted/5 p-5 rounded-[2rem] border-2 border-border/40">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center"><Ban className="w-3.5 h-3.5" /></div>
                    Response & Metadata
                  </h3>
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Success Message (On Pass)</label>
                      <textarea 
                        value={editForm.on_pass?.message || ''} 
                        onChange={(e) => setEditForm(prev => ({ ...prev, on_pass: { ...prev.on_pass, message: e.target.value } }))}
                        className="w-full h-20 rounded-xl border-2 border-emerald-500/20 bg-emerald-500/[0.02] p-3 text-xs font-bold resize-none focus:border-emerald-500/40 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Failure Message (On Fail)</label>
                      <textarea 
                        value={editForm.on_fail?.message || ''} 
                        onChange={(e) => setEditForm(prev => ({ ...prev, on_fail: { ...prev.on_fail, message: e.target.value } }))}
                        className="w-full h-20 rounded-xl border-2 border-red-500/20 bg-red-500/[0.02] p-3 text-xs font-bold resize-none focus:border-red-500/40 transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">CARC Code</label>
                        <Input 
                          value={editForm.on_fail?.carc || ''} 
                          onChange={(e) => setEditForm(prev => ({ ...prev, on_fail: { ...prev.on_fail, carc: e.target.value } }))}
                          className="h-10 rounded-xl border-2 border-border/40 bg-card text-xs font-black"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">RARC Code</label>
                        <Input 
                          value={editForm.on_fail?.rarc || ''} 
                          onChange={(e) => setEditForm(prev => ({ ...prev, on_fail: { ...prev.on_fail, rarc: e.target.value } }))}
                          className="h-10 rounded-xl border-2 border-border/40 bg-card text-xs font-black"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/40">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Effective Date</label>
                        <Input 
                          type="date"
                          value={editForm.effective_date || ''} 
                          onChange={(e) => setEditForm(prev => ({ ...prev, effective_date: e.target.value }))}
                          className="h-10 rounded-xl border-2 border-border/40 bg-card text-xs font-black"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Confidence</label>
                        <div className="relative">
                          <Input 
                            type="number"
                            step="0.01"
                            max="1"
                            min="0"
                            value={editForm.confidence_score || 0} 
                            onChange={(e) => setEditForm(prev => ({ ...prev, confidence_score: parseFloat(e.target.value) }))}
                            className="h-10 rounded-xl border-2 border-border/40 bg-card text-xs font-black pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-muted-foreground/40">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* View Mode: Left Column: Scope & Logic */}
                <div className="space-y-8">
                  <section className="space-y-5">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center"><Layers className="w-3.5 h-3.5" /></div>
                      Jurisdictional Scope
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Clinical Level', val: detailRule?.scope_level },
                        { label: 'Payer Scope', val: detailRule?.payer_scope },
                        { label: 'Clinical Category', val: detailRule?.scope_category },
                        { label: 'Target Body Part', val: detailRule?.scope_body_part },
                        { label: 'Fabrication Type', val: detailRule?.scope_fabrication },
                        { label: 'Usage / Duration', val: detailRule?.scope_usage_time },
                        { label: 'MAC Jurisdiction', val: detailRule?.mac_jurisdiction },
                        { label: 'Rule Type', val: detailRule?.rule_type },
                      ].map(item => (
                        <div 
                          key={item.label} 
                          className={`p-4 rounded-[1.5rem] border-2 transition-all group ${
                            !item.val 
                              ? 'opacity-50 bg-muted/10 border-border/20' 
                              : 'border-border/40 bg-muted/20 hover:border-primary/20'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <p className={`text-[9px] font-black uppercase tracking-widest transition-colors ${
                              !item.val ? 'text-muted-foreground/60' : 'text-muted-foreground/60 group-hover:text-primary/60'
                            }`}>
                              {item.label}
                            </p>
                            {!item.val && <Info className="w-3 h-3 text-muted-foreground/40" />}
                          </div>
                          {item.val ? (
                            <p className="text-xs font-bold text-foreground">{item.val}</p>
                          ) : (
                            <p className="text-[9px] font-medium text-muted-foreground/60 italic mt-1">
                              Will be populated when a suitable document is uploaded
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-5">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5" /></div>
                      Decision Logic
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="p-5 rounded-[2rem] border-2 border-border/40 bg-card shadow-sm">
                        <div className="grid grid-cols-2 gap-6 mb-5">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1.5">Check Type</p>
                            <p className="font-mono text-xs font-black text-primary bg-primary/5 px-2.5 py-1 rounded-lg inline-block">{detailRule?.check_type}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1.5">LLM Requirement</p>
                            <p className="text-xs font-bold text-foreground flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${detailRule?.llm_judgement ? 'bg-amber-500' : 'bg-muted-foreground/30'}`} />
                              {detailRule?.llm_judgement ? 'LLM' : 'Auto'}
                            </p>
                          </div>
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">Verdict Template</p>
                        <p className="text-xs font-medium text-foreground leading-relaxed italic bg-muted/30 p-3 rounded-xl border border-border/40">
                          "{detailRule?.stored_message || 'No template defined'}"
                        </p>
                      </div>
                      <div className="p-5 rounded-[2rem] border-2 border-border/40 bg-card shadow-sm">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-3">Parameters</p>
                        <div className="space-y-3">
                          {(() => {
                            const params = detailRule?.parameters || {};
                            const flattened = [];
                            
                            const processParam = (key, val, prefix = '') => {
                              if (val == null && key !== 'delta_from_base') return;
                              const label = prefix ? `${prefix} - ${toTitleCase(key)}` : toTitleCase(key);
                              
                              if (Array.isArray(val)) {
                                if (val.length > 0) flattened.push({ key, label, val });
                              } else if (val != null && typeof val === 'object') {
                                Object.entries(val).forEach(([k, v]) => processParam(k, v, label));
                              } else {
                                flattened.push({ key, label, val });
                              }
                            };

                            Object.entries(params).forEach(([k, v]) => processParam(k, v));

                            // Add new fields to the end of the flattened list if they exist in the rule but not in parameters
                            const newFields = ['blocking_severity', 'verifiable_from', 'delta_from_base'];
                            newFields.forEach(field => {
                              if (detailRule && detailRule[field] !== undefined) {
                                // Only add if not already in flattened (though they shouldn't be in parameters)
                                if (!flattened.some(f => f.key === field)) {
                                  flattened.push({ key: field, label: toTitleCase(field), val: detailRule[field] });
                                }
                              }
                            });

                            if (flattened.length === 0) {
                              return <p className="text-[10px] font-medium text-muted-foreground/60 italic text-center py-2">No parameters defined</p>;
                            }

                            return flattened.map((item, i) => {
                              // Custom rendering for new fields
                              if (item.key === 'blocking_severity') {
                                const severityMap = {
                                  HARD_BLOCK: 'bg-red-500/10 text-red-600 border-red-500/20',
                                  SOFT_BLOCK: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                                  ADVISORY: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                                };
                                return (
                                  <div key={i} className="flex items-start justify-between gap-4 py-2 border-b border-border/10 last:border-0">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{item.label}</span>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${severityMap[item.val] || 'bg-muted text-muted-foreground'}`}>
                                      {String(item.val).replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                );
                              }

                              if (item.key === 'verifiable_from') {
                                return (
                                  <div key={i} className="flex items-start justify-between gap-4 py-2 border-b border-border/10 last:border-0">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{item.label}</span>
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-tight">
                                      {String(item.val).replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                );
                              }

                              if (item.key === 'delta_from_base') {
                                return (
                                  <div key={i} className={`flex items-start justify-between gap-4 py-2 border-b border-border/10 last:border-0 rounded-lg px-2 -mx-2 ${item.val ? 'bg-amber-500/5' : ''}`}>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{item.label}</span>
                                    <span className={`text-xs font-bold ${item.val ? 'text-amber-700' : 'text-muted-foreground/40'}`}>
                                      {item.val ? `Δ ${item.val}` : '—'}
                                    </span>
                                  </div>
                                );
                              }

                              return (
                                <div key={i} className="flex items-start justify-between gap-4 py-2 border-b border-border/10 last:border-0">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{item.label}</span>
                                  <div className="text-right">
                                    {Array.isArray(item.val) ? (
                                      <div className="flex flex-wrap justify-end gap-1.5">
                                        {item.val.map((v, idx) => (
                                          <span key={idx} className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded">
                                            {String(v)}
                                          </span>
                                        ))}
                                      </div>
                                    ) : typeof item.val === 'boolean' ? (
                                      <span className="text-xs font-bold text-foreground">{item.val ? 'Yes' : 'No'}</span>
                                    ) : (
                                      <span className="text-xs font-bold text-foreground">{String(item.val)}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* View Mode: Right Column: Verdicts & Source */}
                <div className="space-y-10">
                  <section className="space-y-5">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center"><Ban className="w-3.5 h-3.5" /></div>
                      Automated Response
                    </h3>
                    <div className="space-y-4">
                      <div className="p-5 rounded-[2rem] border-2 border-emerald-500/20 bg-emerald-500/[0.03] relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-3 relative z-10">
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full">ON PASS</span>
                          <VerdictBadge verdict="PASS" />
                        </div>
                        <p className="text-xs font-medium text-emerald-900/80 dark:text-emerald-400/80 leading-relaxed relative z-10">{detailRule?.on_pass?.message}</p>
                      </div>
                      <div className="p-5 rounded-[2rem] border-2 border-red-500/20 bg-red-500/[0.03] relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-3 relative z-10">
                          <span className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-100 dark:bg-red-500/20 px-2 py-0.5 rounded-full">ON FAIL</span>
                          <VerdictBadge verdict={detailRule?.on_fail} />
                        </div>
                        <p className="text-xs font-medium text-red-900/80 dark:text-red-400/80 leading-relaxed mb-4 relative z-10">{detailRule?.on_fail?.message}</p>
                        <div className="flex gap-6 border-t border-red-500/10 pt-4 relative z-10">
                          {detailRule?.on_fail?.carc && <div><p className="text-[9px] font-black text-red-600/50 uppercase tracking-widest mb-0.5">CARC</p><p className="text-sm font-black text-foreground">{detailRule.on_fail.carc}</p></div>}
                          {detailRule?.on_fail?.rarc && <div><p className="text-[9px] font-black text-red-600/50 uppercase tracking-widest mb-0.5">RARC</p><p className="text-sm font-black text-foreground">{detailRule.on_fail.rarc}</p></div>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-[1.5rem] border-2 border-border/40 bg-card shadow-sm">
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Effective Date</p>
                          <p className="text-xs font-black text-foreground">{detailRule?.effective_date || '-'}</p>
                        </div>
                        <div className="p-4 rounded-[1.5rem] border-2 border-border/40 bg-card shadow-sm">
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Confidence</p>
                          <p className="text-xs font-black text-foreground flex items-center gap-2">
                            {Math.round((detailRule?.confidence_score || 0) * 100)}%
                            <div className="w-12 h-1 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${(detailRule?.confidence_score || 0) * 100}%` }} />
                            </div>
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-5">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center"><FileText className="w-3.5 h-3.5" /></div>
                      Source Evidence
                    </h3>
                    <div className="p-5 rounded-[2rem] border-2 border-border/40 bg-muted/10">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-3">Originating Document</p>
                      <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-background border-2 border-border/40 shadow-sm group hover:border-primary/30 transition-all cursor-default">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><FileText className="w-4 h-4" /></div>
                        <span className="text-xs font-bold truncate flex-1">{detailRule?.source_doc}</span>
                      </div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">Extracted Contextual Text</p>
                      <p className="text-xs italic text-muted-foreground leading-relaxed bg-background/50 p-4 rounded-xl border border-border/20 shadow-inner">
                        "{detailRule?.source_text}"
                      </p>
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-border/10 bg-muted/5 flex justify-end shrink-0 gap-3">
            {isEditing ? (
              <Button 
                onClick={() => setIsEditing(false)} 
                variant="ghost"
                className="h-12 px-8 rounded-xl font-black text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all uppercase tracking-widest text-[10px]"
              >
                Discard Changes
              </Button>
            ) : null}
            <DialogClose asChild>
              <Button className="h-12 px-8 rounded-xl font-black shadow-xl shadow-primary/20 bg-primary hover:bg-primary/95 transition-all uppercase tracking-widest text-[10px]">
                {isEditing ? 'Cancel Edit' : 'Close Details'}
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={manualMergeOpen} onOpenChange={setManualMergeOpen}>
        <DialogContent className="max-w-[95vw] xl:max-w-7xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl flex flex-col max-h-[90vh] z-[9999]">
          <div className="bg-background px-10 py-8 border-b border-border/10 shrink-0">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <Merge className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight">Manual Merge Review</h2>
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                  Merging {mergeDraft.rules?.length || 0} rules into target: <span className="text-primary">{mergeDraft.a}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="p-10 overflow-x-auto bg-muted/5 flex-1 scrollbar-none">
            <div className="flex gap-6 pb-4">
                {mergeDraft.rules?.map((r, idx) => r && (
                  <MergeRuleCard key={r.rule_id || idx} r={r} />
                ))}
              </div>
          </div>

          <div className="px-10 py-4 border-t border-border/10 bg-background flex flex-col shrink-0 gap-3">
            <div className="space-y-1 px-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Merged Rule Description (optional)</label>
              <textarea 
                value={mergeDraft.desc || ''} 
                onChange={(e) => setMergeDraft(prev => ({ ...prev, desc: e.target.value }))}
                placeholder="Describe the clinical intent of the merged rule..."
                className="w-full h-12 rounded-xl border-2 border-border/40 bg-muted/5 p-3 text-xs font-medium leading-relaxed resize-none focus:border-primary/40 focus:outline-none transition-all shadow-inner"
              />
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <Button variant="ghost" onClick={() => setManualMergeOpen(false)} className="h-11 px-8 rounded-2xl font-black text-muted-foreground hover:bg-muted/50 transition-all uppercase tracking-widest text-[10px]">
                Cancel
              </Button>
              <div className="flex gap-3">
                <Button onClick={() => executeMerge(false)} className="h-11 px-8 rounded-2xl font-black shadow-2xl shadow-purple-500/20 bg-purple-600 hover:bg-purple-700 text-white transition-all uppercase tracking-widest text-[10px] group">
                  <Merge className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                  Confirm Merge
                </Button>
                <Button onClick={() => executeMerge(true)} className="h-11 px-8 rounded-2xl font-black shadow-2xl shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600 text-white transition-all uppercase tracking-widest text-[10px] group">
                  <CheckCircle2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  Merge & Approve
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
        <DialogContent className="max-w-[95vw] xl:max-w-7xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl flex flex-col max-h-[90vh] z-[9999]">
          {/* Header */}
          <div className="bg-primary px-10 py-8 text-white shrink-0 relative overflow-hidden">
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                    <GitBranch className="w-3.5 h-3.5 inline mr-1.5" /> AI Semantic Merge Analysis
                  </div>
                </div>
                <h2 className="text-3xl font-black tracking-tight uppercase tracking-[0.05em]">AI Semantic Merge Analysis</h2>
                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Comparing {mergeDraft.rules?.length || 0} rules for semantic redundancy</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          </div>

          <div className="p-10 overflow-y-auto scrollbar-none bg-background flex-1">
            {/* SECTION 1 — AI Recommendation */}
            <div className="mb-8">
              {!analysisResult ? (
                <div className="flex flex-col items-center justify-center h-[180px] gap-3 bg-muted/5 rounded-[2rem] border-2 border-dashed border-border/40">
                  <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Running AI Analysis...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[180px]">
                  {/* Verdict Card */}
                  <div className={`p-5 rounded-[2rem] border-2 flex flex-col items-center justify-center text-center relative overflow-hidden ${analysisResult?.should_merge ? 'bg-emerald-500/[0.03] border-emerald-500/20' : 'bg-red-500/[0.03] border-red-500/20'}`}>
                    <div className="space-y-1 relative z-10">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Verdict</p>
                      <h3 className={`text-2xl font-black tracking-tight ${analysisResult?.should_merge ? 'text-emerald-600' : 'text-red-600'}`}>
                        {analysisResult?.should_merge ? 'MERGE RECOMMENDED' : 'DO NOT MERGE'}
                      </h3>
                    </div>
                    <div className="mt-4 relative z-10">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">Confidence Score</p>
                      <p className={`text-4xl font-black tracking-tighter ${analysisResult?.should_merge ? 'text-emerald-600' : 'text-red-600'}`}>
                        {Math.round((analysisResult?.confidence || 0) * 100)}%
                      </p>
                    </div>
                  </div>

                  {/* Reasoning Card */}
                  <div className="p-5 rounded-[2rem] border-2 border-border/40 bg-muted/5 flex flex-col min-h-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-primary/60 mb-2 shrink-0">AI REASONING</p>
                    <div className="flex-1 overflow-y-auto scrollbar-none min-h-0">
                      <p className="text-[13px] font-medium text-foreground/80 leading-relaxed italic pr-2">
                        "{analysisResult?.reason}"
                      </p>
                      {analysisResult?.should_merge && analysisResult?.merged_rule_draft && (
                        <div className="mt-4 border-t border-border/10 pt-4">
                          <details className="group">
                            <summary className="text-[9px] font-black uppercase tracking-[0.2em] text-primary hover:text-primary/80 cursor-pointer list-none flex items-center justify-between">
                              View Merged Rule Draft
                              <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" />
                            </summary>
                            <div className="mt-3 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                              {Object.entries(analysisResult.merged_rule_draft).map(([key, value]) => {
                                if (value == null || (Array.isArray(value) && value.length === 0)) return null;
                                return (
                                  <div key={key} className="flex justify-between items-start gap-4 py-1.5 border-b border-border/5 last:border-0">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 shrink-0">{toTitleCase(key)}</span>
                                    <div className="text-right">
                                      {Array.isArray(value) ? (
                                        <div className="flex flex-wrap justify-end gap-1">
                                          {value.map((v, i) => (
                                            <span key={i} className="bg-primary/10 text-primary text-[8px] font-black px-1.5 py-0.5 rounded">
                                              {String(v)}
                                            </span>
                                          ))}
                                        </div>
                                      ) : typeof value === 'boolean' ? (
                                        <span className="text-xs font-bold text-foreground">{value ? 'Yes' : 'No'}</span>
                                      ) : (
                                        <span className="text-[10px] font-bold text-foreground leading-tight">{String(value)}</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2 — Rules Being Compared */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Rules Comparison</p>
                <div className="text-[10px] font-bold text-muted-foreground">
                  {mergeDraft.rules?.length || 0} rules to compare
                </div>
              </div>
              <div className="overflow-x-auto pb-4 scrollbar-none">
                <div className="flex gap-6">
                  {mergeDraft.rules?.map((r, idx) => r && (
                    <div key={r.rule_id || idx} className="min-w-[420px]">
                      <MergeRuleCard r={r} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-border/10 bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
            {analysisResult?.should_merge === false ? (
              <>
                <Button 
                  onClick={() => setAnalysisOpen(false)} 
                  variant="ghost"
                  className="h-14 px-10 rounded-2xl font-black text-muted-foreground hover:bg-muted/50 transition-all uppercase tracking-widest text-xs"
                >
                  Dismiss
                </Button>
                <Button 
                  onClick={() => {
                    setAnalysisOpen(false);
                    setMergeDraft(prev => ({ 
                      ...prev, 
                      desc: analysisResult?.merged_rule_draft?.description || '',
                      aiDraft: analysisResult?.merged_rule_draft || null
                    }));
                    setManualMergeOpen(true);
                  }}
                  variant="outline"
                  className="h-14 px-10 rounded-2xl font-black border-2 border-border/40 text-muted-foreground/60 hover:text-foreground transition-all uppercase tracking-widest text-xs"
                >
                  Override & Merge Anyway
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => setAnalysisOpen(false)} 
                  variant="ghost"
                  className="h-14 px-10 rounded-2xl font-black text-muted-foreground hover:bg-muted/50 transition-all uppercase tracking-widest text-xs"
                >
                  Discard Analysis
                </Button>
                <div className="flex gap-4">
                  <Button 
                    disabled={!analysisResult}
                    onClick={() => {
                      setAnalysisOpen(false);
                      setMergeDraft(prev => ({ 
                        ...prev, 
                        desc: analysisResult?.merged_rule_draft?.description || '',
                        aiDraft: analysisResult?.merged_rule_draft || null
                      }));
                      setManualMergeOpen(true);
                    }} 
                    className="h-14 px-10 rounded-2xl font-black shadow-2xl shadow-purple-500/20 bg-purple-600 hover:bg-purple-700 text-white transition-all uppercase tracking-widest text-xs group disabled:opacity-50"
                  >
                    {!analysisResult && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Merge className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                    Confirm Merge
                  </Button>
                  <Button 
                    disabled={!analysisResult}
                    onClick={() => {
                      setMergeDraft(prev => ({ 
                        ...prev, 
                        desc: analysisResult?.merged_rule_draft?.description || '',
                        aiDraft: analysisResult?.merged_rule_draft || null
                      }));
                      executeMerge(true);
                    }} 
                    className="h-14 px-10 rounded-2xl font-black shadow-2xl shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600 text-white transition-all uppercase tracking-widest text-xs group disabled:opacity-50"
                  >
                    {!analysisResult && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <CheckCircle2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Merge & Approve
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default SuperAdminRules;
