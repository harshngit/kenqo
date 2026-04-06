import { useState } from 'react';
import { BookOpen, Plus, Search, ChevronRight, FileText, GitBranch, Edit2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

const diseasesData = [
  {
    id: 1, name: 'Lymphedema', code: 'I89.0', status: 'active',
    rules: 37, documents: 5, payer: 'Medicare FFS',
    description: 'Chronic condition caused by impaired lymphatic drainage resulting in tissue swelling.',
    icd10: ['I89.0', 'I97.2', 'Q82.0'],
    lastUpdated: '2025-03-15',
    color: 'text-primary bg-primary/10 border-primary/20',
  },
  {
    id: 2, name: 'Chronic Venous Insufficiency', code: 'I87.2', status: 'draft',
    rules: 12, documents: 2, payer: 'Medicare FFS',
    description: 'Condition where veins cannot pump enough blood back to the heart from the legs.',
    icd10: ['I87.2', 'I83.0', 'I83.1'],
    lastUpdated: '2025-02-28',
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 3, name: 'Lipedema', code: 'E88.2', status: 'draft',
    rules: 5, documents: 1, payer: 'Medicare Advantage',
    description: 'Disorder of adipose tissue deposition typically affecting lower extremities.',
    icd10: ['E88.2'],
    lastUpdated: '2025-02-10',
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  },
];

const SuperAdminDiseases = () => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = diseasesData.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
            <BookOpen className="w-3.5 h-3.5" /> Disease Catalog
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Diseases
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Manage disease configurations and coverage rules
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <Button className="h-11 px-6 rounded-2xl font-black text-sm gap-2 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95">
            <Plus className="w-4 h-4" /> Add Disease
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative group max-w-2xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
        <Input
          placeholder="Search diseases by name or ICD-10 code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-14 h-14 bg-card border-2 border-border/40 focus:border-primary/40 rounded-[1.25rem] transition-all shadow-sm focus:shadow-md text-sm font-medium placeholder:text-muted-foreground/40"
        />
      </div>

      {/* Disease Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((disease) => (
          <Card
            key={disease.id}
            onClick={() => setSelected(selected === disease.id ? null : disease.id)}
            className={`group border-2 rounded-[2.5rem] overflow-hidden transition-all duration-300 cursor-pointer ${
              selected === disease.id 
                ? 'border-primary/40 bg-card shadow-xl shadow-primary/5 scale-[1.02]' 
                : 'border-border/40 hover:border-primary/20 hover:shadow-lg hover:scale-[1.01]'
            }`}
          >
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider ${disease.color}`}>
                  <BookOpen className="w-3.5 h-3.5" /> {disease.code}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm ${
                  disease.status === 'active' 
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                }`}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${disease.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  {disease.status}
                </span>
              </div>

              <h3 className="font-black text-foreground text-xl mb-2 tracking-tight">{disease.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 font-medium line-clamp-2">{disease.description}</p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center p-3 bg-muted/30 rounded-2xl border border-border/40 group-hover:bg-primary/5 transition-colors">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Rules</p>
                  <p className="text-lg font-black text-foreground">{disease.rules}</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-2xl border border-border/40 group-hover:bg-primary/5 transition-colors">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Docs</p>
                  <p className="text-lg font-black text-foreground">{disease.documents}</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-2xl border border-border/40 group-hover:bg-primary/5 transition-colors">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Payer</p>
                  <p className="text-[11px] font-black text-foreground truncate">{disease.payer.split(' ')[0]}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                {disease.icd10.map(code => (
                  <span key={code} className="text-[11px] font-mono font-bold px-2.5 py-1 bg-muted/50 text-muted-foreground rounded-lg border border-border/40">
                    {code}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-5 border-t border-border/40">
                <span className="text-[10px] font-bold text-muted-foreground/60">Updated {disease.lastUpdated}</span>
                <Button variant="outline" size="sm" className="h-9 px-4 text-xs rounded-xl border-primary/20 text-primary hover:bg-primary hover:text-white font-black transition-all active:scale-95 shadow-sm">
                  <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Card */}
        <div className="border-2 border-dashed border-border/40 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-5 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group min-h-[320px]">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-500 shadow-inner">
            <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-black text-muted-foreground group-hover:text-foreground transition-colors">Add Disease</p>
            <p className="text-sm text-muted-foreground/60 font-medium max-w-[180px]">Configure new disease coverage rules and schema</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDiseases;
