import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Save,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Edit2,
  X,
  FileText,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useSelector } from 'react-redux';

const BASE_URL = 'https://kenqo-api-409744260053.asia-south1.run.app';

const PROMPT_KEYS = ['chunk_summary', 'rules_extraction'];

const promptMeta = {
  chunk_summary: {
    label: 'Chunk Summary',
    description: 'Summarises individual document chunks for downstream processing',
    icon: FileText,
    accent: 'text-primary bg-primary/10 border-primary/20',
    headerBg: 'bg-primary/5',
  },
  rules_extraction: {
    label: 'Rules Extraction',
    description: 'Extracts clinical rules and compliance criteria from documents',
    icon: BookOpen,
    accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    headerBg: 'bg-emerald-500/5',
  },
};

const SuperAdminPrompts = () => {
  const authUser = useSelector((state) => state.auth?.user);
  const superadminId = authUser?.user_id || authUser?.id || '';

  const [prompts, setPrompts] = useState({ chunk_summary: '', rules_extraction: '' });
  const [editValues, setEditValues] = useState({ chunk_summary: '', rules_extraction: '' });
  const [editMode, setEditMode] = useState({ chunk_summary: false, rules_extraction: false });

  const [isFetching, setIsFetching] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Per-prompt save state
  const [saveState, setSaveState] = useState({ chunk_summary: 'idle', rules_extraction: 'idle' });
  const [saveError, setSaveError] = useState({ chunk_summary: null, rules_extraction: null });

  const fetchPrompts = useCallback(async () => {
    setIsFetching(true);
    setFetchError(null);
    try {
      const response = await fetch(`${BASE_URL}/admin/prompts/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': superadminId,
        },
        body: JSON.stringify({
          user_id: superadminId,
          prompt_names: PROMPT_KEYS,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.detail || data?.message || 'Failed to fetch prompts');
      }
      const fetched = {
        chunk_summary: data.prompts?.chunk_summary || '',
        rules_extraction: data.prompts?.rules_extraction || '',
      };
      setPrompts(fetched);
      setEditValues(fetched);
    } catch (err) {
      setFetchError(err.message || 'Something went wrong');
    } finally {
      setIsFetching(false);
      setIsInitialLoading(false);
    }
  }, [superadminId]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const toggleEdit = (key) => {
    if (editMode[key]) {
      // Cancel — reset to saved value
      setEditValues((prev) => ({ ...prev, [key]: prompts[key] }));
      setSaveError((prev) => ({ ...prev, [key]: null }));
    }
    setEditMode((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (key) => {
    setSaveState((prev) => ({ ...prev, [key]: 'saving' }));
    setSaveError((prev) => ({ ...prev, [key]: null }));
    try {
      const response = await fetch(`${BASE_URL}/admin/prompts/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': superadminId,
        },
        body: JSON.stringify({
          user_id: superadminId,
          prompts: [
            {
              prompt_name: key,
              prompt_text: editValues[key],
            },
          ],
        }),
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data?.detail || data?.message || 'Update failed');
      }
      // Persist locally
      setPrompts((prev) => ({ ...prev, [key]: editValues[key] }));
      setEditMode((prev) => ({ ...prev, [key]: false }));
      setSaveState((prev) => ({ ...prev, [key]: 'success' }));
      setTimeout(() => setSaveState((prev) => ({ ...prev, [key]: 'idle' })), 2500);
    } catch (err) {
      setSaveError((prev) => ({ ...prev, [key]: err.message || 'Could not save. Try again.' }));
      setSaveState((prev) => ({ ...prev, [key]: 'idle' }));
    }
  };

  const wordCount = (text) => (text || '').trim().split(/\s+/).filter(Boolean).length;

  if (isInitialLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center animate-in fade-in duration-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center relative">
            <MessageSquare className="w-8 h-8 text-primary" />
            <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-2xl animate-spin" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold tracking-tight">Loading System Prompts</h2>
            <p className="text-xs text-muted-foreground mt-1">Please wait while we fetch the latest configurations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Subsequent Loading Overlay */}
      {isFetching && !isInitialLoading && (
        <div className="fixed inset-0 z-[100] bg-background/40 backdrop-blur-[1px] flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-card border border-border/50 shadow-2xl rounded-2xl p-6 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-bold tracking-tight">Updating prompts list...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
            <MessageSquare className="w-3.5 h-3.5" /> Prompt Management
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            System Prompts
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            View and update AI prompts used for document processing
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <Button
            variant="outline"
            onClick={fetchPrompts}
            disabled={isFetching}
            className="h-11 px-5 rounded-2xl font-black text-sm gap-2 border-border/60 hover:bg-muted transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Fetch loading */}
      {isFetching && (
        <div className="py-32 flex flex-col items-center gap-6 animate-pulse">
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center relative">
            <MessageSquare className="w-8 h-8 text-primary" />
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-3xl animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-black text-lg">Synchronizing Prompts</p>
            <p className="text-sm text-muted-foreground">Connecting to intelligence engine...</p>
          </div>
        </div>
      )}

      {/* Fetch error */}
      {!isFetching && fetchError && (
        <div className="py-24 flex flex-col items-center gap-6 animate-in zoom-in-95">
          <div className="w-20 h-20 bg-destructive/10 rounded-[2.5rem] flex items-center justify-center shadow-inner">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <div className="text-center space-y-2">
            <p className="font-black text-xl text-destructive">Connection Failed</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto font-medium">{fetchError}</p>
          </div>
          <Button onClick={fetchPrompts} className="rounded-2xl px-8 h-12 font-black bg-destructive hover:bg-destructive/90 shadow-xl shadow-destructive/20 transition-all active:scale-95">
            Retry Connection
          </Button>
        </div>
      )}

      {/* Prompt Cards */}
      {!isFetching && !fetchError && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {PROMPT_KEYS.map((key) => {
            const meta = promptMeta[key];
            const Icon = meta.icon;
            const isEditing = editMode[key];
            const state = saveState[key];
            const err = saveError[key];
            const hasChanges = editValues[key] !== prompts[key];

            return (
              <Card
                key={key}
                className={`group border-2 rounded-[2.5rem] overflow-hidden transition-all duration-300 ${
                  isEditing 
                    ? 'border-primary/40 bg-card shadow-xl shadow-primary/5' 
                    : 'border-border/40 hover:border-primary/20 hover:shadow-lg'
                }`}
              >
                {/* Card Header */}
                <CardHeader className={`px-8 py-6 border-b-2 ${meta.headerBg} border-border/10`}>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 shadow-inner transition-transform duration-500 group-hover:scale-110 ${meta.accent}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg font-black tracking-tight">{meta.label}</CardTitle>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border-2 shadow-sm ${meta.accent}`}>
                            {key}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">{meta.description}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      {state === 'success' && (
                        <div className="flex items-center gap-2 text-xs font-black text-emerald-600 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20 animate-in fade-in slide-in-from-right-4">
                          <CheckCircle2 className="w-4 h-4" />
                          Saved!
                        </div>
                      )}

                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleEdit(key)}
                            disabled={state === 'saving'}
                            className="h-10 px-4 text-xs rounded-xl font-black hover:bg-muted text-muted-foreground transition-all"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSave(key)}
                            disabled={state === 'saving' || !hasChanges}
                            className="h-10 px-6 rounded-xl font-black text-xs gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                          >
                            {state === 'saving' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            {state === 'saving' ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleEdit(key)}
                          className="h-10 px-5 text-xs rounded-xl font-black gap-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all active:scale-95 shadow-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit Prompt
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Card Body */}
                <CardContent className="p-0">
                  {isEditing ? (
                    <div className="p-8 space-y-4">
                      <textarea
                        className="w-full min-h-[350px] bg-muted/10 border-2 border-border/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-[1.5rem] p-6 font-mono text-sm text-foreground/80 leading-relaxed resize-none outline-none transition-all placeholder:text-muted-foreground/30 shadow-inner"
                        value={editValues[key]}
                        onChange={(e) =>
                          setEditValues((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        placeholder={`Enter the ${meta.label} prompt here...`}
                      />
                      <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                          <span>{wordCount(editValues[key])} words</span>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span>{(editValues[key] || '').length} characters</span>
                        </div>
                        {hasChanges && (
                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full animate-pulse">
                            Unsaved Changes
                          </span>
                        )}
                      </div>
                      {err && (
                        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-xs text-destructive font-bold animate-in shake">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {err}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8">
                      {prompts[key] ? (
                        <div className="space-y-4">
                          <div className="bg-muted/30 border-2 border-border/40 rounded-[1.5rem] p-6 font-mono text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap max-h-[350px] overflow-y-auto shadow-inner group-hover:bg-muted/40 transition-colors">
                            {prompts[key]}
                          </div>
                          <div className="flex items-center gap-4 px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                            <span>{wordCount(prompts[key])} words</span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span>{(prompts[key] || '').length} characters</span>
                          </div>
                        </div>
                      ) : (
                        <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                          <div className="w-20 h-20 bg-muted/30 rounded-[2.5rem] flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
                            <MessageSquare className="w-10 h-10" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-black text-muted-foreground/60">No prompt configured</p>
                            <Button variant="link" size="sm" onClick={() => toggleEdit(key)} className="font-black text-primary p-0 h-auto">
                              Click to create prompt
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SuperAdminPrompts;