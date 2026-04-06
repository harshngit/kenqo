import { useState } from 'react';
import {
  Upload, ArrowUpRight, FileText, ChevronDown, Activity,
  BookOpen, CheckCircle2, AlertCircle, Layers, Settings2, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const pendingRules = [
  { id: 'R-1',  text: 'Patient must have a lymphedema diagnosis with valid ICD-10 code (I89.0, I97.2, Q82.0)', status: 'approved', severity: 'RED' },
  { id: 'R-5',  text: 'Daytime garments: max 3 items per body area per 6-month period', status: 'approved', severity: 'RED' },
  { id: 'R-12', text: 'Ordering physician must be MD, DO, PA, NP, or CNS — not limited to lymphedema specialists', status: 'pending', severity: 'RED' },
  { id: 'R-18', text: 'Custom flat-knit garments require documented clinical justification on the order form', status: 'pending', severity: 'YELLOW' },
  { id: 'R-23', text: 'Bilateral garments must use RT and LT modifiers on separate claim lines', status: 'merge', severity: 'RED' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const map = {
    approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    pending:  'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20',
    merge:    'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    ingested: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${map[status] || map.pending}`}>
      {status}
    </span>
  );
};

const SeverityBadge = ({ severity }) => {
  const map = {
    RED:    'bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
    YELLOW: 'bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20',
  };
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md tracking-wider ${map[severity] || map.RED}`}>
      {severity}
    </span>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const SuperAdminKnowledgeBase = () => {
  const [selectedDisease, setSelectedDisease] = useState('Lymphedema');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
            <BookOpen className="w-3.5 h-3.5" /> Intelligence Repository
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Knowledge Base
          </h1>
          <div className="flex items-center gap-3 text-muted-foreground text-sm font-medium">
            <span className="capitalize text-primary font-bold">{selectedDisease}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>Medicare FFS</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="text-muted-foreground/60 italic">Updated 2h ago</span>
          </div>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="relative group">
            <button className="flex items-center gap-3 h-11 px-5 border-2 border-border/40 bg-card rounded-2xl text-sm font-black hover:border-primary/20 transition-all shadow-sm">
              <span>{selectedDisease}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
            </button>
          </div>
          <Button className="h-11 px-6 rounded-2xl font-black text-sm gap-2 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95">
            <Upload className="w-4 h-4" /> Upload Document
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Rules',     value: 37, icon: BookOpen, color: 'text-foreground', bg: 'bg-foreground/5' },
          { label: 'Pending Review',  value: 14, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Active Pipeline', value: 21, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Vector Chunks',   value: 84, icon: Layers, color: 'text-primary', bg: 'bg-primary/10' },
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

      {/* ── Rules List ── */}
      <Card className="border-2 border-border/40 rounded-[2.5rem] shadow-lg overflow-hidden transition-all duration-500 bg-card">
        <CardHeader className="px-8 py-6 border-b-2 border-border/10 bg-muted/5">
          <CardTitle className="text-sm font-black text-foreground uppercase tracking-widest flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                <BookOpen className="w-5 h-5" />
              </div>
              <span>Rules Pending Review</span>
            </div>
            <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors">
              View Directory <ArrowUpRight className="w-4 h-4" />
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y-2 divide-border/5">
            {pendingRules.map((rule) => (
              <div key={rule.id} className="px-8 py-5 flex items-start gap-6 hover:bg-primary/[0.02] transition-colors group">
                <span className="text-[11px] font-black text-muted-foreground/30 w-10 shrink-0 mt-1.5 transition-colors group-hover:text-primary/40 font-mono">
                  {rule.id}
                </span>
                <p className="flex-1 text-sm text-foreground/70 leading-relaxed font-medium mt-0.5">{rule.text}</p>
                <div className="flex items-center gap-3 shrink-0 pt-0.5">
                  <StatusBadge status={rule.status} />
                  <SeverityBadge severity={rule.severity} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminKnowledgeBase;
