import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileQuestion,
  FileText,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Checkbox } from '../../components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

const BASE_URL = 'https://kenqo-api-409744260053.asia-south1.run.app';

const POLLING_STATUSES = new Set(['uploading', 'processing']);

const DOCUMENT_DISEASES = [
  { label: 'Lymphedema', value: 'lymphedema', active: true },
  { label: 'Diabetics', value: 'diabetics', comingSoon: true },
];

const getDocumentId = (doc) => doc?.document_id || doc?.id || doc?.doc_id;

const getPdfUrl = (doc) => doc?.doc_url || doc?.document_url || doc?.pdf_url || doc?.url || doc?.file_url;

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatCount = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  return Number.isFinite(Number(value)) ? Number(value).toLocaleString() : value;
};

const getErrorMessage = (payload, fallback) => (
  payload?.detail ||
  payload?.message ||
  payload?.error ||
  fallback
);

const normalizeDocuments = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.documents)) return data.documents;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const normalizeQuestionnaire = (data) => {
  const questionnaire = data?.questionnaire || data || {};
  return {
    questionnaire_id: questionnaire.questionnaire_id || questionnaire.id || data?.questionnaire_id || data?.id,
    document_id: questionnaire.document_id || data?.document_id,
    questions: Array.isArray(questionnaire.questions) ? questionnaire.questions : [],
  };
};

const normalizeOptions = (question) => {
  const options = question.options || question.choices || question.answers || [];
  if (Array.isArray(options)) {
    return options.map((option) => {
      if (option && typeof option === 'object') {
        const value = option.value ?? option.id ?? option.key ?? option.label ?? option.text;
        return { value: String(value ?? ''), label: String(option.label ?? option.text ?? value ?? '') };
      }
      return { value: String(option ?? ''), label: String(option ?? '') };
    }).filter((option) => option.value);
  }
  if (options && typeof options === 'object') {
    return Object.entries(options).map(([value, label]) => ({ value, label: String(label) }));
  }
  return [];
};

const getQuestionId = (question, index) => (
  question.question_id ||
  question.id ||
  question.key ||
  question.name ||
  `question_${index}`
);

const getQuestionText = (question) => (
  question.question ||
  question.text ||
  question.label ||
  question.prompt ||
  'Question'
);

const toSuggestedArray = (value) => {
  if (Array.isArray(value)) return value.map(String);
  if (value === null || value === undefined || value === '') return [];
  return [String(value)];
};

const StatusBadge = ({ status, errorMessage }) => {
  const value = (status || 'uploading').toLowerCase();
  const config = {
    uploading: {
      className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      label: 'Uploading...',
    },
    processing: {
      className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      label: 'Processing...',
    },
    pending_questionnaire: {
      className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      icon: <FileQuestion className="w-3.5 h-3.5" />,
      label: 'Questionnaire Ready',
    },
    pending: {
      className: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      label: 'Extraction Complete - Rules Pending',
    },
    complete: {
      className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      label: 'Complete',
    },
    completed: {
      className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      label: 'Complete',
    },
    failed: {
      className: 'bg-red-500/10 text-red-600 border-red-500/20',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      label: errorMessage || 'Failed',
    },
  };
  const item = config[value] || config.uploading;

  return (
    <div
      title={item.label}
      className={`inline-flex max-w-[260px] items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-sm ${item.className}`}
    >
      {item.icon}
      <span className="truncate">{item.label}</span>
    </div>
  );
};

const SkeletonRow = () => (
  <TableRow>
    {[...Array(7)].map((_, index) => (
      <TableCell key={index} className={index === 0 ? 'pl-8' : index === 6 ? 'pr-8' : ''}>
        <div className="h-4 w-24 animate-pulse rounded bg-muted/40" />
      </TableCell>
    ))}
  </TableRow>
);

const UploadDialog = ({ open, onOpenChange, userId, onUploaded }) => {
  const fileRef = useRef(null);
  const [disease, setDisease] = useState('lymphedema');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const reset = () => {
    setDisease('lymphedema');
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = async () => {
    if (!userId) {
      toast.error('Please sign in before uploading documents');
      return;
    }
    if (!disease.trim()) {
      toast.error('Please enter a disease');
      return;
    }
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }
    if (file.type && file.type !== 'application/pdf') {
      toast.error('Only PDF files are supported');
      return;
    }

    setIsUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('disease', disease.trim());
      body.append('user_id', userId);

      const response = await fetch(`${BASE_URL}/admin/documents/upload`, {
        method: 'POST',
        headers: { 'x-user-id': userId },
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(getErrorMessage(data, 'Upload failed'));
      }

      toast.success('Document uploaded. Processing started.');
      onUploaded({
        ...data,
        document_id: data.document_id || data.id,
        filename: data.filename || file.name,
        disease: data.disease || disease.trim(),
        status: data.status || 'uploading',
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      onOpenChange(nextOpen);
      if (!nextOpen) reset();
    }}>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-2xl px-6 text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20">
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg rounded-[2rem] border-0 p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black tracking-tight">Upload Document</DialogTitle>
          <DialogDescription className="text-xs font-medium text-muted-foreground">
            Add a PDF and disease context to start the extraction flow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Disease</label>
            <Select
              value={disease}
              onValueChange={setDisease}
            >
              <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background/50 text-sm font-medium">
                <SelectValue placeholder="Select disease" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50">
                {DOCUMENT_DISEASES.map((item) => (
                  <SelectItem
                    key={item.value}
                    value={item.value}
                    disabled={item.comingSoon}
                    className="rounded-lg text-sm font-bold"
                  >
                    {item.label}{item.comingSoon ? ' - Coming soon' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">PDF File</label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 px-5 py-8 text-center transition-all hover:border-primary/40 hover:bg-primary/5"
            >
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner transition-transform group-hover:scale-105">
                <FileText className="h-6 w-6" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="max-w-sm truncate text-sm font-black">{file?.name || 'Choose a PDF'}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  PDF only
                </p>
              </div>
            </button>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="outline" className="rounded-xl font-bold" disabled={isUploading} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="rounded-xl font-bold" disabled={isUploading} onClick={submit}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Start Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const QuestionnaireDialog = ({ open, document, questionnaire, loading, submitting, answers, customPrompt, onAnswersChange, onCustomPromptChange, onClose, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [otherValues, setOtherValues] = useState({});
  const questions = questionnaire?.questions || [];
  const isPromptStep = currentStep >= questions.length;
  const currentQuestion = questions[currentStep];
  const totalSteps = questions.length + 1;

  const setAnswer = (questionId, value) => {
    onAnswersChange((previous) => ({ ...previous, [questionId]: value }));
  };

  const toggleMultiAnswer = (questionId, optionValue, checked) => {
    onAnswersChange((previous) => {
      const current = Array.isArray(previous[questionId]) ? previous[questionId] : [];
      return {
        ...previous,
        [questionId]: checked
          ? [...new Set([...current, optionValue])]
          : current.filter((value) => value !== optionValue),
      };
    });
  };

  const renderQuestionInput = (question, index) => {
    const questionId = getQuestionId(question, index);
    const questionType = question.type || question.input_type || question.question_type || 'text';
    const options = normalizeOptions(question);
    const currentAnswer = answers[questionId];
    const otherValue = otherValues[questionId] || '';
    const hasOtherSelected = Object.prototype.hasOwnProperty.call(otherValues, questionId);

    if (questionType === 'single_select') {
      return (
        <>
          <RadioGroup
            value={hasOtherSelected ? '__other__' : currentAnswer || ''}
            onValueChange={(value) => {
              if (value === '__other__') {
                setOtherValues((previous) => ({ ...previous, [questionId]: previous[questionId] || '' }));
                setAnswer(questionId, otherValues[questionId] || '');
                return;
              }
              setOtherValues((previous) => {
                const next = { ...previous };
                delete next[questionId];
                return next;
              });
              setAnswer(questionId, value);
            }}
          >
            {options.map((option) => (
              <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/40 bg-background/60 px-3 py-3 text-sm font-bold transition-colors hover:bg-primary/5">
                <RadioGroupItem value={option.value} />
                <span>{option.label}</span>
              </label>
            ))}
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/40 bg-background/60 px-3 py-3 text-sm font-bold transition-colors hover:bg-primary/5">
              <RadioGroupItem value="__other__" />
              <span>Other</span>
            </label>
          </RadioGroup>
          {hasOtherSelected && (
            <Input
              value={otherValue}
              onChange={(event) => {
                const value = event.target.value;
                setOtherValues((previous) => ({ ...previous, [questionId]: value }));
                setAnswer(questionId, value);
              }}
              placeholder="Please specify..."
              className="mt-2 h-11 rounded-xl bg-background/70 text-sm font-medium"
            />
          )}
        </>
      );
    }

    if (questionType === 'multi_select') {
      const currentValues = Array.isArray(currentAnswer) ? currentAnswer : [];
      return (
        <>
          <div className="grid gap-3">
            {options.map((option) => (
              <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/40 bg-background/60 px-3 py-3 text-sm font-bold transition-colors hover:bg-primary/5">
                <Checkbox
                  checked={currentValues.includes(option.value)}
                  onCheckedChange={(checked) => toggleMultiAnswer(questionId, option.value, checked === true)}
                />
                <span>{option.label}</span>
              </label>
            ))}
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/40 bg-background/60 px-3 py-3 text-sm font-bold transition-colors hover:bg-primary/5">
              <Checkbox
                checked={hasOtherSelected}
                onCheckedChange={(checked) => {
                  if (checked === true) {
                    setOtherValues((previous) => ({ ...previous, [questionId]: previous[questionId] || '' }));
                    onAnswersChange((previous) => {
                      const current = Array.isArray(previous[questionId]) ? previous[questionId] : [];
                      return { ...previous, [questionId]: [...new Set([...current, '__other__'])] };
                    });
                    return;
                  }
                  const valueToRemove = otherValues[questionId];
                  setOtherValues((previous) => {
                    const next = { ...previous };
                    delete next[questionId];
                    return next;
                  });
                  onAnswersChange((previous) => {
                    const current = Array.isArray(previous[questionId]) ? previous[questionId] : [];
                    return {
                      ...previous,
                      [questionId]: current.filter((value) => value !== '__other__' && value !== valueToRemove),
                    };
                  });
                }}
              />
              <span>Other</span>
            </label>
          </div>
          {hasOtherSelected && (
            <Input
              value={otherValue}
              onChange={(event) => {
                const value = event.target.value;
                const previousOtherValue = otherValues[questionId];
                setOtherValues((previous) => ({ ...previous, [questionId]: value }));
                onAnswersChange((previous) => {
                  const current = Array.isArray(previous[questionId]) ? previous[questionId] : [];
                  const next = current.filter((item) => item !== '__other__' && item !== previousOtherValue);
                  return { ...previous, [questionId]: value ? [...new Set([...next, value])] : next };
                });
              }}
              placeholder="Please specify..."
              className="mt-2 h-11 rounded-xl bg-background/70 text-sm font-medium"
            />
          )}
        </>
      );
    }

    return (
      <Input
        value={currentAnswer || ''}
        onChange={(event) => setAnswer(questionId, event.target.value)}
        placeholder={question.suggested_answer ? String(question.suggested_answer) : 'Enter answer'}
        className="h-11 rounded-xl bg-background/70 text-sm font-medium"
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[90vh] sm:max-w-2xl overflow-hidden rounded-[2rem] border-0 p-0 shadow-2xl">
        <DialogHeader className="border-b border-border/40 px-6 py-5">
          <DialogTitle className="text-xl font-black tracking-tight">Document Context Questions</DialogTitle>
          <DialogDescription className="truncate text-xs font-medium text-muted-foreground">
            {document?.filename || 'Complete the questionnaire to start extraction.'}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[62vh] space-y-5 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-sm font-black text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading questions...
            </div>
          ) : questions.length ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <span>{isPromptStep ? 'Final Step' : `Question ${currentStep + 1} of ${questions.length}`}</span>
                  <span>{Math.min(currentStep + 1, totalSteps)} / {totalSteps}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${(Math.min(currentStep + 1, totalSteps) / totalSteps) * 100}%` }}
                  />
                </div>
              </div>

              {!isPromptStep ? (
                <div className="rounded-2xl border border-border/50 bg-muted/10 p-5">
                  <div className="mb-5 space-y-2">
                    <p className="text-base font-black leading-relaxed">{getQuestionText(currentQuestion)}</p>
                    {currentQuestion.help_text && (
                      <p className="text-xs font-medium text-muted-foreground">{currentQuestion.help_text}</p>
                    )}
                  </div>
                  {renderQuestionInput(currentQuestion, currentStep)}
                </div>
              ) : (
                <div className="rounded-2xl border border-border/50 bg-muted/10 p-5 space-y-4">
                  <div className="space-y-2">
                    <p className="text-base font-black leading-relaxed">Please enter your prompt for better results</p>
                    <p className="text-xs font-medium text-muted-foreground">
                      Add optional extraction guidance or context before starting extraction.
                    </p>
                  </div>
                  <Textarea
                    value={customPrompt}
                    onChange={(event) => onCustomPromptChange(event.target.value)}
                    placeholder="Example: Focus on coverage limits, prior authorization, documentation requirements, and HCPCS-specific rules..."
                    className="min-h-32 rounded-xl bg-background/70 text-sm font-medium"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 py-16 text-center">
              <FileQuestion className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="font-black">No questions available</p>
              <p className="text-xs font-medium text-muted-foreground">Try refreshing the document list and opening this again.</p>
            </div>
          )}

        </div>

        <DialogFooter className="gap-3 border-t border-border/40 px-6 py-4">
          <Button variant="outline" className="rounded-xl font-bold" disabled={submitting} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            className="rounded-xl font-bold"
            disabled={loading || submitting || currentStep === 0}
            onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
          >
            Back
          </Button>
          <Button
            className="rounded-xl font-bold"
            disabled={loading || submitting || !questionnaire?.questionnaire_id}
            onClick={() => {
              if (!isPromptStep) {
                setCurrentStep((step) => Math.min(totalSteps - 1, step + 1));
                return;
              }
              onSubmit();
            }}
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isPromptStep ? (
              <Sparkles className="mr-2 h-4 w-4" />
            ) : null}
            {isPromptStep ? 'Submit Answers' : 'Next'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AdminDocuments = () => {
  const { user } = useSelector((state) => state.auth);
  const userId = user?.user_id || user?.id || '';

  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [questionnaireState, setQuestionnaireState] = useState({
    open: false,
    document: null,
    questionnaire: null,
    loading: false,
    submitting: false,
    answers: {},
    customPrompt: '',
  });
  const pollingRef = useRef({});
  const sessionPollingIdsRef = useRef(new Set());

  const fetchDocuments = useCallback(async ({ silent = false } = {}) => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    if (!silent) setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/admin/documents/`, {
        headers: { 'x-user-id': userId },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(getErrorMessage(data, 'Failed to load documents'));
      }
      setDocuments(normalizeDocuments(data));
    } catch (error) {
      toast.error(error.message || 'Failed to load documents');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [userId]);

  const stopPolling = useCallback((documentId) => {
    if (!pollingRef.current[documentId]) return;
    clearInterval(pollingRef.current[documentId]);
    delete pollingRef.current[documentId];
  }, []);

  const pollStatus = useCallback(async (documentId) => {
    if (!userId || !documentId) return;
    try {
      const response = await fetch(`${BASE_URL}/admin/documents/${documentId}/status`, {
        headers: { 'x-user-id': userId },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) return;

      const nextStatus = data.status || data.document?.status;
      setDocuments((previous) => previous.map((doc) => {
        if (getDocumentId(doc) !== documentId) return doc;
        return {
          ...doc,
          ...(data.document || {}),
          status: nextStatus || doc.status,
          step: data.step ?? doc.step,
          step_message: data.step_message ?? doc.step_message,
          chunks_added: data.chunks_added ?? data.document?.chunks_added ?? doc.chunks_added,
          rules_added: data.rules_added ?? data.document?.rules_added ?? doc.rules_added,
          error_message: data.error_message ?? data.document?.error_message ?? doc.error_message,
        };
      }));

      if (!POLLING_STATUSES.has(String(nextStatus || '').toLowerCase())) {
        stopPolling(documentId);
        sessionPollingIdsRef.current.delete(documentId);
        if (nextStatus === 'pending_questionnaire') toast.info('Questionnaire ready');
        if (nextStatus === 'failed') toast.error(data.error_message || 'Document processing failed');
      }
    } catch {
      // Keep polling through transient network failures.
    }
  }, [stopPolling, userId]);

  const startPolling = useCallback((documentId) => {
    if (!documentId || pollingRef.current[documentId]) return;
    pollingRef.current[documentId] = setInterval(() => pollStatus(documentId), 4000);
    pollStatus(documentId);
  }, [pollStatus]);

  useEffect(() => {
    fetchDocuments();
    return () => {
      Object.values(pollingRef.current).forEach(clearInterval);
      pollingRef.current = {};
    };
  }, [fetchDocuments]);

  useEffect(() => {
    documents.forEach((doc) => {
      const documentId = getDocumentId(doc);
      const status = String(doc.status || '').toLowerCase();
      if (documentId && !POLLING_STATUSES.has(status)) {
        stopPolling(documentId);
        sessionPollingIdsRef.current.delete(documentId);
      }
    });
  }, [documents, startPolling, stopPolling]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return documents;
    return documents.filter((doc) => (
      (doc.filename || '').toLowerCase().includes(query) ||
      (doc.disease || '').toLowerCase().includes(query) ||
      (doc.status || '').toLowerCase().includes(query)
    ));
  }, [documents, search]);

  const handleUploaded = (uploadResponse) => {
    const documentId = uploadResponse.document_id || uploadResponse.id;
    const nextDoc = {
      document_id: documentId,
      filename: uploadResponse.filename || 'Uploaded document',
      disease: uploadResponse.disease || '',
      status: uploadResponse.status || 'uploading',
      chunks_added: uploadResponse.chunks_added,
      rules_added: uploadResponse.rules_added,
      created_at: uploadResponse.created_at || new Date().toISOString(),
      ...uploadResponse.document,
    };
    setDocuments((previous) => [nextDoc, ...previous.filter((doc) => getDocumentId(doc) !== documentId)]);
    if (documentId) {
      sessionPollingIdsRef.current.add(documentId);
      startPolling(documentId);
    }
  };

  const handleViewPdf = (doc) => {
    const url = getPdfUrl(doc);
    if (!url) {
      toast.error('PDF URL is not available yet');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDelete = async (doc) => {
    const documentId = getDocumentId(doc);
    if (!documentId || !window.confirm(`Delete "${doc.filename || 'this document'}"?`)) return;

    setDeletingId(documentId);
    try {
      const response = await fetch(`${BASE_URL}/admin/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(getErrorMessage(data, 'Delete failed'));
      }
      stopPolling(documentId);
      setDocuments((previous) => previous.filter((item) => getDocumentId(item) !== documentId));
      toast.success('Document deleted');
    } catch (error) {
      toast.error(error.message || 'Delete failed');
    } finally {
      setDeletingId('');
    }
  };

  const openQuestionnaire = async (doc) => {
    const documentId = getDocumentId(doc);
    setQuestionnaireState({
      open: true,
      document: doc,
      questionnaire: null,
      loading: true,
      submitting: false,
      answers: {},
      customPrompt: '',
    });

    try {
      const response = await fetch(`${BASE_URL}/questionnaires/${documentId}`, {
        headers: { 'x-user-id': userId },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(getErrorMessage(data, 'Failed to load questionnaire'));
      }

      const questionnaire = normalizeQuestionnaire(data);
      const suggestedAnswers = {};
      questionnaire.questions.forEach((question, index) => {
        const questionId = getQuestionId(question, index);
        const questionType = question.type || question.input_type || question.question_type || 'text';
        if (questionType === 'multi_select') {
          suggestedAnswers[questionId] = toSuggestedArray(question.suggested_answer);
        } else if (questionType === 'single_select') {
          suggestedAnswers[questionId] = toSuggestedArray(question.suggested_answer)[0] || '';
        } else {
          suggestedAnswers[questionId] = '';
        }
      });

      setQuestionnaireState((previous) => ({
        ...previous,
        questionnaire,
        loading: false,
        answers: suggestedAnswers,
      }));
    } catch (error) {
      toast.error(error.message || 'Failed to load questionnaire');
      setQuestionnaireState((previous) => ({ ...previous, loading: false }));
    }
  };

  const closeQuestionnaire = () => {
    if (questionnaireState.submitting) return;
    setQuestionnaireState({
      open: false,
      document: null,
      questionnaire: null,
      loading: false,
      submitting: false,
      answers: {},
      customPrompt: '',
    });
  };

  const submitQuestionnaire = async () => {
    const questionnaireId = questionnaireState.questionnaire?.questionnaire_id;
    if (!questionnaireId) {
      toast.error('Questionnaire ID is missing');
      return;
    }

    setQuestionnaireState((previous) => ({ ...previous, submitting: true }));
    try {
      const response = await fetch(`${BASE_URL}/questionnaires/${questionnaireId}/submit`, {
        method: 'POST',
        headers: {
          'x-user-id': userId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          answers: questionnaireState.answers,
          custom_prompt: questionnaireState.customPrompt,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(getErrorMessage(data, 'Failed to submit questionnaire'));
      }

      toast.success('Extraction started');
      const documentId = getDocumentId(questionnaireState.document);
      closeQuestionnaire();
      await fetchDocuments({ silent: true });
      if (documentId) {
        sessionPollingIdsRef.current.add(documentId);
        startPolling(documentId);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit questionnaire');
      setQuestionnaireState((previous) => ({ ...previous, submitting: false }));
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary shadow-sm">
            <FileText className="h-3.5 w-3.5" />
            Document Central
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Documents</h1>
            <p className="text-sm font-medium text-muted-foreground">
              Upload PDFs, answer extraction context, and monitor rule generation.
            </p>
          </div>
        </div>

        <UploadDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          userId={userId}
          onUploaded={handleUploaded}
        />
      </div>

      <Card className="overflow-hidden rounded-2xl border-0 bg-card/50 shadow-lg shadow-black/5 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <Input
              placeholder="Search by filename, disease, or status..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-12 rounded-xl border-border/50 bg-background/50 pl-11 pr-12 text-sm font-medium transition-all focus:border-primary/50 focus:ring-primary/20"
            />
          </div>
        </CardContent>
      </Card>

      {!userId && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm font-bold text-amber-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Please sign in to manage documents.
        </div>
      )}

      <Card className="w-full max-w-full overflow-hidden rounded-[2rem] border-none bg-card shadow-xl shadow-black/[0.03]">
        <CardContent className="p-0">
          {isLoading ? (
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[24%] pl-8">Filename</TableHead>
                  <TableHead className="w-[13%]">Disease</TableHead>
                  <TableHead className="w-[20%]">Status</TableHead>
                  <TableHead className="w-[10%]">Chunks</TableHead>
                  <TableHead className="w-[10%]">Rules</TableHead>
                  <TableHead className="w-[11%]">Uploaded</TableHead>
                  <TableHead className="w-[12%] pr-8 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, index) => <SkeletonRow key={index} />)}
              </TableBody>
            </Table>
          ) : filtered.length === 0 ? (
            <div className="py-28 text-center">
              <div className="mx-auto max-w-md space-y-5 px-6">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-muted shadow-inner">
                  <FileText className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black tracking-tight">No documents found</h3>
                  <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                    Upload a PDF to begin the new questionnaire-led extraction flow.
                  </p>
                </div>
                <Button className="h-11 rounded-2xl px-6 text-xs font-black uppercase tracking-widest" onClick={() => setUploadOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </div>
            </div>
          ) : (
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[24%] pl-8">Filename</TableHead>
                  <TableHead className="w-[13%]">Disease</TableHead>
                  <TableHead className="w-[20%]">Status</TableHead>
                  <TableHead className="w-[10%]">Chunks</TableHead>
                  <TableHead className="w-[10%]">Rules</TableHead>
                  <TableHead className="w-[11%]">Uploaded</TableHead>
                  <TableHead className="w-[12%] pr-8 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((doc, index) => {
                  const documentId = getDocumentId(doc) || index;
                  const status = String(doc.status || '').toLowerCase();
                  return (
                    <TableRow key={documentId} className="group hover:bg-primary/[0.02]">
                      <TableCell className="min-w-0 pl-8">
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner">
                            <FileText className="h-5 w-5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-black" title={doc.filename}>
                              {doc.filename || '-'}
                            </span>
                            <span className="block truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                              {documentId}
                            </span>
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="min-w-0">
                        <span className="block truncate rounded-xl bg-muted px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          {doc.disease || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="min-w-0">
                        <StatusBadge status={doc.status} errorMessage={doc.error_message} />
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-muted-foreground">{formatCount(doc.chunks_added ?? doc.chunks_count)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-muted-foreground">{formatCount(doc.rules_added ?? doc.rules_count)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium text-muted-foreground">
                          {formatDate(doc.created_at || doc.uploaded_at || doc.upload_date)}
                        </span>
                      </TableCell>
                      <TableCell className="pr-8">
                        <div className="flex min-w-0 items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            title="View PDF"
                            className="h-10 w-10 rounded-xl border-border/60 shadow-sm transition-all active:scale-95"
                            onClick={() => handleViewPdf(doc)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {status === 'pending_questionnaire' && (
                            <Button
                              title="Answer Questionnaire"
                              className="h-10 min-w-10 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/15"
                              onClick={() => openQuestionnaire(doc)}
                            >
                              <FileQuestion className="mr-2 h-4 w-4" />
                              <span className="hidden xl:inline">Questionnaire</span>
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="icon"
                            title="Delete"
                            disabled={deletingId === getDocumentId(doc)}
                            className="h-10 w-10 rounded-xl border-border/60 shadow-sm transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500 active:scale-95"
                            onClick={() => handleDelete(doc)}
                          >
                            {deletingId === getDocumentId(doc)
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <QuestionnaireDialog
        key={`${getDocumentId(questionnaireState.document) || 'document'}-${questionnaireState.questionnaire?.questionnaire_id || 'questionnaire'}`}
        open={questionnaireState.open}
        document={questionnaireState.document}
        questionnaire={questionnaireState.questionnaire}
        loading={questionnaireState.loading}
        submitting={questionnaireState.submitting}
        answers={questionnaireState.answers}
        customPrompt={questionnaireState.customPrompt}
        onAnswersChange={(updater) => setQuestionnaireState((previous) => ({
          ...previous,
          answers: typeof updater === 'function' ? updater(previous.answers) : updater,
        }))}
        onCustomPromptChange={(customPrompt) => setQuestionnaireState((previous) => ({ ...previous, customPrompt }))}
        onClose={closeQuestionnaire}
        onSubmit={submitQuestionnaire}
      />
    </div>
  );
};

export default AdminDocuments;
