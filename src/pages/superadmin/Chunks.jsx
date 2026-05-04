import { useState, useEffect, useCallback } from 'react';
import { Layers, FileText, Hash, Eye, Activity, RefreshCw, Loader2, X, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { useSelector } from 'react-redux';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const BASE_URL = 'https://kenqo-api-409744260053.asia-south1.run.app';
const DISEASE = 'lymphedema';

/* ─── CHUNK DETAILS DIALOG ─── */
const normalizeChunks = (data) => {
  const raw = Array.isArray(data)
    ? data
    : Array.isArray(data?.chunks)
      ? data.chunks
      : Array.isArray(data?.items)
        ? data.items
        : [];

  return raw.map((chunk, fallbackIndex) => ({
    ...chunk,
    chunk_id: chunk.chunk_id || chunk.id || `${chunk.document_id || 'document'}-${chunk.index ?? chunk.chunk_index ?? fallbackIndex}`,
    chunk_index: chunk.chunk_index ?? chunk.index ?? fallbackIndex,
    source_doc: chunk.filename || chunk.source_doc || chunk.source_document || chunk.document_id || '',
  }));
};

const getDocumentName = (chunk) => chunk?.filename || chunk?.source_doc || chunk?.source_document || '';

const ChunkDetailsDialog = ({ open, chunk, onCancel }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border-2 border-border/40 rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight">Chunk Details</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-xl border border-primary/20 inline-block">
              {getDocumentName(chunk) || 'Document Chunk'}
            </p>
          </div>
          <button onClick={onCancel} className="w-10 h-10 rounded-xl border border-border/60 flex items-center justify-center hover:bg-muted transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {chunk ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/40">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Filename</p>
                <p className="text-xs font-bold truncate" title={getDocumentName(chunk)}>{getDocumentName(chunk) || '-'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/40">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Ingested At</p>
                <p className="text-xs font-bold">{chunk.ingested_at || chunk.created_at ? new Date(chunk.ingested_at || chunk.created_at).toLocaleDateString() : '-'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Fragment Text</p>
              <div className="p-6 rounded-[1.5rem] bg-muted/10 border-l-4 border-primary text-sm font-medium leading-relaxed text-foreground/80 relative">
                <div className={isExpanded ? "" : "max-h-32 overflow-hidden relative"}>
                  {chunk.text}
                  {!isExpanded && chunk.text?.length > 300 && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-muted/10 to-transparent" />
                  )}
                </div>
                {chunk.text?.length > 300 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-2 text-primary text-[10px] font-black uppercase tracking-widest hover:underline"
                  >
                    {isExpanded ? 'Show Less' : 'Read More'}
                  </button>
                )}
              </div>
            </div>

            {chunk.summary && (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">AI Summary</p>
                <div className="p-5 rounded-2xl bg-violet-500/5 border border-violet-500/10 text-xs font-medium italic text-violet-700 leading-relaxed">
                  {chunk.summary}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Linked Rules</p>
                <div className="space-y-2 h-[200px] overflow-y-scroll">
                  {(chunk.rule_ids || chunk.linked_rule_ids)?.length > 0 ? (
                    (chunk.rule_ids || chunk.linked_rule_ids).map(ruleId => (
                      <div key={ruleId} className="p-3 rounded-xl bg-primary/5 border border-primary/10 space-y-1">
                        <span className="text-[8px] font-black text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">
                          {ruleId}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No linked rules</span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Applicable HCPCS</p>
                <div className="flex flex-wrap gap-2">
                  {(chunk.applicable_hcpcs || chunk.matched_hcpcs)?.map(code => (
                    <span key={code} className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                      {code}
                    </span>
                  )) || <span className="text-xs text-muted-foreground italic">No HCPCS tags</span>}
                </div>
              </div>
            </div>

            {chunk.relevance_tags && (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Relevance Tags</p>
                <div className="flex flex-wrap gap-2">
                  {chunk.relevance_tags.split(',').map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-muted border border-border/60 text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="pt-4">
          <Button onClick={onCancel} className="w-full h-12 rounded-2xl font-black bg-muted hover:bg-muted/80 text-foreground transition-all active:scale-95">
            Close View
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─── LINKED RULES DIALOG ─── */
const SuperAdminChunks = () => {
  const authUser = useSelector((state) => state.auth?.user);
  const userId = authUser?.user_id || authUser?.id || '';

  const [chunks, setChunks]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [selectedDocument, setSelectedDocument] = useState('all');
  const [selectedChunk, setSelectedChunk] = useState(null);

  const fetchChunks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/rules/${DISEASE}/chunks`, {
        headers: { 'x-user-id': userId }
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || 'Failed to load chunks');
      setChunks(normalizeChunks(data));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchChunks();
  }, [fetchChunks]);

  const documentNames = [...new Set(chunks.map(getDocumentName).filter(Boolean))];
  const filtered = selectedDocument === 'all'
    ? chunks
    : chunks.filter((chunk) => getDocumentName(chunk) === selectedDocument);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <ChunkDetailsDialog
        key={selectedChunk?.chunk_id || selectedChunk?.id || 'chunk-detail'}
        open={!!selectedChunk}
        chunk={selectedChunk}
        onCancel={() => setSelectedChunk(null)}
      />
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
            <Layers className="w-3.5 h-3.5" /> Intelligence Fragmentation
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Document Chunks
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Analyze and monitor semantic fragments from ingested policy documents
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-card border-2 border-border/40 shadow-sm group hover:border-primary/20 transition-all">
            <Hash className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-sm font-black tracking-tight">
              <span className="text-primary">{loading ? '...' : chunks.length}</span> Total Chunks
            </span>
          </div>
          <Button onClick={fetchChunks} variant="outline" className="h-11 px-5 rounded-2xl font-black border-border/60">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Active Chunks',  value: chunks.length, icon: Layers, color: 'text-foreground', bg: 'bg-foreground/5' },
          { label: 'Avg Token Size',  value: chunks.length ? Math.round(chunks.reduce((acc, c) => acc + (c.text?.split(' ').length || 0), 0) / chunks.length) : 0, icon: Hash,   color: 'text-primary',    bg: 'bg-primary/10' },
          { label: 'Source Docs',     value: documentNames.length, icon: FileText, color: 'text-violet-500', bg: 'bg-violet-500/10' },
          { label: 'System Health',   value: 'Optimal', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        ].map((s) => (
          <Card key={s.label} className="border-2 border-border/40 rounded-[2rem] shadow-sm hover:shadow-md transition-all overflow-hidden relative group">
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500 ${s.color}`}>
              <s.icon className="w-16 h-16" />
            </div>
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">{s.label}</p>
              <p className={`text-3xl font-black tracking-tighter ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 text-red-600 border border-red-500/20 px-5 py-4 rounded-2xl text-sm font-bold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Search ── */}
      <div className="max-w-2xl space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Filter by document name</p>
        <Select value={selectedDocument} onValueChange={setSelectedDocument}>
          <SelectTrigger className="h-14 bg-card border-2 border-border/40 focus:border-primary/40 rounded-[1.25rem] transition-all shadow-sm focus:shadow-md text-sm font-black">
            <SelectValue placeholder="All documents" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-border/40">
            <SelectItem value="all" className="rounded-xl font-bold">All documents</SelectItem>
            {documentNames.map((name) => (
              <SelectItem key={name} value={name} className="rounded-xl font-bold">
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Chunks List ── */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-32 flex flex-col items-center gap-4 animate-pulse">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Synchronizing Fragments...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-32 flex flex-col items-center gap-6 text-center opacity-40">
            <div className="w-20 h-20 bg-muted rounded-[2.5rem] flex items-center justify-center shadow-inner">
              <Layers className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <p className="font-black text-lg">No Fragments Found</p>
              <p className="text-sm font-medium">Try choosing a different document.</p>
            </div>
          </div>
        ) : (
          filtered.map((chunk) => (
            <div key={chunk.chunk_id} className="group bg-card border-2 border-border/40 rounded-[2rem] p-6 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 shadow-sm">
              <div className="flex items-start justify-between gap-6 mb-5">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 shadow-sm tracking-widest uppercase truncate max-w-[720px]" title={getDocumentName(chunk)}>
                    {getDocumentName(chunk) || '-'}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setSelectedChunk(chunk)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-primary/10 transition-all text-muted-foreground hover:text-primary border border-border/40 hover:border-primary/20 active:scale-95 group/view"
                  >
                    <Eye className="w-5 h-5 group-hover/view:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/10 rounded-full group-hover:bg-primary/30 transition-colors" />
                <p className="text-sm text-foreground/70 leading-relaxed font-medium pl-6">
                  {chunk.summary || chunk.text?.substring(0, 150) + (chunk.text?.length > 150 ? '...' : '')}
                </p>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default SuperAdminChunks;
