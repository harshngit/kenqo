import { useState } from 'react';
import {
  Upload, ArrowUpRight, FileText, ChevronDown, ToggleLeft, ToggleRight,
  Plus, ExternalLink, Edit2, Activity
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const pendingRules = [
  { id: 'R-1',  text: 'Patient must have a lymphedema diagnosis with valid ICD-10 code (I89.0, I97.2, Q82.0)', status: 'approved', severity: 'RED' },
  { id: 'R-5',  text: 'Daytime garments: max 3 items per body area per 6-month period', status: 'approved', severity: 'RED' },
  { id: 'R-12', text: 'Ordering physician must be MD, DO, PA, NP, or CNS — not limited to lymphedema specialists', status: 'pending', severity: 'RED' },
  { id: 'R-18', text: 'Custom flat-knit garments require documented clinical justification on the order form', status: 'pending', severity: 'YELLOW' },
  { id: 'R-23', text: 'Bilateral garments must use RT and LT modifiers on separate claim lines', status: 'merge', severity: 'RED' },
];

const policyDocuments = [
  { id: 'R12471CP', title: 'Claims Processing', subtitle: '37 rules', status: 'ingested', progress: 100 },
  { id: 'R12532BP', title: 'Benefit Policy', subtitle: 'pending', status: 'pending', progress: 0 },
  { id: 'LCD L33829', title: 'LCD', subtitle: 'pump coverage criteria', status: 'pending', progress: 0 },
  { id: 'A52488',   title: 'Policy Article', subtitle: 'PCD docs', status: 'pending', progress: 0 },
  { id: 'MM13286',  title: 'Provider Education', subtitle: 'guidance', status: 'pending', progress: 0 },
];

const extractionAgents = [
  { id: 0, name: 'Classifier',    type: 'All doc types',  active: true },
  { id: 1, name: 'Demographics',  type: 'Rx, Order Form', active: true },
  { id: 2, name: 'Insurance',     type: 'Insurance Card', active: true },
  { id: 3, name: 'Provider',      type: 'Rx, LMN',       active: true },
];

const schemaFields = [
  { name: 'patient_demographics', highlight: true },
  { name: 'insurance',            highlight: true },
  { name: 'provider',             highlight: true },
  { name: 'clinical_findings',    highlight: true },
  { name: 'measurements',         highlight: true },
  { name: 'garment_order',        highlight: true },
  { name: 'pump_order',           highlight: false },
  { name: 'facility',             highlight: false },
  { name: 'lmn',                  highlight: false },
  { name: 'key_dates',            highlight: false },
  { name: 'pain_assessment',      highlight: false },
  { name: 'e0652_step_therapy',   highlight: false },
];

const fieldCriticality = [
  { label: 'RED',    count: 40, color: 'bg-red-500' },
  { label: 'YELLOW', count: 41, color: 'bg-yellow-400' },
  { label: 'GREEN',  count: 64, color: 'bg-emerald-500' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const map = {
    approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    pending:  'bg-gray-100 text-gray-600 border border-gray-200',
    merge:    'bg-blue-50 text-blue-700 border border-blue-200',
    ingested: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${map[status] || map.pending}`}>
      {status}
    </span>
  );
};

const SeverityBadge = ({ severity }) => {
  const map = {
    RED:    'bg-red-100 text-red-700 border border-red-200',
    YELLOW: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    GREEN:  'bg-emerald-100 text-emerald-700 border border-emerald-200',
  };
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md tracking-wider ${map[severity]}`}>
      {severity}
    </span>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const KnowledgeBase = () => {
  const [selectedDisease, setSelectedDisease] = useState('Lymphedema');
  const [agentStates, setAgentStates] = useState(extractionAgents.map(a => a.active));

  const toggleAgent = (idx) => {
    setAgentStates(prev => prev.map((s, i) => i === idx ? !s : s));
  };

  return (
    <div className="space-y-0 animate-in fade-in duration-500">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between mb-6">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Rules',     value: 37, sub: 'from 1 document ingested',  subColor: '' },
          { label: 'Pending Approval', value: 14, sub: 'requires review',           subColor: 'text-amber-500' },
          { label: 'Approved Rules',   value: 21, sub: 'active in pipeline',        subColor: 'text-emerald-600' },
          { label: 'Total Chunks',     value: 84, sub: 'across 1 document',         subColor: '' },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border/50 rounded-xl p-5">
            <p className="text-xs text-muted-foreground font-medium mb-1">{s.label}</p>
            <p className="text-3xl font-black text-foreground tracking-tight">{s.value}</p>
            <p className={`text-[11px] mt-1 font-medium ${s.subColor || 'text-muted-foreground/70'}`}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main 2-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

        {/* ─ Rules pending review ─ */}
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
            <h2 className="text-sm font-bold text-foreground">Rules — pending review</h2>
            <button className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-border/40">
            {pendingRules.map((rule) => (
              <div key={rule.id} className="px-5 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                <span className="text-xs font-black text-muted-foreground/60 w-8 shrink-0 mt-0.5">{rule.id}</span>
                <p className="flex-1 text-xs text-foreground/80 leading-relaxed">{rule.text}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <StatusBadge status={rule.status} />
                  <SeverityBadge severity={rule.severity} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─ Policy Documents ─ */}
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
            <h2 className="text-sm font-bold text-foreground">Policy documents</h2>
            <button className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              Upload <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-border/40">
            {policyDocuments.map((doc) => (
              <div key={doc.id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{doc.id}</p>
                  <p className="text-[11px] text-muted-foreground">{doc.title} · {doc.subtitle}</p>
                  {doc.status === 'ingested' && (
                    <div className="mt-1.5 h-1 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${doc.progress}%` }} />
                    </div>
                  )}
                </div>
                <StatusBadge status={doc.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom 2-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ─ Extraction Agents ─ */}
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
            <h2 className="text-sm font-bold text-foreground">Extraction agents</h2>
            <button className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              Manage <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {extractionAgents.map((agent, idx) => (
              <div key={agent.id} className="flex flex-col items-center text-center p-3 rounded-xl border border-border/40 bg-muted/20 gap-1.5">
                <span className="text-[10px] text-muted-foreground font-semibold">Agent {agent.id}</span>
                <span className="text-sm font-bold text-foreground">{agent.name}</span>
                <span className="text-[10px] text-muted-foreground">{agent.type}</span>
                <button
                  onClick={() => toggleAgent(idx)}
                  className={`mt-1 relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${agentStates[idx] ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${agentStates[idx] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                  {agentStates[idx] ? 'active' : 'inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ─ Extraction Schema ─ */}
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
            <h2 className="text-sm font-bold text-foreground">Extraction schema</h2>
            <button className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              Edit <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            {/* Field tags */}
            <div className="flex flex-wrap gap-2">
              {schemaFields.map((field) => (
                <span
                  key={field.name}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                    field.highlight
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-muted/40 text-muted-foreground border-border/40'
                  }`}
                >
                  {field.name}
                </span>
              ))}
            </div>

            {/* Field criticality breakdown */}
            <div>
              <p className="text-xs font-bold text-foreground mb-2">Field criticality breakdown</p>
              <div className="flex gap-3">
                {fieldCriticality.map((fc) => (
                  <div key={fc.label} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${fc.color}`} />
                    <span className="text-[11px] font-semibold text-muted-foreground">{fc.label} {fc.count}</span>
                  </div>
                ))}
              </div>
              {/* Stacked bar */}
              <div className="mt-2 flex rounded-full overflow-hidden h-2">
                {fieldCriticality.map((fc) => {
                  const total = fieldCriticality.reduce((a, b) => a + b.count, 0);
                  return (
                    <div
                      key={fc.label}
                      className={fc.color}
                      style={{ width: `${(fc.count / total) * 100}%` }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
