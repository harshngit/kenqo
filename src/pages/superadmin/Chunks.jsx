import { useState } from 'react';
import { Layers, Search, Filter, ChevronRight, FileText, Hash, Copy, Eye, Activity, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

const chunksData = [
  { id: 'CHK-001', docId: 'R12471CP', text: 'Medicare coverage for lymphedema compression garments requires a valid diagnosis of lymphedema with ICD-10 codes I89.0, I97.2, or Q82.0. The diagnosis must be documented in the medical record by the treating physician.', tokens: 48, page: 1, similarity: 0.98 },
  { id: 'CHK-002', docId: 'R12471CP', text: 'Daytime compression garments are limited to a maximum of 3 items per affected body area per 6-month benefit period. This includes gloves, gauntlets, sleeves, and stockings as applicable to the diagnosis.', tokens: 42, page: 2, similarity: 0.95 },
  { id: 'CHK-003', docId: 'R12471CP', text: 'Custom-fitted flat-knit garments require documented clinical justification on the order form. The ordering physician must specify why a standard prefabricated garment is not appropriate for the patient\'s condition.', tokens: 46, page: 3, similarity: 0.92 },
  { id: 'CHK-004', docId: 'R12471CP', text: 'Bilateral garment orders must use RT (right) and LT (left) modifiers on separate claim lines. Failure to include appropriate modifiers may result in claim denial or request for additional documentation.', tokens: 44, page: 4, similarity: 0.90 },
  { id: 'CHK-005', docId: 'R12471CP', text: 'The ordering physician must be an MD, DO, PA, NP, or CNS. The order is not limited to lymphedema specialists — any qualified healthcare provider with prescribing authority may order lymphedema compression garments.', tokens: 50, page: 5, similarity: 0.88 },
  { id: 'CHK-006', docId: 'R12471CP', text: 'Nighttime garments are covered separately and do not count toward the daytime garment limit. Nighttime garments must be ordered with separate documentation specifying their medical necessity for nocturnal compression therapy.', tokens: 45, page: 6, similarity: 0.85 },
];

const SuperAdminChunks = () => {
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(null);

  const filtered = chunksData.filter(c =>
    c.id.toLowerCase().includes(search.toLowerCase()) ||
    c.text.toLowerCase().includes(search.toLowerCase()) ||
    c.docId.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
            <Layers className="w-3.5 h-3.5" /> Intelligence Fragmentation
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Document Chunks
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Analyze and monitor semantic fragments from ingested policy documents
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-card border-2 border-border/40 shadow-sm group hover:border-primary/20 transition-all">
            <Hash className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-sm font-black tracking-tight"><span className="text-primary">{chunksData.length}</span> Total Chunks</span>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Active Chunks',  value: 84,    icon: Layers, color: 'text-foreground', bg: 'bg-foreground/5' },
          { label: 'Avg Token Size',  value: 46,    icon: Hash,   color: 'text-primary',    bg: 'bg-primary/10' },
          { label: 'Source Docs',     value: 1,     icon: FileText, color: 'text-violet-500', bg: 'bg-violet-500/10' },
          { label: 'Avg Similarity',  value: '91%', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        ].map((s) => (
          <Card key={s.label} className="border-2 border-border/40 rounded-[2rem] shadow-sm hover:shadow-md transition-all overflow-hidden relative group">
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500 ${s.color}`}>
              <s.icon className="w-16 h-16" />
            </div>
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">{s.label}</p>
              <p className={`text-3xl font-black tracking-tighter ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="relative group max-w-2xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
        <Input
          placeholder="Search chunks by content, ID, or document reference..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-14 h-14 bg-card border-2 border-border/40 focus:border-primary/40 rounded-[1.25rem] transition-all shadow-sm focus:shadow-md text-sm font-medium placeholder:text-muted-foreground/40"
        />
      </div>

      {/* ── Chunks List ── */}
      <div className="space-y-4">
        {filtered.map((chunk) => (
          <div key={chunk.id} className="group bg-card border-2 border-border/40 rounded-[2rem] p-6 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 shadow-sm">
            <div className="flex items-start justify-between gap-6 mb-5">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 shadow-sm tracking-widest uppercase">{chunk.id}</span>
                <span className="text-[10px] font-black text-muted-foreground/60 bg-muted/50 px-3 py-1.5 rounded-xl border border-border/40 tracking-widest uppercase">{chunk.docId}</span>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/30 border border-border/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                  Page {chunk.page}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-500/10 text-violet-600 border border-violet-500/20 text-[10px] font-black uppercase tracking-widest shadow-sm">
                  <Hash className="w-3.5 h-3.5" />
                  {chunk.tokens} Tokens
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest shadow-sm ${
                  chunk.similarity > 0.93 
                    ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' 
                    : chunk.similarity > 0.88 
                      ? 'text-amber-600 bg-amber-500/10 border-amber-500/20' 
                      : 'text-muted-foreground bg-muted/50 border-border/40'
                }`}>
                  <Activity className="w-3.5 h-3.5" />
                  {(chunk.similarity * 100).toFixed(0)}% Similarity
                </div>
                <button
                  onClick={() => handleCopy(chunk.id, chunk.text)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-primary/10 transition-all text-muted-foreground hover:text-primary border border-border/40 hover:border-primary/20 active:scale-95 group/copy"
                >
                  {copied === chunk.id ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-in zoom-in" />
                  ) : (
                    <Copy className="w-5 h-5 group-hover/copy:scale-110 transition-transform" />
                  )}
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/10 rounded-full group-hover:bg-primary/30 transition-colors" />
              <p className="text-sm text-foreground/70 leading-relaxed font-medium pl-6">{chunk.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuperAdminChunks;
