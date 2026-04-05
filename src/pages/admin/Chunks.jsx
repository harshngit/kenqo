import { useState } from 'react';
import { Layers, Search, Filter, ChevronRight, FileText, Hash, Copy, Eye } from 'lucide-react';
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

const Chunks = () => {
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
            <Layers className="w-3.5 h-3.5" />
            Document Chunks
          </div>
          <h1 className="text-2xl font-black tracking-tight">Chunks</h1>
          <p className="text-muted-foreground text-sm">Semantic chunks extracted from ingested policy documents</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-card border border-border/50 px-4 py-2 rounded-xl">
          <Hash className="w-4 h-4 text-primary" />
          <span className="font-black text-foreground">{chunksData.length}</span> total chunks
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Chunks',    value: 84,    color: 'text-primary',    bg: 'bg-primary/10' },
          { label: 'Avg Tokens',      value: 46,    color: 'text-primary',    bg: 'bg-primary/10' },
          { label: 'Documents',       value: 1,     color: 'text-primary',    bg: 'bg-primary/10' },
          { label: 'Avg Similarity',  value: '0.91',color: 'text-primary',    bg: 'bg-primary/10' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border/50 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-2">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <Card className="border border-border/50 shadow-sm rounded-xl bg-card/50 overflow-hidden">
        <CardContent className="p-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search chunks by content, ID, or document..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-11 bg-background/50 border-border/50 focus:border-primary/50 rounded-xl transition-all"
            />
          </div>
        </CardContent>
      </Card>

      {/* Chunks List */}
      <div className="space-y-3">
        {filtered.map((chunk) => (
          <div key={chunk.id} className="group bg-card border border-border/50 rounded-xl p-5 hover:border-purple-200 dark:hover:border-purple-500/30 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-black text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg">{chunk.id}</span>
                <span className="text-[11px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">{chunk.docId}</span>
                <span className="text-[10px] font-semibold text-muted-foreground/60">Page {chunk.page}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md">{chunk.tokens} tokens</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${chunk.similarity > 0.93 ? 'text-emerald-600 bg-emerald-500/10' : chunk.similarity > 0.88 ? 'text-amber-600 bg-amber-500/10' : 'text-muted-foreground bg-muted/50'}`}>
                  {(chunk.similarity * 100).toFixed(0)}% sim
                </span>
                <button
                  onClick={() => handleCopy(chunk.id, chunk.text)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Copy className={`w-3.5 h-3.5 ${copied === chunk.id ? 'text-emerald-500' : ''}`} />
                </button>
              </div>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{chunk.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Chunks;
