import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import {
  ClipboardList,
  Search,
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  UserX,
  Users,
  Trash2,
  Eye,
  Info,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';

import { deleteOrder, getOrderFields, getOrderSummaryHistory, listOrders, submitCSRDecision } from '../../../services/intakeApi';

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Derive the single most-important status signal from an order row.
// Priority: identity_mismatch > identity_incomplete > identity_review_required
//           > awaiting_csr > pipeline status
const getIdentityReviewPayload = (order) =>
  order?.identity_review_payload || order?.identityReviewPayload || {};

const getDecisionType = (order) =>
  order?.decision_type || getIdentityReviewPayload(order)?.decision_type;

const isMergeDecisionOrder = (order) =>
  order?.awaiting_csr === true &&
  order?.identity_decision_status === 'pending' &&
  (
    getDecisionType(order) === 'merge_or_new' ||
    !!order?.existing_order ||
    !!getIdentityReviewPayload(order)?.existing_order
  );

const deriveDisplayStatus = (order) => {
  if (!order) return { key: 'pending', label: 'Pending', color: 'amber' };

  const s = (order.status || 'pending').toLowerCase();
  const decisionType = order?.decision_type || getIdentityReviewPayload(order)?.decision_type;

  if (decisionType === 'mixed_patient_docs') return { key: 'mixed_patient', label: 'Mixed Patients', color: 'red' };
  if (decisionType === 'doc_type_mismatch') return { key: 'doc_type_issue', label: 'Doc Type Mismatch', color: 'amber' };
  if (decisionType === 'duplicate_files') return { key: 'duplicate_files', label: 'Duplicate Files', color: 'violet' };
  if (isMergeDecisionOrder(order))  return { key: 'merge_decision',      label: 'Merge Decision',     color: 'violet' };
  if (order.identity_mismatch)        return { key: 'identity_mismatch',  label: 'Identity Mismatch',  color: 'red'    };
  if (order.identity_incomplete)      return { key: 'identity_incomplete', label: 'ID Incomplete',      color: 'amber'  };
  if (order.identity_review_required) return { key: 'identity_review',     label: 'Identity Review',    color: 'orange' };
  if (order.awaiting_csr)             return { key: 'awaiting_csr',        label: 'Action Required',    color: 'orange' };

  // For extracted orders, check completeness before showing "Ready for Review"
  if (s === 'extracted') {
    const missingDocs = order.missing_documents || [];
    const completeness = order.completeness_score;
    
    // If missing required documents OR completeness < 90%, show INCOMPLETE
    if (missingDocs.length > 0 || (completeness != null && completeness < 90)) {
      return { key: 'incomplete', label: 'Incomplete', color: 'red' };
    }
    // Otherwise ready for review
    return { key: 'extracted', label: 'Ready for Review', color: 'amber' };
  }

  const PIPELINE = {
    pending:              { key: 'processing',  label: 'Processing',       color: 'blue'    },
    classifying:          { key: 'processing',  label: 'Processing',       color: 'blue'    },
    extracting:           { key: 'processing',  label: 'Processing',       color: 'blue'    },
    reconciling:          { key: 'processing',  label: 'Processing',       color: 'blue'    },
    awaiting_csr_decision:{ key: 'awaiting_csr',label: 'Action Required',  color: 'orange'  },
    complete:             { key: 'complete',    label: 'Complete',         color: 'emerald' },
    failed:               { key: 'failed',      label: 'Failed',           color: 'red'     },
  };
  return PIPELINE[s] || { key: s, label: s.replace(/_/g, ' '), color: 'amber' };
};

const COLOR_CLASSES = {
  blue:    { badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20',       dot: 'bg-blue-500 animate-pulse' },
  amber:   { badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20',    dot: 'bg-amber-500'              },
  orange:  { badge: 'bg-orange-500/10 text-orange-600 border-orange-500/20', dot: 'bg-orange-500'             },
  violet:  { badge: 'bg-violet-500/10 text-violet-600 border-violet-500/20', dot: 'bg-violet-500'             },
  emerald: { badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', dot: 'bg-emerald-500'         },
  red:     { badge: 'bg-red-500/10 text-red-600 border-red-500/20',          dot: 'bg-red-500'                },
};

const StatusBadge = ({ order }) => {
  const { label, color, key } = deriveDisplayStatus(order);
  const { badge, dot } = COLOR_CLASSES[color] || COLOR_CLASSES.amber;
  const isPulse = key === 'processing';

  return (
    <div className={`inline-flex max-w-full items-center gap-1.5 px-2.5 py-1 text-center rounded-full text-[9px] font-black uppercase tracking-[0.18em] leading-tight border whitespace-normal break-words ${badge}`}>
      <span className={`w-1 h-1 rounded-full ${dot} ${isPulse ? 'animate-pulse' : ''}`} />
      {label}
    </div>
  );
};

const IdentityAlerts = ({ order }) => {
  const alerts = [];

  if (order.identity_mismatch) {
    alerts.push(
      <span key="mismatch" title="Identity mismatch detected" className="text-red-500">
        <ShieldAlert className="w-3.5 h-3.5" />
      </span>
    );
  }
  if (order.identity_incomplete) {
    alerts.push(
      <span key="incomplete" title="Identity incomplete" className="text-amber-500">
        <UserX className="w-3.5 h-3.5" />
      </span>
    );
  }
  if (order.identity_review_required && !order.identity_mismatch && !order.identity_incomplete) {
    alerts.push(
      <span key="review" title="Identity review required" className="text-amber-500">
        <Users className="w-3.5 h-3.5" />
      </span>
    );
  }

  if (!alerts.length) return null;
  return <span className="inline-flex items-center gap-1">{alerts}</span>;
};

const RYGBadge = ({ verdict }) => {
  if (!verdict) return <span className="text-muted-foreground/40 font-mono">—</span>;
  const map = {
    RED:    'bg-red-500/10 text-red-600 border-red-500/20',
    YELLOW: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    GREEN:  'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  };
  return (
    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border ${map[verdict] || 'bg-muted text-muted-foreground'}`}>
      {verdict}
    </span>
  );
};

// ─── Filter helpers ───────────────────────────────────────────────────────────

const formatDate = (value, fallback = 'Date pending') => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString();
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Orders' },
  { value: 'processing', label: 'Processing' },
  { value: 'incomplete', label: 'Incomplete' },
  { value: 'extracted', label: 'Ready for Review' },
  { value: 'awaiting_csr', label: 'Action Required' },
  { value: 'duplicate_files', label: 'Duplicate Files' },
  { value: 'complete', label: 'Complete' },
  { value: 'failed', label: 'Failed' },
];

// Maps UI filter value → API params
// When API filter is 'awaiting_csr_decision' the response may include orders
// with identity_review_required / awaiting_csr flags but different status strings.
// Client-side, keep them all visible since the API filter already scoped them.
const needsCSRAction = (order) =>
  order.awaiting_csr ||
  order.identity_review_required ||
  order.identity_mismatch ||
  order.identity_incomplete ||
  order.status === 'awaiting_csr_decision';

const needsReviewAction = (order) =>
  needsCSRAction(order) || order.status === 'extracted';

const orderSortWeight = (order) => {
  if (isMergeDecisionOrder(order)) return 0;
  if (order.status === 'awaiting_csr_decision' || order.awaiting_csr) return 1;
  if (order.status === 'extracted') return 2;
  if (['pending', 'classifying', 'extracting', 'reconciling'].includes(order.status)) return 3;
  if (order.status === 'complete') return 5;
  if (order.status === 'failed') return 6;
  return 4;
};

const getSummaryCounts = (order) => {
  if (!order) return { red: 0, yellow: 0, green: 0 };
  
  // The structure can be order.summary.missing.green.count 
  // or order.summary.green.count (if summary is passed directly or from backend)
  const summary = order.summary || order; // handle both order object and summary object
  const missing = summary?.missing;
  const breakdown = order.field_breakdown;

  return {
    red: missing?.red?.count ?? summary?.red?.count ?? (typeof summary?.red === 'number' ? summary.red : null) ?? breakdown?.red?.total ?? 0,
    yellow: missing?.yellow?.count ?? summary?.yellow?.count ?? (typeof summary?.yellow === 'number' ? summary.yellow : null) ?? breakdown?.yellow?.total ?? 0,
    green: missing?.green?.count ?? summary?.green?.count ?? (typeof summary?.green === 'number' ? summary.green : null) ?? breakdown?.green?.total ?? 0,
  };
};

// ─── Component ────────────────────────────────────────────────────────────────

const IntakeOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [orderSummaries, setOrderSummaries] = useState({});
  const [summaryDialogOrder, setSummaryDialogOrder] = useState(null);
  const [isFetchingDialogSummary, setIsFetchingDialogSummary] = useState(false);
  const [dialogSummaryData, setDialogSummaryData] = useState({ text: '', counts: { red: 0, yellow: 0, green: 0 } });
  const activeFilterLabel = FILTER_OPTIONS.find((option) => option.value === statusFilter)?.label || 'All Orders';

  const fetchOrders = useCallback(async () => {
    try {
      const data = await listOrders();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load order data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchOrders();
    const interval = setInterval(() => fetchOrders(), 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleRetry = async (orderId) => {
    try {
      await submitCSRDecision(orderId, { decision: 'retry_failed' });
      toast.success('Order requeued');
      fetchOrders();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Delete this order? This cannot be undone.')) return;

    setDeletingIds(prev => new Set([...prev, orderId]));
    try {
      await deleteOrder(orderId);
      setOrders(prev => prev.filter(order => order.order_id !== orderId));
      toast.success('Order deleted');
    } catch (error) {
      toast.error(error.message || 'Failed to delete order');
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((order) =>
        (order.patient_name || '').toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((order) => deriveDisplayStatus(order).key === statusFilter);
    }

    return [...result].sort((a, b) => {
      const byWeight = orderSortWeight(a) - orderSortWeight(b);
      if (byWeight !== 0) return byWeight;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [orders, search, statusFilter]);

  // Counts for header summary
  const csrCount = useMemo(() => orders.filter(needsReviewAction).length, [orders]);

  useEffect(() => {
    if (!summaryDialogOrder) {
      setDialogSummaryData({ text: '', counts: { red: 0, yellow: 0, green: 0 } });
      return;
    }

    let cancelled = false;
    const orderId = summaryDialogOrder.order_id;

    // Set initial data from the order object
    setDialogSummaryData({
      text: summaryDialogOrder.summary_text || '',
      counts: orderSummaries[orderId] ? getSummaryCounts({ summary: orderSummaries[orderId] }) : getSummaryCounts(summaryDialogOrder)
    });

    setIsFetchingDialogSummary(true);

    // Fetch fresh data
    Promise.all([
      getOrderFields(orderId).catch(() => null),
      getOrderSummaryHistory(orderId).catch(() => null)
    ]).then(([fieldsData, historyData]) => {
      if (cancelled) return;

      const history = (historyData?.history || []).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      const latestSummaryText = history[0]?.summary_text || summaryDialogOrder.summary_text || '';
      const latestCounts = getSummaryCounts({ summary: fieldsData?.summary || summaryDialogOrder.summary });

      setDialogSummaryData({
        text: latestSummaryText,
        counts: latestCounts
      });

      // Also update the list-wide cache
      if (fieldsData?.summary) {
        setOrderSummaries(prev => ({ ...prev, [orderId]: fieldsData.summary }));
      }
    }).finally(() => {
      if (!cancelled) setIsFetchingDialogSummary(false);
    });

    return () => {
      cancelled = true;
    };
  }, [summaryDialogOrder, orderSummaries]);

  useEffect(() => {
    const ordersNeedingSummary = filteredOrders.filter(
      (order) => !orderSummaries[order.order_id] && order.summary_text != null
    );

    if (!ordersNeedingSummary.length) return;

    let cancelled = false;

    Promise.all(
      ordersNeedingSummary.map(async (order) => {
        try {
          const data = await getOrderFields(order.order_id);
          return [order.order_id, data?.summary || null];
        } catch (error) {
          console.error(`Failed to load summary for order ${order.order_id}:`, error);
          return [order.order_id, null];
        }
      })
    ).then((results) => {
      if (cancelled) return;
      setOrderSummaries((prev) => {
        const next = { ...prev };
        results.forEach(([orderId, summary]) => {
          next[orderId] = summary;
        });
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [filteredOrders, orderSummaries]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
            <ClipboardList className="w-3.5 h-3.5" />
            Intake Pipeline
          </div>
          <h1 className="text-2xl font-black tracking-tight">Orders</h1>
          <p className="text-muted-foreground text-sm">Monitor and manage all clinical intake extractions</p>
        </div>
        {csrCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 w-fit">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">{csrCount} Need{csrCount > 1 ? '' : 's'} Action</span>
          </div>
        )}
      </div>

      {/* Search */}
      <Card className="border-0 shadow-lg shadow-black/5 dark:shadow-white/5 rounded-2xl bg-card/50 backdrop-blur-sm border-white/20 dark:border-white/5 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative group flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search by patient name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl text-base transition-all"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48 h-12 rounded-xl border-2 border-border/40 bg-background/50 text-xs font-bold">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => navigate('/admin/intake/new')}
              className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-12 px-5 rounded-xl font-bold text-sm group"
            >
              <Plus className="w-4 h-4 mr-2 transition-transform group-hover:rotate-90" />
              New Order
            </Button>
          </div>
          {statusFilter !== 'all' && (
            <div className="mt-3">
              <span className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
                Filtering: {activeFilterLabel}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="border-0 shadow-lg shadow-black/5 dark:shadow-white/5 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm border-white/20 dark:border-white/5">
        <CardHeader className="p-6 border-b border-border/50">
          <CardTitle className="text-lg font-bold tracking-tight">
            Order Index
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-6 py-6 border-b border-border/40 animate-pulse flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-muted rounded-xl" />
                    <div className="space-y-2">
                      <div className="w-24 h-3 bg-muted rounded" />
                      <div className="w-32 h-2 bg-muted rounded opacity-50" />
                    </div>
                  </div>
                  <div className="w-20 h-6 bg-muted rounded-full" />
                </div>
              ))}
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="table-fixed min-w-full">
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="w-[19%] px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Patient</TableHead>
                    <TableHead className="w-[13%] px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Disease</TableHead>
                    <TableHead className="w-[18%] px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</TableHead>
                    <TableHead className="w-[7%] px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">RYG</TableHead>
                    <TableHead className="w-[23%] px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Summary</TableHead>
                    <TableHead className="w-[10%] px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Created</TableHead>
                    <TableHead className="w-[10%] px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const reviewNeeded = needsReviewAction(order);
                    const displayStatus = deriveDisplayStatus(order);
                    const mergeDecision = displayStatus.key === 'merge_decision';
                    const canDeleteOrder = order.status !== 'complete';
                    const isDeleting = deletingIds.has(order.order_id);
                    const summaryCounts = getSummaryCounts(orderSummaries[order.order_id] || order);
                    return (
                      <TableRow
                        key={order.order_id}
                        className={`group border-border/40 transition-colors ${
                          reviewNeeded
                            ? mergeDecision
                              ? 'bg-violet-500/[0.03] hover:bg-violet-500/[0.06] border-l-2 border-l-violet-500/40'
                              : displayStatus.key === 'extracted'
                                ? 'bg-amber-500/[0.03] hover:bg-amber-500/[0.06] border-l-2 border-l-amber-500/40'
                                : 'bg-orange-500/[0.03] hover:bg-orange-500/[0.06] border-l-2 border-l-orange-500/40'
                            : 'hover:bg-primary/[0.02]'
                        }`}
                      >
                        <TableCell className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <IdentityAlerts order={order} />
                            <span className="font-bold text-sm">{order.patient_name || 'Unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-5">
                          <span className="text-xs font-bold uppercase tracking-tight">
                            {(order.disease || '').charAt(0).toUpperCase() + (order.disease || '').slice(1)}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-5">
                          <div className="flex flex-col gap-1.5">
                            <StatusBadge order={order} />
                            {order.identity_decision_status && (
                              <span className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest">
                                {order.identity_decision_status.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-5">
                          <RYGBadge verdict={order.ryg_verdict} />
                        </TableCell>
                        <TableCell className="px-6 py-5">
                          <div className="relative w-full max-w-[240px]">
                            {order.summary_text == null ? (
                              <p className="text-xs italic text-muted-foreground/50">Processing...</p>
                            ) : (
                              <div className="rounded-xl border border-border/40 bg-muted/[0.03] p-3">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                    Summary
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    title="View summary"
                                    onClick={() => setSummaryDialogOrder(order)}
                                    className="h-6 w-6 shrink-0 rounded-full border border-primary/20 bg-white text-primary shadow-sm hover:bg-primary hover:text-white"
                                  >
                                    <Info className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                                <div className="min-w-0 space-y-2">
                                  <div className="inline-flex flex-wrap items-center gap-2">
                                    <span className="inline-flex rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-mono text-emerald-700">
                                      G: {summaryCounts.green}
                                    </span>
                                    <span className="inline-flex rounded bg-amber-50 px-2 py-0.5 text-[10px] font-mono text-amber-700">
                                      Y: {summaryCounts.yellow}
                                    </span>
                                    <span className="inline-flex rounded bg-red-50 px-2 py-0.5 text-[10px] font-mono text-red-700">
                                      R: {summaryCounts.red}
                                    </span>
                                  </div>
                                  {order.missing_documents?.length > 0 && (
                                    <div>
                                      <span className="block max-w-full truncate rounded bg-red-50 px-2 py-0.5 text-[10px] text-red-600">
                                        Missing: {order.missing_documents.join(', ')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-5 text-[11px] font-bold text-muted-foreground">
                          {formatDate(order.created_at)}
                        </TableCell>
                        <TableCell className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {order.status === 'failed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-lg px-3 text-xs border-primary/20 text-primary hover:bg-primary/5 font-bold"
                                onClick={() => handleRetry(order.order_id)}
                              >
                                <RefreshCw className="w-3 h-3 mr-1.5" />
                                Retry
                              </Button>
                            )}
                            {displayStatus.key === 'duplicate_files' && (
                              <Button
                                asChild
                                size="sm"
                                className="h-8 rounded-lg bg-orange-500 px-3 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-500/90"
                              >
                                <Link to={`/admin/intake/orders/${order.order_id}`}>
                                  Review Duplicates
                                </Link>
                              </Button>
                            )}
                            {canDeleteOrder && (
                              <Button
                                variant="outline"
                                size="icon"
                                title="Delete order"
                                className="h-9 w-9 rounded-lg border-red-500/20 text-red-600 hover:bg-red-500/5"
                                onClick={() => handleDeleteOrder(order.order_id)}
                                disabled={isDeleting}
                              >
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </Button>
                            )}
                            <Button
                              asChild
                              variant={reviewNeeded ? 'default' : 'ghost'}
                              size="icon"
                              title={reviewNeeded ? 'Review order' : 'View order'}
                              className={`h-9 w-9 rounded-lg ${
                                reviewNeeded
                                  ? mergeDecision
                                    ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-md shadow-violet-500/20'
                                    : displayStatus.key === 'extracted'
                                      ? 'bg-amber-500 text-white hover:bg-amber-500/90 shadow-md shadow-amber-500/20'
                                      : 'bg-orange-500 text-white hover:bg-orange-500/90 shadow-md shadow-orange-500/20'
                                  : 'hover:bg-primary/10 hover:text-primary'
                              }`}
                            >
                              <Link to={`/admin/intake/orders/${order.order_id}`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-24 text-center">
              <Card className="max-w-md mx-auto border-none bg-transparent shadow-none">
                <CardContent className="space-y-6">
                  <div className="w-20 h-20 bg-muted rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                    <ClipboardList className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black tracking-tight">
                      {statusFilter !== 'all'
                        ? `No orders found with status: ${activeFilterLabel}`
                        : search
                          ? 'No orders match your filters'
                          : 'No orders yet'}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                      {search || statusFilter !== 'all'
                        ? 'Try adjusting your search query or status filter.'
                        : 'Create your first clinical order to get started with automated extraction.'}
                    </p>
                  </div>
                  {!(search || statusFilter !== 'all') && (
                    <Button
                      onClick={() => navigate('/admin/intake/new')}
                      className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Order
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(summaryDialogOrder)} onOpenChange={(open) => !open && setSummaryDialogOrder(null)}>
        <DialogContent className="sm:max-w-xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-left text-lg font-black tracking-tight flex items-center justify-between">
              <span>Summary{summaryDialogOrder?.patient_name ? ` for ${summaryDialogOrder.patient_name}` : ''}</span>
              {isFetchingDialogSummary && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {summaryDialogOrder && (
              <div className="inline-flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-mono text-emerald-700">
                  G: {dialogSummaryData.counts.green}
                </span>
                <span className="inline-flex rounded bg-amber-50 px-2 py-0.5 text-[10px] font-mono text-amber-700">
                  Y: {dialogSummaryData.counts.yellow}
                </span>
                <span className="inline-flex rounded bg-red-50 px-2 py-0.5 text-[10px] font-mono text-red-700">
                  R: {dialogSummaryData.counts.red}
                </span>
              </div>
            )}
            <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-border/40 bg-muted/[0.03] p-4">
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                {dialogSummaryData.text || (isFetchingDialogSummary ? 'Fetching latest summary...' : 'Summary unavailable.')}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntakeOrders;
