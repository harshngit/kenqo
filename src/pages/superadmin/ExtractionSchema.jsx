import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Database, ChevronDown, ChevronRight, Plus, Edit2, Trash2, Save,
  Loader2, AlertCircle, RefreshCw, ToggleLeft, ToggleRight,
  CheckCircle2, Shield, Info, Link2, FileText, Settings2, Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import { useSelector } from 'react-redux';

const BASE_URL = 'https://kenqo-api-409744260053.asia-south1.run.app';
const DISEASE = 'lymphedema';

const SECTIONS = [
  'patient_demographics','insurance','provider','facility','clinical_diagnosis',
  'clinical_findings','pain_assessment','measurements','outcome_measures',
  'conservative_treatment','physician_order','lmn','document_metadata',
  'key_dates','garment_order','billing_claim_garments','pump_order',
  'pump_clinical_criteria','e0652_step_therapy',
];

const FIELD_TYPES = ['string','date','integer','boolean','enum','array','object','icd10'];
const CRITICALITY_VALUES = ['RED','YELLOW','GREEN'];

const critConfig = {
  RED:    { bg: 'bg-red-500/10',    text: 'text-red-500',    border: 'border-red-500/25',    dot: 'bg-red-500'    },
  YELLOW: { bg: 'bg-amber-500/10',  text: 'text-amber-500',  border: 'border-amber-500/25',  dot: 'bg-amber-400'  },
  GREEN:  { bg: 'bg-emerald-500/10',text: 'text-emerald-500',border: 'border-emerald-500/25',dot: 'bg-emerald-500' },
};

const typeColors = {
  string:  'bg-blue-500/10 text-blue-500 border-blue-500/20',
  date:    'bg-purple-500/10 text-purple-500 border-purple-500/20',
  integer: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  boolean: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  enum:    'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  array:   'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  object:  'bg-teal-500/10 text-teal-500 border-teal-500/20',
  icd10:   'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

// Convert snake_case → "Human Readable Label"
const toLabel = (s) => {
  if (typeof s !== 'string') return String(s || '');
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const EMPTY_FIELD = {
  field_name: '', type: 'string', required: false,
  criticality: 'YELLOW', active: true, confidence_threshold: '',
  source_docs: '', validation: '', criticality_rationale: '',
  cross_doc_check: false, section: SECTIONS[0],
};

// ─── Custom Dropdown ──────────────────────────────────────────────────────────
function CustomDropdown({ label, value, options, onChange, renderOption, renderSelected }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find((o) => (typeof o === 'string' ? o : o.value) === value);
  const selectedVal = selected ? (typeof selected === 'string' ? selected : selected.value) : null;

  return (
    <div ref={ref} className="relative">
      {label && (
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{label}</p>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 h-11 px-3.5 rounded-xl border text-sm font-medium bg-background transition-all
          ${open ? 'border-primary ring-2 ring-primary/15 shadow-sm' : 'border-border/60 hover:border-muted-foreground/40'}`}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          {selectedVal
            ? renderSelected
              ? renderSelected(selectedVal)
              : <span className="truncate">{toLabel(selectedVal)}</span>
            : <span className="text-muted-foreground">Select…</span>
          }
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-popover border border-border/60 rounded-xl shadow-2xl overflow-hidden"
          style={{ animation: 'dropdownIn 0.12s ease-out' }}>
          <style>{`@keyframes dropdownIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div className="max-h-60 overflow-y-auto py-1.5 px-1.5 space-y-0.5">
            {options.map((opt) => {
              const val = typeof opt === 'string' ? opt : opt.value;
              const isSelected = val === value;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => { onChange(val); setOpen(false); }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm text-left transition-colors
                    ${isSelected ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted/60 text-foreground'}`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    {renderOption
                      ? renderOption(val, isSelected)
                      : <span className="truncate">{toLabel(val)}</span>
                    }
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function CritBadge({ value }) {
  const c = critConfig[value] || critConfig.GREEN;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {value}
    </span>
  );
}

function TypeBadge({ value }) {
  const cls = typeColors[value] || 'bg-muted text-muted-foreground border-border/50';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${cls}`}>
      {value}
    </span>
  );
}

// ─── Field Card ───────────────────────────────────────────────────────────────
function FieldCard({ field, fieldName, section, sectionActive, onToggle, onEdit, onDelete }) {
  const [toggling, setToggling] = useState(false);
  const active = field.active !== false;

  const handleToggle = async () => {
    if (!sectionActive) return;
    setToggling(true);
    await onToggle(section, fieldName, !active);
    setToggling(false);
  };

  return (
    <div className={`group relative rounded-xl border p-4 transition-all duration-200 ${
      active && sectionActive
        ? 'bg-card border-border/50 hover:border-primary/30 hover:shadow-md hover:shadow-black/5'
        : 'bg-muted/30 border-border/30 opacity-55'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {/* Human readable name */}
          <span className="font-bold text-sm text-foreground">{toLabel(fieldName)}</span>
          <TypeBadge value={field.type} />
          <CritBadge value={field.criticality} />
          {field.required && (
            <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              Required
            </span>
          )}
          {field.cross_doc_check && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-500 border border-violet-500/20">
              <Link2 className="w-2.5 h-2.5" />Cross-doc
            </span>
          )}
          {!active && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
              Inactive
            </span>
          )}
        </div>
        {sectionActive && (
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={handleToggle} disabled={toggling} title={active ? 'Deactivate' : 'Activate'}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              {toggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : active ? <ToggleRight className="w-3.5 h-3.5 text-emerald-500" />
                : <ToggleLeft className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => onEdit(section, fieldName, field)} title="Edit"
              className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(section, fieldName)} title="Delete"
              className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1.5 text-[11px] text-muted-foreground">
        {field.validation && (
          <p className="flex gap-1.5"><Shield className="w-3 h-3 mt-0.5 shrink-0 text-primary/50" /><span>{field.validation}</span></p>
        )}
        {field.criticality_rationale && (
          <p className="flex gap-1.5"><Info className="w-3 h-3 mt-0.5 shrink-0 text-amber-500/60" /><span>{field.criticality_rationale}</span></p>
        )}
        {field.source_docs?.length > 0 && (
          <p className="flex gap-1.5 flex-wrap items-start">
            <FileText className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground/50" />
            <span className="flex flex-wrap gap-1">
              {field.source_docs.map((d) => (
                <span key={d} className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/40 font-medium">{d}</span>
              ))}
            </span>
          </p>
        )}
        {field.confidence_threshold != null && (
          <p className="text-[10px]">Confidence: <span className="font-bold text-foreground/70">{field.confidence_threshold}</span></p>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const SuperAdminExtractionSchema = () => {
  const authUser = useSelector((s) => s.auth?.user);
  const superadminId = authUser?.user_id || authUser?.id || '';

  const [schema, setSchema] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [togglingSections, setTogglingSections] = useState(new Set());
  const [expandedSections, setExpandedSections] = useState({});
  const [activeTab, setActiveTab] = useState('schema');

  const [fieldDialog, setFieldDialog] = useState({ open: false, mode: 'add', section: '', fieldName: '', data: {} });
  const [isSavingField, setIsSavingField] = useState(false);
  const [fieldSaveError, setFieldSaveError] = useState(null);

  const [deleteDialog, setDeleteDialog] = useState({ open: false, section: '', fieldName: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  // New Dialogs for DocTypes and Routing
  const [docTypeDialog, setDocTypeDialog] = useState({ open: false, mode: 'add', data: { name: '', active: true, description: '' } });
  const [isSavingDocType, setIsSavingDocType] = useState(false);

  const [routingDialog, setRoutingDialog] = useState({ open: false, mode: 'add', product: '', data: { name: '', active: true, description: '' } });
  const [isSavingRouting, setIsSavingRouting] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSchema = useCallback(async () => {
    setIsFetching(true); setFetchError(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/schema`, {
        headers: { 'Content-Type': 'application/json', 'x-user-id': superadminId },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.detail || data?.message || 'Failed to load schema');
      setSchema(data.schema);
      const first = Object.keys(data.schema?.extraction_schema || {})[0];
      if (first) setExpandedSections({ [first]: true });
    } catch (e) { setFetchError(e.message); }
    finally { 
      setIsFetching(false); 
      setIsInitialLoading(false);
    }
  }, [superadminId]);

  const [docTypes, setDocTypes] = useState([]);
  const [isFetchingDocs, setIsFetchingDocs] = useState(false);

  const fetchDocTypes = useCallback(async () => {
    setIsFetchingDocs(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/schema/document-types`, {
        headers: { 'Content-Type': 'application/json', 'x-user-id': superadminId },
      });
      const data = await res.json();
      if (res.ok && data.success) setDocTypes(data.document_types || []);
    } catch (e) { showToast('Failed to load document types', 'error'); }
    finally { setIsFetchingDocs(false); }
  }, [superadminId]);

  useEffect(() => { fetchSchema(); fetchDocTypes(); }, [fetchSchema, fetchDocTypes]);

  const toggleSection = (s) => setExpandedSections((p) => ({ ...p, [s]: !p[s] }));

  const openAddDialog = (section, fromSection = false) => {
    const sec = section || SECTIONS[0];
    setFieldSaveError(null);
    setFieldDialog({
      open: true, mode: 'add', section: sec, fieldName: '',
      data: { ...EMPTY_FIELD, section: sec },
      sectionLocked: fromSection
    });
  };

  const openEditDialog = (section, fieldName, fieldData) => {
    setFieldSaveError(null);
    setFieldDialog({
      open: true, mode: 'edit', section, fieldName,
      data: {
        ...EMPTY_FIELD, ...fieldData, section, field_name: fieldName,
        source_docs: Array.isArray(fieldData.source_docs) ? fieldData.source_docs.join(', ') : '',
        confidence_threshold: fieldData.confidence_threshold ?? '',
      },
      sectionLocked: true // Editing is always locked to its section
    });
  };

  const upd = (patch) => setFieldDialog((p) => ({ ...p, data: { ...p.data, ...patch } }));

  const handleFieldSave = async () => {
    const { mode, data } = fieldDialog;
    if (!data.field_name?.trim()) { setFieldSaveError('Field name is required.'); return; }
    setIsSavingField(true); setFieldSaveError(null);
    try {
      const body = {
        user_id: superadminId, section: data.section, field_name: data.field_name.trim(),
        field_config: {
          type: data.type, required: !!data.required, criticality: data.criticality,
          active: data.active !== false, cross_doc_check: !!data.cross_doc_check,
          ...(data.confidence_threshold !== '' && { confidence_threshold: parseFloat(data.confidence_threshold) }),
          ...(data.source_docs && { source_docs: data.source_docs.split(',').map((s) => s.trim()).filter(Boolean) }),
          ...(data.validation && { validation: data.validation }),
          ...(data.criticality_rationale && { criticality_rationale: data.criticality_rationale }),
        },
      };
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/schema/field`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': superadminId },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok || result.success === false) throw new Error(result?.detail || result?.message || 'Save failed');
      setSchema((prev) => {
        const es = { ...prev.extraction_schema };
        es[body.section] = { ...es[body.section], [body.field_name]: body.field_config };
        return { ...prev, extraction_schema: es };
      });
      setFieldDialog((p) => ({ ...p, open: false }));
      showToast(mode === 'add' ? 'Field added successfully' : 'Field updated successfully');
    } catch (e) { setFieldSaveError(e.message); }
    finally { setIsSavingField(false); }
  };

  const handleToggleActive = async (section, fieldName, newActive) => {
    try {
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/schema/field/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': superadminId },
        body: JSON.stringify({ user_id: superadminId, section, field_name: fieldName, active: newActive }),
      });
      const result = await res.json();
      if (!res.ok || result.success === false) throw new Error(result?.detail || 'Toggle failed');
      setSchema((prev) => {
        const es = { ...prev.extraction_schema };
        es[section] = { ...es[section], [fieldName]: { ...es[section][fieldName], active: newActive } };
        return { ...prev, extraction_schema: es };
      });
      showToast(`Field ${newActive ? 'activated' : 'deactivated'}`);
    } catch (e) { showToast(e.message, 'error'); }
  };

  const handleToggleSectionActive = async (section, newActive) => {
    if (togglingSections.has(section)) return;
    setTogglingSections(prev => new Set(prev).add(section));
    try {
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/schema/section/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': superadminId },
        body: JSON.stringify({ user_id: superadminId, section_name: section, active: newActive }),
      });
      const result = await res.json();
      if (!res.ok || result.success === false) throw new Error(result?.detail || 'Section toggle failed');
      setSchema((prev) => {
        const es = { ...prev.extraction_schema };
        es[section] = { 
          ...es[section], 
          _meta: { ...(es[section]._meta || {}), active: newActive } 
        };
        return { ...prev, extraction_schema: es };
      });
      showToast(`Section ${newActive ? 'activated' : 'deactivated'}`);
    } catch (e) { showToast(e.message, 'error'); }
    finally {
      setTogglingSections(prev => {
        const next = new Set(prev);
        next.delete(section);
        return next;
      });
    }
  };

  const handleUpdateSectionDescription = async (section, description) => {
    try {
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/schema/section/description`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': superadminId },
        body: JSON.stringify({ user_id: superadminId, section_name: section, description }),
      });
      const result = await res.json();
      if (!res.ok || result.success === false) throw new Error(result?.detail || 'Description update failed');
      setSchema((prev) => {
        const es = { ...prev.extraction_schema };
        es[section] = { 
          ...es[section], 
          _meta: { ...(es[section]._meta || {}), description } 
        };
        return { ...prev, extraction_schema: es };
      });
      showToast('Description updated');
    } catch (e) { showToast(e.message, 'error'); }
  };

  const handleDocTypeSave = async () => {
    const { data } = docTypeDialog;
    if (!data.name?.trim()) return;
    setIsSavingDocType(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/schema/document-types`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': superadminId },
        body: JSON.stringify({ user_id: superadminId, ...data }),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) throw new Error(resData?.detail || 'Failed to save document type');
      fetchDocTypes();
      setDocTypeDialog((p) => ({ ...p, open: false }));
      showToast('Document type saved');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setIsSavingDocType(false); }
  };

  const handleDocTypeDelete = async (name) => {
    if (!confirm(`Are you sure you want to permanently remove "${name}"?`)) return;
    try {
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/schema/document-types`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-user-id': superadminId },
        body: JSON.stringify({ user_id: superadminId, name }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.detail || 'Failed to delete');
      fetchDocTypes();
      showToast('Document type deleted');
    } catch (e) { showToast(e.message, 'error'); }
  };

  const handleDocTypeToggle = async (name, active) => {
    try {
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/schema/document-types/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': superadminId },
        body: JSON.stringify({ user_id: superadminId, name, active }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.detail || 'Toggle failed');
      fetchDocTypes();
      showToast(`Document type ${active ? 'activated' : 'deactivated'}`);
    } catch (e) { showToast(e.message, 'error'); }
  };

  const handleRoutingSectionSave = async () => {
    const { product, data } = routingDialog;
    if (!data.name?.trim()) return;
    setIsSavingRouting(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/schema/routing-section`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': superadminId },
        body: JSON.stringify({ user_id: superadminId, product, ...data }),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) throw new Error(resData?.detail || 'Failed to save routing section');
      fetchSchema();
      setRoutingDialog((p) => ({ ...p, open: false }));
      showToast('Routing section updated');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setIsSavingRouting(false); }
  };

  const handleRoutingSectionToggle = async (product, sectionName, active) => {
    try {
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/schema/routing-section/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': superadminId },
        body: JSON.stringify({ user_id: superadminId, product, section_name: sectionName, active }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.detail || 'Toggle failed');
      fetchSchema();
      showToast(`Routing section ${active ? 'activated' : 'deactivated'}`);
    } catch (e) { showToast(e.message, 'error'); }
  };

  const openDeleteDialog = (section, fieldName) => setDeleteDialog({ open: true, section, fieldName });

  const handleDelete = async () => {
    setIsDeleting(true);
    const { section, fieldName } = deleteDialog;
    try {
      const res = await fetch(`${BASE_URL}/admin/config/${DISEASE}/schema/field`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-user-id': superadminId },
        body: JSON.stringify({ user_id: superadminId, section, field_name: fieldName }),
      });
      const result = await res.json();
      if (!res.ok || result.success === false) throw new Error(result?.detail || 'Delete failed');
      setSchema((prev) => {
        const es = { ...prev.extraction_schema };
        const sec = { ...es[section] };
        delete sec[fieldName];
        return { ...prev, extraction_schema: { ...es, [section]: sec } };
      });
      setDeleteDialog({ open: false, section: '', fieldName: '' });
      showToast('Field deleted');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setIsDeleting(false); }
  };

  const extractionSchema = schema?.extraction_schema || {};
  const allFields = Object.values(extractionSchema).flatMap(Object.values);
  const redCount = allFields.filter((f) => f.criticality === 'RED').length;
  const yellowCount = allFields.filter((f) => f.criticality === 'YELLOW').length;
  const greenCount = allFields.filter((f) => f.criticality === 'GREEN').length;

  if (isInitialLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center animate-in fade-in duration-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center relative">
            <Database className="w-8 h-8 text-primary" />
            <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-2xl animate-spin" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold tracking-tight">Loading Extraction Schema</h2>
            <p className="text-xs text-muted-foreground mt-1">Fetching your system configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Subsequent Loading Overlay */}
      {isFetching && !isInitialLoading && (
        <div className="fixed inset-0 z-[100] bg-background/40 backdrop-blur-[1px] flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-card border border-border/50 shadow-2xl rounded-2xl p-6 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-bold tracking-tight">Updating schema data...</p>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-bold
          ${toast.type === 'error' ? 'bg-destructive text-white' : 'bg-emerald-600 text-white'}`}
          style={{ animation: 'slideInToast 0.2s ease-out' }}>
          <style>{`@keyframes slideInToast{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
            <Database className="w-3.5 h-3.5" />Extraction Schema
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Schema — <span className="text-primary capitalize">{DISEASE}</span>
          </h1>
          {schema && (
            <p className="text-muted-foreground text-sm">
              {schema.product_name} · v{schema.version} · Updated {schema.last_updated}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={fetchSchema} disabled={isFetching} className="h-10 px-4 rounded-xl font-bold text-sm gap-2">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />Refresh
          </Button>
          <Button onClick={() => openAddDialog()} className="h-10 px-4 rounded-xl font-bold text-sm gap-2 bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" />Add Field
          </Button>
        </div>
      </div>

      {isFetching && (
        <div className="py-24 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading schema…</p>
        </div>
      )}

      {!isFetching && fetchError && (
        <div className="py-16 flex flex-col items-center gap-4">
          <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-destructive" />
          </div>
          <p className="font-bold text-sm text-destructive">{fetchError}</p>
          <Button size="sm" onClick={fetchSchema} className="rounded-xl px-4 h-9 font-bold">Try Again</Button>
        </div>
      )}

      {!isFetching && !fetchError && schema && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Fields', value: allFields.length, cls: 'text-foreground' },
              { label: 'Critical (RED)', value: redCount, cls: 'text-red-500' },
              { label: 'Important (YELLOW)', value: yellowCount, cls: 'text-amber-500' },
              { label: 'Optional (GREEN)', value: greenCount, cls: 'text-emerald-500' },
            ].map((s) => (
              <Card key={s.label} className="border border-border/50 rounded-xl shadow-sm">
                <CardContent className="p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">{s.label}</p>
                  <p className={`text-2xl font-black ${s.cls}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit border border-border/50">
            {[
              { key: 'schema',  label: 'Extraction Schema',    Icon: Database  },
              { key: 'routing', label: 'Product Routing',      Icon: Link2     },
              { key: 'scoring', label: 'Scoring & Confidence', Icon: Settings2 },
            ].map(({ key, label, Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all
                  ${activeTab === key ? 'bg-background text-foreground shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>

          {/* ── Schema Tab ── */}
          {activeTab === 'schema' && (
            <div className="space-y-4 animate-in fade-in duration-500">
              {/* Unassigned Fields Alert */}
              {schema?.unassigned_count > 0 ? (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex items-start gap-4 shadow-sm shadow-amber-500/5 transition-all hover:bg-amber-500/[0.12]">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <h4 className="text-sm font-black text-amber-700 dark:text-amber-400 uppercase tracking-tight">
                        Unassigned Fields Detected
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                        {schema.unassigned_count} NEW
                      </span>
                    </div>
                    <p className="text-xs text-amber-600/80 dark:text-amber-500/70 mt-1 leading-relaxed font-medium">
                      The following fields are present in the system but haven't been assigned to any extraction section yet. Please assign them to ensure proper document analysis.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3.5">
                      {schema.unassigned_fields.map((f) => (
                        <div key={f} className="group relative flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/50 dark:bg-black/20 border border-amber-500/30 hover:border-amber-500/60 transition-all cursor-default shadow-sm shadow-amber-500/5">
                          <span className="text-[10px] font-bold font-mono text-amber-700 dark:text-amber-300">
                            {f}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in duration-500">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-xs font-bold text-emerald-600/80 dark:text-emerald-500/70 tracking-tight">
                    All system fields have been assigned to sections. No unassigned fields detected.
                  </p>
                </div>
              )}

              {Object.entries(extractionSchema).map(([section, fields]) => {
                const sectionMeta = fields._meta || {};
                const sectionActive = sectionMeta.active !== false;
                const fieldEntries = Object.entries(fields).filter(([k]) => k !== '_meta');
                const isOpen = !!expandedSections[section];
                const reds = fieldEntries.filter(([, f]) => f.criticality === 'RED').length;
                const inactive = fieldEntries.filter(([, f]) => f.active === false).length;

                return (
                  <Card key={section} className={`border border-border/50 rounded-2xl overflow-hidden shadow-sm transition-all ${!sectionActive ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => toggleSection(section)}>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${sectionActive ? 'bg-primary/10' : 'bg-muted'}`}>
                            <Database className={`w-4 h-4 ${sectionActive ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm">{toLabel(section)}</p>
                              {!sectionActive && (
                                <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                                  Disabled
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {fieldEntries.length} field{fieldEntries.length !== 1 ? 's' : ''}
                              {reds > 0 && <span className="ml-2 text-red-500 font-bold">{reds} RED</span>}
                              {inactive > 0 && <span className="ml-2 text-muted-foreground/60">· {inactive} inactive</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {/* Section Toggle */}
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border border-border/50" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active</span>
                            <button
                              onClick={() => handleToggleSectionActive(section, !sectionActive)}
                              disabled={togglingSections.has(section)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${sectionActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'} ${togglingSections.has(section) ? 'opacity-50 cursor-wait' : ''}`}
                            >
                              {togglingSections.has(section) ? (
                                <Loader2 className="w-3 h-3 text-white mx-auto animate-spin" />
                              ) : (
                                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${sectionActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                              )}
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            {sectionActive && (
                              <Button variant="ghost" size="sm"
                                onClick={(e) => { e.stopPropagation(); openAddDialog(section, true); }}
                                className="h-7 px-2.5 text-xs rounded-lg font-bold gap-1 hover:bg-primary/10 hover:text-primary">
                                <Plus className="w-3 h-3" />Add
                              </Button>
                            )}
                            {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        </div>
                      </div>
                      
                      {sectionMeta.description && (
                        <div className="px-5 pb-3 -mt-1">
                          <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-primary/20 pl-3 py-0.5">
                            {sectionMeta.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-2 border-t border-border/40 bg-muted/10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {fieldEntries.map(([fieldName, fieldData]) => (
                            <FieldCard key={fieldName} field={fieldData} fieldName={fieldName}
                              section={section} sectionActive={sectionActive} onToggle={handleToggleActive}
                              onEdit={openEditDialog} onDelete={openDeleteDialog} />
                          ))}
                          {fieldEntries.length === 0 && (
                            <div className="lg:col-span-2 py-8 text-center border-2 border-dashed border-border/40 rounded-xl">
                              <p className="text-sm text-muted-foreground">No fields configured in this section.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* ── Routing Tab ── */}
          {activeTab === 'routing' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(schema.product_routing || {}).map(([product, config]) => (
                <Card key={product} className="border border-border/50 rounded-2xl shadow-sm overflow-hidden">
                  <CardHeader className="px-6 py-4 border-b border-border/40 bg-primary/5">
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-primary" />{product.toUpperCase()} Route
                    </CardTitle>
                    {config.hcpcs_range && (
                      <p className="text-xs text-muted-foreground mt-1">HCPCS Range: <span className="font-mono font-bold">{config.hcpcs_range.join(' → ')}</span></p>
                    )}
                    {config.hcpcs_codes && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {config.hcpcs_codes.map((c) => (
                          <span key={c} className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{c}</span>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sections ({config.sections.length})</p>
                      <button
                        onClick={() => setRoutingDialog({ open: true, product, data: { name: '', active: true, description: '' } })}
                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Section
                      </button>
                    </div>
                    <div className="flex flex-col gap-2 h-[300px] overflow-y-scroll ">
                      {config.sections.map((s) => {
                        const name = typeof s === 'string' ? s : s.name;
                        const active = typeof s === 'string' ? true : s.active !== false;
                        const description = typeof s === 'string' ? '' : s.description;

                        return (
                          <div key={name} className={`group relative flex flex-col p-3 rounded-xl border transition-all ${active ? 'bg-card border-border/60 hover:border-primary/30 hover:shadow-sm' : 'bg-muted/40 border-border/20 opacity-60'}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-foreground">{toLabel(name)}</span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleRoutingSectionToggle(product, name, !active)}
                                  className={`p-1 rounded-lg hover:bg-muted transition-colors ${active ? 'text-emerald-500' : 'text-muted-foreground'}`}
                                  title={active ? 'Deactivate' : 'Activate'}
                                >
                                  {active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => setRoutingDialog({ open: true, mode: 'edit', product, data: { name, active, description } })}
                                  className="p-1 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Remove ${name} from ${product} routing?`)) {
                                      handleRoutingSectionToggle(product, name, false);
                                    }
                                  }}
                                  className="p-1 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            {description && (
                              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2 italic">
                                {description}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Card className="border border-border/50 rounded-2xl shadow-sm overflow-hidden md:col-span-2">
                <CardHeader className="px-6 py-4 border-b border-border/40 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />Accepted Document Types
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => fetchDocTypes()} disabled={isFetchingDocs} className="h-8 w-8 p-0 rounded-lg">
                      <RefreshCw className={`w-3.5 h-3.5 ${isFetchingDocs ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {docTypes.map((dt) => (
                      <div key={dt.name || dt} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${dt.active !== false ? 'bg-card border-border/60' : 'bg-muted/40 border-border/30 opacity-60'}`}>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{dt.name || dt}</p>
                          {dt.description && <p className="text-[10px] text-muted-foreground truncate">{dt.description}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleDocTypeToggle(dt.name || dt, dt.active === false)}
                            className={`p-1.5 rounded-lg hover:bg-muted transition-colors ${dt.active !== false ? 'text-emerald-500' : 'text-muted-foreground'}`}
                          >
                            {dt.active !== false ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDocTypeDelete(dt.name || dt)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => setDocTypeDialog({ open: true, mode: 'add', data: { name: '', active: true, description: '' } })}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-bold">Add Document Type</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
              {schema.cross_doc_reconciliation && (
                <Card className="border border-border/50 rounded-2xl shadow-sm overflow-hidden md:col-span-2">
                  <CardHeader className="px-6 py-4 border-b border-border/40 bg-violet-500/5">
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-violet-500" />Cross-Document Reconciliation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          {['Field','Tolerance','Severity'].map((h) => (
                            <th key={h} className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {schema.cross_doc_reconciliation.fields.map((f) => (
                          <tr key={f.field} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-xs">{toLabel(f.field)}</td>
                            <td className="py-2.5 px-3 text-xs text-muted-foreground">{f.tolerance}</td>
                            <td className="py-2.5 px-3"><CritBadge value={f.severity} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ── Scoring Tab ── */}
          {activeTab === 'scoring' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {schema.completeness_scoring && (
                <>
                  <Card className="border border-border/50 rounded-2xl shadow-sm overflow-hidden">
                    <CardHeader className="px-6 py-4 border-b border-border/40 bg-muted/20">
                      <CardTitle className="text-base font-black">Criticality Weights</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-3">
                      {Object.entries(schema.completeness_scoring.weights).map(([k, w]) => (
                        <div key={k} className="flex items-center gap-3">
                          <CritBadge value={k} />
                          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                            <div className={`h-full rounded-full ${k==='RED'?'bg-red-500':k==='YELLOW'?'bg-amber-400':'bg-emerald-500'}`}
                              style={{ width: `${(w/3)*100}%` }} />
                          </div>
                          <span className="font-black text-sm w-4">{w}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card className="border border-border/50 rounded-2xl shadow-sm overflow-hidden">
                    <CardHeader className="px-6 py-4 border-b border-border/40 bg-muted/20">
                      <CardTitle className="text-base font-black">Hard Gates</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-2">
                      {Object.entries(schema.completeness_scoring.hard_gates).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                          <span className="text-xs font-medium text-muted-foreground">{toLabel(k)}</span>
                          <span className={`text-xs font-black px-2 py-0.5 rounded ${v?'bg-red-500/10 text-red-500':'bg-muted text-muted-foreground'}`}>{String(v)}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card className="border border-border/50 rounded-2xl shadow-sm overflow-hidden md:col-span-2">
                    <CardHeader className="px-6 py-4 border-b border-border/40 bg-muted/20">
                      <CardTitle className="text-base font-black">Completeness Thresholds</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {Object.entries(schema.completeness_scoring.thresholds).map(([k, t]) => (
                          <div key={k} className={`rounded-xl p-4 border ${k==='green'?'bg-emerald-500/5 border-emerald-500/20':k==='yellow'?'bg-amber-500/5 border-amber-500/20':'bg-red-500/5 border-red-500/20'}`}>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${k==='green'?'text-emerald-500':k==='yellow'?'text-amber-500':'text-red-500'}`}>{t.label}</p>
                            <p className="text-xs text-muted-foreground mb-1">{t.min!=null&&`Min: ${t.min}%`}{t.max!=null&&` · Max: ${t.max}%`}</p>
                            <p className="text-xs font-bold">{String(t.action || '').replace(/_/g,' ')}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
              {schema.confidence_display && (
                <Card className="border border-border/50 rounded-2xl shadow-sm overflow-hidden md:col-span-2">
                  <CardHeader className="px-6 py-4 border-b border-border/40 bg-muted/20">
                    <CardTitle className="text-base font-black">Confidence Display Bands</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {Object.entries(schema.confidence_display.production).map(([band, cfg]) => (
                        <div key={band} className="rounded-xl p-4 bg-muted/30 border border-border/50">
                          <CritBadge value={band.toUpperCase()} />
                          <p className="text-xs text-muted-foreground mt-2">{cfg.min!=null&&`≥ ${cfg.min}%`}{cfg.max!=null&&` · < ${cfg.max+1}%`}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Flag threshold: <span className="font-bold text-foreground">&lt; {schema.confidence_display.flag_below}%</span>
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={fieldDialog.open} onOpenChange={(v) => !v && setFieldDialog((p) => ({ ...p, open: false }))}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden max-h-[92vh] flex flex-col gap-0">
          {/* Dialog top bar */}
          <div className="px-6 pt-6 pb-5 border-b border-border/50 shrink-0"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.06) 0%, transparent 60%)' }}>
            <DialogHeader>
              <DialogTitle className="font-black text-lg flex items-center gap-3">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  fieldDialog.mode === 'add' ? 'bg-primary/15 text-primary' : 'bg-amber-500/15 text-amber-500'
                }`}>
                  {fieldDialog.mode === 'add' ? <Plus className="w-4.5 h-4.5" /> : <Edit2 className="w-4.5 h-4.5" />}
                </span>
                {fieldDialog.mode === 'add' ? 'Add New Field' : 'Edit Field'}
              </DialogTitle>
              {fieldDialog.mode === 'edit' && fieldDialog.fieldName && (
                <p className="text-sm text-muted-foreground mt-1 ml-12">
                  <span className="font-semibold text-foreground">{toLabel(fieldDialog.fieldName)}</span>
                  {' '}in <span className="font-semibold">{toLabel(fieldDialog.data.section || '')}</span>
                </p>
              )}
            </DialogHeader>
          </div>

          {/* Scrollable form */}
          <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">

            {/* Section */}
            <div className={fieldDialog.sectionLocked ? 'opacity-70 pointer-events-none' : ''}>
              <CustomDropdown
                label="Section"
                value={fieldDialog.data.section || SECTIONS[0]}
                options={SECTIONS}
                onChange={(v) => upd({ section: v })}
                renderSelected={(v) => <span className="font-medium text-sm">{toLabel(v)}</span>}
                renderOption={(v) => <span className="text-sm">{toLabel(v)}</span>}
              />
              {fieldDialog.sectionLocked && (
                <p className="text-[10px] text-muted-foreground mt-1 ml-1">Section is locked for this entry.</p>
              )}
            </div>

            {/* Field Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Field Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. patient_name"
                value={fieldDialog.data.field_name || ''}
                onChange={(e) => upd({ field_name: e.target.value })}
                className="rounded-xl h-11 font-mono text-sm"
                disabled={fieldDialog.mode === 'edit'}
              />
              <p className="text-[10px] text-muted-foreground/70">Use snake_case — this is the API key name.</p>
            </div>

            {/* Type + Criticality */}
            <div className="grid grid-cols-2 gap-4">
              <CustomDropdown
                label="Type"
                value={fieldDialog.data.type}
                options={FIELD_TYPES}
                onChange={(v) => upd({ type: v })}
                renderSelected={(v) => (
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${typeColors[v] || ''}`}>{v}</span>
                )}
                renderOption={(v) => (
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${typeColors[v] || 'bg-muted text-muted-foreground border-border/50'}`}>{v}</span>
                )}
              />
              <CustomDropdown
                label="Criticality"
                value={fieldDialog.data.criticality}
                options={CRITICALITY_VALUES}
                onChange={(v) => upd({ criticality: v })}
                renderSelected={(v) => {
                  const c = critConfig[v];
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${c.bg} ${c.text} ${c.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{v}
                    </span>
                  );
                }}
                renderOption={(v) => {
                  const c = critConfig[v];
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${c.bg} ${c.text} ${c.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{v}
                    </span>
                  );
                }}
              />
            </div>

            {/* Confidence */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Confidence Threshold (0–1)</label>
              <Input placeholder="e.g. 0.90" type="number" step="0.01" min="0" max="1"
                value={fieldDialog.data.confidence_threshold}
                onChange={(e) => upd({ confidence_threshold: e.target.value })}
                className="rounded-xl h-11 text-sm" />
            </div>

            {/* Source docs */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Source Docs</label>
              <Input placeholder="Rx, Clinical Notes, Order Form"
                value={fieldDialog.data.source_docs}
                onChange={(e) => upd({ source_docs: e.target.value })}
                className="rounded-xl h-11 text-sm" />
              <p className="text-[10px] text-muted-foreground/70">Comma-separated list.</p>
            </div>

            {/* Validation */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Validation Rule</label>
              <Input placeholder="Describe validation logic…"
                value={fieldDialog.data.validation}
                onChange={(e) => upd({ validation: e.target.value })}
                className="rounded-xl h-11 text-sm" />
            </div>

            {/* Rationale */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Criticality Rationale</label>
              <textarea
                placeholder="Explain why this field has this criticality…"
                value={fieldDialog.data.criticality_rationale}
                onChange={(e) => upd({ criticality_rationale: e.target.value })}
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border/60 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 resize-none transition-all" />
            </div>

            {/* Toggle switches */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Options</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'required',        label: 'Required',   activeColor: 'bg-primary' },
                  { key: 'active',          label: 'Active',     activeColor: 'bg-emerald-500' },
                  { key: 'cross_doc_check', label: 'Cross-doc',  activeColor: 'bg-violet-500' },
                ].map(({ key, label, activeColor }) => {
                  const on = !!fieldDialog.data[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => upd({ [key]: !on })}
                      className={`flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-xl border cursor-pointer transition-all select-none ${
                        on ? 'border-primary/30 bg-primary/5' : 'border-border/50 hover:border-border bg-muted/20'
                      }`}
                    >
                      {/* Mini toggle track */}
                      <div className={`w-9 h-[18px] rounded-full relative transition-colors duration-200 ${on ? activeColor : 'bg-muted-foreground/20'}`}>
                        <span className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-all duration-200 ${on ? 'left-[18px]' : 'left-0.5'}`} />
                      </div>
                      <span className={`text-[11px] font-bold transition-colors ${on ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {fieldSaveError && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />{fieldSaveError}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border/50 bg-muted/20 flex justify-end gap-2 shrink-0">
            <Button variant="outline" onClick={() => setFieldDialog((p) => ({ ...p, open: false }))}
              disabled={isSavingField} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button onClick={handleFieldSave} disabled={isSavingField} className="rounded-xl font-bold gap-2">
              {isSavingField ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {isSavingField ? 'Saving…' : fieldDialog.mode === 'add' ? 'Add Field' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ── */}
      <Dialog open={deleteDialog.open} onOpenChange={(v) => !v && setDeleteDialog({ open: false, section: '', fieldName: '' })}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />Delete Field
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{' '}
              <span className="font-bold text-foreground">{toLabel(deleteDialog.fieldName)}</span>{' '}
              from <span className="font-bold">{toLabel(deleteDialog.section)}</span>? This cannot be undone.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, section: '', fieldName: '' })}
              disabled={isDeleting} className="rounded-xl font-bold">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="rounded-xl font-bold gap-2">
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              {isDeleting ? 'Deleting…' : 'Delete Field'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Document Type Dialog ── */}
      <Dialog open={docTypeDialog.open} onOpenChange={(v) => !v && setDocTypeDialog((p) => ({ ...p, open: false }))}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              {docTypeDialog.mode === 'add' ? 'Add Document Type' : 'Edit Document Type'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Name</label>
              <Input
                placeholder="e.g. Rx, Order Form"
                value={docTypeDialog.data.name}
                onChange={(e) => setDocTypeDialog(p => ({ ...p, data: { ...p.data, name: e.target.value } }))}
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Description</label>
              <Input
                placeholder="Brief description of the document type"
                value={docTypeDialog.data.description}
                onChange={(e) => setDocTypeDialog(p => ({ ...p, data: { ...p.data, description: e.target.value } }))}
                className="rounded-xl h-11"
              />
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
              <button
                onClick={() => setDocTypeDialog(p => ({ ...p, data: { ...p.data, active: !p.data.active } }))}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${docTypeDialog.data.active ? 'bg-emerald-500' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${docTypeDialog.data.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-xs font-bold text-foreground">Active and enabled for extraction</span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDocTypeDialog(p => ({ ...p, open: false }))} className="rounded-xl font-bold">Cancel</Button>
            <Button onClick={handleDocTypeSave} disabled={isSavingDocType || !docTypeDialog.data.name?.trim()} className="rounded-xl font-bold gap-2">
              {isSavingDocType ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Document Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Routing Section Dialog ── */}
      <Dialog open={routingDialog.open} onOpenChange={(v) => !v && setRoutingDialog((p) => ({ ...p, open: false }))}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-lg flex items-center gap-2">
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                routingDialog.mode === 'add' ? 'bg-primary/15 text-primary' : 'bg-amber-500/15 text-amber-500'
              }`}>
                {routingDialog.mode === 'add' ? <Plus className="w-4.5 h-4.5" /> : <Edit2 className="w-4.5 h-4.5" />}
              </span>
              {routingDialog.mode === 'add' ? 'Add Section to' : 'Edit Section in'} {toLabel(routingDialog.product)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Section Name</label>
              <Input
                placeholder="e.g. patient_demographics"
                value={routingDialog.mode === 'edit' ? toLabel(routingDialog.data.name) : routingDialog.data.name}
                onChange={(e) => setRoutingDialog(p => ({ ...p, data: { ...p.data, name: e.target.value } }))}
                className="rounded-xl h-11"
                disabled={routingDialog.mode === 'edit'}
              />
              {routingDialog.mode === 'edit' && (
                <p className="text-[10px] text-muted-foreground/70">Section name cannot be changed while editing.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Description</label>
              <Input
                placeholder="e.g. Patient identity and contact fields"
                value={routingDialog.data.description}
                onChange={(e) => setRoutingDialog(p => ({ ...p, data: { ...p.data, description: e.target.value } }))}
                className="rounded-xl h-11"
              />
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
              <button
                onClick={() => setRoutingDialog(p => ({ ...p, data: { ...p.data, active: !p.data.active } }))}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${routingDialog.data.active ? 'bg-emerald-500' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${routingDialog.data.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-xs font-bold text-foreground">Include in product routing</span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRoutingDialog(p => ({ ...p, open: false }))} className="rounded-xl font-bold">Cancel</Button>
            <Button onClick={handleRoutingSectionSave} disabled={isSavingRouting || !routingDialog.data.name?.trim()} className="rounded-xl font-bold gap-2">
              {isSavingRouting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {routingDialog.mode === 'add' ? 'Add to Routing' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminExtractionSchema;