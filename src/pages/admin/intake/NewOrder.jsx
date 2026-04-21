import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
  User,
  FileText,
  Check,
  Search,
  Plus,
  Upload,
  X,
  File,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  ClipboardCheck,
  Info
} from 'lucide-react';

import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';

import { createPatient, listPatients, createOrder } from '../../../services/intakeApi';

const DOC_TYPES = [
  'Auto-detect',
  'Rx',
  'Clinical Notes',
  'Insurance Card',
  'Order Form',
  'LMN',
  'Measurement Form'
];

const DISEASE_LABELS = {
  lymphedema: 'Lymphedema',
  wound_care: 'Wound Care',
  oncology: 'Oncology',
};

const NewOrder = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const patientSearchRequestRef = useRef(0);

  // Progress State
  const [step, setStep] = useState(1);

  // Step 1: Patient State
  const [selectionMode, setSelectionMode] = useState('auto');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [defaultPatientResults, setDefaultPatientResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasLoadedDefaultPatients, setHasLoadedDefaultPatients] = useState(false);
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [createPatientForm, setCreatePatientForm] = useState({
    first_name: '',
    last_name: '',
    dob: '',
    medicare_id: '',
    member_id: '',
    payer_id: '',
    gender: 'Unknown',
    address: ''
  });

  // Step 2: Documents State
  const [files, setFiles] = useState([]);
  const [disease, setDisease] = useState('lymphedema');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState(null);

  const loadPatientResults = async (search = '') => {
    const requestId = patientSearchRequestRef.current + 1;
    patientSearchRequestRef.current = requestId;
    setIsSearching(true);
    try {
      const query = search.trim();
      const data = await listPatients(query);
      if (patientSearchRequestRef.current === requestId) {
        setPatientResults(data.patients || []);
        if (!query) {
          setDefaultPatientResults(data.patients || []);
          setHasLoadedDefaultPatients(true);
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
      if (patientSearchRequestRef.current === requestId) {
        setPatientResults([]);
      }
    } finally {
      if (patientSearchRequestRef.current === requestId) {
        setIsSearching(false);
      }
    }
  };

  const selectManualMode = () => {
    setSelectionMode('manual');
    if (hasLoadedDefaultPatients) {
      setPatientResults(defaultPatientResults);
    } else if (!isSearching) {
      loadPatientResults('');
    }
  };

  useEffect(() => {
    loadPatientResults('');
  }, []);

  // Patient Search Debounce
  useEffect(() => {
    if (selectionMode !== 'manual') {
      return;
    }

    if (!patientSearch.trim() && hasLoadedDefaultPatients) {
      setPatientResults(defaultPatientResults);
      return;
    }

    const handler = setTimeout(() => {
      loadPatientResults(patientSearch);
    }, patientSearch.trim() ? 400 : 0);

    return () => clearTimeout(handler);
  }, [patientSearch, selectionMode, hasLoadedDefaultPatients, defaultPatientResults]);

  // File Upload Handlers
  const handleFileChange = (e) => {
    const incoming = Array.from(e.target.files || []);

    const nonPdfs = incoming.filter(f => f.type !== 'application/pdf');
    if (nonPdfs.length > 0) {
      toast.error('Only PDF files are allowed');
      e.target.value = '';
      return;
    }

    const existingNames = new Set(
      files
        .map(f => f.file?.name || f.name)
        .filter(Boolean)
    );
    const duplicates = incoming.filter(f => existingNames.has(f.name));
    const unique = incoming.filter(f => !existingNames.has(f.name));

    if (duplicates.length > 0) {
      toast.warning(
        `${duplicates.length} duplicate file${duplicates.length > 1 ? 's' : ''} skipped: ${duplicates.map(f => f.name).join(', ')}`
      );
    }

    if (unique.length > 0) {
      setFiles(prev => [
        ...prev.filter(f => f.file instanceof File),
        ...unique.map(f => ({ file: f, docType: 'Auto-detect' }))
      ]);
    }

    e.target.value = '';
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateDocType = (index, type) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, docType: type } : f));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Create Patient Handler
  const handleCreatePatient = async (e) => {
    e.preventDefault();
    try {
      const result = await createPatient(createPatientForm);
      setSelectedPatient(result);
      setShowCreatePatient(false);
      toast.success('Patient created and selected');
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Submit Handler
  const handleSubmitOrder = async () => {
    if (selectionMode === 'manual' && !selectedPatient) {
      toast.error('Please select a patient before submitting');
      return;
    }
    if (files.length === 0) {
      toast.error('Please upload at least one document');
      return;
    }

    const validFiles = files.filter(
  f => f.file && typeof f.file === 'object' && 'name' in f.file
);
    if (validFiles.length === 0) {
      toast.error('Please re-select the document files before submitting');
      return;
    }

    const kbId = user?.kb_id || user?.user_id || user?.id;
    if (!kbId) {
      toast.error('Missing knowledge base ID. Please log out and log back in.');
      return;
    }

    setOrderError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('disease', disease);
      formData.append('kb_id', kbId);
      formData.append('selection_mode', selectionMode);

      if (selectionMode === 'manual' && selectedPatient) {
        formData.append('patient_id', selectedPatient.patient_id);
      }

      const docTypes = validFiles.map(f => f.docType === 'Auto-detect' ? 'auto' : f.docType);
      formData.append('doc_types', JSON.stringify(docTypes));

      validFiles.forEach(f => {
        formData.append('files', f.file);
      });

      const result = await createOrder(formData);
      toast.success('Order created — extraction starting');
      navigate(`/admin/intake/orders/${result.order_id}`);
    } catch (error) {
      const msg = error.message || 'Failed to create order. Please try again.';
      setOrderError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Progress Header */}
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight">Create New Intake Order</h1>
          <p className="text-muted-foreground text-sm font-medium">Follow the steps below to initiate clinical extraction.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between relative px-2">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0" />
          {[
            { n: 1, label: 'Patient' },
            { n: 2, label: 'Documents' },
            { n: 3, label: 'Review' }
          ].map((s) => (
            <div key={s.n} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${
                step >= s.n ? 'bg-primary border-primary text-white scale-110' : 'bg-card border-muted text-muted-foreground'
              }`}>
                {step > s.n ? <Check className="w-5 h-5" /> : <span className="text-xs font-black">{s.n}</span>}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${
                step >= s.n ? 'text-primary' : 'text-muted-foreground/40'
              }`}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── STEP 1: Patient Selection ─────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card
              onClick={() => { setSelectionMode('auto'); setSelectedPatient(null); }}
              className={`cursor-pointer transition-all duration-300 border-2 rounded-[2.5rem] p-8 space-y-4 hover:shadow-xl ${
                selectionMode === 'auto' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : 'border-border/40 bg-muted/5'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                selectionMode === 'auto' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              }`}>
                <FileText className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black tracking-tight">Auto-identify</h3>
                <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                  Patient will be identified automatically from uploaded documents using AI extraction.
                </p>
              </div>
              {selectionMode === 'auto' && (
                <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                  <Check className="w-3.5 h-3.5" /> Selected
                </div>
              )}
            </Card>

            <Card
              onClick={selectManualMode}
              className={`cursor-pointer transition-all duration-300 border-2 rounded-[2.5rem] p-8 space-y-4 hover:shadow-xl ${
                selectionMode === 'manual' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : 'border-border/40 bg-muted/5'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                selectionMode === 'manual' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              }`}>
                <User className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black tracking-tight">Select Manually</h3>
                <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                  Choose an existing patient from the registry or create a new profile.
                </p>
              </div>
              {selectionMode === 'manual' && (
                <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                  <Check className="w-3.5 h-3.5" /> Selected
                </div>
              )}
            </Card>
          </div>

          {selectionMode === 'manual' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              {selectedPatient && (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xs font-black uppercase shrink-0">
                    {selectedPatient.first_name?.[0] ?? '?'}{selectedPatient.last_name?.[0] ?? ''}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-emerald-700">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                    <p className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-widest">
                      DOB: {selectedPatient.dob || '—'} • Medicare: {selectedPatient.medicare_id || '—'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-xl text-emerald-700 hover:bg-emerald-500/10"
                    onClick={() => setSelectedPatient(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Search by name, DOB, or Medicare ID..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="pl-11 h-12 rounded-2xl border-2 border-border/40 focus:border-primary/40 text-sm font-bold shadow-sm"
                  />
                  {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary/40" />}
                </div>
                <Button
                  onClick={() => setShowCreatePatient(true)}
                  variant="outline"
                  className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 border-primary/20 text-primary hover:bg-primary/5"
                >
                  <Plus className="w-4 h-4 mr-2" /> New Patient
                </Button>
              </div>

              {patientResults.length > 0 && (
                <Card className="border-none shadow-xl shadow-black/[0.03] rounded-[2rem] overflow-hidden">
                  <div className="divide-y divide-border/40">
                    {patientResults.map((p) => {
                      const isSelected = selectedPatient?.patient_id === p.patient_id;
                      return (
                        <div
                          key={p.patient_id}
                          className={`p-5 flex items-center justify-between hover:bg-muted/30 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black uppercase ${
                              isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                            }`}>
                              {p.first_name?.[0] ?? '?'}{p.last_name?.[0] ?? ''}
                            </div>
                            <div>
                              <p className="text-sm font-black">{p.first_name} {p.last_name}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                DOB: {p.dob || '—'} • Medicare: {p.medicare_id || '—'}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => setSelectedPatient(p)}
                            variant={isSelected ? 'default' : 'ghost'}
                            className={`h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              isSelected ? 'bg-primary shadow-lg shadow-primary/20' : 'text-primary'
                            }`}
                          >
                            {isSelected && <Check className="w-4 h-4 mr-2" />}
                            {isSelected ? 'Selected' : 'Select'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {!isSearching && patientResults.length === 0 && (
                <p className="text-center text-xs font-bold text-muted-foreground py-4">
                  {patientSearch.trim()
                    ? `No patients found for "${patientSearch}" - create a new profile above.`
                    : 'No patients found - create a new profile above.'}
                </p>
              )}

              {showCreatePatient && (
                <Card className="border-2 border-primary/20 bg-primary/[0.02] rounded-[2.5rem] p-8 animate-in zoom-in-95 duration-300">
                  <form onSubmit={handleCreatePatient} className="space-y-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-black tracking-tight flex items-center gap-2">
                        <Plus className="w-5 h-5 text-primary" /> Create New Patient Profile
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">First Name <span className="text-red-500">*</span></label>
                        <Input required value={createPatientForm.first_name} onChange={e => setCreatePatientForm({...createPatientForm, first_name: e.target.value})} className="h-11 rounded-xl bg-card border-border/60" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Last Name <span className="text-red-500">*</span></label>
                        <Input required value={createPatientForm.last_name} onChange={e => setCreatePatientForm({...createPatientForm, last_name: e.target.value})} className="h-11 rounded-xl bg-card border-border/60" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Date of Birth <span className="text-red-500">*</span></label>
                        <Input required type="date" value={createPatientForm.dob} onChange={e => setCreatePatientForm({...createPatientForm, dob: e.target.value})} className="h-11 rounded-xl bg-card border-border/60" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Medicare ID</label>
                        <Input value={createPatientForm.medicare_id} onChange={e => setCreatePatientForm({...createPatientForm, medicare_id: e.target.value})} className="h-11 rounded-xl bg-card border-border/60" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Member ID</label>
                        <Input value={createPatientForm.member_id} onChange={e => setCreatePatientForm({...createPatientForm, member_id: e.target.value})} className="h-11 rounded-xl bg-card border-border/60" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Payer</label>
                        <Input value={createPatientForm.payer_id} onChange={e => setCreatePatientForm({...createPatientForm, payer_id: e.target.value})} className="h-11 rounded-xl bg-card border-border/60" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Gender</label>
                        <Select value={createPatientForm.gender} onValueChange={v => setCreatePatientForm({...createPatientForm, gender: v})}>
                          <SelectTrigger className="h-11 rounded-xl bg-card border-border/60">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Unknown">Unknown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Address</label>
                        <textarea
                          className="w-full h-24 rounded-xl bg-card border border-border/60 p-3 text-sm font-medium focus:border-primary/40 focus:outline-none transition-all resize-none"
                          value={createPatientForm.address}
                          onChange={e => setCreatePatientForm({...createPatientForm, address: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="button" variant="ghost" onClick={() => setShowCreatePatient(false)} className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</Button>
                      <Button type="submit" className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-primary shadow-xl shadow-primary/20">Create Patient</Button>
                    </div>
                  </form>
                </Card>
              )}
            </div>
          )}

          <div className="flex justify-end pt-10">
            <Button
              onClick={() => setStep(2)}
              disabled={selectionMode === 'manual' && !selectedPatient}
              className="h-14 px-10 rounded-[2rem] bg-primary text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/20 group transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue to Documents <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Documents ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
          <label className="block">
            <Card className="border-4 border-dashed border-border/40 bg-muted/5 rounded-[3rem] p-16 flex flex-col items-center gap-6 hover:border-primary/40 transition-all cursor-pointer relative group overflow-hidden">
              <div className="absolute inset-0 bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner">
                <Upload className="w-10 h-10" />
              </div>
              <div className="text-center space-y-2 relative z-10">
                <h3 className="text-xl font-black tracking-tight">Upload Clinical Documents</h3>
                <p className="text-sm font-medium text-muted-foreground">PDF files only · max 50 MB each · duplicates skipped</p>
              </div>
              <input
                type="file"
                multiple
                accept="application/pdf"
                onChange={handleFileChange}
                className="sr-only"
              />
            </Card>
          </label>

          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <File className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{files.length} File{files.length > 1 ? 's' : ''} Selected</span>
              </div>
              <div className="space-y-3">
                {files.map((f, i) => (
                  <Card key={`${f.file.name}-${i}`} className="border-none shadow-xl shadow-black/[0.03] rounded-3xl p-5 bg-card flex items-center gap-6 group hover:bg-primary/[0.02] transition-colors">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black truncate" title={f.file.name}>{f.file.name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{formatFileSize(f.file.size)}</p>
                    </div>
                    <div className="w-48">
                      <Select value={f.docType} onValueChange={(v) => updateDocType(i, v)}>
                        <SelectTrigger className="h-10 rounded-xl bg-muted/50 border-none text-[10px] font-black uppercase tracking-widest focus:ring-primary/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DOC_TYPES.map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-95"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-2 px-2">
              <ClipboardCheck className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Disease Domain</span>
            </div>
            <div className="w-full max-w-sm">
              <Select value={disease} onValueChange={setDisease}>
                <SelectTrigger className="h-14 rounded-[1.5rem] border-2 border-border/40 bg-card px-6 text-sm font-black focus:border-primary/40 focus:ring-0 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2">
                  <SelectItem value="lymphedema" className="font-black">Lymphedema</SelectItem>
                  <SelectItem value="wound_care" disabled className="opacity-40">Wound Care (Coming Soon)</SelectItem>
                  <SelectItem value="oncology" disabled className="opacity-40">Oncology (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between pt-10">
            <Button
              variant="ghost"
              onClick={() => setStep(1)}
              className="h-14 px-10 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px]"
            >
              <ArrowLeft className="w-4 h-4 mr-3" /> Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={files.length === 0}
              className="h-14 px-10 rounded-[2rem] bg-primary text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/20 group transition-all active:scale-95 disabled:opacity-40"
            >
              Review Order <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Review & Submit ───────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
          <Card className="border-none shadow-2xl shadow-black/[0.03] rounded-[3rem] bg-card overflow-hidden">
            <div className="p-10 space-y-10">
              <div className="flex items-center gap-4 border-b border-border/40 pb-6">
                <div className="w-14 h-14 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary">
                  <Info className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight uppercase tracking-[0.1em]">Order Summary</h3>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Verify the information below before submission.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Patient & Mode</p>
                    <div className="space-y-3">
                      <span className={`inline-flex text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${
                        selectionMode === 'auto'
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                      }`}>
                        {selectionMode} mode
                      </span>
                      <p className="text-xl font-black tracking-tight">
                        {selectionMode === 'auto'
                          ? 'Auto-identify from documents'
                          : `${selectedPatient?.first_name} ${selectedPatient?.last_name}`}
                      </p>
                      {selectionMode === 'manual' && selectedPatient?.dob && (
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          DOB: {selectedPatient.dob}
                          {selectedPatient.medicare_id ? ` · Medicare: ${selectedPatient.medicare_id}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Clinical Context</p>
                    <p className="text-lg font-black uppercase tracking-tight text-primary">
                      {DISEASE_LABELS[disease] || disease}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{files.length} Document{files.length > 1 ? 's' : ''}</p>
                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                      {files.map((f, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-muted/30 border border-border/20">
                          <span className="text-[10px] font-black text-muted-foreground/40 mt-1">{i + 1}.</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-black truncate" title={f.file.name}>{f.file.name}</p>
                            <p className="text-[9px] font-black text-primary uppercase tracking-tighter">{f.docType}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Inline error display */}
          {orderError && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/20 animate-in fade-in duration-300">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-black text-red-600 uppercase tracking-widest">Submission Failed</p>
                <p className="text-sm font-medium text-red-700/80">{orderError}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <Button
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className="h-16 w-full rounded-[2rem] bg-primary text-white font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:scale-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Initiating Clinical Extraction...
                </>
              ) : (
                'Submit Order for Extraction'
              )}
            </Button>
            <Button
              variant="ghost"
              disabled={isSubmitting}
              onClick={() => { setStep(2); setOrderError(null); }}
              className="h-14 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] text-muted-foreground disabled:opacity-40"
            >
              <ArrowLeft className="w-3 h-3 mr-2" /> Back to Documents
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewOrder;
