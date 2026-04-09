import { useSelector } from 'react-redux';
import { useUserStore } from '../../store';
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload, ArrowUpRight, FileText, ChevronDown,
  Users, CheckCircle2, Clock,
  TrendingUp, GitBranch, Layers, AlertCircle, RefreshCw, Zap, Loader2
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const diseases = [
  { label: 'Lymphedema', value: 'lymphedema', active: true },
  { label: 'Diabetics', value: 'diabetics', comingSoon: true },
];

const BASE_URL = 'https://kenqo-api-409744260053.asia-south1.run.app';

const StatusBadge = ({ status }) => {
  const map = {
    approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    pending:  'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    merge:    'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    complete: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    processing: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
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
    PASS:   'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  };
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md tracking-wider ${map[severity] || map.RED}`}>
      {severity}
    </span>
  );
};

const SuperAdminDashboard = () => {
  const authUser = useSelector((state) => state.auth?.user);
  const userId = authUser?.user_id || authUser?.id || '';
  
  const [selectedDisease, setSelectedDisease] = useState('lymphedema');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const fetchDashboard = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/dashboard/${selectedDisease}`, {
        headers: { 'x-user-id': userId }
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load dashboard');
      setData(json);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedDisease]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const stats = data?.stats || {};
  const pendingRules = data?.rules_pending_review || [];
  const policyDocs = data?.policy_documents || [];
  const agents = data?.extraction_agents || [];
  const schema = data?.extraction_schema || { sections: [], field_criticality: {} };

  const topStats = [
    {
      title: 'TOTAL DOCUMENTS',
      value: stats.total_documents || 0,
      icon: FileText,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
      to: '/superadmin/documents',
    },
    {
      title: 'TOTAL USERS',
      value: stats.total_users || 0,
      icon: Users,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-50 dark:bg-blue-500/10',
      to: '/superadmin/users',
    },
    {
      title: 'TOTAL RULES',
      value: stats.total_rules || 0,
      icon: GitBranch,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
      to: '/superadmin/knowledge-base',
    },
    {
      title: 'TOTAL CHUNKS',
      value: stats.total_chunks || 0,
      icon: Layers,
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
                Welcome back, <span className="text-white font-black underline underline-offset-4 decoration-white/30">Superadmin</span>. System throughput is optimal with {stats.pending_review || 0} rules awaiting review in the pipeline.
              </p>
            </div>
          </div>

          {/* Right side: disease selector */}
          <div className="flex flex-col gap-5 shrink-0 lg:items-end">
            <div className="flex flex-wrap items-center gap-4">
              {/* Disease Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 h-12 px-6 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl text-sm font-black backdrop-blur-xl transition-all shadow-xl shadow-black/10 group"
                >
                  <GitBranch className="w-4 h-4 opacity-70 group-hover:rotate-12 transition-transform" />
                  <span className="capitalize">{selectedDisease}</span>
                  <ChevronDown className={`w-4 h-4 opacity-50 transition-transform duration-500 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute top-full mt-3 right-0 w-64 bg-card border-2 border-border/40 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-2 space-y-1">
                      {diseases.map((d) => (
                        <button
                          key={d.label}
                          onClick={() => { if (!d.comingSoon) { setSelectedDisease(d.value); setDropdownOpen(false); } }}
                          className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm transition-all ${
                            d.comingSoon
                              ? 'opacity-40 cursor-not-allowed grayscale'
                              : selectedDisease === d.value
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
                          {selectedDisease === d.value && !d.comingSoon && (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Button onClick={fetchDashboard} variant="outline" className="h-12 px-5 rounded-2xl font-black bg-white/10 border-white/20 text-white hover:bg-white/20">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
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

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 text-red-600 border border-red-500/20 px-5 py-4 rounded-2xl text-sm font-bold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

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
                  </div>
                  <h3 className={`text-3xl font-black tracking-tighter ${stat.iconColor} group-hover:scale-105 transition-transform origin-left`}>
                    {loading ? '...' : stat.value}
                  </h3>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Main 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rules */}
        <div className="bg-card border-2 border-border/40 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-[400px]">
          <div className="flex items-center justify-between px-6 py-5 border-b-2 border-border/10 bg-muted/5 shrink-0">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Rules — Pending Review</h3>
            <Link to="/superadmin/knowledge-base" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border/10 overflow-y-auto scrollbar-none flex-1">
            {loading ? (
              <div className="p-10 flex flex-col items-center justify-center gap-3 opacity-40">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest">Loading Rules...</p>
              </div>
            ) : pendingRules.length > 0 ? (
              pendingRules.map((rule) => (
                <div key={rule.rule_id} className="px-6 py-4 flex items-start gap-4 hover:bg-primary/[0.02] transition-colors group">
                  <span className="text-[10px] font-black text-muted-foreground/40 w-10 shrink-0 mt-1 transition-colors group-hover:text-primary/40">{rule.rule_id}</span>
                  <p className="flex-1 text-xs text-foreground/70 leading-relaxed font-medium line-clamp-2">{rule.description}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={rule.status} />
                    <SeverityBadge severity={rule.on_fail?.verdict} />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center opacity-40">
                <p className="text-sm font-bold">No pending rules</p>
              </div>
            )}
          </div>
        </div>

        {/* Policy Docs */}
        <div className="bg-card border-2 border-border/40 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-[400px]">
          <div className="flex items-center justify-between px-6 py-5 border-b-2 border-border/10 bg-muted/5 shrink-0">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Policy Documents</h3>
            <Link to="/superadmin/documents" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border/10 overflow-y-auto scrollbar-none flex-1">
            {loading ? (
              <div className="p-10 flex flex-col items-center justify-center gap-3 opacity-40">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest">Loading Docs...</p>
              </div>
            ) : policyDocs.length > 0 ? (
              policyDocs.map((doc) => (
                <div key={doc.document_id} className="px-6 py-4 flex items-center gap-4 hover:bg-primary/[0.02] transition-colors group">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-foreground truncate tracking-tight">{doc.filename}</p>
                    <p className="text-[11px] font-bold text-muted-foreground/60">{doc.doc_type} · {doc.rules_count || 0} rules</p>
                  </div>
                  <StatusBadge status={doc.status} />
                </div>
              ))
            ) : (
              <div className="p-10 text-center opacity-40">
                <p className="text-sm font-bold">No documents found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agents */}
        <div className="bg-card border-2 border-border/40 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-[400px]">
          <div className="flex items-center justify-between px-6 py-5 border-b-2 border-border/10 bg-muted/5 shrink-0">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Extraction Agents</h3>
            <Link to="/superadmin/agents" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors">
              Manage <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto scrollbar-none flex-1">
            {loading ? (
              <div className="col-span-full flex flex-col items-center justify-center gap-3 opacity-40">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest">Loading Agents...</p>
              </div>
            ) : agents.length > 0 ? (
              agents.map((agent) => (
                <div key={agent.agent_id} className="flex flex-col items-center text-center p-4 rounded-2xl border-2 border-border/40 bg-muted/20 gap-2 transition-all hover:border-primary/20 hover:bg-primary/[0.02]">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-muted-foreground/50 font-black uppercase tracking-widest truncate w-full">ID: {agent.agent_id}</span>
                  <span className="text-sm font-black text-foreground tracking-tight truncate w-full">{agent.name || 'AI Agent'}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${agent.active ? 'text-emerald-500' : 'text-muted-foreground/40'}`}>
                    {agent.active ? 'active' : 'inactive'}
                  </span>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center opacity-40">
                <p className="text-sm font-bold">No agents configured</p>
              </div>
            )}
          </div>
        </div>

        {/* Schema */}
        <div className="bg-card border-2 border-border/40 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-[400px]">
          <div className="flex items-center justify-between px-6 py-5 border-b-2 border-border/10 bg-muted/5 shrink-0">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Extraction Schema</h3>
            <Link to="/superadmin/extraction-schema" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors">
              Edit Schema <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-6 space-y-6 flex-1 overflow-y-auto scrollbar-none">
            <div className="flex flex-wrap gap-2">
              {loading ? (
                <div className="w-full flex justify-center py-10 opacity-40">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : schema.sections?.length > 0 ? (
                schema.sections.map((section) => (
                  <span
                    key={section}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-xl border-2 bg-primary/5 text-primary border-primary/20 shadow-sm"
                  >
                    {section.replace(/_/g, ' ')}
                  </span>
                ))
              ) : (
                <p className="text-xs font-bold opacity-40 italic">No sections defined</p>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black text-foreground uppercase tracking-widest">Field Criticality</p>
                <div className="flex gap-3">
                  {[
                    { label: 'RED',    val: schema.field_criticality?.red,    color: 'bg-red-500' },
                    { label: 'YELLOW', val: schema.field_criticality?.yellow, color: 'bg-yellow-400' },
                    { label: 'GREEN',  val: schema.field_criticality?.green,  color: 'bg-emerald-500' },
                  ].map((fc) => (
                    <div key={fc.label} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${fc.color} shadow-sm`} />
                      <span className="text-[10px] font-black text-muted-foreground/60 uppercase">{fc.label} {fc.val || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex rounded-full overflow-hidden h-2.5 bg-muted/50 shadow-inner">
                {(() => {
                  const r = schema.field_criticality?.red || 0;
                  const y = schema.field_criticality?.yellow || 0;
                  const g = schema.field_criticality?.green || 0;
                  const total = r + y + g || 1;
                  return (
                    <>
                      <div className="bg-red-500 transition-all duration-1000" style={{ width: `${(r / total) * 100}%` }} />
                      <div className="bg-yellow-400 transition-all duration-1000" style={{ width: `${(y / total) * 100}%` }} />
                      <div className="bg-emerald-500 transition-all duration-1000" style={{ width: `${(g / total) * 100}%` }} />
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SuperAdminDashboard;
