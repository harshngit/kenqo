import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import {
  ClipboardList,
  Search,
  Plus,
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  UserX,
  Users,
  Trash2,
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

import { deleteOrder, listOrders, submitCSRDecision } from '../../../services/intakeApi';

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
  if (isMergeDecisionOrder(order))  return { key: 'merge_decision',      label: 'Merge Decision',     color: 'violet' };
  if (order.identity_mismatch)        return { key: 'identity_mismatch',  label: 'Identity Mismatch',  color: 'red'    };
  if (order.identity_incomplete)      return { key: 'identity_incomplete', label: 'ID Incomplete',      color: 'amber'  };
  if (order.identity_review_required) return { key: 'identity_review',     label: 'Identity Review',    color: 'orange' };
  if (order.awaiting_csr)             return { key: 'awaiting_csr',        label: 'Action Required',    color: 'orange' };

  const PIPELINE = {
    pending:              { key: 'processing',  label: 'Processing',       color: 'blue'    },
    classifying:          { key: 'processing',  label: 'Processing',       color: 'blue'    },
    extracting:           { key: 'processing',  label: 'Processing',       color: 'blue'    },
    reconciling:          { key: 'processing',  label: 'Processing',       color: 'blue'    },
    extracted:            { key: 'extracted',   label: 'Ready for Review', color: 'amber'   },
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
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${badge}`}>
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
  { value: 'all',            label: 'All Statuses' },
  { value: 'pending',        label: 'Pending' },
  { value: 'extracting',     label: 'Extracting' },
  { value: 'needs_review',   label: 'Needs Review' },
  { value: 'action_required', label: 'Action Required' },
  { value: 'complete',       label: 'Complete' },
  { value: 'failed',         label: 'Failed' },
];

// Maps UI filter value → API params
const filterToParams = (filter) => {
  switch (filter) {
    case 'pending':      return { status: 'pending' };
    case 'extracting':   return { status: 'extracting' };
    case 'needs_review': return { status: 'extracted' };
    case 'action_required': return { status: 'awaiting_csr_decision' };
    case 'complete':     return { status: 'complete' };
    case 'failed':       return { status: 'failed' };
    default:             return {};
  }
};

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

// ─── Component ────────────────────────────────────────────────────────────────

const IntakeOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingIds, setDeletingIds] = useState(new Set());

  const fetchOrders = useCallback(async (filter = 'all') => {
    try {
      const params = filterToParams(filter);
      const data = await listOrders(params);
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
    fetchOrders(statusFilter);
    const interval = setInterval(() => fetchOrders(statusFilter), 15000);
    return () => clearInterval(interval);
  }, [fetchOrders, statusFilter]);

  const handleRetry = async (orderId) => {
    try {
      await submitCSRDecision(orderId, { decision: 'retry_failed' });
      toast.success('Order requeued');
      fetchOrders(statusFilter);
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
    const q = search.toLowerCase();
    const visible = search.trim()
      ? orders.filter(o =>
          (o.patient_name || '').toLowerCase().includes(q)
        )
      : orders;
    return [...visible].sort((a, b) => {
      const byWeight = orderSortWeight(a) - orderSortWeight(b);
      if (byWeight !== 0) return byWeight;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [orders, search]);

  // Counts for header summary
  const csrCount = useMemo(() => orders.filter(needsReviewAction).length, [orders]);

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
        <div className="flex items-center gap-3">
          {csrCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">{csrCount} Need{csrCount > 1 ? '' : 's'} Action</span>
            </div>
          )}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-10 rounded-xl bg-card border-border/50 text-xs font-bold">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {FILTER_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => navigate('/admin/intake/new')}
            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-10 px-5 rounded-xl font-bold text-sm group"
          >
            <Plus className="w-4 h-4 mr-2 transition-transform group-hover:rotate-90" />
            New Order
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-lg shadow-black/5 dark:shadow-white/5 rounded-2xl bg-card/50 backdrop-blur-sm border-white/20 dark:border-white/5 overflow-hidden">
        <CardContent className="p-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by patient name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl text-base transition-all"
            />
          </div>
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
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Patient</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Disease</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">RYG</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Created</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const reviewNeeded = needsReviewAction(order);
                    const displayStatus = deriveDisplayStatus(order);
                    const mergeDecision = displayStatus.key === 'merge_decision';
                    const canDeleteOrder = order.status !== 'complete';
                    const isDeleting = deletingIds.has(order.order_id);
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
                            {canDeleteOrder && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-lg px-3 text-xs border-red-500/20 text-red-600 hover:bg-red-500/5 font-bold"
                                onClick={() => handleDeleteOrder(order.order_id)}
                                disabled={isDeleting}
                              >
                                {isDeleting ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Trash2 className="w-3 h-3 mr-1.5" />}
                                Delete
                              </Button>
                            )}
                            <Button
                              asChild
                              variant={reviewNeeded ? 'default' : 'ghost'}
                              size="sm"
                              className={`rounded-lg h-8 px-3 text-xs font-bold ${
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
                                {reviewNeeded ? 'Review' : 'View'}
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
                      {search || statusFilter !== 'all' ? 'No orders match your filters' : 'No orders yet'}
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
    </div>
  );
};

export default IntakeOrders;
