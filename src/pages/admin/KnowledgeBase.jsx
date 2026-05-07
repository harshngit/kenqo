import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Code2,
  Database,
  Edit2,
  Eye,
  FileText,
  Filter,
  Crown,
  GitMerge,
  Hash,
  History,
  Layers,
  Loader2,
  RotateCcw,
  Save,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

const BASE_URL = 'https://kenqo-api-409744260053.asia-south1.run.app';
const DEFAULT_DISEASE = 'lymphedema';
const ALL_FILTER = '__all__';

const ACTIVE_DETAIL_SECTIONS = [
  {
    title: 'Core Info',
    icon: BookOpen,
    fields: ['rule_name', 'description', 'category', 'rule', 'source_text'],
  },
  {
    title: 'Validation',
    icon: Code2,
    fields: ['check_type', 'field', 'parameters'],
  },
  {
    title: 'Actions',
    icon: ShieldAlert,
    fields: ['on_fail', 'on_pass', 'blocking_severity'],
  },
  {
    title: 'Scope',
    icon: Filter,
    fields: [
      'scope_levels',
      'scope_condition',
      'scope_category',
      'scope_body_part',
      'scope_fabrication',
      'scope_usage_time',
      'payer_id',
      'payer_name',
      'payer_type',
      'jurisdiction',
    ],
  },
  {
    title: 'Metadata',
    icon: Database,
    fields: [
      'source_document',
      'confidence_score',
      'created_at',
      'updated_at',
      'matched_hcpcs',
      'linked_chunk_ids',
      'status',
    ],
  },
];

const getRuleId = (rule) => rule?.rule_id || rule?.id;

const normalizeRuleId = (ruleId) => String(ruleId || '').toLowerCase();

const getRuleDomId = (ruleId) => `kb-rule-${String(ruleId || '').replace(/[^a-zA-Z0-9_-]/g, '-')}`;

const getMergeRefId = (ref) => {
  if (!ref || typeof ref !== 'object') return ref;
  return ref.rule_id || ref.id || ref.ruleId || ref.source_rule_id || ref.target_rule_id || '';
};

const getSourceDocument = (rule) => rule?.source_document || rule?.source_doc || rule?.document_id || '-';
const getSourceDocumentName = (rule) => (
  rule?.document_name ||
  rule?.source_document_name ||
  rule?.file_name ||
  rule?.filename ||
  rule?.document?.name ||
  rule?.source_document ||
  rule?.source_doc ||
  '-'
);

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.includes(',')) {
    return value.split(',').map((item) => item.trim());
  }
  if (!value) return [];
  return [value];
};

const getRuleCategory = (rule) => (
  rule?.category ||
  rule?.scope_category ||
  rule?.rule_category ||
  rule?.metadata?.category ||
  ''
);

const getMatchedProductLines = (rule) => {
  const value = (
    rule?.matched_product_lines ??
    rule?.match_product_lines ??
    rule?.match_prpduct_lines ??
    rule?.product_lines ??
    rule?.matched_product_line ??
    rule?.product_line
  );
  return toArray(value).filter(Boolean);
};

const normalizeRules = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rules)) return data.rules;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const getErrorMessage = (payload, fallback) => (
  payload?.detail ||
  payload?.message ||
  payload?.error ||
  fallback
);

const formatLabel = (value) => String(value || '')
  .replace(/_/g, ' ')
  .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeFilterValue = (value) => String(value || '')
  .trim()
  .replace(/_/g, ' ')
  .replace(/\s+/g, ' ')
  .toLowerCase();

const buildFilterOptions = (values) => (
  [...values].reduce((options, value) => {
    const key = normalizeFilterValue(value);
    if (!key || options.some((option) => option.value === key)) return options;
    options.push({ value: key, label: formatLabel(value) });
    return options;
  }, []).sort((a, b) => a.label.localeCompare(b.label))
);

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '-';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

const getMetric = (data, keys, fallback = 0) => {
  for (const key of keys) {
    const value = data?.[key] ?? data?.metrics?.[key];
    if (value !== undefined && value !== null) return value;
  }
  return fallback;
};

const StatusBadge = ({ status }) => {
  const value = String(status || 'pending').toLowerCase();
  const map = {
    pending: {
      icon: ClipboardList,
      label: 'Pending Review',
      className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    },
    approved: {
      icon: Sparkles,
      label: 'Approved - Expanding...',
      className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    },
    active: {
      icon: ShieldCheck,
      label: 'Active',
      className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    },
    merged: {
      icon: GitMerge,
      label: 'Merged',
      className: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
    },
  };
  const item = map[value] || map.pending;
  const Icon = item.icon;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${item.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {item.label}
    </span>
  );
};

const HcpcsList = ({ codes }) => {
  const values = Array.isArray(codes) ? codes : codes ? [codes] : [];
  if (!values.length) return <span className="text-xs font-bold text-muted-foreground">-</span>;

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((code) => (
        <Badge key={code} variant="outline" className="rounded-lg bg-background/70 font-mono">
          {code}
        </Badge>
      ))}
    </div>
  );
};

const ProductLineBadges = ({ rule }) => {
  const values = getMatchedProductLines(rule);
  if (!values.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((line) => (
        <Badge key={line} variant="secondary" className="rounded-lg">
          {formatLabel(line)}
        </Badge>
      ))}
    </div>
  );
};

const getScopeBadges = (rule) => {
  const badges = [];
  const isPending = rule?.status === 'pending';

  if (isPending) {
    const levels = rule.scope_levels || [];
    const meaningful = levels.filter((level) => !['CONDITION', 'CATEGORY'].includes(level));
    return meaningful.map((level) => ({ label: formatLabel(level), color: 'slate' }));
  }

  if (rule?.scope_usage_time && rule.scope_usage_time !== 'all') {
    badges.push({ label: formatLabel(rule.scope_usage_time), color: 'blue' });
  }
  if (rule?.scope_body_part && rule.scope_body_part !== 'all') {
    badges.push({ label: formatLabel(rule.scope_body_part), color: 'slate' });
  }
  if (rule?.scope_fabrication && rule.scope_fabrication !== 'all') {
    badges.push({ label: formatLabel(rule.scope_fabrication), color: 'violet' });
  }
  if (rule?.scope_category === 'pump') {
    badges.push({ label: 'Pump', color: 'orange' });
  }
  if (rule?.payer_id) {
    badges.push({ label: rule.payer_name || rule.payer_id, color: 'amber' });
  }
  if (Array.isArray(rule?.jurisdiction) && !rule.jurisdiction.includes('ALL') && rule.jurisdiction.length > 0) {
    badges.push({ label: rule.jurisdiction.join(', '), color: 'teal' });
  }
  return badges;
};

const scopeBadgeClasses = {
  blue: 'border-blue-500/20 bg-blue-500/10 text-blue-700',
  slate: 'border-slate-500/20 bg-slate-500/10 text-slate-700',
  violet: 'border-violet-500/20 bg-violet-500/10 text-violet-700',
  orange: 'border-orange-500/20 bg-orange-500/10 text-orange-700',
  amber: 'border-amber-500/20 bg-amber-500/10 text-amber-700',
  teal: 'border-teal-500/20 bg-teal-500/10 text-teal-700',
};

const ScopeBadges = ({ rule }) => {
  const badges = getScopeBadges(rule);
  if (!badges.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <Badge key={`${badge.color}-${badge.label}`} variant="outline" className={`rounded-lg ${scopeBadgeClasses[badge.color] || 'bg-background/70'}`}>
          {badge.label}
        </Badge>
      ))}
    </div>
  );
};

const ConfidenceBadge = ({ confidence }) => {
  const value = Number(confidence);
  const percent = Number.isFinite(value) ? Math.round(value * 100) : 0;

  return (
    <Badge variant="outline" className="rounded-lg border-emerald-500/20 bg-emerald-500/10 text-emerald-700">
      {percent}%
    </Badge>
  );
};

const MergeRoleBadge = ({ role }) => {
  if (!role) return null;

  const isPrimary = role === 'primary';
  return (
    <Badge
      variant="outline"
      className={`rounded-lg ${
        isPrimary
          ? 'border-amber-500/20 bg-amber-500/10 text-amber-700'
          : 'border-blue-500/20 bg-blue-500/10 text-blue-700'
      }`}
    >
      {isPrimary && <Crown className="mr-1.5 h-3.5 w-3.5" />}
      {isPrimary ? 'Primary' : 'Duplicate'}
    </Badge>
  );
};

const MergeRelationshipInfo = ({ rule, mergedFrom: mergedFromOverride, getRuleInfo, onScrollToRule }) => {
  const [expanded, setExpanded] = useState(false);
  const mergedFrom = Array.isArray(mergedFromOverride)
    ? mergedFromOverride.filter(Boolean)
    : Array.isArray(rule?.merged_from)
      ? rule.merged_from.filter(Boolean)
      : [];
  const isMerged = String(rule?.status || '').toLowerCase() === 'merged' && rule?.merged_into;
  const targetInfo = isMerged ? getRuleInfo(rule.merged_into) : null;

  if (!isMerged && !mergedFrom.length) return null;

  return (
    <div className="space-y-2">
      {isMerged && (
        targetInfo.canScroll ? (
          <button
            type="button"
            className="flex max-w-full items-start gap-2 rounded-2xl border border-slate-500/20 bg-slate-500/10 px-3 py-2 text-left text-xs font-bold text-slate-600 transition-colors hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-600 dark:text-slate-300"
            onClick={() => onScrollToRule(targetInfo.id)}
          >
            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0">
              <span className="block truncate">Merged into: {targetInfo.name}</span>
              {targetInfo.description && (
                <span className="mt-0.5 block line-clamp-2 font-semibold text-muted-foreground">
                  {targetInfo.description}
                </span>
              )}
            </span>
          </button>
        ) : (
          <div className="flex max-w-full items-start gap-2 rounded-2xl border border-slate-500/20 bg-slate-500/10 px-3 py-2 text-left text-xs font-bold text-slate-600 dark:text-slate-300">
            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0">
              <span className="block truncate">Merged into: {targetInfo.name}</span>
              {targetInfo.description && (
                <span className="mt-0.5 block line-clamp-2 font-semibold text-muted-foreground">
                  {targetInfo.description}
                </span>
              )}
            </span>
          </div>
        )
      )}

      {mergedFrom.length > 0 && (
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <div className="space-y-2">
            <CollapsibleTrigger className="inline-flex max-w-full items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-left text-xs font-black text-blue-700 transition-colors hover:border-blue-500/30 hover:bg-blue-500/15 dark:text-blue-300">
              <ClipboardList className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 truncate">Merged {mergedFrom.length} {mergedFrom.length === 1 ? 'rule' : 'rules'}</span>
              <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs font-semibold text-muted-foreground">
              {mergedFrom.map((sourceRef, index) => {
                const sourceInfo = getRuleInfo(sourceRef);
                const content = (
                  <>
                    <span className="mt-1 text-blue-500">-</span>
                    <span className="min-w-0">
                      <span className="block truncate font-black text-foreground/80">{sourceInfo.name}</span>
                      {sourceInfo.description && (
                        <span className="mt-0.5 block line-clamp-2 font-semibold text-muted-foreground">
                          {sourceInfo.description}
                        </span>
                      )}
                    </span>
                  </>
                );

                if (!sourceInfo.canScroll) {
                  return (
                    <div key={`${sourceInfo.id}-${index}`} className="flex max-w-full items-start gap-2 text-left">
                      {content}
                    </div>
                  );
                }

                return (
                  <button
                    type="button"
                    key={`${sourceInfo.id}-${index}`}
                    className="flex max-w-full items-start gap-2 text-left hover:text-blue-600"
                    onClick={() => onScrollToRule(sourceInfo.id)}
                  >
                    {content}
                  </button>
                );
              })}
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}
    </div>
  );
};

const RuleCheckbox = ({ checked, onChange, label }) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={checked}
    onClick={onChange}
    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
      checked
        ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20'
        : 'border-border bg-background hover:border-primary/40'
    }`}
  >
    {checked && <Check className="h-3.5 w-3.5" />}
  </button>
);

const InfoRow = ({ label, value }) => {
  const rendered = formatValue(value);
  const isBlock = typeof value === 'object' && value !== null;

  return (
    <div className="border-b border-border/20 py-3 last:border-0">
      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/60">{formatLabel(label)}</p>
      {isBlock ? (
        <pre className="max-h-64 overflow-auto rounded-xl bg-muted/30 p-3 text-xs font-semibold leading-relaxed text-foreground/80">
          {rendered}
        </pre>
      ) : (
        <p className="break-words text-sm font-bold leading-relaxed text-foreground/85">{rendered}</p>
      )}
    </div>
  );
};

const DetailSection = ({ title, icon: Icon, fields, rule }) => {
  const visibleFields = fields.filter((field) => rule?.[field] !== undefined || (field === 'source_document' && getSourceDocument(rule) !== '-'));
  if (!visibleFields.length) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">{title}</h3>
      </div>
      <div className="rounded-2xl border border-border/40 bg-muted/10 px-5">
        {visibleFields.map((field) => (
          <InfoRow
            key={field}
            label={field}
            value={field === 'source_document' ? getSourceDocument(rule) : rule[field]}
          />
        ))}
      </div>
    </section>
  );
};

const MinimalRuleDetails = ({ rule, showSourceText, onToggleSourceText }) => (
  <div className="space-y-4">
    <section className="rounded-2xl border border-border/40 bg-muted/10 p-5">
      <h3 className="break-words text-xl font-black tracking-tight">{rule.rule_name || 'Untitled Rule'}</h3>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="warning" className="rounded-lg">
          {formatLabel(getRuleCategory(rule) || 'uncategorized')}
        </Badge>
        <ProductLineBadges rule={rule} />
        <StatusBadge status={rule.status || 'pending'} />
      </div>
    </section>

    <section className="rounded-2xl border border-border/40 bg-background p-5">
      <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">RULE</p>
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm font-semibold leading-relaxed">
        {rule.rule || '-'}
      </div>
    </section>

    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-2xl border border-border/40 bg-muted/10 p-5">
        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">MATCHED HCPCS</p>
        <HcpcsList codes={rule.matched_hcpcs} />
      </section>
      <section className="min-w-0 rounded-2xl border border-border/40 bg-muted/10 p-5">
        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">SOURCE DOCUMENT</p>
        <p className="truncate font-mono text-xs text-foreground/80" title={getSourceDocument(rule)}>
          {getSourceDocument(rule)}
        </p>
      </section>
    </div>

    {getScopeBadges(rule).length > 0 && (
      <section className="rounded-2xl border border-border/40 bg-muted/10 p-5">
        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">SCOPE</p>
        <ScopeBadges rule={rule} />
      </section>
    )}

    <section className="rounded-2xl border border-border/40 bg-background p-5">
      <Button
        type="button"
        variant="ghost"
        className="h-auto rounded-xl px-0 text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-transparent hover:text-foreground"
        onClick={onToggleSourceText}
      >
        {showSourceText ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
        Show Source Text
      </Button>
      {showSourceText && (
        <div className="mt-4 rounded-2xl border border-border/40 bg-muted/20 p-4 text-sm leading-relaxed text-muted-foreground">
          {rule.source_text || '-'}
        </div>
      )}
    </section>

    <p className="font-mono text-xs text-muted-foreground">Rule ID: {rule.rule_id || '-'}</p>
  </div>
);

const RuleDetailDialog = ({ open, rule, loading, onClose }) => {
  const [sourceTextState, setSourceTextState] = useState({ ruleId: null, visible: false });
  const statusValue = String(rule?.status || '').toLowerCase();
  const isPending = statusValue === 'pending';
  const isApproved = ['active', 'approved'].includes(statusValue);
  const title = isPending ? 'Minimal Rule Details' : 'Structured Rule Details';
  const currentRuleId = getRuleId(rule);
  const showSourceText = open && sourceTextState.ruleId === currentRuleId && sourceTextState.visible;
  const toggleSourceText = () => {
    setSourceTextState({ ruleId: currentRuleId, visible: !showSourceText });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[94vh] w-[calc(100vw-2rem)] max-w-6xl overflow-hidden rounded-[2rem] border-0 p-0 shadow-2xl">
        <DialogHeader className="border-b border-border/40 px-7 py-6">
          <DialogTitle className="text-2xl font-black tracking-tight">{title}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-3 pt-2 text-xs font-medium">
            {rule?.rule_id && <span className="font-mono text-muted-foreground">{rule.rule_id}</span>}
            {rule?.status && <StatusBadge status={rule.status} />}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[76vh] overflow-y-auto px-7 py-6">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-24 text-sm font-black text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading rule details...
            </div>
          ) : rule ? (
            <div className="space-y-8">
              {isPending ? (
                <MinimalRuleDetails
                  rule={rule}
                  showSourceText={showSourceText}
                  onToggleSourceText={toggleSourceText}
                />
              ) : isApproved ? (
                <Tabs defaultValue="minimal" className="space-y-6">
                  <TabsList className="h-11 rounded-2xl bg-muted/60 p-1">
                    <TabsTrigger value="minimal" className="rounded-xl px-5 text-xs font-black uppercase tracking-widest">
                      Minimal View
                    </TabsTrigger>
                    <TabsTrigger value="detailed" className="rounded-xl px-5 text-xs font-black uppercase tracking-widest">
                      Detailed View
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="minimal" className="space-y-8">
                    <MinimalRuleDetails
                      rule={rule}
                      showSourceText={showSourceText}
                      onToggleSourceText={toggleSourceText}
                    />
                  </TabsContent>
                  <TabsContent value="detailed" className="grid gap-6 xl:grid-cols-2">
                    {ACTIVE_DETAIL_SECTIONS.map((section) => (
                      <DetailSection key={section.title} {...section} rule={rule} />
                    ))}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="grid gap-6 xl:grid-cols-2">
                  {ACTIVE_DETAIL_SECTIONS.map((section) => (
                    <DetailSection key={section.title} {...section} rule={rule} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="py-24 text-center">
              <AlertCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="font-black">Rule details unavailable</p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border/40 px-7 py-4">
          <Button variant="outline" className="rounded-xl font-bold" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const PendingRuleCard = ({
  rule,
  selected,
  onToggle,
  onView,
  onEdit,
  onHistory,
  onApprove,
  onReject,
  mergeMode,
  mergeSelected,
  mergeRole,
  onMergeToggle,
  highlighted,
  mergedFrom,
  getRuleInfo,
  onScrollToRule,
}) => (
  <Card
    id={getRuleDomId(getRuleId(rule))}
    className={`group rounded-[2rem] border-2 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 ${
      highlighted
        ? 'border-blue-500/60 ring-4 ring-blue-500/20'
        : mergeRole === 'primary'
          ? 'border-amber-500/40 bg-amber-500/5'
          : mergeSelected
            ? 'border-blue-500/30 bg-blue-500/5'
            : 'border-border/40'
    }`}
  >
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        <RuleCheckbox
          checked={mergeMode ? mergeSelected : selected}
          onChange={mergeMode ? onMergeToggle : onToggle}
          label={`Select ${rule.rule_name} for ${mergeMode ? 'merge' : 'approval'}`}
        />
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-black tracking-tight">{formatLabel(rule.rule_name || 'Untitled Rule')}</h3>
                <StatusBadge status={rule.status || 'pending'} />
                <MergeRoleBadge role={mergeRole} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="warning" className="rounded-lg">{formatLabel(getRuleCategory(rule) || 'uncategorized')}</Badge>
                <ProductLineBadges rule={rule} />
              </div>
              <ScopeBadges rule={rule} />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-10 rounded-xl text-xs font-black uppercase tracking-widest" onClick={onView}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Button>
              <Button type="button" variant="outline" size="icon" title="Edit rule" className="h-10 w-10 rounded-xl" onClick={onEdit}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" title="Version history" className="h-10 w-10 rounded-xl" onClick={onHistory}>
                <History className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="rounded-2xl border border-border/40 bg-muted/20 p-4 text-sm font-semibold leading-relaxed text-foreground/80">
            {rule.rule || 'No rule text provided.'}
          </p>

          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Matched HCPCS</p>
              <HcpcsList codes={rule.matched_hcpcs} />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Source Document</p>
              <p className="truncate font-mono text-xs font-bold text-muted-foreground" title={getSourceDocument(rule)}>
                {getSourceDocument(rule)}
              </p>
            </div>
          </div>

          <MergeRelationshipInfo
            rule={rule}
            mergedFrom={mergedFrom}
            getRuleInfo={getRuleInfo}
            onScrollToRule={onScrollToRule}
          />

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/30 pt-4">
            <Button
              className="h-10 rounded-xl text-xs font-black uppercase tracking-widest"
              onClick={onApprove}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button
              variant="outline"
              className="h-10 rounded-xl text-xs font-black uppercase tracking-widest hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
              onClick={onReject}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ActiveRuleCard = ({
  rule,
  onView,
  onEdit,
  onHistory,
  onDelete,
  deleting,
  mergeMode,
  mergeSelected,
  mergeRole,
  onMergeToggle,
  highlighted,
  mergedFrom,
  getRuleInfo,
  onScrollToRule,
}) => (
  <Card
    id={getRuleDomId(getRuleId(rule))}
    className={`group rounded-[2rem] border-2 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 ${
      highlighted
        ? 'border-blue-500/60 ring-4 ring-blue-500/20'
        : mergeRole === 'primary'
          ? 'border-amber-500/40 bg-amber-500/5'
          : mergeSelected
            ? 'border-blue-500/30 bg-blue-500/5'
            : 'border-border/40'
    }`}
  >
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        {mergeMode && (
          <RuleCheckbox checked={mergeSelected} onChange={onMergeToggle} label={`Select ${rule.rule_name} for merge`} />
        )}
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-black tracking-tight">{formatLabel(rule.rule_name || 'Untitled Rule')}</h3>
                <StatusBadge status={rule.status || 'active'} />
                <MergeRoleBadge role={mergeRole} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="warning" className="rounded-lg">{formatLabel(getRuleCategory(rule) || 'uncategorized')}</Badge>
                <ProductLineBadges rule={rule} />
              </div>
              <ScopeBadges rule={rule} />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-10 rounded-xl text-xs font-black uppercase tracking-widest" onClick={onView}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Button>
              <Button type="button" variant="outline" size="icon" title="Edit rule" className="h-10 w-10 rounded-xl" onClick={onEdit}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" title="Version history" className="h-10 w-10 rounded-xl" onClick={onHistory}>
                <History className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Delete rule"
                disabled={deleting}
                className="h-10 w-10 rounded-xl hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
                onClick={onDelete}
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <p className="rounded-2xl border border-border/40 bg-muted/20 p-4 text-sm font-semibold leading-relaxed text-foreground/80">
            {rule.rule || 'No rule text provided.'}
          </p>

          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Matched HCPCS</p>
              <HcpcsList codes={rule.matched_hcpcs} />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Source Document</p>
              <p className="truncate font-mono text-xs font-bold text-muted-foreground" title={getSourceDocument(rule)}>
                {getSourceDocument(rule)}
              </p>
            </div>
          </div>

          <MergeRelationshipInfo
            rule={rule}
            mergedFrom={mergedFrom}
            getRuleInfo={getRuleInfo}
            onScrollToRule={onScrollToRule}
          />
        </div>
      </div>
    </CardContent>
  </Card>
);

const EmptyState = ({ title, description }) => (
  <div className="rounded-[2rem] border-2 border-dashed border-border/50 bg-muted/5 py-24 text-center">
    <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
    <h3 className="text-xl font-black tracking-tight">{title}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-muted-foreground">{description}</p>
  </div>
);

const splitCommaList = (value) => String(value || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const joinCommaList = (value) => toArray(value).join(', ');

const getNestedValue = (object, path, fallback = '') => (
  path.split('.').reduce((current, key) => current?.[key], object) ?? fallback
);

const updateNestedValue = (object, path, value) => {
  const keys = path.split('.');
  const next = { ...object };
  let cursor = next;

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      cursor[key] = value;
      return;
    }
    cursor[key] = { ...(cursor[key] || {}) };
    cursor = cursor[key];
  });

  return next;
};

const FieldLabel = ({ children }) => (
  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{children}</label>
);

const EditField = ({ label, value, onChange, type = 'text' }) => (
  <div className="space-y-2">
    <FieldLabel>{label}</FieldLabel>
    <Input
      type={type}
      value={value ?? ''}
      onChange={(event) => {
        if (type !== 'number') {
          onChange(event.target.value);
          return;
        }
        onChange(Number.isNaN(event.target.valueAsNumber) ? '' : event.target.valueAsNumber);
      }}
      className="h-11 rounded-xl bg-background/70 font-semibold"
    />
  </div>
);

const EditTextArea = ({ label, value, onChange, className = '' }) => (
  <div className="space-y-2">
    <FieldLabel>{label}</FieldLabel>
    <Textarea
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
      className={`rounded-xl bg-background/70 font-semibold ${className}`}
    />
  </div>
);

const EditRuleDialog = ({ open, rule, saving, onChange, onClose, onSave }) => {
  if (!rule) return null;

  const status = String(rule.status || '').toLowerCase();
  const isActive = status === 'active';
  const setField = (field, value) => onChange({ ...rule, [field]: value });
  const setNestedField = (field, value) => onChange(updateNestedValue(rule, field, value));

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden rounded-[2rem] border-0 p-0 shadow-2xl">
        <DialogHeader className="border-b border-border/40 px-7 py-6">
          <DialogTitle className="flex flex-wrap items-center gap-3 text-2xl font-black tracking-tight">
            Edit Rule
            <StatusBadge status={rule.status || 'pending'} />
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-muted-foreground">
            {getRuleId(rule) || '-'}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[68vh] overflow-y-auto px-7 py-6">
          <div className="grid gap-5 md:grid-cols-2">
            <EditField label="Rule Name" value={rule.rule_name} onChange={(value) => setField('rule_name', value)} />
            <EditField label="Category" value={rule.category} onChange={(value) => setField('category', value)} />
            <EditTextArea label="Rule" value={rule.rule} onChange={(value) => setField('rule', value)} className="min-h-24 md:col-span-2" />
            <EditTextArea
              label="Matched HCPCS"
              value={joinCommaList(rule.matched_hcpcs)}
              onChange={(value) => setField('matched_hcpcs', splitCommaList(value))}
            />
            <EditTextArea
              label="Matched Product Lines"
              value={joinCommaList(rule.matched_product_lines)}
              onChange={(value) => setField('matched_product_lines', splitCommaList(value))}
            />
            <EditTextArea label="Source Text" value={rule.source_text} onChange={(value) => setField('source_text', value)} className="min-h-32 md:col-span-2" />

            {isActive && (
              <>
                <EditField label="Check Type" value={rule.check_type} onChange={(value) => setField('check_type', value)} />
                <EditField label="Blocking Severity" value={rule.blocking_severity} onChange={(value) => setField('blocking_severity', value)} />
                <EditField label="Field" value={rule.field} onChange={(value) => setField('field', value)} />
                <EditField label="Frequency Value" type="number" value={rule.frequency_value} onChange={(value) => setField('frequency_value', value)} />
                <EditField label="Frequency Unit" value={rule.frequency_unit} onChange={(value) => setField('frequency_unit', value)} />
                <div className="space-y-2">
                  <FieldLabel>Prior Auth Required</FieldLabel>
                  <div className="flex h-11 items-center gap-3 rounded-xl border border-border/50 bg-background/70 px-3">
                    <Switch
                      checked={Boolean(rule.prior_auth_required)}
                      onCheckedChange={(checked) => setField('prior_auth_required', checked)}
                    />
                    <span className="text-sm font-bold text-muted-foreground">{rule.prior_auth_required ? 'Required' : 'Not required'}</span>
                  </div>
                </div>
                <EditField label="Documentation Required" value={rule.documentation_required} onChange={(value) => setField('documentation_required', value)} />
                <EditField label="On Fail Action" value={getNestedValue(rule, 'on_fail.action')} onChange={(value) => setNestedField('on_fail.action', value)} />
                <EditTextArea label="On Fail Message" value={getNestedValue(rule, 'on_fail.message')} onChange={(value) => setNestedField('on_fail.message', value)} className="min-h-24" />
                <EditField label="On Pass Action" value={getNestedValue(rule, 'on_pass.action')} onChange={(value) => setNestedField('on_pass.action', value)} />
                <EditField label="On Pass Message" value={getNestedValue(rule, 'on_pass.message')} onChange={(value) => setNestedField('on_pass.message', value)} />
                <EditField label="Verifiable From" value={rule.verifiable_from} onChange={(value) => setField('verifiable_from', value)} />
                <EditTextArea
                  label="Allowed Values"
                  value={joinCommaList(rule.allowed_values)}
                  onChange={(value) => setField('allowed_values', splitCommaList(value))}
                />
                <EditTextArea
                  label="Scope Levels"
                  value={joinCommaList(rule.scope_levels)}
                  onChange={(value) => setField('scope_levels', splitCommaList(value))}
                />
                <EditField label="Scope Condition" value={rule.scope_condition} onChange={(value) => setField('scope_condition', value)} />
                <EditField label="Scope Category" value={rule.scope_category} onChange={(value) => setField('scope_category', value)} />
                <EditField label="Scope Body Part" value={rule.scope_body_part} onChange={(value) => setField('scope_body_part', value)} />
                <EditField label="Scope Fabrication" value={rule.scope_fabrication} onChange={(value) => setField('scope_fabrication', value)} />
                <EditField label="Scope Usage Time" value={rule.scope_usage_time} onChange={(value) => setField('scope_usage_time', value)} />
                <EditField label="Payer ID" value={rule.payer_id} onChange={(value) => setField('payer_id', value)} />
                <EditField label="Payer Name" value={rule.payer_name} onChange={(value) => setField('payer_name', value)} />
                <EditField label="Payer Type" value={rule.payer_type} onChange={(value) => setField('payer_type', value)} />
                <EditTextArea
                  label="Jurisdiction"
                  value={joinCommaList(rule.jurisdiction)}
                  onChange={(value) => setField('jurisdiction', splitCommaList(value))}
                />
              </>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-border/40 px-7 py-4">
          <Button variant="outline" className="rounded-xl font-bold" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button className="rounded-xl font-bold" onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const VersionHistoryDialog = ({ open, rule, versions, loading, onClose, onRestore }) => (
  <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
    <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden rounded-[2rem] border-0 p-0 shadow-2xl">
      <DialogHeader className="border-b border-border/40 px-7 py-6">
        <DialogTitle className="text-2xl font-black tracking-tight">Version History</DialogTitle>
        <DialogDescription className="truncate text-xs font-semibold text-muted-foreground">
          {rule?.rule_name || 'Untitled Rule'}
        </DialogDescription>
      </DialogHeader>

      <div className="max-h-[68vh] overflow-y-auto px-7 py-6">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-24 text-sm font-black text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Loading version history...
          </div>
        ) : versions?.length ? (
          <div className="space-y-3">
            {versions.map((version, index) => {
              const snapshot = version.snapshot || {};
              const editedAt = version.edited_at || version.updated_at || version.created_at;
              const editedBy = version.edited_by_name || version.edited_by || version.user_id || '-';

              return (
                <div key={version.version || version.id || index} className="rounded-2xl border border-border/40 bg-muted/10 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge className="rounded-lg bg-primary/10 text-primary">V{version.version || index + 1}</Badge>
                        <span className="text-xs font-bold text-muted-foreground">
                          {editedAt ? new Date(editedAt).toLocaleString() : 'Date unavailable'}
                        </span>
                      </div>
                      <p className="truncate text-xs font-mono text-muted-foreground" title={String(editedBy)}>
                        {editedBy}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl font-black" onClick={() => onRestore(version)}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restore
                    </Button>
                  </div>

                  <details className="group mt-4">
                    <summary className="flex cursor-pointer list-none items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                      Snapshot
                    </summary>
                    <div className="mt-3 space-y-3 rounded-xl border border-border/30 bg-background/60 p-4">
                      <InfoRow label="rule_name" value={snapshot.rule_name} />
                      <InfoRow label="category" value={snapshot.category} />
                      <InfoRow label="rule" value={snapshot.rule} />
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No version history yet"
            description="Versions are created when a rule is edited."
          />
        )}
      </div>

      <DialogFooter className="border-t border-border/40 px-7 py-4">
        <Button variant="outline" className="rounded-xl font-bold" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const ActiveMergeSuggestions = ({
  suggestions,
  loading,
  open,
  rulesById,
  onToggle,
  onRefresh,
  onAccept,
  onReject,
}) => {
  if (!suggestions.length) return null;

  return (
    <Card className="overflow-hidden rounded-2xl border-2 border-border/40 shadow-sm">
      <CardContent className="p-0">
        <div className="flex flex-col gap-3 border-b border-border/30 p-4 md:flex-row md:items-center md:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="h-auto justify-start rounded-xl px-0 text-sm font-black uppercase tracking-widest hover:bg-transparent"
            onClick={onToggle}
          >
            {open ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
            AI Merge Suggestions ({suggestions.length})
          </Button>
          <Button type="button" variant="outline" size="icon" title="Refresh suggestions" className="h-10 w-10 rounded-xl" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {open && (
          <div className="space-y-3 p-4">
            {loading ? (
              <div className="flex items-center justify-center gap-3 py-12 text-sm font-black text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Loading merge suggestions...
              </div>
            ) : (
              suggestions.map((suggestion) => {
                const duplicateIds = suggestion.duplicate_rule_ids || [];
                const primaryName = rulesById.get(suggestion.primary_rule_id)?.rule_name || suggestion.primary_rule_id;

                return (
                  <div key={suggestion.suggestion_id} className="rounded-2xl border border-border/40 bg-muted/10 p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="break-words text-sm font-black">
                            Merge {duplicateIds.length} rule(s) into: {formatLabel(primaryName)}
                          </p>
                          <ConfidenceBadge confidence={suggestion.confidence} />
                        </div>
                        <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
                          Reason: {suggestion.reason || '-'}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button className="h-10 rounded-xl text-xs font-black uppercase tracking-widest" onClick={() => onAccept(suggestion.suggestion_id)}>
                          Accept
                        </Button>
                        <Button variant="outline" className="h-10 rounded-xl text-xs font-black uppercase tracking-widest" onClick={() => onReject(suggestion.suggestion_id)}>
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AnalyzeResultPanel = ({ analyzeResult, onAccept, onDismiss }) => {
  if (!analyzeResult) return null;

  if (analyzeResult.has_suggestions === false) {
    return (
      <Card className="rounded-2xl border-2 border-border/40 shadow-2xl">
        <CardContent className="p-4 text-sm font-black text-muted-foreground">
          Gemini found no strong merge candidates among the selected rules
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {(analyzeResult.suggestions || []).map((suggestion, index) => (
        <Card key={suggestion.suggestion_id || `${suggestion.primary_rule_id}-${index}`} className="rounded-2xl border-2 border-border/40 shadow-2xl">
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-black">Primary: {formatLabel(suggestion.primary_rule_name || suggestion.primary_rule_id)}</p>
              <ConfidenceBadge confidence={suggestion.confidence} />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">
              Absorbs: {(suggestion.duplicate_rule_names || suggestion.duplicate_rule_ids || []).map(formatLabel).join(', ') || '-'}
            </p>
            <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
              Reason: {suggestion.reason || '-'}
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                className="h-10 rounded-xl text-xs font-black uppercase tracking-widest"
                onClick={() => onAccept(suggestion.primary_rule_id, suggestion.duplicate_rule_ids || [])}
              >
                Accept Suggestion
              </Button>
              <Button variant="outline" className="h-10 rounded-xl text-xs font-black uppercase tracking-widest" onClick={onDismiss}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const KnowledgeBase = () => {
  const { user } = useSelector((state) => state.auth);
  const userId = user?.user_id || user?.id || '';

  const [disease, setDisease] = useState(DEFAULT_DISEASE);
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingRules, setPendingRules] = useState([]);
  const [activeRules, setActiveRules] = useState([]);
  const [mergedRules, setMergedRules] = useState([]);
  const [loading, setLoading] = useState({ pending: true, active: true, merged: true });
  const [categoryFilter, setCategoryFilter] = useState(ALL_FILTER);
  const [productLineFilter, setProductLineFilter] = useState(ALL_FILTER);
  const [sourceDocumentFilter, setSourceDocumentFilter] = useState(ALL_FILTER);
  const [selectedRuleIds, setSelectedRuleIds] = useState([]);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [detailState, setDetailState] = useState({ open: false, rule: null, loading: false });
  const [editState, setEditState] = useState({ open: false, rule: null, saving: false });
  const [versionState, setVersionState] = useState({ open: false, rule: null, versions: [], loading: false });
  const [mergeSuggestions, setMergeSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState(null);
  const [analyzingRules, setAnalyzingRules] = useState(false);
  const [manualMergeMode, setManualMergeMode] = useState(false);
  const [manualMergeSelections, setManualMergeSelections] = useState([]);
  const [primaryRuleId, setPrimaryRuleId] = useState(null);
  const [executingMerge, setExecutingMerge] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [highlightedRuleId, setHighlightedRuleId] = useState(null);

  const diseaseKey = disease.trim().toLowerCase() || DEFAULT_DISEASE;

  const fetchRules = useCallback(async (status, { silent = false } = {}) => {
    if (!userId) {
      setLoading((previous) => ({ ...previous, [status]: false }));
      return;
    }
    if (!silent) setLoading((previous) => ({ ...previous, [status]: true }));

    try {
      const response = await fetch(`${BASE_URL}/admin/rules/${diseaseKey}?status=${status}`, {
        headers: { 'x-user-id': userId },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(getErrorMessage(data, `Failed to load ${status} rules`));
      }

      const rules = normalizeRules(data).map((rule) => ({ ...rule, status: rule.status || status }));
      if (status === 'pending') setPendingRules(rules);
      if (status === 'active') setActiveRules(rules);
      if (status === 'merged') setMergedRules(rules);
    } catch (error) {
      toast.error(error.message || `Failed to load ${status} rules`);
    } finally {
      if (!silent) setLoading((previous) => ({ ...previous, [status]: false }));
    }
  }, [diseaseKey, userId]);

  const refreshAll = useCallback(async ({ silent = false } = {}) => {
    await Promise.all([
      fetchRules('pending', { silent }),
      fetchRules('active', { silent }),
      fetchRules('merged', { silent }),
    ]);
  }, [fetchRules]);

  const fetchMergeSuggestions = useCallback(async () => {
    if (!userId) return;

    setLoadingSuggestions(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${diseaseKey}/merge-suggestions`, {
        headers: { 'x-user-id': userId },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) setMergeSuggestions(data.suggestions || []);
    } catch {
      toast.error('Failed to load merge suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  }, [diseaseKey, userId]);

  useEffect(() => {
    setSelectedRuleIds([]);
    refreshAll();
    if (activeTab === 'active') fetchMergeSuggestions();
  }, [activeTab, fetchMergeSuggestions, refreshAll]);

  const stats = useMemo(() => ({
    pending: pendingRules.length,
    active: activeRules.length,
    total: pendingRules.length + activeRules.length + mergedRules.length,
    chunks: new Set([...pendingRules, ...activeRules, ...mergedRules].flatMap((rule) => rule.linked_chunk_ids || [])).size,
  }), [activeRules, mergedRules, pendingRules]);

  const filterableRules = useMemo(() => [...pendingRules, ...activeRules], [activeRules, pendingRules]);
  const allRules = useMemo(() => [...filterableRules, ...mergedRules], [filterableRules, mergedRules]);

  const categoryOptions = useMemo(() => (
    buildFilterOptions(filterableRules.map(getRuleCategory).filter(Boolean))
  ), [filterableRules]);

  const productLineOptions = useMemo(() => (
    buildFilterOptions(filterableRules.flatMap(getMatchedProductLines).filter(Boolean))
  ), [filterableRules]);

  const sourceDocumentOptions = useMemo(() => (
    buildFilterOptions(filterableRules.map(getSourceDocumentName).filter((value) => value && value !== '-'))
  ), [filterableRules]);

  const ruleMatchesFilters = useCallback((rule) => {
    const categoryKey = normalizeFilterValue(getRuleCategory(rule));
    const productLineKeys = getMatchedProductLines(rule).map(normalizeFilterValue);
    const sourceDocumentKey = normalizeFilterValue(getSourceDocumentName(rule));

    return (
      (categoryFilter === ALL_FILTER || categoryKey === categoryFilter) &&
      (productLineFilter === ALL_FILTER || productLineKeys.includes(productLineFilter)) &&
      (sourceDocumentFilter === ALL_FILTER || sourceDocumentKey === sourceDocumentFilter)
    );
  }, [categoryFilter, productLineFilter, sourceDocumentFilter]);

  const filteredPendingRules = useMemo(() => {
    return pendingRules.filter(ruleMatchesFilters);
  }, [pendingRules, ruleMatchesFilters]);

  const filteredActiveRules = useMemo(() => {
    return activeRules.filter(ruleMatchesFilters);
  }, [activeRules, ruleMatchesFilters]);

  const toggleRuleSelection = (ruleId) => {
    setSelectedRuleIds((previous) => (
      previous.includes(ruleId)
        ? previous.filter((id) => id !== ruleId)
        : [...previous, ruleId]
    ));
  };

  const toggleAllPending = () => {
    const visibleIds = filteredPendingRules.map(getRuleId).filter(Boolean);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedRuleIds.includes(id));
    setSelectedRuleIds((previous) => {
      if (allSelected) return previous.filter((id) => !visibleIds.includes(id));
      return [...new Set([...previous, ...visibleIds])];
    });
  };

  const openRuleDetail = async (rule) => {
    const ruleId = getRuleId(rule);
    setDetailState({ open: true, rule, loading: true });

    try {
      const response = await fetch(`${BASE_URL}/admin/rules/${diseaseKey}/${ruleId}`, {
        headers: { 'x-user-id': userId },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(getErrorMessage(data, 'Failed to load rule details'));
      }
      setDetailState({ open: true, rule: { ...rule, ...(data.rule || data) }, loading: false });
    } catch (error) {
      toast.error(error.message || 'Failed to load rule details');
      setDetailState({ open: true, rule, loading: false });
    }
  };

  const openEditRule = (rule) => {
    setEditState({ open: true, rule: { ...rule }, saving: false });
  };

  const saveEditedRule = async (editedRule) => {
    const ruleId = getRuleId(editedRule);
    if (!ruleId) return;

    setEditState((previous) => ({ ...previous, saving: true }));
    try {
      const response = await fetch(`${BASE_URL}/admin/rules/${diseaseKey}/${ruleId}`, {
        method: 'PATCH',
        headers: {
          'x-user-id': userId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, updates: editedRule }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(getErrorMessage(data, 'Failed to save rule'));
      }

      toast.success('Rule updated');
      setEditState({ open: false, rule: null, saving: false });
      await refreshAll({ silent: true });
    } catch (error) {
      toast.error(error.message || 'Failed to save rule');
      setEditState((previous) => ({ ...previous, saving: false }));
    }
  };

  const openVersionHistory = async (rule) => {
    const ruleId = getRuleId(rule);
    if (!ruleId) return;

    setVersionState({ open: true, rule, versions: [], loading: true });
    try {
      const response = await fetch(`${BASE_URL}/admin/rules/${diseaseKey}/${ruleId}/versions`, {
        headers: { 'x-user-id': userId },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(getErrorMessage(data, 'Failed to load version history'));
      }
      setVersionState((previous) => ({
        ...previous,
        versions: Array.isArray(data?.versions) ? data.versions : [],
        loading: false,
      }));
    } catch (error) {
      toast.error(error.message || 'Failed to load version history');
      setVersionState((previous) => ({ ...previous, loading: false }));
    }
  };

  const restoreVersion = (version, currentRule) => {
    if (!version?.snapshot || !currentRule) return;

    toast.info(`Restoring version ${version.version}...`);
    saveEditedRule({
      ...currentRule,
      ...version.snapshot,
      rule_id: getRuleId(currentRule),
      status: currentRule.status,
    });
  };

  const acceptSuggestion = async (suggestionId) => {
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${diseaseKey}/merge-suggestions/accept`, {
        method: 'POST',
        headers: { 'x-user-id': userId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, suggestion_id: suggestionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Accept failed');
      toast.success('Merged successfully');
      setMergeSuggestions((prev) => prev.filter((s) => s.suggestion_id !== suggestionId));
      await refreshAll({ silent: true });
      await fetchMergeSuggestions();
    } catch (e) {
      toast.error(e.message || 'Accept failed');
    }
  };

  const rejectSuggestion = async (suggestionId) => {
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${diseaseKey}/merge-suggestions/reject`, {
        method: 'POST',
        headers: { 'x-user-id': userId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, suggestion_id: suggestionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Reject failed');
      toast.success('Suggestion dismissed');
      setMergeSuggestions((prev) => prev.filter((s) => s.suggestion_id !== suggestionId));
    } catch (e) {
      toast.error(e.message || 'Reject failed');
    }
  };

  const analyzeSelectedRules = async (ruleIds) => {
    if (ruleIds.length < 2) {
      toast.error('Select at least 2 rules to analyze');
      return;
    }
    setAnalyzingRules(true);
    setAnalyzeResult(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${diseaseKey}/merge-suggestions/analyze`, {
        method: 'POST',
        headers: { 'x-user-id': userId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, rule_ids: ruleIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Analysis failed');
      setAnalyzeResult(data);
    } catch (e) {
      toast.error(e.message || 'Analysis failed');
    } finally {
      setAnalyzingRules(false);
    }
  };

  const executeManualMerge = async (primaryId, duplicateIds) => {
    if (!primaryId || !duplicateIds.length) {
      toast.error('Select a primary rule and at least one duplicate');
      return;
    }
    setExecutingMerge(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${diseaseKey}/manual-merge`, {
        method: 'POST',
        headers: { 'x-user-id': userId, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          primary_rule_id: primaryId,
          duplicate_rule_ids: duplicateIds,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Merge failed');
      toast.success(`Merged ${duplicateIds.length} rule(s) into primary`);
      setManualMergeMode(false);
      setManualMergeSelections([]);
      setPrimaryRuleId(null);
      setAnalyzeResult(null);
      await refreshAll({ silent: true });
      await fetchMergeSuggestions();
    } catch (e) {
      toast.error(e.message || 'Merge failed');
    } finally {
      setExecutingMerge(false);
    }
  };

  const approveSelectedRules = async () => {
    if (!selectedRuleIds.length) return;

    setBulkLoading('approve');
    setApproveConfirmOpen(false);
    const toastId = toast.loading('Expanding rules... (using Claude Opus 4.7)');
    setPendingRules((previous) => previous.map((rule) => (
      selectedRuleIds.includes(getRuleId(rule)) ? { ...rule, status: 'approved' } : rule
    )));

    try {
      const response = await fetch(`${BASE_URL}/admin/rules/${diseaseKey}/approve`, {
        method: 'POST',
        headers: {
          'x-user-id': userId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, rule_ids: selectedRuleIds }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(getErrorMessage(data, 'Failed to approve rules'));
      }

      const count = getMetric(data, ['approved_count', 'rules_approved', 'count'], selectedRuleIds.length);
      const tokens = getMetric(data, ['tokens_used', 'token_count'], 0);
      const seconds = getMetric(data, ['seconds', 'duration_seconds', 'elapsed_seconds'], 0);
      toast.success(`${count} rules approved and expanded (${tokens} tokens used, ${seconds} seconds)`, { id: toastId });
      setSelectedRuleIds([]);
      setActiveTab('active');
      await refreshAll({ silent: true });
      await fetchMergeSuggestions();
    } catch (error) {
      toast.error(error.message || 'Failed to approve rules', { id: toastId });
      await fetchRules('pending', { silent: true });
    } finally {
      setBulkLoading('');
    }
  };

  const rejectSelectedRules = async () => {
    if (!selectedRuleIds.length) return;

    setBulkLoading('reject');
    setRejectConfirmOpen(false);
    try {
      const response = await fetch(`${BASE_URL}/admin/rules/${diseaseKey}/reject`, {
        method: 'POST',
        headers: {
          'x-user-id': userId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, rule_ids: selectedRuleIds }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(getErrorMessage(data, 'Failed to reject rules'));
      }

      toast.success(`${selectedRuleIds.length} pending rules rejected`);
      setPendingRules((previous) => previous.filter((rule) => !selectedRuleIds.includes(getRuleId(rule))));
      setSelectedRuleIds([]);
    } catch (error) {
      toast.error(error.message || 'Failed to reject rules');
    } finally {
      setBulkLoading('');
    }
  };

  const deleteRule = async (rule) => {
    const ruleId = getRuleId(rule);
    if (!ruleId || !window.confirm(`Delete "${formatLabel(rule.rule_name || ruleId)}"?`)) return;

    setDeletingId(ruleId);
    try {
      const status = String(rule.status || '').toLowerCase();
      const endpoint = status === 'pending'
        ? `${BASE_URL}/admin/rules/${diseaseKey}/reject`
        : `${BASE_URL}/admin/rules/${diseaseKey}/bulk-delete`;
      const options = status === 'pending'
        ? {
            method: 'POST',
            headers: { 'x-user-id': userId, 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, rule_ids: [ruleId] }),
          }
        : {
            method: 'DELETE',
            headers: { 'x-user-id': userId, 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, rule_ids: [ruleId] }),
          };

      const response = await fetch(endpoint, options);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(getErrorMessage(data, 'Failed to delete rule'));
      }

      toast.success('Rule deleted');
      setPendingRules((previous) => previous.filter((item) => getRuleId(item) !== ruleId));
      setActiveRules((previous) => previous.filter((item) => getRuleId(item) !== ruleId));
      setMergedRules((previous) => previous.filter((item) => getRuleId(item) !== ruleId));
      setSelectedRuleIds((previous) => previous.filter((id) => id !== ruleId));
    } catch (error) {
      toast.error(error.message || 'Failed to delete rule');
    } finally {
      setDeletingId('');
    }
  };

  const selectedCount = selectedRuleIds.length;
  const visiblePendingIds = filteredPendingRules.map(getRuleId).filter(Boolean);
  const allVisibleSelected = visiblePendingIds.length > 0 && visiblePendingIds.every((id) => selectedRuleIds.includes(id));
  const isApproving = bulkLoading === 'approve';
  const isRejecting = bulkLoading === 'reject';
  const rulesById = useMemo(() => allRules.reduce((map, rule) => {
    const ruleId = getRuleId(rule);
    if (!ruleId) return map;
    map.set(ruleId, rule);
    map.set(normalizeRuleId(ruleId), rule);
    return map;
  }, new Map()), [allRules]);
  const getRuleById = useCallback((ruleId) => (
    rulesById.get(ruleId) || rulesById.get(normalizeRuleId(ruleId))
  ), [rulesById]);

  const mergedRulesByTargetId = useMemo(() => mergedRules.reduce((map, mergedRule) => {
    const targetId = getMergeRefId(mergedRule.merged_into);
    if (!targetId) return map;
    const key = normalizeRuleId(targetId);
    map.set(key, [...(map.get(key) || []), mergedRule]);
    return map;
  }, new Map()), [mergedRules]);

  const getMergedSourcesForRule = useCallback((rule) => {
    const explicitSources = Array.isArray(rule?.merged_from) ? rule.merged_from.filter(Boolean) : [];
    const derivedSources = mergedRulesByTargetId.get(normalizeRuleId(getRuleId(rule))) || [];
    const seen = new Set();

    return [...explicitSources, ...derivedSources].filter((sourceRef, index) => {
      const sourceId = normalizeRuleId(getMergeRefId(sourceRef));
      const key = sourceId || `embedded-${index}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [mergedRulesByTargetId]);

  const primaryRule = primaryRuleId ? getRuleById(primaryRuleId) : null;
  const duplicateRuleIds = manualMergeSelections.filter((id) => id !== primaryRuleId);
  const selectedMergeIds = primaryRuleId ? [primaryRuleId, ...duplicateRuleIds] : duplicateRuleIds;

  const getRelationshipRuleInfo = useCallback((ruleRef) => {
    const ruleId = getMergeRefId(ruleRef);
    const embeddedRule = ruleRef && typeof ruleRef === 'object' ? ruleRef : null;
    const loadedRule = getRuleById(ruleId);
    const sourceRule = loadedRule || embeddedRule || {};
    const loadedStatus = String(loadedRule?.status || '').toLowerCase();
    const name = (
      sourceRule.rule_name ||
      sourceRule.source_rule_name ||
      sourceRule.target_rule_name ||
      sourceRule.merged_rule_name ||
      sourceRule.name ||
      sourceRule.title
    );
    const description = (
      sourceRule.rule ||
      sourceRule.rule_text ||
      sourceRule.source_rule_text ||
      sourceRule.target_rule_text ||
      sourceRule.description ||
      sourceRule.rule_description ||
      sourceRule.source_text
    );

    return {
      id: ruleId || name || 'unknown-rule',
      name: formatLabel(name || 'Merged rule'),
      description: description || 'Details unavailable in the current rule list.',
      canScroll: Boolean(ruleId && loadedRule && loadedStatus !== 'merged'),
    };
  }, [getRuleById]);

  const scrollToRule = useCallback((ruleId) => {
    if (!ruleId) return;

    const targetRule = getRuleById(ruleId);
    if (targetRule) {
      const targetStatus = String(targetRule.status || '').toLowerCase();
      setActiveTab(targetStatus === 'pending' ? 'pending' : 'active');
    }

    window.setTimeout(() => {
      const element = document.getElementById(getRuleDomId(ruleId));
      if (!element) {
        toast.info('Target rule is not visible with the current filters');
        return;
      }

      setHighlightedRuleId(ruleId);
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => setHighlightedRuleId((current) => (
        current === ruleId ? null : current
      )), 1800);
    }, 120);
  }, [getRuleById]);

  const resetMergeMode = () => {
    setManualMergeMode(false);
    setManualMergeSelections([]);
    setPrimaryRuleId(null);
    setAnalyzeResult(null);
  };

  const toggleMergeMode = () => {
    setManualMergeMode((previous) => {
      const next = !previous;
      setManualMergeSelections([]);
      setPrimaryRuleId(null);
      setAnalyzeResult(null);
      return next;
    });
  };

  const toggleManualMergeSelection = (ruleId) => {
    if (!ruleId) return;
    setAnalyzeResult(null);

    if (ruleId === primaryRuleId) {
      const [nextPrimary, ...remainingDuplicates] = duplicateRuleIds;
      setPrimaryRuleId(nextPrimary || null);
      setManualMergeSelections(remainingDuplicates);
      return;
    }

    if (duplicateRuleIds.includes(ruleId)) {
      setManualMergeSelections((previous) => previous.filter((id) => id !== ruleId));
      return;
    }

    if (!primaryRuleId) {
      setPrimaryRuleId(ruleId);
      setManualMergeSelections([]);
      return;
    }

    setManualMergeSelections((previous) => [...new Set([...previous.filter((id) => id !== primaryRuleId), ruleId])]);
  };

  const getMergeRole = (ruleId) => {
    if (ruleId === primaryRuleId) return 'primary';
    if (duplicateRuleIds.includes(ruleId)) return 'duplicate';
    return '';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary shadow-sm">
            <BookOpen className="h-3.5 w-3.5" />
            Knowledge Base
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Rule Review</h1>
            <p className="text-sm font-medium text-muted-foreground">
              Review minimal extracted rules, approve structured expansion, and manage active validation logic.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={disease}
            onChange={(event) => setDisease(event.target.value)}
            className="h-11 w-full rounded-2xl border-2 border-border/40 bg-card px-4 text-sm font-black sm:w-48"
            placeholder="Disease"
          />
          <Button variant="outline" className="h-11 rounded-2xl font-black" onClick={() => refreshAll()} disabled={loading.pending || loading.active || loading.merged}>
            <RefreshCw className={`mr-2 h-4 w-4 ${(loading.pending || loading.active || loading.merged) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {!userId && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm font-bold text-amber-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Please sign in to manage rules.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Rules', value: stats.total, sub: `${diseaseKey} knowledge base`, icon: Hash, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Pending Review', value: stats.pending, sub: 'minimal rules awaiting approval', icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-500/10' },
          { label: 'Active Rules', value: stats.active, sub: 'structured validation rules', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
          { label: 'Linked Chunks', value: stats.chunks || '-', sub: 'from rule metadata', icon: Layers, color: 'text-violet-600', bg: 'bg-violet-500/10' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="overflow-hidden rounded-[1.5rem] border-2 border-border/40 shadow-sm">
              <CardContent className="relative p-5">
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${item.bg} ${item.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">{item.label}</p>
                <p className="mt-1 text-3xl font-black tracking-tight">{item.value}</p>
                <p className="mt-2 text-[11px] font-bold text-muted-foreground/70">{item.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        if (value !== 'pending') setSelectedRuleIds([]);
      }} className="space-y-5">
        <div className="flex flex-col gap-4 rounded-[2rem] border-2 border-border/40 bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <TabsList className="h-12 rounded-2xl bg-muted/60 p-1">
            <TabsTrigger value="pending" className="rounded-xl px-5 text-xs font-black uppercase tracking-widest">
              Pending Review
              <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-600">{stats.pending}</span>
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-xl px-5 text-xs font-black uppercase tracking-widest">
              Active Rules
              <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-600">{stats.active}</span>
            </TabsTrigger>
          </TabsList>

          {activeTab === 'pending' && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={manualMergeMode ? 'default' : 'outline'}
                className="h-10 rounded-xl text-xs font-black uppercase tracking-widest"
                onClick={toggleMergeMode}
              >
                <GitMerge className="mr-2 h-4 w-4" />
                {manualMergeMode ? 'Exit Merge Mode' : 'Merge Mode'}
              </Button>
              <Button variant="outline" className="h-10 rounded-xl text-xs font-black uppercase tracking-widest" onClick={toggleAllPending} disabled={!visiblePendingIds.length}>
                {allVisibleSelected ? 'Clear Visible' : 'Select Visible'}
              </Button>
              <Button
                className="h-10 rounded-xl text-xs font-black uppercase tracking-widest"
                disabled={!selectedCount || isApproving || isRejecting}
                onClick={() => setApproveConfirmOpen(true)}
              >
                {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Approve {selectedCount || ''} {selectedCount === 1 ? 'Rule' : 'Rules'}
              </Button>
              <Button
                variant="outline"
                className="h-10 rounded-xl text-xs font-black uppercase tracking-widest hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
                disabled={!selectedCount || isApproving || isRejecting}
                onClick={() => setRejectConfirmOpen(true)}
              >
                {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Reject Selected
              </Button>
            </div>
          )}

          {activeTab === 'active' && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={manualMergeMode ? 'default' : 'outline'}
                className="h-10 rounded-xl text-xs font-black uppercase tracking-widest"
                onClick={toggleMergeMode}
              >
                <GitMerge className="mr-2 h-4 w-4" />
                {manualMergeMode ? 'Exit Merge Mode' : 'Merge Mode'}
              </Button>
            </div>
          )}
        </div>

        <Card className="overflow-hidden rounded-2xl border-0 bg-card/50 shadow-lg shadow-black/5 backdrop-blur-sm">
          <CardContent className="grid gap-4 p-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Category</p>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-11 w-full rounded-xl border-border/50 bg-background/50 text-sm font-bold">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value={ALL_FILTER}>All categories</SelectItem>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Product Line</p>
              <Select value={productLineFilter} onValueChange={setProductLineFilter}>
                <SelectTrigger className="h-11 w-full rounded-xl border-border/50 bg-background/50 text-sm font-bold">
                  <SelectValue placeholder="All product lines" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value={ALL_FILTER}>All product lines</SelectItem>
                  {productLineOptions.map((line) => (
                    <SelectItem key={line.value} value={line.value}>
                      {line.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Source Document</p>
              <Select value={sourceDocumentFilter} onValueChange={setSourceDocumentFilter}>
                <SelectTrigger className="h-11 w-full rounded-xl border-border/50 bg-background/50 text-sm font-bold">
                  <SelectValue placeholder="All source documents" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value={ALL_FILTER}>All source documents</SelectItem>
                  {sourceDocumentOptions.map((documentName) => (
                    <SelectItem key={documentName.value} value={documentName.value}>
                      {documentName.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              className="h-11 rounded-xl text-xs font-black uppercase tracking-widest"
              disabled={categoryFilter === ALL_FILTER && productLineFilter === ALL_FILTER && sourceDocumentFilter === ALL_FILTER}
              onClick={() => {
                setCategoryFilter(ALL_FILTER);
                setProductLineFilter(ALL_FILTER);
                setSourceDocumentFilter(ALL_FILTER);
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>

        <TabsContent value="pending" className="space-y-4">
          {isApproving && (
            <div className="flex items-center gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-5 py-4 text-sm font-black text-blue-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              Expanding rules to structured format...
            </div>
          )}

          {loading.pending ? (
            <div className="flex items-center justify-center gap-3 rounded-[2rem] border-2 border-dashed border-border/50 py-28 text-sm font-black text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading pending rules...
            </div>
          ) : filteredPendingRules.length ? (
            filteredPendingRules.map((rule) => {
              const ruleId = getRuleId(rule);
              return (
                <PendingRuleCard
                  key={ruleId}
                  rule={rule}
                  selected={selectedRuleIds.includes(ruleId)}
                  onToggle={() => toggleRuleSelection(ruleId)}
                  mergeMode={manualMergeMode}
                  mergeSelected={selectedMergeIds.includes(ruleId)}
                  mergeRole={getMergeRole(ruleId)}
                  onMergeToggle={() => toggleManualMergeSelection(ruleId)}
                  highlighted={highlightedRuleId === ruleId}
                  mergedFrom={rule.merged_from}
                  getRuleInfo={getRelationshipRuleInfo}
                  onScrollToRule={scrollToRule}
                  onView={() => openRuleDetail(rule)}
                  onEdit={() => openEditRule(rule)}
                  onHistory={() => openVersionHistory(rule)}
                  onApprove={() => {
                    setSelectedRuleIds([ruleId]);
                    setApproveConfirmOpen(true);
                  }}
                  onReject={() => {
                    setSelectedRuleIds([ruleId]);
                    setRejectConfirmOpen(true);
                  }}
                />
              );
            })
          ) : (
            <EmptyState
              title={pendingRules.length ? 'No pending rules match these filters' : 'No pending rules'}
              description={pendingRules.length ? 'Adjust the category, product line, or source document filters to see more minimal rules.' : 'Minimal rules will appear here after document extraction completes and rules are ready for review.'}
            />
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <ActiveMergeSuggestions
            suggestions={mergeSuggestions}
            loading={loadingSuggestions}
            open={suggestionsOpen}
            rulesById={rulesById}
            onToggle={() => setSuggestionsOpen((previous) => !previous)}
            onRefresh={fetchMergeSuggestions}
            onAccept={acceptSuggestion}
            onReject={rejectSuggestion}
          />

          {(loading.active || loading.merged) ? (
            <div className="flex items-center justify-center gap-3 rounded-[2rem] border-2 border-dashed border-border/50 py-28 text-sm font-black text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading active rules...
            </div>
          ) : filteredActiveRules.length ? (
            filteredActiveRules.map((rule) => {
              const ruleId = getRuleId(rule);
              return (
                <ActiveRuleCard
                  key={ruleId}
                  rule={rule}
                  deleting={deletingId === ruleId}
                  mergeMode={manualMergeMode}
                  mergeSelected={selectedMergeIds.includes(ruleId)}
                  mergeRole={getMergeRole(ruleId)}
                  onMergeToggle={() => toggleManualMergeSelection(ruleId)}
                  highlighted={highlightedRuleId === ruleId}
                  mergedFrom={getMergedSourcesForRule(rule)}
                  getRuleInfo={getRelationshipRuleInfo}
                  onScrollToRule={scrollToRule}
                  onView={() => openRuleDetail(rule)}
                  onEdit={(event) => {
                    event?.stopPropagation?.();
                    openEditRule(rule);
                  }}
                  onHistory={(event) => {
                    event?.stopPropagation?.();
                    openVersionHistory(rule);
                  }}
                  onDelete={() => deleteRule(rule)}
                />
              );
            })
          ) : (
            <EmptyState
              title={activeRules.length ? 'No active rules match these filters' : 'No active rules'}
              description={activeRules.length ? 'Adjust the category, product line, or source document filters to see more active rules.' : 'Approved rules will appear here after the backend expands them into the full structured format.'}
            />
          )}
        </TabsContent>
      </Tabs>

      {manualMergeMode && (
        <div className="sticky bottom-4 z-50 w-full min-w-0 overflow-hidden rounded-[1.75rem] border border-border/50 bg-background/95 p-3 shadow-2xl backdrop-blur sm:p-4">
          <div className="mx-auto w-full max-w-screen-2xl space-y-3">
            <AnalyzeResultPanel
              analyzeResult={analyzeResult}
              onAccept={executeManualMerge}
              onDismiss={() => setAnalyzeResult(null)}
            />
            <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-3 overflow-hidden rounded-2xl border border-border/50 bg-card p-3 sm:p-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,auto)] xl:items-center">
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-black">
                  Primary: {primaryRule ? formatLabel(primaryRule.rule_name || primaryRuleId) : 'Select a primary rule'}
                </p>
                <p className="text-xs font-bold text-muted-foreground">
                  {duplicateRuleIds.length} duplicates selected
                </p>
              </div>
              <div className="flex w-full min-w-0 max-w-full flex-wrap items-center justify-start gap-2 sm:justify-end xl:w-auto">
                <Button
                  variant="outline"
                  className="h-10 min-w-0 flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest sm:flex-none sm:px-4 md:text-sm"
                  disabled={analyzingRules || selectedMergeIds.length < 2}
                  onClick={() => analyzeSelectedRules(selectedMergeIds)}
                >
                  {analyzingRules ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Get AI Suggestion
                </Button>
                <Button
                  className="h-10 min-w-0 flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest sm:flex-none sm:px-4 md:text-sm"
                  disabled={executingMerge || !primaryRuleId || !duplicateRuleIds.length}
                  onClick={() => executeManualMerge(primaryRuleId, duplicateRuleIds)}
                >
                  {executingMerge ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitMerge className="mr-2 h-4 w-4" />}
                  Merge Now
                </Button>
                <Button
                  variant="outline"
                  className="h-10 min-w-0 flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest sm:flex-none sm:px-4 md:text-sm"
                  onClick={resetMergeMode}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <RuleDetailDialog
        open={detailState.open}
        rule={detailState.rule}
        loading={detailState.loading}
        onClose={() => setDetailState({ open: false, rule: null, loading: false })}
      />

      <EditRuleDialog
        open={editState.open}
        rule={editState.rule}
        saving={editState.saving}
        onChange={(updatedRule) => setEditState((prev) => ({ ...prev, rule: updatedRule }))}
        onClose={() => setEditState({ open: false, rule: null, saving: false })}
        onSave={() => saveEditedRule(editState.rule)}
      />

      <VersionHistoryDialog
        open={versionState.open}
        rule={versionState.rule}
        versions={versionState.versions}
        loading={versionState.loading}
        onClose={() => setVersionState({ open: false, rule: null, versions: [], loading: false })}
        onRestore={(version) => restoreVersion(version, versionState.rule)}
      />

      <AlertDialog open={approveConfirmOpen} onOpenChange={setApproveConfirmOpen}>
        <AlertDialogContent className="rounded-[2rem] border-2 border-border/40">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black tracking-tight">Approve {selectedCount} rules?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium leading-relaxed">
              This will expand them to full structured format.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl font-bold" onClick={approveSelectedRules}>
              Approve Rules
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={rejectConfirmOpen} onOpenChange={setRejectConfirmOpen}>
        <AlertDialogContent className="rounded-[2rem] border-2 border-border/40">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black tracking-tight">Reject {selectedCount} rules?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium leading-relaxed">
              Rejected pending rules will be removed from review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-red-500 font-bold text-white hover:bg-red-600" onClick={rejectSelectedRules}>
              Reject Rules
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default KnowledgeBase;
