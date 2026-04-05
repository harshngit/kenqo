import { useState } from 'react';
import { MessageSquare, Plus, Edit2, Copy, ChevronDown, Save, CheckCircle2, Eye, Code2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const promptsData = [
  {
    id: 1, name: 'Demographic Extraction',
    description: 'Extracts patient demographics from order forms and prescriptions',
    category: 'Extraction', model: 'claude-sonnet-4-5', version: 'v2.1',
    tokens: 420, lastUpdated: '2025-03-12',
    preview: 'You are a medical document extraction specialist. Extract the following patient demographic information from the provided document...',
  },
  {
    id: 2, name: 'Insurance Parser',
    description: 'Parses insurance card information and validates payer details',
    category: 'Extraction', model: 'claude-haiku-4-5', version: 'v1.4',
    tokens: 280, lastUpdated: '2025-03-10',
    preview: 'Extract insurance information from the provided insurance card image or document. Focus on: Member ID, Group Number, Payer Name...',
  },
  {
    id: 3, name: 'Rule Validation',
    description: 'Validates clinical documentation against Medicare coverage rules',
    category: 'Validation', model: 'claude-sonnet-4-5', version: 'v3.0',
    tokens: 860, lastUpdated: '2025-03-15',
    preview: 'You are a Medicare compliance specialist reviewing medical documentation for lymphedema compression garments...',
  },
  {
    id: 4, name: 'Document Classifier',
    description: 'Classifies incoming documents into predefined categories',
    category: 'Classification', model: 'claude-haiku-4-5', version: 'v1.2',
    tokens: 190, lastUpdated: '2025-03-08',
    preview: 'Classify the following document into one of these categories: Prescription, Insurance Card, LMN, Clinical Notes, EOB...',
  },
];

const categoryColors = {
  Extraction:     'text-primary bg-primary/10 border-primary/20',
  Validation:     'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  Classification: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
};

const Prompts = () => {
  const [expanded, setExpanded] = useState(null);
  const [copied, setCopied] = useState(null);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
            <MessageSquare className="w-3.5 h-3.5" />
            Prompt Library
          </div>
          <h1 className="text-2xl font-black tracking-tight">Prompts</h1>
          <p className="text-muted-foreground text-sm">Manage system prompts for AI extraction agents</p>
        </div>
        <Button className="h-9 px-4 rounded-xl text-sm font-bold gap-2 bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20 self-start sm:self-auto">
          <Plus className="w-3.5 h-3.5" /> New Prompt
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Prompts', value: promptsData.length },
          { label: 'Extraction',   value: promptsData.filter(p => p.category === 'Extraction').length },
          { label: 'Validation',   value: promptsData.filter(p => p.category === 'Validation').length },
          { label: 'Avg Tokens',   value: Math.round(promptsData.reduce((a, p) => a + p.tokens, 0) / promptsData.length) },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border/50 rounded-xl p-4">
            <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-1.5">{s.label}</p>
            <p className="text-2xl font-black text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Prompt Cards */}
      <div className="space-y-3">
        {promptsData.map((prompt) => (
          <Card key={prompt.id} className="border border-border/50 shadow-sm rounded-xl overflow-hidden bg-card/50">
            <div
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/20 transition-colors"
              onClick={() => setExpanded(expanded === prompt.id ? null : prompt.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-foreground">{prompt.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${categoryColors[prompt.category]}`}>
                      {prompt.category}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                      {prompt.version}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{prompt.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>{prompt.tokens} tokens</span>
                  <span className="text-border">·</span>
                  <span className="font-mono">{prompt.model.replace('claude-', '')}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded === prompt.id ? 'rotate-180' : ''}`} />
              </div>
            </div>
            {expanded === prompt.id && (
              <div className="px-5 pb-4 border-t border-border/50 pt-4 bg-muted/10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Prompt Preview</p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(prompt.id, prompt.preview)}
                      className="h-7 px-2.5 text-xs rounded-lg font-bold gap-1.5 hover:bg-primary/10 hover:text-primary"
                    >
                      <Copy className="w-3 h-3" />
                      {copied === prompt.id ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs rounded-lg font-bold gap-1.5 hover:bg-primary/10 hover:text-primary">
                      <Edit2 className="w-3 h-3" /> Edit
                    </Button>
                  </div>
                </div>
                <div className="bg-background border border-border/50 rounded-xl p-4 font-mono text-xs text-foreground/70 leading-relaxed">
                  {prompt.preview}
                  <span className="text-muted-foreground/40"> [... {prompt.tokens} tokens total]</span>
                </div>
                <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground">
                  <span>Last updated: {prompt.lastUpdated}</span>
                  <span>·</span>
                  <span>Model: {prompt.model}</span>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Prompts;
