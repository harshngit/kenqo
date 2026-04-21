import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Copy,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  File,
  Trash2,
  Edit2,
  Loader2,
  ShieldAlert,
  Users,
  UserPlus,
  Shield,
  ChevronRight,
  MessageSquare,
  ExternalLink,
  Upload,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '../../../components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';

import {
  getOrderStatus,
  getOrderFields,
  getOrderDocuments,
  addOrderDocuments,
  approveOrder,
  deleteOrder,
  submitCSRDecision,
  editField,
  resolveConflict,
  deleteDocument,
  listPatients,
  getPatientOrders,
  verifyEligibility,
  viewDocument,
} from '../../../services/intakeApi';

// ─── REUSABLE COMPONENTS ──────────────────────────────────────────────────────

const OrderStatusBadge = ({ status }) => {
  const s = (status || 'pending').toLowerCase();
  const map = {
    pending: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    classifying: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    extracting: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    reconciling: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    extracted: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    awaiting_csr_decision: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    complete: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    failed: 'bg-red-500/10 text-red-600 border-red-500/20',
  };
  const isProcessing = ['pending', 'classifying', 'extracting', 'reconciling'].includes(s);
  const labels = {
    pending: 'Processing',
    classifying: 'Processing',
    extracting: 'Processing',
    reconciling: 'Processing',
    extracted: 'Ready for Review',
    awaiting_csr_decision: 'Action Required',
    complete: 'Complete',
    failed: 'Failed',
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${map[s] || map.pending}`}>
      {isProcessing ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : s === 'complete' ? (
        <CheckCircle2 className="w-3.5 h-3.5" />
      ) : s === 'awaiting_csr_decision' || s === 'extracted' ? (
        <AlertCircle className="w-3.5 h-3.5" />
      ) : (
        <X className="w-3.5 h-3.5" />
      )}
      {labels[s] || s.replace(/_/g, ' ')}
    </div>
  );
};

const RYGBadge = ({ verdict }) => {
  if (!verdict) return <span className="text-muted-foreground/40 font-mono">—</span>;
  const map = {
    RED: 'bg-red-500 text-white',
    YELLOW: 'bg-amber-500 text-white',
    GREEN: 'bg-emerald-500 text-white',
  };
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded tracking-widest ${map[verdict] || 'bg-muted text-muted-foreground'}`}>
      {verdict}
    </span>
  );
};

const DocumentStatusBadge = ({ status }) => {
  const s = (status || 'pending').toLowerCase();
  const map = {
    pending: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    classifying: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    extracting: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    complete: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    extracted: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    failed: 'bg-red-500/10 text-red-600 border-red-500/20',
  };
  return (
    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border ${map[s] || map.pending}`}>
      {s.replace(/_/g, ' ')}
    </span>
  );
};

const ConfidenceDot = ({ confidence }) => {
  const score = parseFloat(confidence || 0);
  let color = 'text-red-500';
  if (score >= 0.85) color = 'text-emerald-500';
  else if (score >= 0.60) color = 'text-amber-500';
  return (
    <span className={`text-[12px] leading-none ${color}`}>●</span>
  );
};

const MetaLabel = ({ children }) => (
  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 block mb-0.5">
    {children}
  </span>
);

// Inline tooltip that appears above on hover
const HoverTip = ({ icon, label, content, colorClass = 'text-muted-foreground/30 hover:text-muted-foreground/70' }) => (
  <div className="relative group/tip">
    <button className={`transition-colors ${colorClass}`} type="button" title={label}>
      {icon}
    </button>
    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-popover border border-border/40 rounded-xl px-3 py-2.5 text-[11px] text-muted-foreground leading-relaxed shadow-xl opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 whitespace-normal">
      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 block mb-1">{label}</span>
      {content}
    </div>
  </div>
);

// ─── SEMANTIC TAB DEFINITIONS ─────────────────────────────────────────────────

const SEMANTIC_TABS = [
  { id: 'patient',      label: 'Patient',             agents: ['agent_1'] },
  { id: 'insurance',    label: 'Insurance & Billing',  agents: ['agent_2'] },
  { id: 'provider',     label: 'Provider',             agents: ['agent_3'] },
  { id: 'prescription', label: 'Prescription',         agents: ['agent_6', 'agent_7'] },
  { id: 'clinical',     label: 'Clinical Notes',       agents: ['agent_4'] },
  { id: 'dme',          label: 'DME Items',            agents: ['agent_5'] },
];

const DOC_TYPES = [
  'Auto-detect',
  'Rx',
  'Clinical Notes',
  'Insurance Card',
  'Order Form',
  'LMN',
  'Measurement Form'
];

const TERMINAL_STATUSES = ['extracted', 'complete', 'failed', 'awaiting_csr_decision'];

const shouldHaltPolling = (data) =>
  TERMINAL_STATUSES.includes(data?.status) || data?.awaiting_csr === true;

const shouldLoadFields = (data) =>
  data?.status === 'extracted' ||
  data?.status === 'complete' ||
  data?.status === 'awaiting_csr_decision' ||
  data?.awaiting_csr === true;

const getIdentityReviewPayload = (order) =>
  order?.identity_review_payload || order?.identityReviewPayload || {};

const getDecisionType = (order) =>
  order?.decision_type || getIdentityReviewPayload(order)?.decision_type;

const getMergeDecisionData = (order) => {
  const payload = getIdentityReviewPayload(order);
  const existingOrder = order?.existing_order || payload?.existing_order || (
    order?.incomplete_prior_order_id || order?.prior_order_id
      ? {
          order_id: order.incomplete_prior_order_id || order.prior_order_id,
          created_at: order.prior_order_created_at,
          doc_types: order.prior_order_doc_types,
          total_fields: order.prior_order_total_fields,
          extracted_fields: order.prior_order_extracted_fields,
        }
      : null
  );
  return {
    existingOrder,
    currentDocs: order?.current_docs || payload?.current_docs || [],
  };
};

const isMergeOrNewDecision = (order) => {
  if (order?.status !== 'awaiting_csr_decision') return false;
  if (getDecisionType(order) === 'merge_or_new') return true;
  const { existingOrder } = getMergeDecisionData(order);
  return order?.awaiting_csr === true &&
    order?.identity_decision_status === 'pending' &&
    !!existingOrder?.order_id;
};

const formatDate = (value, fallback = 'Date pending') => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString();
};

const formatDateTime = (value, fallback = 'Date pending') => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString();
};

const formatList = (items, fallback = 'None listed') => {
  if (!Array.isArray(items) || items.length === 0) return fallback;
  return items.filter(Boolean).join(', ') || fallback;
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

const getConflictCount = (order) =>
  Number(order?.extraction?.conflict_count || order?.conflict_count || 0);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const pollingRef = useRef(null);

  const [order, setOrder] = useState(null);
  const [fields, setFields] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedManualPatientId, setSelectedManualPatientId] = useState('');
  const [patientOrders, setPatientOrders] = useState([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isLoadingPatientOrders, setIsLoadingPatientOrders] = useState(false);

  // Document accordion & viewer state
  const [openDocs, setOpenDocs] = useState({});
  const [viewingDoc, setViewingDoc] = useState(null);
  const [viewerDoc, setViewerDoc] = useState(null);

  // Modal states
  const [editModal, setEditModal] = useState({ open: false, fieldName: '', currentValue: '', newValue: '', reason: '' });
  const [conflictModal, setConflictModal] = useState({ open: false, field: null, choice: '', manualValue: '', reason: '' });
  const [uploadModal, setUploadModal] = useState({ open: false, files: [] });
  const [approveModal, setApproveModal] = useState({ open: false, mode: 'confirm', missingFields: [], conflictCount: 0 });

  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isSubmittingConflict, setIsSubmittingConflict] = useState(false);
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [isAddingDocuments, setIsAddingDocuments] = useState(false);
  const [isApprovingOrder, setIsApprovingOrder] = useState(false);
  const [isVerifyingEligibility, setIsVerifyingEligibility] = useState(false);
  const [docTypeChoice, setDocTypeChoice] = useState('accept_classifier');

  const fetchFields = useCallback(async () => {
    setIsLoadingFields(true);
    try {
      const data = await getOrderFields(orderId);
      setFields(data);
    } catch (e) {
      console.error('Failed to load fields:', e);
    } finally {
      setIsLoadingFields(false);
    }
  }, [orderId]);

  const fetchDocuments = useCallback(async () => {
    setIsLoadingDocuments(true);
    try {
      const data = await getOrderDocuments(orderId);
      setDocuments(Array.isArray(data) ? data : data.documents || []);
    } catch (e) {
      console.error('Failed to load documents:', e);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [orderId]);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getOrderStatus(orderId);
      setOrder(data);
      if (shouldHaltPolling(data)) {
        if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
        if (shouldLoadFields(data)) {
          setIsLoadingFields(true);
          getOrderFields(orderId).then(r => setFields(r)).catch(() => {}).finally(() => setIsLoadingFields(false));
        }
        fetchDocuments();
      }
    } catch (e) {
      console.error('Polling failed:', e);
    } finally {
      setIsLoadingStatus(false);
    }
  }, [orderId, fetchDocuments]);

  const restartPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    fetchStatus();
    pollingRef.current = setInterval(fetchStatus, 3000);
  }, [fetchStatus]);

  useEffect(() => {
    fetchStatus();
    fetchDocuments();
    pollingRef.current = setInterval(fetchStatus, 3000);
    setIsLoadingPatients(true);
    listPatients()
      .then(data => setPatients(data.patients || []))
      .catch(() => {})
      .finally(() => setIsLoadingPatients(false));
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [orderId, fetchStatus, fetchDocuments]);

  useEffect(() => {
    if (!order?.patient_id || !order?.awaiting_csr || order?.identity_decision_status !== 'pending') {
      setPatientOrders([]);
      return;
    }

    setIsLoadingPatientOrders(true);
    getPatientOrders(order.patient_id)
      .then(data => setPatientOrders(data.orders || data || []))
      .catch((e) => {
        console.error('Failed to load patient orders:', e);
        toast.error('Could not load existing patient orders');
      })
      .finally(() => setIsLoadingPatientOrders(false));
  }, [order?.patient_id, order?.awaiting_csr, order?.identity_decision_status]);

  const handleCopy = (text) => { navigator.clipboard.writeText(text); toast.success('Copied to clipboard'); };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await deleteDocument(orderId, docId);
      toast.success('Document deleted');
      fetchDocuments();
      fetchStatus();
    } catch (e) { toast.error(e.message); }
  };

  const handleDeleteOrder = async () => {
    if (!window.confirm('Delete this order? This cannot be undone.')) return;
    try {
      await deleteOrder(orderId);
      toast.success('Order deleted');
      navigate('/admin/intake');
    } catch (e) {
      toast.error(e.message || 'Failed to delete order');
    }
  };

  const handleViewDoc = async (doc) => {
    const docId = doc.doc_id || doc.id || doc.document_id;
    setViewingDoc(docId);
    try {
      const data = await viewDocument(orderId, docId);
      setViewerDoc({
        ...doc,
        doc_url: data.url,
      });
    } catch (e) {
      toast.error(e.message || 'Could not open document');
    } finally {
      setViewingDoc(null);
    }
  };

  const handleCSRDecision = async (payload) => {
    setIsSubmittingDecision(true);
    try {
      const response = await submitCSRDecision(orderId, payload);
      toast.success('Decision submitted');
      if (payload.decision === 'merge_into_existing') {
        toast.success('Order merged into existing order');
        navigate('/admin/intake');
      } else if (payload.decision === 'cancel_mismatch' || payload.decision === 'split_order') {
        navigate('/admin/intake');
      } else if (payload.decision === 'split_and_create') {
        toast.success('Documents split — both patients now processing separately');
        navigate('/admin/intake');
      } else if (payload.decision === 'partial_merge') {
        toast.success('Docs merged — both orders now processing');
        navigate('/admin/intake');
      } else if (payload.decision === 'combined_resolve') {
        toast.success('All issues resolved — order(s) now processing');
        navigate('/admin/intake');
      } else if (payload.decision === 'continue_existing_order') {
        toast.success('Documents merged into existing orders');
        navigate('/admin/intake');
      } else if ([
        'resume',
        'fresh',
        'confirm_identity',
        'proceed_mismatch',
        'proceed_doc_type',
        'override_doc_type',
        'continue_existing_patient',
        'continue_new_patient',
        'start_new_order',
      ].includes(payload.decision)) {
        restartPolling();
      } else {
        navigate('/admin/intake');
      }
    } catch (e) { toast.error(e.message); }
    finally { setIsSubmittingDecision(false); }
  };

  const handleMergeDecision = async (decision, targetOrderId) => {
    setIsSubmittingDecision(true);
    try {
      const payload = decision === 'merge'
        ? { decision: 'merge_into_existing', prior_order_id: targetOrderId }
        : { decision: 'start_new_order' };
      await submitCSRDecision(orderId, payload);
      toast.success('Decision submitted');
      if (payload.decision === 'merge_into_existing') {
        navigate('/admin/intake');
      } else {
        fetchStatus();
        fetchDocuments();
      }
    } catch (e) {
      toast.error(e.message || 'Failed to submit decision');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleUploadFileChange = (e) => {
    const incoming = Array.from(e.target.files || []);
    const nonPdfs = incoming.filter(f => f.type !== 'application/pdf');
    if (nonPdfs.length > 0) {
      toast.error('Only PDF files are allowed');
      e.target.value = '';
      return;
    }

    const existingNames = new Set(uploadModal.files.map(f => f.file?.name).filter(Boolean));
    const unique = incoming.filter(f => !existingNames.has(f.name));
    if (unique.length < incoming.length) {
      toast.warning(`${incoming.length - unique.length} duplicate file${incoming.length - unique.length > 1 ? 's' : ''} skipped`);
    }
    setUploadModal(prev => ({
      ...prev,
      files: [...prev.files, ...unique.map(file => ({ file, docType: 'Auto-detect' }))]
    }));
    e.target.value = '';
  };

  const removeUploadFile = (index) => {
    setUploadModal(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
  };

  const updateUploadDocType = (index, docType) => {
    setUploadModal(prev => ({
      ...prev,
      files: prev.files.map((item, i) => i === index ? { ...item, docType } : item)
    }));
  };

  const submitAddedDocuments = async () => {
    const validFiles = uploadModal.files.filter(f => f.file);
    if (validFiles.length === 0) {
      toast.error('Please upload at least one document');
      return;
    }

    setIsAddingDocuments(true);
    try {
      const formData = new FormData();
      formData.append('doc_types', JSON.stringify(validFiles.map(f => f.docType === 'Auto-detect' ? 'auto' : f.docType)));
      validFiles.forEach(f => formData.append('files', f.file));
      await addOrderDocuments(orderId, formData);
      toast.success('Documents added — extraction restarting');
      setUploadModal({ open: false, files: [] });
      setFields(null);
      setOrder(prev => prev ? ({ ...prev, status: 'pending' }) : { status: 'pending' });
      fetchDocuments();
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(fetchStatus, 3000);
    } catch (e) {
      toast.error(e.message || 'Failed to add documents');
    } finally {
      setIsAddingDocuments(false);
    }
  };

  const openApproveModal = () => {
    const conflictCount = getConflictCount(order);
    if (conflictCount > 0) {
      setApproveModal({ open: true, mode: 'conflicts', conflictCount, missingFields: [] });
      return;
    }
    setApproveModal({ open: true, mode: 'confirm', conflictCount: 0, missingFields: [] });
  };

  const submitApproval = async (overrideMissing = false) => {
    setIsApprovingOrder(true);
    try {
      const result = await approveOrder(orderId, { overrideMissing });
      toast.success('Order approved');
      setApproveModal({ open: false, mode: 'confirm', conflictCount: 0, missingFields: [] });
      setOrder(prev => ({ ...(prev || {}), ...(result || {}), status: 'complete' }));
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      fetchStatus();
    } catch (e) {
      if (e.status === 400 && e.missingFields?.length) {
        setApproveModal({ open: true, mode: 'missing', conflictCount: 0, missingFields: e.missingFields });
      } else {
        toast.error(e.message || 'Approval failed');
      }
    } finally {
      setIsApprovingOrder(false);
    }
  };

  const handleEditSave = async () => {
    if (!editModal.newValue || !editModal.reason) { toast.error('Value and reason are required'); return; }
    setIsSubmittingEdit(true);
    try {
      await editField(orderId, editModal.fieldName, editModal.newValue, editModal.reason);
      toast.success('Field updated');
      setEditModal({ open: false, fieldName: '', currentValue: '', newValue: '', reason: '' });
      fetchFields();
    } catch (e) { toast.error(e.message); }
    finally { setIsSubmittingEdit(false); }
  };

  const handleResolveConflict = async () => {
    const { field, choice, manualValue, reason } = conflictModal;
    if ((!choice && !manualValue) || !reason) { toast.error('Resolution and reason are required'); return; }
    let resolutionType = 'manual_entry';
    let chosenValue = manualValue;
    if (choice === 'opt1') { resolutionType = 'picked_option_1'; chosenValue = field.conflict_details.option_1.value; }
    else if (choice === 'opt2') { resolutionType = 'picked_option_2'; chosenValue = field.conflict_details.option_2.value; }
    setIsSubmittingConflict(true);
    try {
      await resolveConflict(orderId, field.name, chosenValue, reason, resolutionType);
      toast.success('Conflict resolved');
      setConflictModal({ open: false, field: null, choice: '', manualValue: '', reason: '' });
      fetchFields();
    } catch (e) { toast.error(e.message); }
    finally { setIsSubmittingConflict(false); }
  };

  const handleVerifyEligibility = async () => {
    setIsVerifyingEligibility(true);
    try {
      await verifyEligibility(orderId);
      toast.success('Eligibility verification initiated');
    } catch (e) { toast.error(e.message || 'Verification failed'); }
    finally { setIsVerifyingEligibility(false); }
  };

  const patientName = useMemo(() => {
    if (!order?.patient_id) return 'Auto-identify from documents';
    const p = patients.find(p => p.patient_id === order.patient_id);
    return p ? `${p.first_name} ${p.last_name}` : 'Patient selected';
  }, [order, patients]);

  const mergeDecisionExistingOrder = useMemo(() => {
    const payloadOrder = getMergeDecisionData(order).existingOrder;
    if (payloadOrder?.order_id) return payloadOrder;

    const candidates = (patientOrders || []).filter(o => o?.order_id && o.order_id !== orderId);
    return candidates.find(o => o.status === 'extracted') ||
      candidates.find(o => o.status !== 'complete' && o.status !== 'failed') ||
      candidates[0] ||
      null;
  }, [order, patientOrders, orderId]);

  const isAwaitingCSRDecision = order?.awaiting_csr || order?.status === 'awaiting_csr_decision';
  const canAddDocuments = ['extracted', 'awaiting_csr_decision'].includes(order?.status);
  const canApproveOrder = order?.status === 'extracted';
  const canDeleteOrder = !!order && order.status !== 'complete';
  const isPendingMergeDecision = order?.awaiting_csr === true && order?.identity_decision_status === 'pending';

  const groupedFields = useMemo(() => {
    if (!fields?.fields) return {};
    const groups = {};
    Object.entries(fields.fields).forEach(([fieldName, wrapper]) => {
      const agentKey = (wrapper.source_agents?.[0] || 'other');
      if (!groups[agentKey]) groups[agentKey] = [];
      groups[agentKey].push({ fieldName, ...wrapper });
    });
    return groups;
  }, [fields]);

  const activeSemanticTabs = useMemo(() =>
    SEMANTIC_TABS.filter(tab => tab.agents.some(key => groupedFields[key]?.length > 0)),
    [groupedFields]
  );

  const getTabCounts = (tab) => {
    const allFields = tab.agents.flatMap(key => groupedFields[key] || []);
    let red = 0, yellow = 0;
    allFields.forEach(f => {
      if (f.status === 'conflict' || !f.value) { red++; return; }
      const conf = parseFloat(f.confidence || 0);
      if (conf < 0.60) red++;
      else if (conf < 0.85) yellow++;
    });
    return { red, yellow };
  };

  const getFieldBorderColor = (field) => {
    if (field.status === 'conflict' || !field.value) return 'border-l-red-500';
    const conf = parseFloat(field.confidence || 0);
    if (conf >= 0.85) return 'border-l-emerald-500';
    if (conf >= 0.60) return 'border-l-amber-500';
    return 'border-l-red-500';
  };

  const formatFieldName = (name) => name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const formatFieldValue = (wrapper) => {
    if (wrapper.not_found || wrapper.value === null || wrapper.value === undefined) return null;
    if (typeof wrapper.value === 'boolean') return wrapper.value ? 'Yes' : 'No';
    if (Array.isArray(wrapper.value)) return wrapper.value.join(', ');
    return String(wrapper.value);
  };

  const getFieldSourceLabel = (field) => {
    const src = field?.source;
    if (!src) return null;
    const docName = src.document_name || src.filename || src.document || src.doc_name || null;
    const page = src.page_number || src.page || null;
    if (!docName) return null;
    return page ? `${docName} · Page ${page}` : docName;
  };

  const sortFields = (fieldList) => [...fieldList].sort((a, b) => {
    if (a.status === 'conflict' && b.status !== 'conflict') return -1;
    if (b.status === 'conflict' && a.status !== 'conflict') return 1;
    if (!a.value && b.value) return 1;
    if (a.value && !b.value) return -1;
    return (a.confidence || 0) - (b.confidence || 0);
  });

  // ─── DOCUMENTS ACCORDION ──────────────────────────────────────────────────────

  const renderDocumentsAccordion = () => {
    const docs = documents || [];
    if (isLoadingDocuments && !docs.length) {
      return (
        <div className="border border-border/20 rounded-2xl bg-card px-5 py-4 flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest">Loading documents...</span>
        </div>
      );
    }
    if (!docs.length) return null;

    return (
      <div className="border border-border/20 rounded-2xl bg-card overflow-hidden">
        {/* Strip header */}
        <div className="px-5 py-2.5 flex items-center gap-2.5 bg-muted/10 border-b border-border/10">
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest">Documents</span>
          <span className="text-[9px] font-mono text-muted-foreground/40 bg-muted/40 px-1.5 py-0.5 rounded-full">{docs.length}</span>
        </div>

        {/* Accordion rows */}
        <div className="divide-y divide-border/10">
          {docs.map((doc) => {
            const docId = doc.doc_id || doc.id || doc.document_id;
            const isOpen = !!openDocs[docId];
            const conf = Math.round((doc.classification_confidence || doc.confidence || 0) * 100);
            const confColor = conf >= 85 ? 'text-emerald-500' : conf >= 60 ? 'text-amber-500' : 'text-red-500';

            return (
              <div key={docId || doc.filename}>
                {/* Collapsed row */}
                <button
                  type="button"
                  className="w-full px-5 py-3 flex items-center gap-3 hover:bg-muted/10 transition-colors text-left"
                  onClick={() => setOpenDocs(prev => ({ ...prev, [docId]: !prev[docId] }))}
                >
                  <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground/40 transition-transform duration-150 shrink-0 ${isOpen ? 'rotate-90' : ''}`} />
                  <span className="text-xs font-bold truncate flex-1 min-w-0" title={doc.filename}>
                    {doc.filename}
                  </span>
                  <span className="text-[9px] font-black bg-muted px-1.5 py-0.5 rounded text-muted-foreground/60 uppercase shrink-0">
                    {doc.doc_type || 'unclassified'}
                  </span>
                  <DocumentStatusBadge status={doc.status} />
                  <span className={`text-[10px] font-black font-mono shrink-0 ${confColor}`}>{conf}%</span>
                  {(doc.status === 'failed' || doc.doc_type === 'unassigned_doc_type') && (
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  )}
                </button>

                {/* Expanded panel */}
                {isOpen && (
                  <div className="px-10 py-3 bg-muted/[0.03] border-t border-border/10 space-y-3 animate-in slide-in-from-top-1 duration-150">
                    {doc.classification_reasoning && (
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{doc.classification_reasoning}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 rounded-lg px-3 text-[10px] font-black uppercase tracking-widest gap-1.5 border-primary/20 text-primary hover:bg-primary/5"
                        onClick={() => handleViewDoc(doc)}
                        disabled={viewingDoc === docId}
                      >
                        {viewingDoc === docId
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <ExternalLink className="w-3 h-3" />
                        }
                        View
                      </Button>
                      {canAddDocuments && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 rounded-lg px-3 text-[10px] font-black uppercase tracking-widest gap-1.5 text-red-500 hover:bg-red-500/10"
                          onClick={() => handleDeleteDoc(docId)}
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── IDENTITY CANDIDATE MATCHES ──────────────────────────────────────────────

  const renderIdentityCandidates = () => {
    const candidates = order?.identity_candidate_matches || [];
    const validCandidates = candidates.filter(c => c && c.patient);
    const selectedManualPatient = patients.find(p => p.patient_id === selectedManualPatientId);

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm font-semibold text-amber-700">
            {validCandidates.length} candidate patient match{validCandidates.length > 1 ? 'es' : ''} found — select how to proceed
          </p>
        </div>

        {order?.identity_suspicious && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-xs font-bold text-red-700">This order has been flagged as suspicious. Review carefully before proceeding.</p>
          </div>
        )}

        <div className="space-y-3">
          {validCandidates.map((c, i) => {
            const patient = c.patient;
            if (!patient) return null;
            return (
              <div key={patient.patient_id || i} className="rounded-2xl border-2 border-border/40 bg-card p-5 space-y-4 hover:border-primary/20 transition-colors">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                  <div><MetaLabel>Name</MetaLabel><span className="font-bold">{[patient.first_name, patient.last_name].filter(Boolean).join(' ') || '—'}</span></div>
                  <div><MetaLabel>Date of Birth</MetaLabel><span className="font-bold">{patient.dob || '—'}</span></div>
                  {patient.member_id && <div><MetaLabel>Member ID</MetaLabel><span className="font-bold font-mono">{patient.member_id}</span></div>}
                  {patient.medicare_id && <div><MetaLabel>Medicare ID</MetaLabel><span className="font-bold font-mono">{patient.medicare_id}</span></div>}
                  {patient.payer_id && <div><MetaLabel>Payer ID</MetaLabel><span className="font-bold font-mono">{patient.payer_id}</span></div>}
                  <div><MetaLabel>Match Tier</MetaLabel><span className="font-bold">{c.tier ?? '—'}</span></div>
                  <div><MetaLabel>Confidence</MetaLabel><span className="font-bold">{c.confidence != null ? `${Math.round(c.confidence * 100)}%` : '—'}</span></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.has_incomplete_prior_order && <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-700 border border-amber-500/20 px-2.5 py-1 rounded-lg">Incomplete prior order</span>}
                  {c.has_completed_prior_order && <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-2.5 py-1 rounded-lg">Completed prior order</span>}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {c.has_incomplete_prior_order && c.incomplete_prior_order_id && (
                    <Button size="sm" disabled={isSubmittingDecision} onClick={() => handleCSRDecision({ decision: 'continue_existing_order', prior_order_id: c.incomplete_prior_order_id, patient_id: patient.patient_id })} className="h-9 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest">
                      {isSubmittingDecision ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Continue Existing Order'}
                    </Button>
                  )}
                  {!c.has_incomplete_prior_order && c.has_completed_prior_order && (
                    <Button size="sm" disabled={isSubmittingDecision} onClick={() => handleCSRDecision({ decision: 'start_new_order', patient_id: patient.patient_id })} className="h-9 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest">
                      {isSubmittingDecision ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Start New Order'}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" disabled={isSubmittingDecision} onClick={() => handleCSRDecision({ decision: 'continue_existing_patient', patient_id: patient.patient_id })} className="h-9 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/5">
                    {isSubmittingDecision ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Continue as This Patient'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border-2 border-border/40 bg-card p-5 space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-black tracking-tight">Select manually</h4>
            <p className="text-xs font-medium text-muted-foreground">
              Choose from this tenant&apos;s patient list.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
            <Select
              value={selectedManualPatientId}
              onValueChange={setSelectedManualPatientId}
              disabled={isLoadingPatients || patients.length === 0}
            >
              <SelectTrigger className="h-11 rounded-xl border-2 border-border/40 bg-card text-xs font-bold">
                <SelectValue placeholder={isLoadingPatients ? 'Loading patients...' : 'Select a patient'} />
              </SelectTrigger>
              <SelectContent>
                {patients.map(patient => {
                  const name = [patient.first_name, patient.last_name].filter(Boolean).join(' ') || 'Unnamed patient';
                  const detail = [patient.dob, patient.member_id || patient.medicare_id].filter(Boolean).join(' - ');
                  return (
                    <SelectItem key={patient.patient_id} value={patient.patient_id}>
                      {detail ? `${name} - ${detail}` : name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              disabled={isSubmittingDecision || !selectedManualPatientId}
              onClick={() => handleCSRDecision({ decision: 'continue_existing_patient', patient_id: selectedManualPatientId })}
              className="h-11 rounded-xl px-5 text-[10px] font-black uppercase tracking-widest"
            >
              {isSubmittingDecision ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Use Selected Patient'}
            </Button>
          </div>
          {selectedManualPatient && (
            <p className="text-[11px] font-medium text-muted-foreground">
              Selected {[selectedManualPatient.first_name, selectedManualPatient.last_name].filter(Boolean).join(' ') || 'patient'}
            </p>
          )}
        </div>

        <div className="pt-1 border-t border-border/20">
          <Button variant="outline" disabled={isSubmittingDecision} onClick={() => handleCSRDecision({ decision: 'continue_new_patient' })} className="h-10 rounded-xl px-5 text-[10px] font-black uppercase tracking-widest gap-2">
            <UserPlus className="w-3.5 h-3.5" />
            {isSubmittingDecision ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Continue as New Patient'}
          </Button>
        </div>
      </div>
    );
  };

  // ─── CSR DECISION BODY ────────────────────────────────────────────────────────

  const renderMergeDecisionCard = () => {
    const existingOrder = mergeDecisionExistingOrder;
    const targetOrderId = existingOrder?.order_id;

    return (
      <Card className="rounded-2xl border-2 border-violet-500/25 bg-violet-500/[0.04] shadow-xl shadow-violet-500/10">
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1 text-violet-700">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Merge Decision</span>
            </div>
            <h4 className="text-lg font-black tracking-tight">Existing order found for this patient</h4>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              A document was uploaded for a patient who already has an existing order. Please decide how to proceed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-card/80 border border-border/30 p-4">
              <MetaLabel>Existing Order</MetaLabel>
              <p className="font-black font-mono break-all">
                {isLoadingPatientOrders && !targetOrderId ? 'Loading...' : targetOrderId ? 'Available' : 'Not found'}
              </p>
            </div>
            <div className="rounded-xl bg-card/80 border border-border/30 p-4">
              <MetaLabel>Existing Order Status</MetaLabel>
              <p className="font-black uppercase tracking-widest text-violet-700">
                {existingOrder?.status || 'Unknown'}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-card/80 border border-border/30 p-4 text-xs">
            <MetaLabel>Current Patient</MetaLabel>
            <p className="font-bold">{patientName}</p>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <Button
              onClick={() => handleMergeDecision('merge', targetOrderId)}
              disabled={isSubmittingDecision || isLoadingPatientOrders || !targetOrderId}
              className="h-10 rounded-xl bg-violet-600 px-5 font-black uppercase tracking-widest text-[10px] text-white shadow-xl shadow-violet-500/20 hover:bg-violet-700"
            >
              {isSubmittingDecision ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Merge into existing order'}
            </Button>
            <Button
              onClick={() => handleMergeDecision('new')}
              disabled={isSubmittingDecision}
              variant="outline"
              className="h-10 rounded-xl border-2 border-violet-500/20 px-5 text-violet-700 font-black uppercase tracking-widest text-[10px] hover:bg-violet-500/5"
            >
              {isSubmittingDecision ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create as new order'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCSRBody = () => {
    if (order?.decision_type === 'combined_review') {
      const conflict = order?.identity_mismatch_details || {};
      const groups = conflict.all_groups || [];
      const groupA = groups[0] || {
        name: conflict.name_a || 'Unknown',
        doc_ids: conflict.group_a_doc_ids || [conflict.doc_a_id].filter(Boolean),
        filenames: conflict.group_a_filenames || [conflict.doc_a].filter(Boolean),
        existing_patient_id: conflict.group_a_existing_patient_id || null,
        has_incomplete_order: conflict.group_a_has_incomplete_order || false,
        incomplete_order_id: conflict.group_a_incomplete_order_id || null,
      };
      const groupB = groups[1] || {
        name: conflict.name_b || 'Unknown',
        doc_ids: conflict.group_b_doc_ids || [conflict.doc_b_id].filter(Boolean),
        filenames: conflict.group_b_filenames || [conflict.doc_b].filter(Boolean),
        existing_patient_id: conflict.group_b_existing_patient_id || null,
        has_incomplete_order: conflict.group_b_has_incomplete_order || false,
        incomplete_order_id: conflict.group_b_incomplete_order_id || null,
      };
      const buildSplitPayload = (group) => {
        const docIds = (group?.doc_ids || []).join(',');
        const existingId = group?.existing_patient_id;
        return existingId ? `${docIds}|${existingId}` : docIds;
      };
      const groupBSplitPayload = buildSplitPayload(groupB);
      const payload = order?.identity_review_payload || {};
      const mismatch = payload.mismatch || order?.mismatch || {};
      const errMsg = order?.error_message || '';
      const csr_type = mismatch.csr_type || errMsg.match(/selected '([^']+)'/)?.[1] || 'your selection';
      const detected_type = mismatch.detected_type || errMsg.match(/appears to be '([^']+)'/)?.[1] || 'unknown';
      const confidence = mismatch.confidence ? `${Math.round(mismatch.confidence * 100)}%` : '';
      const filename = mismatch.filename || errMsg.match(/'([^']+\.pdf)'/)?.[1] || '';

      const PatientGroupCard = ({ group }) => {
        const isExisting = !!group.existing_patient_id;
        const hasIncomplete = group.has_incomplete_order && group.incomplete_order_id;

        return (
          <div className="rounded-xl bg-card/70 border border-red-500/10 p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-red-700 text-sm">{group.name}</p>
              {isExisting && (
                <span className="text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-700 border border-blue-500/20 px-2 py-0.5 rounded-lg">
                  Existing Patient
                </span>
              )}
              {hasIncomplete && (
                <span className="text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-700 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                  Incomplete Order
                </span>
              )}
            </div>
            <div className="space-y-0.5">
              {(group.filenames || []).map((f, i) => (
                <p key={i} className="text-[11px] text-muted-foreground font-mono truncate">{f}</p>
              ))}
            </div>
          </div>
        );
      };

      return (
        <div className="space-y-5">
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-5 space-y-4">
            <h4 className="text-sm font-black tracking-tight text-red-700">Mixed patient documents detected</h4>
            <p className="text-sm font-medium text-red-700/80 leading-relaxed">
              Documents in this order belong to different patients.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <PatientGroupCard group={groupA} />
              <PatientGroupCard group={groupB} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-5 space-y-4">
              <h4 className="text-sm font-black tracking-tight text-amber-700">Classifier detected different types</h4>
              <p className="text-sm font-medium text-amber-700/80 leading-relaxed">
                You selected <span className="font-black">{csr_type}</span> but <span className="font-black">{filename}</span> appears to be <span className="font-black">{detected_type}</span> {confidence && `(${confidence} confidence)`}.
              </p>
              <p className="text-sm font-medium text-amber-700/80">
                Classifier detected different types — accept or keep your selection?
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => setDocTypeChoice('accept_classifier')}
                disabled={isSubmittingDecision}
                variant={docTypeChoice === 'accept_classifier' ? 'default' : 'outline'}
                className="h-10 rounded-xl px-6 font-black uppercase tracking-widest text-[10px]"
              >
                Accept Classifier
              </Button>
              <Button
                type="button"
                onClick={() => setDocTypeChoice('keep_csr')}
                disabled={isSubmittingDecision}
                variant={docTypeChoice === 'keep_csr' ? 'default' : 'outline'}
                className="h-10 rounded-xl px-6 font-black uppercase tracking-widest text-[10px]"
              >
                Keep My Selection
              </Button>
            </div>
          </div>

          <Button
            onClick={() => handleCSRDecision({
              decision: 'combined_resolve',
              prior_order_id: docTypeChoice,
              patient_id: groupBSplitPayload || null,
              remaining_patient_id: groupA.existing_patient_id || null,
              remaining_prior_order_id: groupA.incomplete_order_id || null,
            })}
            disabled={isSubmittingDecision}
            className="h-10 rounded-xl px-6 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20"
          >
            {isSubmittingDecision ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Resolve All & Continue'}
          </Button>
        </div>
      );
    }

    // Mixed patient documents — show before any other decision
    if (order?.decision_type === 'mixed_patient_docs' || order?.error_message?.startsWith('Mixed patient documents')) {
      const conflict = order?.identity_mismatch_details || {};
      const groups = conflict.all_groups || [];

      // Fall back to legacy shape if all_groups not present (old backend)
      const groupA = groups[0] || {
        name: conflict.name_a || 'Unknown',
        doc_ids: conflict.group_a_doc_ids || [conflict.doc_a_id].filter(Boolean),
        filenames: conflict.group_a_filenames || [conflict.doc_a].filter(Boolean),
        existing_patient: conflict.group_a_existing_patient || null,
        existing_patient_id: conflict.group_a_existing_patient_id || null,
        has_incomplete_order: conflict.group_a_has_incomplete_order || false,
        incomplete_order_id: conflict.group_a_incomplete_order_id || null,
      };
      const groupB = groups[1] || {
        name: conflict.name_b || 'Unknown',
        doc_ids: conflict.group_b_doc_ids || [conflict.doc_b_id].filter(Boolean),
        filenames: conflict.group_b_filenames || [conflict.doc_b].filter(Boolean),
        existing_patient: conflict.group_b_existing_patient || null,
        existing_patient_id: conflict.group_b_existing_patient_id || null,
        has_incomplete_order: conflict.group_b_has_incomplete_order || false,
        incomplete_order_id: conflict.group_b_incomplete_order_id || null,
      };

      // Build patient_id payload for split_and_create
      // Format: "docid1,docid2[|existing_patient_uuid]"
      const buildSplitPayload = (group) => {
        const docIds = (group?.doc_ids || []).join(',');
        const existingId = group?.existing_patient_id;
        return existingId ? `${docIds}|${existingId}` : docIds;
      };

      const groupBSplitPayload = buildSplitPayload(groupB);

      // Determine the dominant action
      const bothHaveExisting = groupA.existing_patient_id && groupB.existing_patient_id;
      const bothHaveIncomplete = groupA.has_incomplete_order && groupB.has_incomplete_order;
      const aHasIncomplete = groupA.has_incomplete_order && groupA.incomplete_order_id;

      // The single atomic merge payload - merges both groups into their respective existing orders
      const mergeBothPayload = {
        decision: 'continue_existing_order',
        prior_order_id: groupA.incomplete_order_id,
        patient_id: `${(groupA.doc_ids || []).join(',')}|${groupA.existing_patient_id}`,
        remaining_patient_id: groupB.existing_patient_id || null,
        remaining_prior_order_id: groupB.incomplete_order_id || null,
      };

      // Split + merge payload - split B into their existing order, keep A on current order
      const splitAndMergePayload = {
        decision: 'partial_merge',
        prior_order_id: groupB.incomplete_order_id,
        patient_id: (groupB.doc_ids || []).join(','),
        remaining_patient_id: groupA.existing_patient_id || null,
        remaining_prior_order_id: groupA.incomplete_order_id || null,
      };

      return (
        <div className="space-y-5">
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-5 space-y-4">
            <h4 className="text-sm font-black tracking-tight text-red-700">Mixed patient documents detected</h4>
            <p className="text-sm font-medium text-red-700/80 leading-relaxed">
              Documents in this order belong to different patients.
            </p>
            {/* Show both patient groups and their docs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[groupA, groupB].map((group, i) => (
                <div key={i} className="rounded-xl bg-card/70 border border-red-500/10 p-4 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-red-700 text-sm">{group.name}</p>
                    {group.existing_patient_id && (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-700 border border-blue-500/20 px-2 py-0.5 rounded-lg">Existing Patient</span>
                    )}
                    {group.has_incomplete_order && (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-700 border border-amber-500/20 px-2 py-0.5 rounded-lg">Incomplete Order</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {(group.filenames || []).map((f, j) => (
                      <p key={j} className="text-[11px] text-muted-foreground font-mono truncate">{f}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* PRIMARY: Both exist with incomplete orders -> one button merges both */}
            {bothHaveExisting && bothHaveIncomplete && (
              <Button
                onClick={() => handleCSRDecision(mergeBothPayload)}
                disabled={isSubmittingDecision}
                className="h-10 rounded-xl px-6 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20"
              >
                {isSubmittingDecision ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Merge Each Into Their Existing Order'}
              </Button>
            )}

            {/* Both exist but only A has incomplete order */}
            {bothHaveExisting && aHasIncomplete && !bothHaveIncomplete && (
              <Button
                onClick={() => handleCSRDecision({
                  decision: 'continue_existing_order',
                  prior_order_id: groupA.incomplete_order_id,
                  patient_id: `${(groupA.doc_ids || []).join(',')}|${groupA.existing_patient_id}`,
                  remaining_patient_id: groupB.existing_patient_id || null,
                  remaining_prior_order_id: null,
                })}
                disabled={isSubmittingDecision}
                className="h-10 rounded-xl px-6 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20"
              >
                {isSubmittingDecision ? <Loader2 className="w-4 h-4 animate-spin" /> : `Merge ${groupA.name} -> Existing Order & New Order for ${groupB.name}`}
              </Button>
            )}

            {/* B exists, merge B's docs into their existing order */}
            {groupB.existing_patient_id && groupB.has_incomplete_order && !bothHaveIncomplete && (
              <Button
                onClick={() => handleCSRDecision(splitAndMergePayload)}
                disabled={isSubmittingDecision}
                variant="outline"
                className="h-10 rounded-xl border-2 border-blue-500/20 px-6 text-blue-700 font-black uppercase tracking-widest text-[10px] hover:bg-blue-500/5"
              >
                {isSubmittingDecision ? <Loader2 className="w-4 h-4 animate-spin" /> : `Merge ${groupB.name} -> Existing Order`}
              </Button>
            )}

            {/* Fallback: split B into new/linked order */}
            {(!groupB.has_incomplete_order || !groupB.existing_patient_id) && (
              <Button
                onClick={() => handleCSRDecision({
                  decision: 'split_and_create',
                  patient_id: buildSplitPayload(groupB),
                  remaining_patient_id: groupA?.existing_patient_id || null,
                  remaining_prior_order_id: groupA?.incomplete_order_id || null,
                })}
                disabled={isSubmittingDecision || !groupBSplitPayload}
                className="h-10 rounded-xl px-6 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20"
              >
                {isSubmittingDecision ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  groupB.existing_patient_id
                    ? `Split & Link to ${groupB.name}'s Record`
                    : `Start New Order for ${groupB.name}`
                )}
              </Button>
            )}

            {/* Always: cancel */}
            <Button
              onClick={() => handleCSRDecision({ decision: 'split_order' })}
              disabled={isSubmittingDecision}
              variant="outline"
              className="h-10 rounded-xl border-2 border-red-500/20 px-6 text-red-600 font-black uppercase tracking-widest text-[10px] hover:bg-red-500/5"
            >
              {isSubmittingDecision ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel & Re-upload Separately'}
            </Button>
          </div>
        </div>
      );
    }

    if (order?.decision_type === 'doc_type_mismatch' || order?.error_message?.startsWith('Document type mismatch')) {
      const payload = order?.identity_review_payload || {};
      const mismatch = payload.mismatch || order?.mismatch || {};
      const errMsg = order?.error_message || '';
      const csr_type = mismatch.csr_type || errMsg.match(/selected '([^']+)'/)?.[1] || 'your selection';
      const detected_type = mismatch.detected_type || errMsg.match(/appears to be '([^']+)'/)?.[1] || 'unknown';
      const confidence = mismatch.confidence ? `${Math.round(mismatch.confidence * 100)}%` : '';
      const filename = mismatch.filename || errMsg.match(/'([^']+\.pdf)'/)?.[1] || '';
      return (
        <div className="space-y-5">
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-5 space-y-4">
            <h4 className="text-sm font-black tracking-tight text-amber-700">Document type mismatch</h4>
            <p className="text-sm font-medium text-amber-700/80 leading-relaxed">
              You selected <span className="font-black">{csr_type}</span> but <span className="font-black">{filename}</span> appears to be <span className="font-black">{detected_type}</span> {confidence && `(${confidence} confidence)`}.
            </p>
            <p className="text-sm font-medium text-amber-700/80">How would you like to proceed?</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleCSRDecision({ decision: 'proceed_doc_type', prior_order_id: mismatch.doc_id, patient_id: detected_type })}
              disabled={isSubmittingDecision}
              className="h-10 rounded-xl px-6 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20"
            >
              {isSubmittingDecision ? <Loader2 className="w-4 h-4 animate-spin" /> : `Use ${detected_type}`}
            </Button>
            <Button
              onClick={() => handleCSRDecision({ decision: 'override_doc_type' })}
              disabled={isSubmittingDecision}
              variant="outline"
              className="h-10 rounded-xl border-2 border-amber-500/20 px-6 text-amber-700 font-black uppercase tracking-widest text-[10px] hover:bg-amber-500/5"
            >
              {isSubmittingDecision ? <Loader2 className="w-4 h-4 animate-spin" /> : `Keep ${csr_type}`}
            </Button>
          </div>
        </div>
      );
    }

    if (isPendingMergeDecision) {
      return renderMergeDecisionCard();
    }

    if (isMergeOrNewDecision(order)) {
      const { existingOrder, currentDocs } = getMergeDecisionData(order);
      return (
        <div className="space-y-5">
          <div className="rounded-2xl bg-violet-500/10 border border-violet-500/20 p-5 space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-black tracking-tight text-violet-700">Patient already has an open order</h4>
              <p className="text-sm font-medium text-violet-700/80 leading-relaxed">
                Patient {patientName} already has an incomplete order from {formatDate(existingOrder?.created_at, 'an unknown date')}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-card/70 border border-violet-500/10 p-4">
                <MetaLabel>Existing order contains</MetaLabel>
                <p className="font-bold leading-relaxed">{formatList(existingOrder?.doc_types)}</p>
              </div>
              <div className="rounded-xl bg-card/70 border border-violet-500/10 p-4">
                <MetaLabel>Fields extracted</MetaLabel>
                <p className="font-bold">
                  {existingOrder?.extracted_fields ?? 0} / {existingOrder?.total_fields ?? 0}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-card/70 border border-violet-500/10 p-4 text-xs">
              <MetaLabel>New document(s)</MetaLabel>
              <p className="font-bold leading-relaxed">{formatList(currentDocs)}</p>
            </div>

            <p className="text-sm font-medium text-violet-700/80 leading-relaxed">
              Would you like to add the new document(s) to the existing order, or start a completely new order?
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleCSRDecision({ decision: 'merge_into_existing', prior_order_id: existingOrder?.order_id })}
              disabled={isSubmittingDecision || !existingOrder?.order_id}
              className="h-10 rounded-xl bg-violet-600 px-6 font-black uppercase tracking-widest text-[10px] text-white shadow-xl shadow-violet-500/20 hover:bg-violet-700"
            >
              {isSubmittingDecision ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to Existing Order'}
            </Button>
            <Button
              onClick={() => handleCSRDecision({ decision: 'fresh' })}
              disabled={isSubmittingDecision}
              variant="outline"
              className="h-10 rounded-xl border-2 border-violet-500/20 px-6 text-violet-700 font-black uppercase tracking-widest text-[10px] hover:bg-violet-500/5"
            >
              {isSubmittingDecision ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start New Order'}
            </Button>
            <Button
              onClick={() => handleCSRDecision({ decision: 'split_order' })}
              disabled={isSubmittingDecision}
              variant="outline"
              className="h-10 rounded-xl border-2 border-red-500/20 px-6 text-red-600 font-black uppercase tracking-widest text-[10px] hover:bg-red-500/5"
            >
              {isSubmittingDecision ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel & Delete'}
            </Button>
          </div>
        </div>
      );
    }

    const hasCandidates = (order?.identity_candidate_matches || []).length > 0;
    return (
      <div className="space-y-5">
        {(order?.identity_review_required || hasCandidates) && renderIdentityCandidates()}

        {!hasCandidates && order?.patient_match_tier === 3 && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-5 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-amber-700">Patient matched by name and date of birth</h4>
              <p className="text-sm font-medium text-amber-700/80 leading-relaxed">This patient was automatically matched. Please verify the identity before proceeding.</p>
              <table className="w-full text-[10px]">
                <thead><tr className="text-muted-foreground/60 border-b border-amber-500/10"><th className="text-left py-1 font-black">NAME</th><th className="text-left py-1 font-black">DOB</th></tr></thead>
                <tbody><tr><td className="py-2 font-bold">{patientName}</td><td className="py-2 font-bold">{order.patient_dob || '-'}</td></tr></tbody>
              </table>
            </div>
            <Button disabled={isSubmittingDecision} onClick={() => handleCSRDecision({ decision: 'confirm_identity' })} className="h-10 rounded-xl px-6 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20">
              {isSubmittingDecision ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm and Continue'}
            </Button>
          </div>
        )}

        {!hasCandidates && order?.patient_match_tier === 4 && (
          <div className="space-y-4">
            <p className="text-sm font-medium leading-relaxed">Possible patient match found <span className="font-black text-amber-700">(Tier 4 — partial match)</span>. Please confirm this is the correct patient before extraction proceeds.</p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => handleCSRDecision({ decision: 'confirm_identity' })} disabled={isSubmittingDecision} className="h-10 rounded-xl px-6 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20">Confirm Patient</Button>
              <Button onClick={() => handleCSRDecision({ decision: 'cancel_mismatch' })} disabled={isSubmittingDecision} variant="outline" className="h-10 rounded-xl border-2 border-red-500/20 px-6 text-red-600 font-black uppercase tracking-widest text-[10px] hover:bg-red-500/5">Cancel Order</Button>
            </div>
          </div>
        )}

        {!hasCandidates && order?.identity_mismatch && (
          <div className="space-y-4">
            <p className="text-sm font-medium leading-relaxed">Document identity <span className="font-black text-red-600">does not match</span> selected patient.</p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => handleCSRDecision({ decision: 'proceed_mismatch' })} disabled={isSubmittingDecision} className="h-10 rounded-xl bg-amber-500 px-6 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-amber-500/20 hover:bg-amber-500/90">Proceed Anyway</Button>
              <Button onClick={() => handleCSRDecision({ decision: 'cancel_mismatch' })} disabled={isSubmittingDecision} variant="outline" className="h-10 rounded-xl border-2 border-red-500/20 px-6 text-red-600 font-black uppercase tracking-widest text-[10px] hover:bg-red-500/5">Cancel & Re-upload</Button>
            </div>
          </div>
        )}

        {!hasCandidates && !order?.patient_match_tier && !order?.identity_mismatch && !order?.identity_review_required && (
          <div className="space-y-4">
            <p className="text-sm font-medium leading-relaxed">An <span className="font-black text-amber-700">incomplete order exists</span> for this patient.</p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => handleCSRDecision({ decision: 'resume', prior_order_id: order.prior_order_id })} disabled={isSubmittingDecision} className="h-10 rounded-xl px-6 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20">Resume Existing Order</Button>
              <Button onClick={() => handleCSRDecision({ decision: 'fresh' })} disabled={isSubmittingDecision} variant="outline" className="h-10 rounded-xl border-2 border-primary/20 px-6 text-primary font-black uppercase tracking-widest text-[10px] hover:bg-primary/5">Start Fresh</Button>
            </div>
          </div>
        )}

        {isAwaitingCSRDecision && !hasCandidates && !order?.patient_match_tier && !order?.identity_mismatch && order?.identity_review_required && (
          <div className="space-y-4">
            <p className="text-sm font-medium leading-relaxed">
              This order is waiting for a CSR decision, but no patient candidates were returned. You can start it as a fresh order and resume extraction.
            </p>
            <Button onClick={() => handleCSRDecision({ decision: 'fresh' })} disabled={isSubmittingDecision} className="h-10 rounded-xl px-6 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20">
              {isSubmittingDecision ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start New Order'}
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderCSRPanel = () => (
    <Card className="rounded-lg border-amber-500/40 bg-amber-500/[0.03]">
      <CardContent className="space-y-6 p-6">
        <div className="flex items-start gap-3 border-b border-amber-500/10 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-500 text-white">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-amber-700">Action Required</h3>
            <p className="text-xs uppercase tracking-wide text-amber-700/70">CSR intervention required to proceed</p>
          </div>
        </div>
        {renderCSRBody()}
      </CardContent>
    </Card>
  );

  // ─── FIELD TABS ───────────────────────────────────────────────────────────────

  const renderFieldTabs = () => {
    if (isLoadingFields) {
      return (
        <div className="py-20 flex flex-col items-center gap-4 opacity-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest">Loading extracted fields...</p>
        </div>
      );
    }
    if (activeSemanticTabs.length === 0) {
      return (
        <div className="py-20 flex flex-col items-center gap-4 opacity-40">
          <FileText className="w-10 h-10 text-muted-foreground" />
          <p className="text-[10px] font-black uppercase tracking-widest">No fields extracted yet</p>
        </div>
      );
    }

    return (
      <Tabs defaultValue={activeSemanticTabs[0].id}>
        <TabsList className="h-auto flex-wrap gap-1 bg-muted/30 p-1.5 rounded-2xl">
          {activeSemanticTabs.map(tab => {
            const { red, yellow } = getTabCounts(tab);
            const attention = red + yellow;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest px-4 py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                {tab.label}
                {attention > 0 && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none ${red > 0 ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
                    {attention}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {activeSemanticTabs.map(tab => {
          const allFields = tab.agents.flatMap(key => groupedFields[key] || []);
          const sorted = sortFields(allFields);

          return (
            <TabsContent key={tab.id} value={tab.id}>
              <div className="mt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sorted.map(field => {
                    const displayValue = formatFieldValue(field);
                    const source = getFieldSourceLabel(field);
                    const borderColor = getFieldBorderColor(field);
                    const conf = Math.round((field.confidence || 0) * 100);

                    return (
                      <div
                        key={field.fieldName}
                        className={`border-l-4 ${borderColor} bg-card rounded-r-xl px-4 py-3 space-y-2 border border-border/20`}
                      >
                        {/* Label row */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 truncate">
                              {formatFieldName(field.fieldName)}
                            </label>
                            {field.status === 'conflict' && (
                              <span className="text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded tracking-widest uppercase shrink-0">Conflict</span>
                            )}
                            {field.needs_csr_review && (
                              <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" title="Needs CSR Review" />
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {field.status === 'conflict' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[9px] font-black text-red-600 uppercase tracking-widest hover:bg-red-500/10"
                                onClick={() => setConflictModal({
                                  open: true,
                                  field: { name: field.fieldName, conflict_details: { option_1: field.conflict_values?.[0], option_2: field.conflict_values?.[1] } },
                                  choice: '', manualValue: '', reason: '',
                                })}
                              >
                                Resolve
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-6 h-6 rounded-md hover:bg-muted/60"
                              onClick={() => setEditModal({ open: true, fieldName: field.fieldName, currentValue: field.value, newValue: String(field.value || ''), reason: '' })}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Value box */}
                        <div className={`rounded-lg border px-3 py-2 text-sm font-medium min-h-[36px] leading-snug ${
                          !displayValue
                            ? 'bg-red-500/5 border-red-500/20 text-muted-foreground/40 italic'
                            : 'bg-muted/20 border-border/30 text-foreground'
                        }`}>
                          {displayValue || 'Not found'}
                        </div>

                        {/* Footer: hover-tooltip icons */}
                        <div className="flex items-center gap-3 pt-0.5">
                          {/* Confidence */}
                          <HoverTip
                            icon={<span className="flex items-center gap-0.5"><ConfidenceDot confidence={field.confidence} /><span className="text-[10px] font-mono ml-0.5">{conf}%</span></span>}
                            label="Confidence"
                            content={`${conf}% extraction confidence`}
                          />

                          {/* Reasoning */}
                          {field.reasoning && (
                            <HoverTip
                              icon={<MessageSquare className="w-3 h-3" />}
                              label="Reasoning"
                              content={field.reasoning}
                            />
                          )}

                          {/* Source */}
                          {source && (
                            <HoverTip
                              icon={<FileText className="w-3 h-3" />}
                              label="Source"
                              content={source}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Eligibility Verification — Insurance & Billing tab only */}
                {tab.id === 'insurance' && (
                  <div className="border border-border/30 rounded-2xl p-6 bg-card space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-black tracking-tight">Eligibility Verification</h4>
                        <p className="text-xs text-muted-foreground">Verify DME coverage for lymphedema supplies</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleVerifyEligibility}
                      disabled={isVerifyingEligibility}
                      className="h-10 rounded-xl px-6 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/15"
                    >
                      {isVerifyingEligibility
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />Verifying...</>
                        : 'Verify Eligibility'}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    );
  };

  const renderFieldSummaryPills = () => (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-[10px] font-black bg-muted px-3 py-1.5 rounded-full uppercase tracking-widest text-muted-foreground/60">
        Total: {fields?.summary?.total || 0}
      </span>
      <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-full uppercase tracking-widest">
        ✓ {fields?.summary?.green || 0}
      </span>
      <span className="text-[10px] font-black bg-amber-500/10 text-amber-600 px-3 py-1.5 rounded-full uppercase tracking-widest">
        ~ {fields?.summary?.yellow || 0}
      </span>
      <span className="text-[10px] font-black bg-red-500/10 text-red-600 px-3 py-1.5 rounded-full uppercase tracking-widest">
        ! {fields?.summary?.red || 0}
      </span>
      {(fields?.summary?.conflicts || 0) > 0 && (
        <span className="text-[10px] font-black bg-red-500 text-white px-3 py-1.5 rounded-full uppercase tracking-widest animate-pulse">
          ⚠ {fields.summary.conflicts} Conflicts
        </span>
      )}
    </div>
  );

  // ─── IDENTITY ALERT CARDS ─────────────────────────────────────────────────────

  const renderIdentityAlerts = () => (
    <>
      {order?.identity_incomplete && (
        <Card className="border-2 border-amber-500/20 bg-amber-500/5 rounded-[2rem] p-6 animate-in zoom-in-95">
          <div className="flex gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-widest text-amber-700">Patient identity not found</h4>
              <p className="text-xs font-medium text-amber-700/80 leading-relaxed">Add patient details to complete this record.</p>
            </div>
          </div>
        </Card>
      )}
      {order?.identity_mismatch && (
        <Card className="border-2 border-red-500/20 bg-red-500/5 rounded-[2rem] p-6 animate-in zoom-in-95">
          <div className="flex gap-4">
            <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
            <div className="space-y-3 flex-1">
              <h4 className="text-xs font-black uppercase tracking-widest text-red-700">Identity mismatch detected</h4>
              <table className="w-full text-[10px]">
                <thead><tr className="text-muted-foreground/60 border-b border-red-500/10"><th className="text-left py-1 font-black">FIELD</th><th className="text-left py-1 font-black">EXPECTED</th><th className="text-left py-1 font-black">EXTRACTED</th></tr></thead>
                <tbody className="divide-y divide-red-500/10">
                  {Object.entries(order.identity_mismatch_details || {}).map(([f, d]) => (
                    <tr key={f}><td className="py-2 font-black uppercase tracking-tighter">{f}</td><td className="py-2 font-bold">{d.expected || '—'}</td><td className="py-2 font-bold text-red-600">{d.extracted || '—'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </>
  );

  // ─── LAYOUT ──────────────────────────────────────────────────────────────────

  const renderOrderActions = () => {
    if (!canAddDocuments && !canApproveOrder && !canDeleteOrder) return null;
    return (
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {canAddDocuments && (
          <Button
            variant="outline"
            onClick={() => setUploadModal({ open: true, files: [] })}
            className="h-9 rounded-lg px-4 text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/5"
          >
            <Upload className="w-3.5 h-3.5 mr-2" />
            Add Documents
          </Button>
        )}
        {canApproveOrder && (
          <Button
            onClick={openApproveModal}
            className="h-9 rounded-lg px-4 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
            Approve Order
          </Button>
        )}
        {canDeleteOrder && (
          <Button
            variant="outline"
            onClick={handleDeleteOrder}
            className="h-9 rounded-lg px-4 text-[10px] font-black uppercase tracking-widest border-red-500/20 text-red-600 hover:bg-red-500/5"
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Delete Order
          </Button>
        )}
      </div>
    );
  };

  const isCompactLayout = order?.status === 'extracted' ||
    order?.status === 'complete' ||
    (order?.status === 'awaiting_csr_decision' && fields) ||
    (order?.awaiting_csr && fields);

  if (isLoadingStatus && !order) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Initializing Order Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20">
      {/* ── PAGE HEADER ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/intake')} className="rounded-xl border border-border/40">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black tracking-tight">Order Detail</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Manage extraction & clinical reconciliation</p>
          </div>
        </div>
        {!isCompactLayout && renderOrderActions()}
      </div>

      {isCompactLayout ? (
        <>
          {/* ── COMPACT TOP BAR ── */}
          <div className="border border-border/20 rounded-2xl px-6 py-3 flex items-center justify-between bg-card/50 flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <OrderStatusBadge status={order?.status} />
              <span className="bg-primary/10 text-primary text-[10px] font-black uppercase px-2 py-0.5 rounded">{order?.disease}</span>
              <span className="text-[10px] text-muted-foreground/60">{formatDate(order?.created_at)}</span>
              <span className="text-xs font-bold text-muted-foreground/80">{patientName}</span>
              {order?.ryg_verdict && <RYGBadge verdict={order.ryg_verdict} />}
            </div>
            {(fields || canAddDocuments || canApproveOrder || canDeleteOrder) && (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {fields && renderFieldSummaryPills()}
                {renderOrderActions()}
              </div>
            )}
          </div>

          {/* ── DOCUMENTS ACCORDION (full width) ── */}
          {renderDocumentsAccordion()}

          {/* ── IDENTITY ALERTS (full width, if present) ── */}
          {(order?.identity_incomplete || order?.identity_mismatch) && (
            <div className="space-y-3">{renderIdentityAlerts()}</div>
          )}

          {/* ── CSR PANEL (full width, if awaiting) ── */}
          {isAwaitingCSRDecision && (!isMergeOrNewDecision(order) || isPendingMergeDecision) && (
            <Card className="border-2 border-amber-500 bg-amber-500/[0.03] rounded-2xl overflow-hidden shadow-xl shadow-amber-500/10 animate-in slide-in-from-top-2 duration-300">
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3 border-b border-amber-500/10 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-amber-700">Action Required</h3>
                    <p className="text-[10px] font-medium text-amber-700/60 uppercase tracking-widest">CSR Intervention Required to Proceed</p>
                  </div>
                </div>
                {renderCSRBody()}
              </div>
            </Card>
          )}

          {/* ── FIELD TABS (full width) ── */}
          <div className="space-y-4 animate-in fade-in duration-500">
            {renderFieldTabs()}
          </div>
        </>
      ) : (
        <>
          {/* ── DOCUMENTS ACCORDION (full layout) ── */}
          {renderDocumentsAccordion()}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN */}
            <div className="space-y-8">
              <Card className="border-none shadow-xl shadow-black/[0.03] rounded-[2.5rem] bg-card overflow-hidden">
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Order</p>
                        <span className="text-sm font-black">Clinical intake</span>
                      </div>
                      <OrderStatusBadge status={order?.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Disease</p>
                        <span className="text-xs font-black uppercase text-primary bg-primary/5 px-2 py-0.5 rounded">{order?.disease}</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Created</p>
                        <span className="text-[10px] font-bold text-muted-foreground">{formatDateTime(order?.created_at)}</span>
                      </div>
                    </div>
                    <div className="space-y-1 pt-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Patient</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate pr-4">{patientName}</span>
                      </div>
                    </div>
                    {order?.ryg_status && (
                      <div className="space-y-1 pt-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Criticality (RYG)</p>
                        <RYGBadge verdict={order.ryg_status} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {renderIdentityAlerts()}
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-2 space-y-8">
              {isAwaitingCSRDecision && (!isMergeOrNewDecision(order) || isPendingMergeDecision) && (
                <Card className="border-2 border-amber-500 bg-amber-500/[0.03] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-amber-500/10 animate-in slide-in-from-top-4 duration-500">
                  <div className="p-8 space-y-6">
                    <div className="flex items-center gap-4 border-b border-amber-500/10 pb-6">
                      <div className="w-14 h-14 rounded-[1.5rem] bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-black tracking-tight uppercase tracking-widest text-amber-700">Action Required</h3>
                        <p className="text-xs font-medium text-amber-700/60 uppercase tracking-widest">CSR Intervention Required to Proceed</p>
                      </div>
                    </div>
                    {renderCSRBody()}
                  </div>
                </Card>
              )}

              {(order?.status === 'extracted' || order?.status === 'complete' || (order?.status === 'awaiting_csr_decision' && fields) || (order?.awaiting_csr && fields)) && (
                <div className="space-y-4 animate-in fade-in duration-700">
                  {renderFieldSummaryPills()}
                  {renderFieldTabs()}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* MERGE DECISION MODAL */}
      <Dialog open={isMergeOrNewDecision(order) && !isPendingMergeDecision}>
        <DialogContent className="max-w-2xl rounded-[2rem] border-2 border-violet-500/30 p-8">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-black tracking-tight">Patient already has an open order</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {renderCSRBody()}
          </div>
        </DialogContent>
      </Dialog>

      {viewerDoc && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-card border-2 border-border/40 rounded-[2rem] w-full max-w-5xl h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-6 py-4 border-b border-border/20 flex items-center justify-between gap-4 bg-muted/5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-black tracking-tight truncate">{viewerDoc.filename || 'Document'}</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {viewerDoc.doc_type || 'Document'}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="w-10 h-10 rounded-xl shrink-0"
                onClick={() => setViewerDoc(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 bg-muted/20 relative">
              {viewerDoc.doc_url ? (
                <iframe
                  src={`${viewerDoc.doc_url}#toolbar=0&navpanes=0&scrollbar=1`}
                  className="w-full h-full border-none"
                  title={viewerDoc.filename || 'Document'}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 opacity-40">
                  <AlertCircle className="w-12 h-12" />
                  <p className="font-black text-lg uppercase tracking-widest">Document URL Not Available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD DOCUMENTS MODAL */}
      <Dialog open={uploadModal.open} onOpenChange={(v) => setUploadModal(v ? { ...uploadModal, open: true } : { open: false, files: [] })}>
        <DialogContent className="max-w-3xl rounded-[2rem] border-2 border-border/40 p-8">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-black tracking-tight uppercase tracking-widest">Add Documents</DialogTitle>
            <p className="text-xs font-medium text-muted-foreground">Upload PDF files and choose document types before restarting extraction.</p>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <label className="block">
              <div className="border-4 border-dashed border-border/40 bg-muted/5 rounded-2xl p-10 flex flex-col items-center gap-4 hover:border-primary/40 transition-all cursor-pointer">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Upload className="w-7 h-7" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-black tracking-tight">Upload Clinical Documents</h3>
                  <p className="text-xs font-medium text-muted-foreground">PDF files only, duplicates skipped</p>
                </div>
                <input type="file" multiple accept="application/pdf" onChange={handleUploadFileChange} className="sr-only" />
              </div>
            </label>

            {uploadModal.files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <File className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{uploadModal.files.length} File{uploadModal.files.length > 1 ? 's' : ''} Selected</span>
                </div>
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {uploadModal.files.map((item, i) => (
                    <Card key={`${item.file.name}-${i}`} className="rounded-2xl p-4 bg-card flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black truncate" title={item.file.name}>{item.file.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{formatFileSize(item.file.size)}</p>
                      </div>
                      <div className="w-48">
                        <Select value={item.docType} onValueChange={(v) => updateUploadDocType(i, v)}>
                          <SelectTrigger className="h-10 rounded-xl bg-muted/50 border-none text-[10px] font-black uppercase tracking-widest">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="w-9 h-9 rounded-lg text-red-500 hover:bg-red-500/10" onClick={() => removeUploadFile(i)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setUploadModal({ open: false, files: [] })} disabled={isAddingDocuments} className="h-11 rounded-xl font-black uppercase tracking-widest text-[10px]">Cancel</Button>
            <Button onClick={submitAddedDocuments} disabled={isAddingDocuments || uploadModal.files.length === 0} className="h-11 rounded-xl font-black uppercase tracking-widest text-[10px]">
              {isAddingDocuments ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Documents'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* APPROVE MODAL */}
      <Dialog open={approveModal.open} onOpenChange={(v) => !v && setApproveModal({ open: false, mode: 'confirm', missingFields: [], conflictCount: 0 })}>
        <DialogContent className="max-w-lg rounded-[2rem] border-2 border-border/40 p-8">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-black tracking-tight uppercase tracking-widest">Approve Order</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {approveModal.mode === 'conflicts' && (
              <p className="text-sm font-medium leading-relaxed">
                {approveModal.conflictCount} unresolved conflict{approveModal.conflictCount === 1 ? '' : 's'} remain. Resolve them first or approve anyway.
              </p>
            )}
            {approveModal.mode === 'missing' && (
              <div className="space-y-3">
                <p className="text-sm font-medium leading-relaxed">Missing required RED fields remain. Fill them first or approve anyway.</p>
                <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4 max-h-48 overflow-y-auto">
                  <ul className="space-y-1">
                    {approveModal.missingFields.map(field => (
                      <li key={field} className="text-xs font-bold text-red-700">{formatFieldName(String(field))}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {approveModal.mode === 'confirm' && (
              <p className="text-sm font-medium leading-relaxed">Approve this order? This marks extraction as complete.</p>
            )}
          </div>
          <DialogFooter className="gap-3">
            {approveModal.mode === 'confirm' ? (
              <>
                <Button variant="ghost" onClick={() => setApproveModal({ open: false, mode: 'confirm', missingFields: [], conflictCount: 0 })} disabled={isApprovingOrder} className="h-11 flex-1 rounded-xl font-black uppercase tracking-widest text-[10px]">Cancel</Button>
                <Button onClick={() => submitApproval(false)} disabled={isApprovingOrder} className="h-11 flex-1 rounded-xl font-black uppercase tracking-widest text-[10px]">
                  {isApprovingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setApproveModal({ open: false, mode: 'confirm', missingFields: [], conflictCount: 0 })} disabled={isApprovingOrder} className="h-11 flex-1 rounded-xl font-black uppercase tracking-widest text-[10px]">
                  {approveModal.mode === 'missing' ? 'Fill Missing Fields' : 'Resolve First'}
                </Button>
                <Button onClick={() => submitApproval(true)} disabled={isApprovingOrder} className="h-11 flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-[10px]">
                  {isApprovingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Approve Anyway'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={editModal.open} onOpenChange={(v) => !v && setEditModal({ ...editModal, open: false })}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-2 border-border/40 p-8">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-black tracking-tight uppercase tracking-widest">Edit Field</DialogTitle>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">{editModal.fieldName.replace(/_/g, ' ')}</p>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Current Value</label>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/20 text-xs font-medium text-muted-foreground italic">{String(editModal.currentValue || '—')}</div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">New Value</label>
              <textarea className="w-full h-24 rounded-2xl border-2 border-border/40 bg-card p-4 text-sm font-bold focus:border-primary/40 focus:outline-none transition-all resize-none" value={editModal.newValue} onChange={(e) => setEditModal(prev => ({ ...prev, newValue: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Reason for Change</label>
              <Input placeholder="Why are you changing this?" value={editModal.reason} onChange={(e) => setEditModal(prev => ({ ...prev, reason: e.target.value }))} className="h-12 rounded-xl border-2 border-border/40 focus:border-primary/40 text-sm font-bold" />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <DialogClose asChild>
              <Button variant="ghost" className="h-12 flex-1 rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</Button>
            </DialogClose>
            <Button onClick={handleEditSave} disabled={isSubmittingEdit} className="h-12 flex-1 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20">
              {isSubmittingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFLICT MODAL */}
      <Dialog open={conflictModal.open} onOpenChange={(v) => !v && setConflictModal({ ...conflictModal, open: false })}>
        <DialogContent className="max-w-3xl rounded-[2.5rem] border-2 border-border/40 p-10">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-black tracking-tight uppercase tracking-widest">Resolve Conflict</DialogTitle>
            <p className="text-xs font-black uppercase tracking-widest text-red-500">{conflictModal.field?.name?.replace(/_/g, ' ')}</p>
          </DialogHeader>
          <div className="space-y-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((optNum) => {
                const opt = conflictModal.field?.conflict_details?.[`option_${optNum}`];
                if (!opt) return null;
                const isSelected = conflictModal.choice === `opt${optNum}`;
                return (
                  <Card key={optNum} onClick={() => setConflictModal(prev => ({ ...prev, choice: `opt${optNum}`, manualValue: '' }))} className={`cursor-pointer transition-all duration-300 border-2 rounded-[2rem] p-6 space-y-4 ${isSelected ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5 scale-[1.02]' : 'border-border/40 bg-card hover:border-primary/20'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Option {optNum}</span>
                      <div className="flex items-center gap-2">
                        <ConfidenceDot confidence={opt.confidence} />
                        <span className="text-[10px] font-black font-mono">{Math.round((opt.confidence || 0) * 100)}%</span>
                      </div>
                    </div>
                    <p className="text-sm font-bold min-h-[48px] line-clamp-2">{String(opt.value || '—')}</p>
                    <div className="flex flex-wrap gap-1 pt-2">
                      {opt.agents?.map(a => <span key={a} className="text-[8px] font-black bg-muted px-1.5 py-0.5 rounded text-muted-foreground/60 uppercase">{a}</span>)}
                    </div>
                  </Card>
                );
              })}
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border/40" />
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">OR RESOLVE MANUALLY</span>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <textarea placeholder="Enter manual resolution value..." className="w-full h-24 rounded-2xl border-2 border-border/40 bg-card p-4 text-sm font-bold focus:border-primary/40 focus:outline-none transition-all resize-none" value={conflictModal.manualValue} onChange={(e) => setConflictModal(prev => ({ ...prev, manualValue: e.target.value, choice: '' }))} />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Resolution Reason</label>
              <Input placeholder="Reason for this resolution choice..." value={conflictModal.reason} onChange={(e) => setConflictModal(prev => ({ ...prev, reason: e.target.value }))} className="h-12 rounded-xl border-2 border-border/40 focus:border-primary/40 text-sm font-bold" />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <DialogClose asChild>
              <Button variant="ghost" className="h-14 flex-1 rounded-2xl font-black uppercase tracking-widest text-[11px]">Cancel</Button>
            </DialogClose>
            <Button onClick={handleResolveConflict} disabled={isSubmittingConflict || (!conflictModal.choice && !conflictModal.manualValue) || !conflictModal.reason} className="h-14 flex-1 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/20">
              {isSubmittingConflict ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Resolve Conflict'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderDetail;
