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

const AdminDashboard = () => {
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
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-50 dark:bg-teal-500/10',
      to: '/admin/documents',
    },
    {
      title: 'TOTAL USERS',
      value: 3,
      icon: Users,
      trend: '+12%',
      trendNeg: false,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-50 dark:bg-blue-500/10',
      to: '/admin/users',
    },
    {
      title: 'TOTAL RULES',
      value: 37,
      icon: GitBranch,
      trend: '+18%',
      trendNeg: false,
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      to: '/admin/knowledge-base',
    },
    {
      title: 'TOTAL CHUNKS',
      value: 84,
      icon: Layers,
      trend: '-5%',
      trendNeg: true,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-50 dark:bg-amber-500/10',
      to: '/admin/chunks',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Hero Banner — with disease selector + upload button embedded */}
      <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-10 text-primary-foreground shadow-xl shadow-primary/20">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              System Live
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight">Admin Dashboard</h1>
            <p className="text-primary-foreground/80 text-sm max-w-md leading-relaxed">
              Welcome back, <span className="font-bold text-white">Admin</span>! System performance is optimal today with {documents.filter(d => d.status === 'processing').length || 1} active tasks.
            </p>
          </div>

          {/* Right side: disease dropdown + upload + action buttons */}
          <div className="flex flex-col gap-4 shrink-0 sm:items-end">
            {/* Top row: selector + upload */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Disease Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 h-11 px-5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-2xl text-sm font-bold backdrop-blur-md transition-all shadow-lg shadow-black/5"
                >
                  <span>{selectedDisease}</span>
                  <ChevronDown className={`w-4 h-4 opacity-80 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute top-full mt-2 right-0 w-52 bg-card border border-border/50 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {diseases.map((d) => (
                      <button
                        key={d.label}
                        onClick={() => { if (!d.comingSoon) { setSelectedDisease(d.label); setDropdownOpen(false); } }}
                        className={`w-full flex items-center justify-between px-5 py-3.5 text-sm transition-colors text-left ${
                          d.comingSoon
                            ? 'opacity-60 cursor-not-allowed'
                            : selectedDisease === d.label
                              ? 'bg-primary/10 text-primary font-bold'
                              : 'text-foreground hover:bg-muted/60 font-medium'
                        }`}
                      >
                        <span>{d.label}</span>
                        {d.comingSoon && (
                          <span className="text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-0.5 rounded-full">
                            Soon
                          </span>
                        )}
                        {selectedDisease === d.label && !d.comingSoon && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button variant="secondary" className="bg-white text-primary hover:bg-white/95 shadow-xl shadow-black/10 h-11 px-6 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 group text-sm">
                <Upload className="w-4 h-4 mr-2 transition-transform group-hover:-translate-y-0.5" />
                Upload Document
                <ArrowUpRight className="w-3.5 h-3.5 ml-1 opacity-60" />
              </Button>
            </div>

            {/* Bottom row: System Logs + Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" className="bg-white/10 hover:bg-white/20 border-white/10 text-white px-6 h-11 rounded-2xl text-sm font-bold backdrop-blur-md transition-all shadow-lg shadow-black/5">
                System Logs
              </Button>
              <Button variant="secondary" className="bg-white/10 hover:bg-white/20 border-white/10 text-white px-6 h-11 rounded-2xl text-sm font-bold backdrop-blur-md transition-all shadow-lg shadow-black/5">
                Quick Actions
              </Button>
            </div>
          </div>
        </div>

        {/* Click-outside to close dropdown */}
        {dropdownOpen && (
          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
        )}

        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/4 w-[30rem] h-[30rem] bg-white/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-72 h-72 bg-black/10 rounded-full blur-[80px]" />
      </div>

      {/* Top Stats — linked cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {topStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={index} to={stat.to} className="group">
              <Card className="border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl bg-card overflow-hidden h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`p-3 ${stat.iconBg} rounded-2xl transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                    <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full ${stat.trendNeg ? 'bg-red-50 text-red-500 dark:bg-red-500/10' : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10'}`}>
                      <TrendingUp className="w-3 h-3" />
                      {stat.trend}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-2">{stat.title}</p>
                    <h3 className="text-3xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">{stat.value}</h3>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Main 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Rules */}
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <h3 className="text-sm font-bold text-foreground">Rules — pending review</h3>
            <Link to="/admin/knowledge-base" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/40">
            {pendingRules.map((rule) => (
              <div key={rule.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-muted/20 transition-colors">
                <span className="text-xs font-black text-muted-foreground/50 w-8 shrink-0 mt-0.5">{rule.id}</span>
                <p className="flex-1 text-xs text-foreground/80 leading-relaxed">{rule.text}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <StatusBadge status={rule.status} />
                  <SeverityBadge severity={rule.severity} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Policy Docs */}
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <h3 className="text-sm font-bold text-foreground">Policy documents</h3>
            <Link to="/admin/documents" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              Upload <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/40">
            {policyDocuments.map((doc) => (
              <div key={doc.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-muted/20 transition-colors">
                <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{doc.id}</p>
                  <p className="text-[11px] text-muted-foreground">{doc.title} · {doc.subtitle}</p>
                  {doc.status === 'ingested' && (
                    <div className="mt-1.5 h-1 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${doc.progress}%` }} />
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Agents */}
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <h3 className="text-sm font-bold text-foreground">Extraction agents</h3>
            <Link to="/admin/agents" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              Manage <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {extractionAgents.map((agent, idx) => (
              <div key={agent.id} className="flex flex-col items-center text-center p-3.5 rounded-xl border border-border/40 bg-muted/20 gap-1.5">
                <span className="text-[10px] text-muted-foreground font-semibold">Agent {agent.id}</span>
                <span className="text-xs font-bold text-foreground">{agent.name}</span>
                <span className="text-[10px] text-muted-foreground leading-tight">{agent.type}</span>
                <button
                  onClick={() => toggleAgent(idx)}
                  className={`mt-1 relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${agentStates[idx] ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${agentStates[idx] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <span className={`text-[9px] font-bold uppercase tracking-wide ${agentStates[idx] ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                  {agentStates[idx] ? 'active' : 'inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Schema */}
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <h3 className="text-sm font-bold text-foreground">Extraction schema</h3>
            <Link to="/admin/extraction-schema" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              Edit <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              {schemaFields.map((field) => (
                <span
                  key={field.name}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                    field.highlight
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-muted/40 text-muted-foreground border-border/40'
                  }`}
                >
                  {field.name}
                </span>
              ))}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground mb-2.5">Field criticality breakdown</p>
              <div className="flex gap-4 mb-2">
                {fieldCriticality.map((fc) => (
                  <div key={fc.label} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${fc.color}`} />
                    <span className="text-[11px] font-semibold text-muted-foreground">{fc.label} {fc.count}</span>
                  </div>
                ))}
              </div>
              <div className="flex rounded-full overflow-hidden h-2">
                {fieldCriticality.map((fc) => {
                  const total = fieldCriticality.reduce((a, b) => a + b.count, 0);
                  return <div key={fc.label} className={fc.color} style={{ width: `${(fc.count / total) * 100}%` }} />;
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;