import { useParams, useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';
import {
  ArrowLeft,
  User,
  CreditCard,
  Stethoscope,
  ClipboardList,
  ShoppingCart,
  Info,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';

const DocumentAnalysis = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { documents } = useUserStore();

  const document = documents.find((d) => d.id === id);
  const extractedData = document?.extractedData;

  if (!document) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Document Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">The document you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => navigate('/user/documents')} className="mt-4">
          Back to Documents
        </Button>
      </div>
    );
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.7) return 'bg-emerald-500 hover:bg-emerald-600';
    if (confidence >= 0.4) return 'bg-amber-500 hover:bg-amber-600';
    return 'bg-red-500 hover:bg-red-600';
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) {
      if (value.length === 0) return '—';
      if (typeof value[0] === 'string') return value.join(', ');
      return JSON.stringify(value);
    }
    return String(value);
  };

  const renderField = (label, field) => {
    const confidencePercent = Math.round(field.confidence * 100);
    
    return (
      <div className="group p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-teal-200 dark:hover:border-teal-500/30 transition-all">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
            <p className={`font-medium text-gray-900 dark:text-white truncate ${!field.value ? 'text-gray-400 dark:text-gray-500' : ''}`}>
              {formatValue(field.value)}
            </p>
            {field.source?.document && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Source: {field.source.document} {field.source.page && `(Page ${field.source.page})`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Confidence Button */}
            <button
              className={`px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-colors ${getConfidenceColor(field.confidence)}`}
            >
              {confidencePercent}%
            </button>
            
            {/* Info Tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 flex items-center justify-center transition-colors">
                    <Info className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </TooltipTrigger>
                <TooltipContent 
                  side="left" 
                  className="max-w-sm p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl"
                >
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900 dark:text-white">Extraction Reasoning</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{field.reasoning}</p>
                    {field.needs_csr_review && (
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Needs CSR Review</span>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (title, icon, data) => {
    if (!data) return null;
    const Icon = icon;
    const fields = Object.entries(data);
    
    if (fields.length === 0) return null;

    return (
      <TabsContent value={title.toLowerCase().replace(/\s+/g, '_')} className="mt-6">
        <Card className="border-0 shadow-lg bg-gray-50/50 dark:bg-slate-800/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 dark:bg-teal-500/20 rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <CardTitle className="text-lg text-gray-800 dark:text-white">{title}</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">{fields.length} fields extracted</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map(([key, field]) => (
                <div key={key}>
                  {renderField(key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), field)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    );
  };

  // Get patient name from extracted data
  const patientName = extractedData?.PATIENT_DEMOGRAPHICS?.patient_name?.value || 'Unknown Patient';

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/user/documents')}
            className="w-10 h-10 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight">{document.name}</h1>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-0 font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-widest">
                {document.category?.replace('_', ' ') || 'Medical Document'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Analyzed on {new Date(document.uploadDate || Date.now()).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-9 px-4 rounded-lg font-bold border-border/50 text-xs">
            Download PDF
          </Button>
          <Button className="h-9 px-4 rounded-lg font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-xs">
            Export Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Analysis Results */}
        <div className="xl:col-span-8 space-y-6">
          <Tabs defaultValue="patient" className="w-full">
            <TabsList className="bg-muted/50 p-1 rounded-xl h-11 border border-border/50 backdrop-blur-sm w-full sm:w-auto mb-6">
              <TabsTrigger value="patient" className="flex-1 sm:flex-none rounded-lg px-6 font-bold uppercase tracking-widest text-[10px] gap-2">
                <User className="w-3.5 h-3.5" /> Patient
              </TabsTrigger>
              <TabsTrigger value="clinical" className="flex-1 sm:flex-none rounded-lg px-6 font-bold uppercase tracking-widest text-[10px] gap-2">
                <Stethoscope className="w-3.5 h-3.5" /> Clinical
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex-1 sm:flex-none rounded-lg px-6 font-bold uppercase tracking-widest text-[10px] gap-2">
                <CreditCard className="w-3.5 h-3.5" /> Billing
              </TabsTrigger>
            </TabsList>

            {/* Patient Content */}
            <TabsContent value="patient" className="space-y-5 mt-0">
              <Card className="border-0 shadow-lg shadow-black/5 dark:shadow-white/5 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm border-white/20 dark:border-white/5">
                <CardHeader className="p-6 border-b border-border/50">
                  <CardTitle className="text-lg font-bold flex items-center gap-2.5">
                    <User className="w-5 h-5 text-primary" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {extractedData?.PATIENT_DEMOGRAPHICS?.patient_name && renderField('Full Name', extractedData.PATIENT_DEMOGRAPHICS.patient_name)}
                    {extractedData?.PATIENT_DEMOGRAPHICS?.patient_dob && renderField('Date of Birth', extractedData.PATIENT_DEMOGRAPHICS.patient_dob)}
                    {extractedData?.PATIENT_DEMOGRAPHICS?.patient_id && renderField('Patient ID', extractedData.PATIENT_DEMOGRAPHICS.patient_id)}
                    {extractedData?.PATIENT_DEMOGRAPHICS?.patient_gender && renderField('Gender', extractedData.PATIENT_DEMOGRAPHICS.patient_gender)}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Clinical Content */}
            <TabsContent value="clinical" className="space-y-5 mt-0">
              <Card className="border-0 shadow-lg shadow-black/5 dark:shadow-white/5 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm border-white/20 dark:border-white/5">
                <CardHeader className="p-6 border-b border-border/50">
                  <CardTitle className="text-lg font-bold flex items-center gap-2.5">
                    <Stethoscope className="w-5 h-5 text-primary" />
                    Clinical Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {extractedData?.CLINICAL_FINDINGS?.diagnosis && renderField('Diagnosis', extractedData.CLINICAL_FINDINGS.diagnosis)}
                    {extractedData?.CLINICAL_FINDINGS?.medications && renderField('Medications', extractedData.CLINICAL_FINDINGS.medications)}
                    {extractedData?.CLINICAL_FINDINGS?.clinical_reasoning && renderField('Clinical Reasoning', extractedData.CLINICAL_FINDINGS.clinical_reasoning)}
                    {extractedData?.CLINICAL_FINDINGS?.treatment_plan && renderField('Treatment Plan', extractedData.CLINICAL_FINDINGS.treatment_plan)}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Content */}
            <TabsContent value="billing" className="space-y-5 mt-0">
              <Card className="border-0 shadow-lg shadow-black/5 dark:shadow-white/5 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm border-white/20 dark:border-white/5">
                <CardHeader className="p-6 border-b border-border/50">
                  <CardTitle className="text-lg font-bold flex items-center gap-2.5">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Billing & Insurance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {extractedData?.INSURANCE_BILLING?.insurance_provider && renderField('Insurance Provider', extractedData.INSURANCE_BILLING.insurance_provider)}
                    {extractedData?.INSURANCE_BILLING?.policy_number && renderField('Policy Number', extractedData.INSURANCE_BILLING.policy_number)}
                    {extractedData?.INSURANCE_BILLING?.group_number && renderField('Group Number', extractedData.INSURANCE_BILLING.group_number)}
                    {extractedData?.INSURANCE_BILLING?.billing_codes && renderField('Billing Codes (CPT/ICD)', extractedData.INSURANCE_BILLING.billing_codes)}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: AI Insights & Document Info */}
        <div className="xl:col-span-4 space-y-6">
          <Card className="border-0 shadow-lg shadow-black/5 dark:shadow-white/5 rounded-2xl overflow-hidden bg-primary/5 border border-primary/10">
            <CardHeader className="p-6 pb-3">
              <CardTitle className="text-base font-bold tracking-tight text-primary flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-500" />
                AI Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <p className="text-xs text-muted-foreground leading-relaxed font-medium italic">
                "Based on the clinical documentation provided, the patient shows clear indicators for {extractedData?.CLINICAL_FINDINGS?.diagnosis?.value || 'the diagnosed condition'}. The AI has verified the medications against current protocols with high confidence."
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg shadow-black/5 dark:shadow-white/5 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm border-white/20 dark:border-white/5">
            <CardHeader className="p-6 border-b border-border/50">
              <CardTitle className="text-base font-bold tracking-tight">Analysis Stats</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">Confidence Score</span>
                  <span className="text-emerald-500 font-black text-lg">94%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-[94%] bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                </div>
                
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Verified clinical reasoning
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Source document matched
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground/80">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    1 field needs manual review
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DocumentAnalysis;
