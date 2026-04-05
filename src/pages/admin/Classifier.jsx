import { useState } from 'react';
import { Settings, FileText, Tag, Percent, ChevronRight, Edit2, Plus, Save, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const classifierRules = [
  { id: 1, name: 'Prescription / Order Form',  keywords: ['Rx', 'Order Form', 'prescription', 'HCPCS'], confidence: 96, docs: 12, color: 'text-primary bg-primary/10 border-primary/20' },
  { id: 2, name: 'Insurance Card',              keywords: ['Member ID', 'Group', 'Payer', 'Insurance'], confidence: 94, docs: 8,  color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { id: 3, name: 'Letter of Medical Necessity', keywords: ['LMN', 'Medical Necessity', 'physician letter'], confidence: 91, docs: 5,  color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  { id: 4, name: 'Clinical Notes',              keywords: ['Progress Note', 'SOAP', 'Assessment', 'Plan'], confidence: 88, docs: 7,  color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  { id: 5, name: 'EOB / Remittance',            keywords: ['EOB', 'Remittance', 'Explanation of Benefits'], confidence: 93, docs: 3,  color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
];

const Classifier = () => {
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
            <Settings className="w-3.5 h-3.5" />
            Classification Engine
          </div>
          <h1 className="text-2xl font-black tracking-tight">Classifier</h1>
          <p className="text-muted-foreground text-sm">Configure document classification rules and confidence thresholds</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Button variant="outline" className="h-9 px-4 rounded-xl text-sm font-bold gap-2">
            <Plus className="w-3.5 h-3.5" /> Add Class
          </Button>
          <Button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} className="h-9 px-4 rounded-xl text-sm font-bold gap-2 bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20">
            {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saved ? 'Saved!' : 'Save Config'}
          </Button>
        </div>
      </div>

      {/* Global Settings */}
      <div className="bg-card border border-border/50 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-foreground">Global Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Min Confidence Threshold', value: '85%', desc: 'Below this: manual review' },
            { label: 'Fallback Class', value: 'Unclassified', desc: 'When no class matches' },
            { label: 'Model', value: 'claude-haiku-4-5', desc: 'Inference model for speed' },
          ].map(item => (
            <div key={item.label} className="p-4 bg-muted/30 rounded-xl border border-border/40">
              <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-1.5">{item.label}</p>
              <p className="text-sm font-black text-foreground font-mono">{item.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Document Classes */}
      <Card className="border border-border/50 shadow-sm rounded-xl overflow-hidden bg-card/50">
        <CardHeader className="px-5 py-4 border-b border-border/50">
          <CardTitle className="text-sm font-bold tracking-tight">Document Classes ({classifierRules.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/40">
            {classifierRules.map((rule) => (
              <div key={rule.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${rule.color} shrink-0`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground mb-1">{rule.name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {rule.keywords.map(kw => (
                      <span key={kw} className="text-[10px] font-semibold px-2 py-0.5 bg-muted rounded-md text-muted-foreground font-mono">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-muted-foreground">Confidence</p>
                    <p className={`text-sm font-black ${rule.confidence > 93 ? 'text-emerald-500' : rule.confidence > 88 ? 'text-amber-500' : 'text-red-500'}`}>
                      {rule.confidence}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-muted-foreground">Docs</p>
                    <p className="text-sm font-black text-foreground">{rule.docs}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary">
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Classifier;
