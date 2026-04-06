import { useState } from 'react';
import { Activity, Plus, Settings, Zap, CheckCircle2, XCircle, ChevronRight, Code2, FileText, Shield, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const agentData = [
  {
    id: 0, name: 'Classifier', type: 'All doc types', active: true,
    description: 'Automatically classifies incoming documents into predefined categories for downstream processing.',
    model: 'claude-sonnet-4-5', processedToday: 12, accuracy: 98.2,
    icon: Shield, color: 'text-primary bg-primary/10',
  },
  {
    id: 1, name: 'Demographics', type: 'Rx, Order Form', active: true,
    description: 'Extracts patient demographic information including name, DOB, address, and Medicare Beneficiary Identifier.',
    model: 'claude-sonnet-4-5', processedToday: 9, accuracy: 96.5,
    icon: Users, color: 'text-blue-500 bg-blue-500/10',
  },
  {
    id: 2, name: 'Insurance', type: 'Insurance Card', active: true,
    description: 'Parses insurance card data including payer name, policy number, group ID and member details.',
    model: 'claude-haiku-4-5', processedToday: 7, accuracy: 94.1,
    icon: FileText, color: 'text-purple-500 bg-purple-500/10',
  },
  {
    id: 3, name: 'Provider', type: 'Rx, LMN', active: true,
    description: 'Extracts prescriber information including NPI, taxonomy codes, credentials and signatures.',
    model: 'claude-sonnet-4-5', processedToday: 9, accuracy: 97.3,
    icon: Code2, color: 'text-emerald-500 bg-emerald-500/10',
  },
  {
    id: 4, name: 'Clinical Findings', type: 'LMN, Notes', active: false,
    description: 'Extracts clinical findings, diagnosis codes, severity scores and treatment history from clinical documentation.',
    model: 'claude-opus-4-5', processedToday: 0, accuracy: 0,
    icon: Activity, color: 'text-amber-500 bg-amber-500/10',
  },
];

const SuperAdminAgents = () => {
  const [states, setStates] = useState(agentData.map(a => a.active));

  const toggle = (idx) => setStates(prev => prev.map((s, i) => i === idx ? !s : s));

  const activeCount = states.filter(Boolean).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
            <Activity className="w-3.5 h-3.5" />
            Agent Management
          </div>
          <h1 className="text-2xl font-black tracking-tight">Extraction Agents</h1>
          <p className="text-muted-foreground text-sm">Configure and monitor AI extraction agents</p>
        </div>
        <Button className="h-9 px-4 rounded-xl text-sm font-bold gap-2 bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20 self-start sm:self-auto">
          <Plus className="w-3.5 h-3.5" /> New Agent
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Agents',   value: agentData.length, color: 'text-foreground' },
          { label: 'Active',         value: activeCount,       color: 'text-emerald-500' },
          { label: 'Inactive',       value: agentData.length - activeCount, color: 'text-muted-foreground' },
          { label: 'Docs Today',     value: states.reduce((sum, s, i) => sum + (s ? agentData[i].processedToday : 0), 0), color: 'text-primary' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border/50 rounded-xl p-4">
            <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-1.5">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agentData.map((agent, idx) => {
          const Icon = agent.icon;
          const isActive = states[idx];
          return (
            <Card key={agent.id} className={`border rounded-xl overflow-hidden transition-all duration-300 ${isActive ? 'border-border/50 shadow-sm' : 'border-border/30 opacity-70'}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${agent.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-foreground">{agent.name}</p>
                        <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Agent {agent.id}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{agent.type}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(idx)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-4">{agent.description}</p>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2.5 bg-muted/30 rounded-lg">
                    <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Model</p>
                    <p className="text-[10px] font-black text-foreground truncate">{agent.model.replace('claude-', '').split('-4-5')[0]}</p>
                  </div>
                  <div className="text-center p-2.5 bg-muted/30 rounded-lg">
                    <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Today</p>
                    <p className="text-sm font-black text-foreground">{isActive ? agent.processedToday : 0}</p>
                  </div>
                  <div className="text-center p-2.5 bg-muted/30 rounded-lg">
                    <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Accuracy</p>
                    <p className={`text-sm font-black ${agent.accuracy > 95 ? 'text-emerald-500' : agent.accuracy > 90 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                      {isActive ? `${agent.accuracy}%` : '—'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                    {isActive
                      ? <><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Active</>
                      : <><span className="w-1.5 h-1.5 bg-gray-400 rounded-full" /> Inactive</>
                    }
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 px-3 text-xs rounded-lg hover:bg-primary/10 hover:text-primary font-bold gap-1.5">
                    <Settings className="w-3 h-3" /> Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SuperAdminAgents;
