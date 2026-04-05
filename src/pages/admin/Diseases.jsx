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

const Diseases = () => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = diseasesData.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
            <BookOpen className="w-3.5 h-3.5" />
            Disease Catalog
          </div>
          <h1 className="text-2xl font-black tracking-tight">Diseases</h1>
          <p className="text-muted-foreground text-sm">Manage disease configurations and coverage rules</p>
        </div>
        <Button className="h-9 px-4 rounded-xl text-sm font-bold gap-2 bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20 self-start sm:self-auto">
          <Plus className="w-3.5 h-3.5" /> Add Disease
        </Button>
      </div>

      {/* Search */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Search diseases by name or ICD-10 code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-11 h-11 bg-card border-border/50 focus:border-primary/50 rounded-xl transition-all"
        />
      </div>

      {/* Disease Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((disease) => (
          <Card
            key={disease.id}
            onClick={() => setSelected(selected === disease.id ? null : disease.id)}
            className={`border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer ${
              selected === disease.id ? 'border-primary/40 shadow-md shadow-primary/10' : 'border-border/50 hover:shadow-sm hover:border-border'
            }`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black ${disease.color}`}>
                  <BookOpen className="w-3 h-3" /> {disease.code}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  disease.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {disease.status}
                </span>
              </div>

              <h3 className="font-black text-foreground text-sm mb-1.5">{disease.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">{disease.description}</p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-muted/30 rounded-lg">
                  <p className="text-[9px] font-bold text-muted-foreground mb-0.5">Rules</p>
                  <p className="text-sm font-black text-foreground">{disease.rules}</p>
                </div>
                <div className="text-center p-2 bg-muted/30 rounded-lg">
                  <p className="text-[9px] font-bold text-muted-foreground mb-0.5">Docs</p>
                  <p className="text-sm font-black text-foreground">{disease.documents}</p>
                </div>
                <div className="text-center p-2 bg-muted/30 rounded-lg">
                  <p className="text-[9px] font-bold text-muted-foreground mb-0.5">Payer</p>
                  <p className="text-[10px] font-bold text-foreground truncate">{disease.payer.split(' ')[0]}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {disease.icd10.map(code => (
                  <span key={code} className="text-[10px] font-mono font-bold px-2 py-0.5 bg-muted/50 text-muted-foreground rounded-md">
                    {code}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/40">
                <span className="text-[10px] text-muted-foreground/60">Updated {disease.lastUpdated}</span>
                <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs rounded-lg hover:bg-primary/10 hover:text-primary font-bold gap-1">
                  <Edit2 className="w-3 h-3" /> Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Card */}
        <div className="border-2 border-dashed border-border/40 rounded-xl p-5 flex flex-col items-center justify-center gap-3 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group min-h-[200px]">
          <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">Add Disease</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">Configure new disease coverage</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Diseases;
