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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
            <FileText className="w-3.5 h-3.5" />
            Document Central
          </div>
          <h1 className="text-2xl font-black tracking-tight">All Documents</h1>
          <p className="text-muted-foreground text-sm">Monitor and manage all processed medical documentation</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-10 px-5 rounded-xl font-bold text-xs">
            Export Report
          </Button>
          <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-10 px-5 rounded-xl font-bold text-xs">
            Batch Process
          </Button>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <Card className="lg:col-span-3 border-0 shadow-lg shadow-black/5 dark:shadow-white/5 rounded-2xl bg-card/50 backdrop-blur-sm border-white/20 dark:border-white/5 overflow-hidden">
          <CardContent className="p-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search documents by name, category, or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl text-base transition-all"
              />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg shadow-black/5 dark:shadow-white/5 rounded-2xl bg-primary text-primary-foreground overflow-hidden relative">
          <CardContent className="p-4 flex flex-col justify-center h-full relative z-10">
            <p className="text-primary-foreground/70 text-[10px] font-bold uppercase tracking-widest mb-1">Total Files</p>
            <h3 className="text-2xl font-black">{filteredDocuments.length}</h3>
          </CardContent>
          <FileText className="absolute right-[-5%] bottom-[-5%] w-16 h-16 text-white/10 rotate-12" />
        </Card>
      </div>

      {/* Documents List */}
      <Card className="border-0 shadow-lg shadow-black/5 dark:shadow-white/5 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm border-white/20 dark:border-white/5">
        <CardHeader className="p-6 border-b border-border/50">
          <CardTitle className="text-lg font-bold tracking-tight">Latest Documents</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="group flex flex-col md:flex-row md:items-center justify-between p-4 bg-background/40 hover:bg-primary/[0.03] border border-border/40 hover:border-primary/20 rounded-xl transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 shrink-0">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-base group-hover:text-primary transition-colors leading-tight">{doc.name}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="bg-primary/5 text-primary border-0 font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-widest">
                          {doc.category.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground/60 font-medium">
                          {formatFileSize(doc.size)}
                        </span>
                        <span className="text-xs text-muted-foreground/40">•</span>
                        <span className="text-xs text-muted-foreground/60 font-medium">
                          {new Date(doc.uploadDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-5 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border/40">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                        <Users className="w-3 h-3" />
                        User #{doc.userId}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {doc.status === 'completed' ? (
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Completed
                        </div>
                      ) : doc.status === 'processing' ? (
                        <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                          <Clock className="w-3.5 h-3.5 animate-spin-slow" />
                          Processing
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                          Failed
                        </div>
                      )}
                      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-5">
                <Search className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">No documents found</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Try adjusting your search terms to find what you are looking for.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminDocuments;
