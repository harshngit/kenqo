import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Users,
  Search,
  UserPlus,
  Edit2,
  ExternalLink,
  Loader2,
  Calendar,
  CreditCard,
  Hash,
  Shield,
  AlertCircle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';

import { listPatients, createPatient, updatePatient } from '../../../services/intakeApi';

// A patient record is considered incomplete when it is missing identity fields
// that the backend needs for reliable matching.
const isIdentityIncomplete = (p) =>
  p.identity_incomplete ||
  (!p.dob && !p.medicare_id && !p.member_id);

const IntakePatients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const searchTimerRef = useRef(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingPatient, setEditingPatient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialForm = {
    first_name: '',
    last_name: '',
    dob: '',
    medicare_id: '',
    member_id: '',
    payer_id: '',
    gender: 'Unknown',
    address: ''
  };

  const [form, setForm] = useState(initialForm);

  const fetchPatients = useCallback(async (query = '') => {
    setIsLoading(true);
    try {
      const data = await listPatients(query);
      setPatients(data.patients || []);
    } catch (error) {
      console.error('Failed to load patients:', error);
      toast.error('Failed to load patient data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => fetchPatients(value), 400);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingPatient(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEditModal = (patient) => {
    setModalMode('edit');
    setEditingPatient(patient);
    setForm({
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      dob: patient.dob || '',
      medicare_id: patient.medicare_id || '',
      member_id: patient.member_id || '',
      payer_id: patient.payer_id || '',
      gender: patient.gender || 'Unknown',
      address: patient.address || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        await createPatient(form);
        toast.success('Patient created');
      } else {
        await updatePatient(editingPatient.patient_id, form);
        toast.success('Patient updated');
      }
      fetchPatients(search);
      setModalOpen(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const maskMedicareId = (id) => {
    if (!id) return '—';
    return `•••••••${id.slice(-4)}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
            <Users className="w-3.5 h-3.5" />
            Patient Registry
          </div>
          <h1 className="text-2xl font-black tracking-tight">Patients</h1>
          <p className="text-muted-foreground text-sm font-medium">Manage and monitor all clinical patient profiles</p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-10 px-5 rounded-xl font-bold text-sm group"
        >
          <UserPlus className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
          Add Patient
        </Button>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-lg shadow-black/5 rounded-2xl bg-card/50 backdrop-blur-sm border-white/20 overflow-hidden">
        <CardContent className="p-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search patients by name, DOB, or Medicare ID..."
              value={search}
              onChange={handleSearchChange}
              className="pl-11 h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl text-base transition-all"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patient Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-none shadow-xl shadow-black/[0.03] rounded-[2rem] h-64 animate-pulse bg-muted/20" />
          ))}
        </div>
      ) : patients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((p) => {
            const incomplete = isIdentityIncomplete(p);
            return (
              <Card
                key={p.patient_id}
                className={`border-none shadow-xl shadow-black/[0.03] rounded-[2rem] bg-card overflow-hidden group hover:scale-[1.02] transition-all duration-300 ${
                  incomplete ? 'ring-1 ring-amber-500/20' : ''
                }`}
              >
                <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between border-b border-border/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black uppercase shrink-0 ${
                      incomplete ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary'
                    }`}>
                      {p.first_name?.[0] ?? '?'}{p.last_name?.[0] ?? ''}
                    </div>
                    <CardTitle className="text-base font-black tracking-tight truncate max-w-[140px]">
                      {p.first_name} {p.last_name}
                    </CardTitle>
                  </div>
                  {incomplete && (
                    <span
                      className="text-[9px] font-black bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded uppercase tracking-widest border border-amber-500/20 shrink-0 flex items-center gap-1 cursor-pointer hover:bg-amber-500/20 transition-colors"
                      title="Identity fields are incomplete — click Edit to complete this profile"
                      onClick={() => openEditModal(p)}
                    >
                      <AlertCircle className="w-2.5 h-2.5" />
                      Incomplete
                    </span>
                  )}
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground/60 font-black uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> DOB
                      </span>
                      <span className={`font-bold ${!p.dob ? 'text-amber-500/60 italic' : 'text-foreground'}`}>
                        {p.dob || 'Missing'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground/60 font-black uppercase tracking-widest flex items-center gap-1.5">
                        <CreditCard className="w-3 h-3" /> Medicare ID
                      </span>
                      <span className={`font-mono font-bold ${!p.medicare_id ? 'text-muted-foreground/40' : 'text-foreground'}`}>
                        {maskMedicareId(p.medicare_id)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground/60 font-black uppercase tracking-widest flex items-center gap-1.5">
                        <Hash className="w-3 h-3" /> Member ID
                      </span>
                      <span className={`font-bold ${!p.member_id ? 'text-muted-foreground/40' : 'text-foreground'}`}>
                        {p.member_id || '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground/60 font-black uppercase tracking-widest flex items-center gap-1.5">
                        <Shield className="w-3 h-3" /> Payer
                      </span>
                      <span className="font-bold text-foreground truncate max-w-[120px]" title={p.payer_id}>
                        {p.payer_id || '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-border/10">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 border-primary/20 text-primary hover:bg-primary/5"
                      onClick={() => navigate(`/admin/intake?patient=${p.patient_id}`)}
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Orders
                    </Button>
                    <Button
                      variant={incomplete ? 'default' : 'ghost'}
                      size="sm"
                      className={`h-9 w-9 rounded-xl transition-colors ${
                        incomplete
                          ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border border-amber-500/20'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                      title={incomplete ? 'Complete patient profile' : 'Edit patient'}
                      onClick={() => openEditModal(p)}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="py-24 text-center">
          <Card className="max-w-md mx-auto border-none bg-transparent shadow-none">
            <CardContent className="space-y-6">
              <div className="w-20 h-20 bg-muted rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                <Users className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black tracking-tight">
                  {search ? 'No patients match your search' : 'No patients yet'}
                </h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  {search
                    ? 'Try a different name, DOB, or Medicare ID.'
                    : 'Patients are created automatically when orders are processed or can be added manually.'}
                </p>
              </div>
              {!search && (
                <Button
                  onClick={openCreateModal}
                  className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add First Patient
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] border-2 border-border/40 p-10">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-black tracking-tight uppercase tracking-widest">
              {modalMode === 'create' ? 'Add New Patient' : 'Edit Patient Profile'}
            </DialogTitle>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              {modalMode === 'create'
                ? 'Initialize a new clinical identity'
                : `Updating profile for patient ID: ${editingPatient?.patient_id?.substring(0, 8)}...`}
            </p>
            {modalMode === 'edit' && editingPatient && isIdentityIncomplete(editingPatient) && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 mt-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-xs font-bold text-amber-700">
                  This patient has incomplete identity fields. Adding DOB, Medicare ID, or Member ID will improve matching accuracy.
                </p>
              </div>
            )}
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">First Name <span className="text-red-500">*</span></label>
                <Input required value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} className="h-12 rounded-xl border-2 border-border/40 focus:border-primary/40 text-sm font-bold shadow-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Last Name <span className="text-red-500">*</span></label>
                <Input required value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} className="h-12 rounded-xl border-2 border-border/40 focus:border-primary/40 text-sm font-bold shadow-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Date of Birth <span className="text-red-500">*</span></label>
                <Input required type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} className="h-12 rounded-xl border-2 border-border/40 focus:border-primary/40 text-sm font-bold shadow-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Medicare ID</label>
                <Input value={form.medicare_id} onChange={e => setForm({...form, medicare_id: e.target.value})} className="h-12 rounded-xl border-2 border-border/40 focus:border-primary/40 text-sm font-bold shadow-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Member ID</label>
                <Input value={form.member_id} onChange={e => setForm({...form, member_id: e.target.value})} className="h-12 rounded-xl border-2 border-border/40 focus:border-primary/40 text-sm font-bold shadow-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Payer ID</label>
                <Input value={form.payer_id} onChange={e => setForm({...form, payer_id: e.target.value})} className="h-12 rounded-xl border-2 border-border/40 focus:border-primary/40 text-sm font-bold shadow-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Gender</label>
                <Select value={form.gender} onValueChange={v => setForm({...form, gender: v})}>
                  <SelectTrigger className="h-12 rounded-xl border-2 border-border/40 bg-card text-sm font-bold focus:border-primary/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-2 shadow-xl">
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Full Address</label>
                <textarea
                  className="w-full h-24 rounded-2xl border-2 border-border/40 bg-card p-4 text-sm font-bold focus:border-primary/40 focus:outline-none transition-all resize-none shadow-sm"
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                />
              </div>
            </div>

            <DialogFooter className="gap-3">
              <DialogClose asChild>
                <Button type="button" variant="ghost" className="h-14 flex-1 rounded-2xl font-black uppercase tracking-widest text-[11px]">Cancel</Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-14 flex-1 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  modalMode === 'create' ? 'Create Patient' : 'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntakePatients;
