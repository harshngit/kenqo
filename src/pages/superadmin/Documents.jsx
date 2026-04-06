import { useUserStore } from '../../store';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { FileText, Search, CheckCircle2, Clock, Users, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';

const SuperAdminDocuments = () => {
  const { documents } = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
            <FileText className="w-3.5 h-3.5" /> Document Central
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            All Documents
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Monitor and manage all processed medical documentation
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <Button variant="outline" className="h-11 px-5 rounded-2xl font-black text-sm gap-2 border-border/60 hover:bg-muted transition-all active:scale-95 shadow-sm">
            Export Report
          </Button>
          <Button className="h-11 px-6 rounded-2xl font-black text-sm gap-2 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95">
            Batch Process
          </Button>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-3 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
          <Input
            placeholder="Search documents by name, category, or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-14 h-14 bg-card border-2 border-border/40 focus:border-primary/40 rounded-[1.25rem] transition-all shadow-sm focus:shadow-md text-sm font-medium placeholder:text-muted-foreground/40"
          />
        </div>
        <Card className="border-2 border-border/40 rounded-[1.25rem] shadow-sm hover:shadow-md transition-all overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-primary">
            <FileText className="w-16 h-16" />
          </div>
          <CardContent className="p-4 flex flex-col justify-center h-full relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Total Files</p>
            <p className="text-3xl font-black tracking-tighter text-primary">{filteredDocuments.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between ml-1">
          <div className="flex items-center gap-3">
            <h2 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Latest Documents</h2>
            <div className="h-px w-12 bg-border" />
          </div>
          <p className="text-[10px] font-medium text-muted-foreground italic bg-muted/30 px-3 py-1 rounded-full">
            Recent activity and processing status
          </p>
        </div>

        {filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-card border-2 border-border/40 hover:border-primary/20 rounded-[2rem] transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 shadow-sm"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-inner shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <FileText className="w-7 h-7 text-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-black text-lg tracking-tight group-hover:text-primary transition-colors leading-tight">{doc.name}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="bg-primary/5 text-primary border-2 border-primary/10 font-black px-3 py-1 rounded-xl text-[10px] uppercase tracking-widest shadow-sm">
                        {doc.category.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/60">
                        <span>{formatFileSize(doc.size)}</span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span>{new Date(doc.uploadDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-6 mt-6 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 border-border/40">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/30 border border-border/40">
                    <Users className="w-3.5 h-3.5 text-muted-foreground/60" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">User #{doc.userId}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {doc.status === 'completed' ? (
                      <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Completed
                      </div>
                    ) : doc.status === 'processing' ? (
                      <div className="flex items-center gap-2 bg-amber-500/10 text-amber-600 border border-amber-500/20 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                        <Clock className="w-4 h-4 animate-spin-slow" />
                        Processing
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-red-500/10 text-red-600 border border-red-500/20 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                        Failed
                      </div>
                    )}
                    <Button variant="outline" size="icon" className="w-10 h-10 rounded-xl border-border/60 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all active:scale-95 shadow-sm">
                      <ArrowUpRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 flex flex-col items-center gap-6 animate-in zoom-in-95 border-2 border-dashed border-border/40 rounded-[2.5rem] bg-muted/5">
            <div className="w-20 h-20 bg-muted rounded-[2.5rem] flex items-center justify-center shadow-inner opacity-20">
              <Search className="w-10 h-10" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-black text-xl text-muted-foreground">No documents found</p>
              <p className="text-sm text-muted-foreground/60 font-medium max-w-xs mx-auto">
                Try adjusting your search terms or filters to find what you are looking for.
              </p>
            </div>
            <Button onClick={() => setSearchQuery('')} variant="outline" className="rounded-2xl px-8 h-12 font-black border-border/60 transition-all active:scale-95">
              Clear Search
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDocuments;
