import { useSelector } from 'react-redux';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Badge } from '../../components/ui/badge';
import {
  FileText,
  Upload,
  MoreVertical,
  Download,
  Trash2,
  Search,
  Clock,
  FileSearch,
} from 'lucide-react';
import { toast } from 'sonner';

const documentCategories = [
  { value: 'prescription', label: 'Prescription' },
  { value: 'clinical_notes', label: 'Clinical Notes' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'lab_result', label: 'Lab Result' },
  { value: 'report', label: 'Medical Report' },
  { value: 'other', label: 'Other' },
];

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const UserDocuments = () => {
  const { user } = useSelector((state) => state.auth);
  const { addDocument, deleteDocument, getUserDocuments } = useUserStore();
  const navigate = useNavigate();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const fileInputRef = useRef(null);

  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: 'prescription',
    file: null,
  });

  const userDocuments = user ? getUserDocuments(user.id) : [];

  const filteredDocuments = userDocuments.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm((prev) => ({
        ...prev,
        name: file.name.replace(/\.[^/.]+$/, ''),
        file,
      }));
    }
  };

  const handleUpload = () => {
    if (!uploadForm.file || !user) {
      toast.error('Please select a file');
      return;
    }

    const newDocument = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      name: uploadForm.name + (uploadForm.file.name.match(/\.[^/.]+$/)?.[0] || ''),
      type: uploadForm.file.type,
      size: uploadForm.file.size,
      uploadDate: new Date().toISOString(),
      url: URL.createObjectURL(uploadForm.file),
      category: uploadForm.category,
      status: 'processing',
    };

    addDocument(newDocument);
    toast.success('Document uploaded successfully! Processing...');
    setIsUploadDialogOpen(false);
    setUploadForm({ name: '', category: 'prescription', file: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Simulate processing completion
    setTimeout(() => {
      toast.success('Document analysis complete!');
    }, 3000);
  };

  const handleDelete = (docId) => {
    deleteDocument(docId);
    toast.success('Document deleted successfully!');
  };

  const handleViewAnalysis = (docId) => {
    navigate(`/user/documents/${docId}/analysis`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
            <FileText className="w-3.5 h-3.5" />
            Medical Repository
          </div>
          <h1 className="text-2xl font-black tracking-tight">Your Documents</h1>
          <p className="text-muted-foreground text-sm">Securely store and analyze your clinical records</p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-10 px-5 rounded-xl font-bold group text-xs">
              <Upload className="w-4 h-4 mr-2 transition-transform group-hover:-translate-y-0.5" />
              Process New File
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] rounded-2xl p-6 border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Upload Document</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-medium">
                Our AI will analyze your file for clinical insights.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Document Name</label>
                <Input
                  placeholder="e.g., Blood Test Report"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  className="h-10 rounded-lg bg-muted/50 border-0 focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Category</label>
                <Select
                  value={uploadForm.category}
                  onValueChange={(val) => setUploadForm({ ...uploadForm, category: val })}
                >
                  <SelectTrigger className="h-10 rounded-lg bg-muted/50 border-0 text-sm">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50">
                    {documentCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="rounded-lg text-sm">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select File</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {uploadForm.file ? (
                    <div className="flex items-center justify-center gap-2 text-primary font-bold text-sm">
                      <FileText className="w-5 h-5" />
                      <span className="truncate max-w-[180px]">{uploadForm.file.name}</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto transition-transform group-hover:scale-110">
                        <Upload className="w-5 h-5 text-primary" />
                      </div>
                      <p className="text-xs font-bold text-muted-foreground">Click to browse or drag and drop</p>
                      <p className="text-[10px] text-muted-foreground/60 font-medium">PDF, JPG, PNG up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 h-10 rounded-lg font-bold text-sm" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
              <Button className="flex-1 h-10 rounded-lg font-bold text-sm" onClick={handleUpload}>Start Processing</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg shadow-black/5 dark:shadow-white/5 rounded-2xl bg-card/50 backdrop-blur-sm border-white/20 dark:border-white/5 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search by filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all text-sm"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[180px] h-11 rounded-xl bg-background/50 border-border/50 text-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50">
                <SelectItem value="all" className="text-sm">All Categories</SelectItem>
                {documentCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="text-sm">{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map((doc) => (
            <Card 
              key={doc.id} 
              className="group border-0 shadow-lg shadow-black/5 dark:shadow-white/5 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm border-white/20 dark:border-white/5 hover:shadow-xl transition-all duration-500 hover:-translate-y-0.5"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-md shadow-black/5 ${
                    doc.status === 'completed' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                    doc.status === 'processing' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                    'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                  }`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full hover:bg-muted">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-border/50 p-1.5">
                      <DropdownMenuItem className="rounded-lg text-xs font-medium cursor-pointer">
                        <Download className="w-3.5 h-3.5 mr-2" /> Download
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="rounded-lg text-xs font-medium text-destructive focus:text-destructive cursor-pointer"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <h3 className="text-base font-bold tracking-tight truncate group-hover:text-primary transition-colors">{doc.name}</h3>
                    <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.12em] mt-0.5">
                      {doc.category.replace('_', ' ')}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3.5 border-t border-border/40">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/70">
                      <Clock className="w-3 h-3" />
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                      {formatFileSize(doc.size)}
                    </div>
                  </div>

                  {doc.status === 'completed' ? (
                    <Button 
                      className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 group/btn text-xs"
                      onClick={() => navigate(`/user/documents/${doc.id}/analysis`)}
                    >
                      <FileSearch className="w-4 h-4 mr-2 transition-transform group-hover/btn:scale-110" />
                      View AI Analysis
                    </Button>
                  ) : doc.status === 'processing' ? (
                    <div className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-amber-500/10 text-amber-600 font-bold text-[11px]">
                      <Clock className="w-4 h-4 animate-spin-slow" />
                      Analyzing Clinical Data...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-destructive/10 text-destructive font-bold text-[11px]">
                      Processing Failed
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-5">
              <Search className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">No documents found</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-6 font-medium">
              We couldn't find any documents matching your criteria. Try adjusting your search or category filters.
            </p>
            <Button 
              variant="outline" 
              className="rounded-xl h-10 px-6 font-bold text-xs"
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDocuments;
