import { useState } from 'react';
import { Database, Plus, Edit2, Trash2, Save, X, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

const initialFields = [
  { id: 1, name: 'patient_demographics', type: 'object',  criticality: 'RED',    required: true,  description: 'Patient name, DOB, address, MBI' },
  { id: 2, name: 'insurance',            type: 'object',  criticality: 'RED',    required: true,  description: 'Payer name, policy number, group ID' },
  { id: 3, name: 'provider',             type: 'object',  criticality: 'RED',    required: true,  description: 'NPI, taxonomy, credentials, signature' },
  { id: 4, name: 'clinical_findings',    type: 'object',  criticality: 'RED',    required: true,  description: 'Diagnosis codes, clinical notes, severity' },
  { id: 5, name: 'measurements',         type: 'array',   criticality: 'YELLOW', required: true,  description: 'Body measurements for garment sizing' },
  { id: 6, name: 'garment_order',        type: 'object',  criticality: 'RED',    required: true,  description: 'HCPCS codes, quantity, garment type' },
  { id: 7, name: 'pump_order',           type: 'object',  criticality: 'YELLOW', required: false, description: 'Pneumatic compression device details' },
  { id: 8, name: 'facility',             type: 'string',  criticality: 'GREEN',  required: false, description: 'Facility name and NPI' },
  { id: 9, name: 'lmn',                  type: 'object',  criticality: 'YELLOW', required: false, description: 'Letter of medical necessity details' },
  { id: 10,name: 'key_dates',            type: 'object',  criticality: 'GREEN',  required: false, description: 'Order date, start date, benefit period' },
  { id: 11,name: 'pain_assessment',      type: 'number',  criticality: 'GREEN',  required: false, description: 'Pain scale 0-10' },
  { id: 12,name: 'e0652_step_therapy',   type: 'boolean', criticality: 'YELLOW', required: false, description: 'Step therapy compliance flag' },
];

const criticalityConfig = {
  RED:    { color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' },
  YELLOW: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20' },
  GREEN:  { color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' },
};

const ExtractionSchema = () => {
  const [fields, setFields] = useState(initialFields);
  const [editing, setEditing] = useState(null);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const counts = {
    RED:    fields.filter(f => f.criticality === 'RED').length,
    YELLOW: fields.filter(f => f.criticality === 'YELLOW').length,
    GREEN:  fields.filter(f => f.criticality === 'GREEN').length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
            <Database className="w-3.5 h-3.5" />
            Schema Config
          </div>
          <h1 className="text-2xl font-black tracking-tight">Extraction Schema</h1>
          <p className="text-muted-foreground text-sm">Define fields extracted from medical documentation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-9 px-4 rounded-xl text-sm font-bold gap-2">
            <Plus className="w-3.5 h-3.5" /> Add Field
          </Button>
          <Button onClick={handleSave} className="h-9 px-4 rounded-xl text-sm font-bold gap-2 bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20">
            {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saved ? 'Saved!' : 'Save Schema'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(counts).map(([key, val]) => (
          <div key={key} className={`border rounded-xl p-4 ${criticalityConfig[key].color}`}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">{key} Fields</p>
            <p className="text-2xl font-black">{val}</p>
          </div>
        ))}
      </div>

      {/* Field breakdown bar */}
      <div className="bg-card border border-border/50 rounded-xl p-5">
        <p className="text-xs font-bold text-foreground mb-3">Field criticality overview</p>
        <div className="flex rounded-full overflow-hidden h-3 mb-3">
          {[
            { key: 'RED', color: 'bg-red-500', count: counts.RED },
            { key: 'YELLOW', color: 'bg-yellow-400', count: counts.YELLOW },
            { key: 'GREEN', color: 'bg-emerald-500', count: counts.GREEN },
          ].map(({ key, color, count }) => (
            <div key={key} className={color} style={{ width: `${(count / fields.length) * 100}%` }} />
          ))}
        </div>
        <div className="flex gap-4">
          {[
            { label: 'RED',    color: 'bg-red-500',     count: counts.RED },
            { label: 'YELLOW', color: 'bg-yellow-400',  count: counts.YELLOW },
            { label: 'GREEN',  color: 'bg-emerald-500', count: counts.GREEN },
          ].map(({ label, color, count }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-[11px] font-semibold text-muted-foreground">{label} {count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fields Table */}
      <Card className="border border-border/50 shadow-sm rounded-xl overflow-hidden bg-card/50">
        <CardHeader className="px-5 py-4 border-b border-border/50">
          <CardTitle className="text-sm font-bold tracking-tight">Schema Fields ({fields.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/40">
            {fields.map((field) => (
              <div key={field.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-foreground font-mono">{field.name}</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">{field.type}</span>
                    {field.required && (
                      <span className="text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-wide">required</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${criticalityConfig[field.criticality].color}`}>
                    {field.criticality}
                  </span>
                  <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary">
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExtractionSchema;
