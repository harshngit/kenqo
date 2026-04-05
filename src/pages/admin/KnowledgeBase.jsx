import { useState } from 'react';
import {
  Upload, ArrowUpRight, FileText, ChevronDown, Activity
} from 'lucide-react';

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
const KnowledgeBase = () => {
  const [selectedDisease, setSelectedDisease] = useState('Lymphedema');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Knowledge Base Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {selectedDisease} · Medicare FFS · <span className="text-muted-foreground/70">Last updated 2 hours ago</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 h-9 px-4 border border-border/60 bg-card rounded-lg text-sm font-medium hover:bg-accent transition-colors">
            <span>{selectedDisease}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="flex items-center gap-2 h-9 px-4 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Upload className="w-4 h-4" />
            Upload Document
            <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Rules',     value: 37, sub: 'from 1 document ingested',  subColor: '' },
          { label: 'Pending Approval', value: 14, sub: 'requires review',           subColor: 'text-amber-500' },
          { label: 'Approved Rules',   value: 21, sub: 'active in pipeline',        subColor: 'text-emerald-600' },
          { label: 'Total Chunks',     value: 84, sub: 'across 1 document',         subColor: '' },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border/40 rounded-2xl p-6 shadow-sm">
            <p className="text-xs text-muted-foreground font-semibold mb-2">{s.label}</p>
            <p className="text-3xl font-black text-foreground tracking-tight">{s.value}</p>
            <p className={`text-[11px] mt-2 font-medium ${s.subColor || 'text-muted-foreground/70'}`}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Rules Section (Full Width) ── */}
      <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Rules — pending review</h2>
          <button className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
            View all <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <div className="divide-y divide-border/30">
          {pendingRules.map((rule) => (
            <div key={rule.id} className="px-6 py-4 flex items-start gap-4 hover:bg-muted/30 transition-colors">
              <span className="text-xs font-black text-muted-foreground/40 w-10 shrink-0 mt-1">{rule.id}</span>
              <p className="flex-1 text-sm text-foreground/80 leading-relaxed">{rule.text}</p>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={rule.status} />
                <SeverityBadge severity={rule.severity} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
