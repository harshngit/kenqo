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
    <div className="space-y-8 animate-in fade-in duration-500 relative">
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
            <MessageSquare className="w-3.5 h-3.5" />
            Prompt Management
          </div>
          <h1 className="text-2xl font-black tracking-tight">System Prompts</h1>
          <p className="text-muted-foreground text-sm">
            View and update AI prompts used for document processing
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchPrompts}
          disabled={isFetching}
          className="h-10 px-5 rounded-xl font-bold text-sm gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Fetch loading */}
      {isFetching && (
        <div className="py-24 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading prompts...</p>
        </div>
      )}

      {/* Fetch error */}
      {!isFetching && fetchError && (
        <div className="py-16 flex flex-col items-center gap-4 px-6">
          <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-destructive" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-bold text-sm text-destructive">Failed to load prompts</p>
            <p className="text-xs text-muted-foreground max-w-xs">{fetchError}</p>
          </div>
          <Button size="sm" onClick={fetchPrompts} className="rounded-xl px-4 h-9 text-sm font-bold">
            Try Again
          </Button>
        </div>
      )}

      {/* Prompt Cards */}
      {!isFetching && !fetchError && (
        <div className="grid grid-cols-2 gap-4">
          {PROMPT_KEYS.map((key) => {
            const meta = promptMeta[key];
            const Icon = meta.icon;
            const isEditing = editMode[key];
            const state = saveState[key];
            const err = saveError[key];
            const currentText = isEditing ? editValues[key] : prompts[key];
            const hasChanges = editValues[key] !== prompts[key];

            return (
              <Card
                key={key}
                className="border border-border/50 shadow-md rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm"
              >
                {/* Card Header */}
                <CardHeader className={`px-6 py-5 border-b border-border/50 ${meta.headerBg}`}>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${meta.accent}`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-black tracking-tight">{meta.label}</CardTitle>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.accent}`}>
                            {key}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Success indicator */}
                      {state === 'success' && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Saved!
                        </div>
                      )}

                      {isEditing ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleEdit(key)}
                            disabled={state === 'saving'}
                            className="h-8 px-3 text-xs rounded-xl font-bold hover:bg-muted gap-1.5"
                          >
                            <X className="w-3.5 h-3.5" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSave(key)}
                            disabled={state === 'saving' || !hasChanges}
                            className="h-8 px-4 text-xs rounded-xl font-bold gap-1.5 bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20"
                          >
                            {state === 'saving' ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-3.5 h-3.5" />
                                Save
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleEdit(key)}
                          className="h-8 px-3 text-xs rounded-xl font-bold gap-1.5 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Card Body */}
                <CardContent className="p-0">
                  {isEditing ? (
                    <div className="p-5 space-y-3">
                      <textarea
                        className="w-full min-h-[280px] bg-background border border-border/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 rounded-xl p-4 font-mono text-sm text-foreground/80 leading-relaxed resize-y outline-none transition-all placeholder:text-muted-foreground/40"
                        value={editValues[key]}
                        onChange={(e) =>
                          setEditValues((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        placeholder={`Enter the ${meta.label} prompt here...`}
                      />
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{wordCount(editValues[key])} words · {(editValues[key] || '').length} chars</span>
                        {hasChanges && (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">Unsaved changes</span>
                        )}
                      </div>
                      {err && (
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {err}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-5">
                      {prompts[key] ? (
                        <>
                          <div className="bg-muted/30 border border-border/40 rounded-xl p-4 font-mono text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap max-h-[320px] overflow-y-auto">
                            {prompts[key]}
                          </div>
                          <div className="mt-2.5 text-[11px] text-muted-foreground">
                            {wordCount(prompts[key])} words · {(prompts[key] || '').length} characters
                          </div>
                        </>
                      ) : (
                        <div className="py-10 text-center text-sm text-muted-foreground">
                          <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-20" />
                          No prompt configured yet. Click <strong>Edit</strong> to add one.
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