import { useState } from 'react';
import { Map, ChevronRight, ArrowRight, Plus, Edit2, Trash2, Save, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const mappings = [
  { id: 1, source: 'patient_name',         target: 'Patient.fullName',       docType: 'Rx',       transform: 'titleCase',   active: true },
  { id: 2, source: 'dob',                  target: 'Patient.dateOfBirth',    docType: 'Rx',       transform: 'dateISO',      active: true },
  { id: 3, source: 'mbi',                  target: 'Patient.MBI',            docType: 'Insurance', transform: 'uppercase',   active: true },
  { id: 4, source: 'payer_name',           target: 'Insurance.payerName',    docType: 'Insurance', transform: 'trim',        active: true },
  { id: 5, source: 'npi',                  target: 'Provider.NPI',           docType: 'Rx',       transform: 'numeric',      active: true },
  { id: 6, source: 'hcpcs_code',           target: 'Order.HCPCSCode',        docType: 'Rx',       transform: 'uppercase',    active: true },
  { id: 7, source: 'diagnosis_code',       target: 'Clinical.ICD10',         docType: 'LMN',      transform: 'uppercase',    active: true },
  { id: 8, source: 'quantity',             target: 'Order.quantity',         docType: 'Rx',       transform: 'integer',      active: false },
];

const Mapping = () => {
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
            <Map className="w-3.5 h-3.5" />
            Field Mapping
          </div>
          <h1 className="text-2xl font-black tracking-tight">Mapping</h1>
          <p className="text-muted-foreground text-sm">Map extracted fields to target schema properties</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Button variant="outline" className="h-9 px-4 rounded-xl text-sm font-bold gap-2">
            <Plus className="w-3.5 h-3.5" /> Add Mapping
          </Button>
          <Button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} className="h-9 px-4 rounded-xl text-sm font-bold gap-2 bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20">
            {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saved ? 'Saved!' : 'Save Mappings'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Mappings', value: mappings.length },
          { label: 'Active',         value: mappings.filter(m => m.active).length },
          { label: 'Doc Types',      value: [...new Set(mappings.map(m => m.docType))].length },
          { label: 'Transforms',     value: [...new Set(mappings.map(m => m.transform))].length },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border/50 rounded-xl p-4">
            <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-1.5">{s.label}</p>
            <p className="text-2xl font-black text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Mappings Table */}
      <Card className="border border-border/50 shadow-sm rounded-xl overflow-hidden bg-card/50">
        <CardHeader className="px-5 py-4 border-b border-border/50">
          <CardTitle className="text-sm font-bold tracking-tight">Field Mappings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="px-5 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Source Field</th>
                  <th className="px-5 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground"></th>
                  <th className="px-5 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Target Field</th>
                  <th className="px-5 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Doc Type</th>
                  <th className="px-5 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Transform</th>
                  <th className="px-5 py-3 text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {mappings.map((m) => (
                  <tr key={m.id} className="group hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-foreground/80 bg-muted/50 px-2 py-0.5 rounded">{m.source}</span>
                    </td>
                    <td className="px-2 py-3.5">
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40" />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-primary/80 bg-primary/5 px-2 py-0.5 rounded">{m.target}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] font-bold bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-md">{m.docType}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md font-mono">{m.transform}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                        {m.active ? 'active' : 'inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="w-6 h-6 rounded hover:bg-primary/10 hover:text-primary">
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-6 h-6 rounded hover:bg-red-500/10 hover:text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Mapping;
