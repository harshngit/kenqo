import { useSelector } from 'react-redux';
import { useUserStore } from '../../store';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload, ArrowUpRight, FileText, ChevronDown,
  Users, CheckCircle2, Clock,
  TrendingUp, GitBranch, Layers,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const pendingRules = [
  { id: 'R-1',  text: 'Patient must have a lymphedema diagnosis with valid ICD-10 code (I89.0, I97.2, Q82.0)', status: 'approved', severity: 'RED' },
  { id: 'R-5',  text: 'Daytime garments: max 3 items per body area per 6-month period', status: 'approved', severity: 'RED' },
  { id: 'R-12', text: 'Ordering physician must be MD, DO, PA, NP, or CNS — not limited to lymphedema specialists', status: 'pending', severity: 'RED' },
  { id: 'R-18', text: 'Custom flat-knit garments require documented clinical justification on the order form', status: 'pending', severity: 'YELLOW' },
  { id: 'R-23', text: 'Bilateral garments must use RT and LT modifiers on separate claim lines', status: 'merge', severity: 'RED' },
];

const policyDocuments = [
  { id: 'R12471CP',   title: 'Claims Processing',  subtitle: '37 rules',               status: 'ingested', progress: 100 },
  { id: 'R12532BP',   title: 'Benefit Policy',      subtitle: 'pending',                status: 'pending',  progress: 0 },
  { id: 'LCD L33829', title: 'LCD',                 subtitle: 'pump coverage criteria',  status: 'pending',  progress: 0 },
  { id: 'A52488',     title: 'Policy Article',       subtitle: 'PCD docs',               status: 'pending',  progress: 0 },
  { id: 'MM13286',    title: 'Provider Education',   subtitle: 'guidance',               status: 'pending',  progress: 0 },
];

const extractionAgents = [
  { id: 0, name: 'Classifier',   type: 'All doc types',  active: true },
  { id: 1, name: 'Demographics', type: 'Rx, Order Form', active: true },
  { id: 2, name: 'Insurance',    type: 'Insurance Card', active: true },
  { id: 3, name: 'Provider',     type: 'Rx, LMN',       active: true },
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
];

const fieldCriticality = [
  { label: 'RED',    count: 40, color: 'bg-red-500' },
  { label: 'YELLOW', count: 41, color: 'bg-yellow-400' },
  { label: 'GREEN',  count: 64, color: 'bg-emerald-500' },
];

const diseases = [
  { label: 'Lymphedema', active: true },
  { label: 'Diabetics', comingSoon: true },
];

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

const SuperAdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { documents } = useUserStore();
  const [selectedDisease, setSelectedDisease] = useState('Lymphedema');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [agentStates, setAgentStates] = useState(extractionAgents.map(a => a.active));

  const toggleAgent = (idx) => {
    setAgentStates(prev => prev.map((s, i) => i === idx ? !s : s));
  };

  const topStats = [
    {
      title: 'TOTAL DOCUMENTS',
      value: documents.length || 3,
      icon: FileText,
      trend: '+25%',
      trendNeg: false,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
      to: '/superadmin/documents',
    },
    {
      title: 'TOTAL USERS',
      value: 3,
      icon: Users,
      trend: '+12%',
      trendNeg: false,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-50 dark:bg-blue-500/10',
      to: '/superadmin/users',
    },
    {
      title: 'TOTAL RULES',
      value: 37,
      icon: GitBranch,
      trend: '+18%',
      trendNeg: false,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
      to: '/superadmin/knowledge-base',
    },
    {
      title: 'TOTAL CHUNKS',
      value: 84,
      icon: Layers,
      trend: '-5%',
      trendNeg: true,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-50 dark:bg-amber-500/10',
      to: '/superadmin/chunks',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-primary px-10 py-12 text-primary-foreground shadow-2xl shadow-primary/30">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Intelligence Engine Live
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tight leading-none">Superadmin Dashboard</h1>
              <p className="text-primary-foreground/70 text-base max-w-lg font-medium leading-relaxed">
                Welcome back, <span className="text-white font-black underline underline-offset-4 decoration-white/30">Superadmin</span>. System throughput is optimal with {documents.filter(d => d.status === 'processing').length || 1} active extraction pipelines.
              </p>
            </div>
          </div>

          {/* Right side: disease selector + upload + action buttons */}
          <div className="flex flex-col gap-5 shrink-0 lg:items-end">
            <div className="flex flex-wrap items-center gap-4">
              {/* Disease Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 h-12 px-6 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl text-sm font-black backdrop-blur-xl transition-all shadow-xl shadow-black/10 group"
                >
                  <GitBranch className="w-4 h-4 opacity-70 group-hover:rotate-12 transition-transform" />
                  <span>{selectedDisease}</span>
                  <ChevronDown className={`w-4 h-4 opacity-50 transition-transform duration-500 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute top-full mt-3 right-0 w-64 bg-card border-2 border-border/40 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-2 space-y-1">
                      {diseases.map((d) => (
                        <button
                          key={d.label}
                          onClick={() => { if (!d.comingSoon) { setSelectedDisease(d.label); setDropdownOpen(false); } }}
                          className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm transition-all ${
                            d.comingSoon
                              ? 'opacity-40 cursor-not-allowed grayscale'
                              : selectedDisease === d.label
                                ? 'bg-primary/10 text-primary font-black shadow-inner'
                                : 'text-foreground hover:bg-muted/60 font-bold'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${d.comingSoon ? 'bg-muted-foreground' : 'bg-primary shadow-sm shadow-primary/50'}`} />
                            <span>{d.label}</span>
                          </div>
                          {d.comingSoon && (
                            <span className="text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full border border-amber-500/10">
                              Soon
                            </span>
                          )}
                          {selectedDisease === d.label && !d.comingSoon && (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Button variant="secondary" className="bg-white text-primary hover:bg-white/95 shadow-2xl shadow-black/10 h-12 px-7 rounded-2xl font-black transition-all hover:scale-105 active:scale-95 group text-sm gap-2">
                <Upload className="w-4.5 h-4.5 transition-transform group-hover:-translate-y-1" />
                Upload Document
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button className="h-11 px-6 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-black uppercase tracking-widest backdrop-blur-md transition-all shadow-lg active:scale-95">
                System Logs
              </button>
              <button className="h-11 px-6 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-black uppercase tracking-widest backdrop-blur-md transition-all shadow-lg active:scale-95">
                Quick Actions
              </button>
            </div>
          </div>
        </div>

        {/* Click-outside to close dropdown */}
        {dropdownOpen && (
          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
        )}

        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/4 w-[35rem] h-[35rem] bg-white/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-80 h-80 bg-black/10 rounded-full blur-[100px]" />
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {topStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={index} to={stat.to} className="group">
              <Card className="border-2 border-border/40 rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300 bg-card overflow-hidden h-full relative">
                <div className={`absolute top-0 right-0 p-5 opacity-5 group-hover:scale-110 transition-transform duration-500 ${stat.iconColor}`}>
                  <Icon className="w-16 h-16" />
                </div>
                <CardContent className="p-7">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{stat.title}</p>
                    <div className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border shadow-sm ${stat.trendNeg ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                      {stat.trend}
                    </div>
                  </div>
                  <h3 className={`text-3xl font-black tracking-tighter ${stat.iconColor} group-hover:scale-105 transition-transform origin-left`}>{stat.value}</h3>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Main 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rules */}
        <div className="bg-card border-2 border-border/40 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between px-6 py-5 border-b-2 border-border/10 bg-muted/5">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Rules — Pending Review</h3>
            <Link to="/superadmin/knowledge-base" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border/10">
            {pendingRules.map((rule) => (
              <div key={rule.id} className="px-6 py-4 flex items-start gap-4 hover:bg-primary/[0.02] transition-colors group">
                <span className="text-[10px] font-black text-muted-foreground/40 w-10 shrink-0 mt-1 transition-colors group-hover:text-primary/40">{rule.id}</span>
                <p className="flex-1 text-xs text-foreground/70 leading-relaxed font-medium">{rule.text}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={rule.status} />
                  <SeverityBadge severity={rule.severity} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Policy Docs */}
        <div className="bg-card border-2 border-border/40 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between px-6 py-5 border-b-2 border-border/10 bg-muted/5">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Policy Documents</h3>
            <Link to="/superadmin/documents" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors">
              Upload <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border/10">
            {policyDocuments.map((doc) => (
              <div key={doc.id} className="px-6 py-4 flex items-center gap-4 hover:bg-primary/[0.02] transition-colors group">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-foreground truncate tracking-tight">{doc.id}</p>
                  <p className="text-[11px] font-bold text-muted-foreground/60">{doc.title} · {doc.subtitle}</p>
                  {doc.status === 'ingested' && (
                    <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${doc.progress}%` }} />
                    </div>
                  )}
                </div>
                <StatusBadge status={doc.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agents */}
        <div className="bg-card border-2 border-border/40 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between px-6 py-5 border-b-2 border-border/10 bg-muted/5">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Extraction Agents</h3>
            <Link to="/superadmin/agents" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors">
              Manage <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {extractionAgents.map((agent, idx) => (
              <div key={agent.id} className="flex flex-col items-center text-center p-4 rounded-2xl border-2 border-border/40 bg-muted/20 gap-2 transition-all hover:border-primary/20 hover:bg-primary/[0.02]">
                <span className="text-[10px] text-muted-foreground/50 font-black uppercase tracking-widest">Agent {agent.id}</span>
                <span className="text-sm font-black text-foreground tracking-tight">{agent.name}</span>
                <span className="text-[10px] text-muted-foreground font-bold leading-tight">{agent.type}</span>
                <button
                  onClick={() => toggleAgent(idx)}
                  className={`mt-2 relative inline-flex h-5 w-10 items-center rounded-full transition-all shadow-inner ${agentStates[idx] ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${agentStates[idx] ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
                <span className={`text-[10px] font-black uppercase tracking-widest ${agentStates[idx] ? 'text-emerald-500' : 'text-muted-foreground/40'}`}>
                  {agentStates[idx] ? 'active' : 'inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Schema */}
        <div className="bg-card border-2 border-border/40 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between px-6 py-5 border-b-2 border-border/10 bg-muted/5">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Extraction Schema</h3>
            <Link to="/superadmin/extraction-schema" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors">
              Edit Schema <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex flex-wrap gap-2">
              {schemaFields.map((field) => (
                <span
                  key={field.name}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border-2 transition-all ${
                    field.highlight
                      ? 'bg-primary/5 text-primary border-primary/20 shadow-sm'
                      : 'bg-muted/40 text-muted-foreground/60 border-border/40'
                  }`}
                >
                  {field.name}
                </span>
              ))}
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black text-foreground uppercase tracking-widest">Field Criticality Breakdown</p>
                <div className="flex gap-3">
                  {fieldCriticality.map((fc) => (
                    <div key={fc.label} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${fc.color} shadow-sm`} />
                      <span className="text-[10px] font-black text-muted-foreground/60 uppercase">{fc.label} {fc.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex rounded-full overflow-hidden h-2.5 bg-muted/50 shadow-inner">
                {fieldCriticality.map((fc) => {
                  const total = fieldCriticality.reduce((a, b) => a + b.count, 0);
                  return <div key={fc.label} className={`${fc.color} transition-all duration-1000`} style={{ width: `${(fc.count / total) * 100}%` }} />;
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SuperAdminDashboard;
