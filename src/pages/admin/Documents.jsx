import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listOrders, getOrderStatus } from '../../services/intakeApi';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { FileText, Search, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';

const OrderStatusBadge = ({ status }) => {
  const s = (status || 'pending').toLowerCase();
  const map = {
    pending: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    classifying: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    extracting: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    reconciling: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    complete: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    awaiting_csr_decision: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    failed: 'bg-red-500/10 text-red-600 border-red-500/20',
  };
  const isProcessing = ['pending', 'classifying', 'extracting', 'reconciling'].includes(s);
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${map[s] || map.pending}`}>
      {isProcessing ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : s === 'complete' ? (
        <CheckCircle2 className="w-3.5 h-3.5" />
      ) : s === 'awaiting_csr_decision' ? (
        <AlertCircle className="w-3.5 h-3.5" />
      ) : (
        <X className="w-3.5 h-3.5" />
      )}
      {s.replace(/_/g, ' ')}
    </div>
  );
};

const ConfidenceDot = ({ score }) => {
  if (score === null || score === undefined) return <span className="text-muted-foreground/40 font-mono">—</span>;
  const pct = Math.round(parseFloat(score) * 100);
  let color = 'text-red-500';
  if (score >= 0.85) color = 'text-emerald-500';
  else if (score >= 0.60) color = 'text-amber-500';
  return (
    <span className="flex items-center gap-1.5">
      <span className={`text-[12px] leading-none ${color}`}>●</span>
      <span className="text-xs font-bold font-mono">{pct}%</span>
    </span>
  );
};

const SkeletonRow = () => (
  <TableRow>
    <TableCell className="pl-8"><div className="h-4 w-48 bg-muted/40 rounded animate-pulse" /></TableCell>
    <TableCell><div className="h-4 w-24 bg-muted/40 rounded animate-pulse" /></TableCell>
    <TableCell><div className="h-4 w-20 bg-muted/40 rounded animate-pulse" /></TableCell>
    <TableCell><div className="h-4 w-32 bg-muted/40 rounded animate-pulse" /></TableCell>
    <TableCell><div className="h-4 w-28 bg-muted/40 rounded animate-pulse" /></TableCell>
    <TableCell><div className="h-4 w-16 bg-muted/40 rounded animate-pulse" /></TableCell>
    <TableCell className="pr-8"><div className="h-4 w-24 bg-muted/40 rounded animate-pulse" /></TableCell>
  </TableRow>
);

const TableColumns = () => (
  <TableHeader>
    <TableRow>
      <TableHead className="pl-8">Filename</TableHead>
      <TableHead>Document Type</TableHead>
      <TableHead>Order ID</TableHead>
      <TableHead>Patient</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Confidence</TableHead>
      <TableHead className="pr-8">Uploaded</TableHead>
    </TableRow>
  </TableHeader>
);

const AdminDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      try {
        const listResult = await listOrders();
        const orders = listResult.orders || [];

        // TODO: Replace with a dedicated GET /intake/documents endpoint when built
        const statusResults = await Promise.allSettled(
          orders.map(order =>
            getOrderStatus(order.order_id).then(res => ({ order, statusData: res }))
          )
        );

        const allDocs = [];
        statusResults.forEach(result => {
          if (result.status === 'fulfilled') {
            const { order, statusData } = result.value;
            const docs = statusData.order?.documents || [];
            docs.forEach(doc => {
              allDocs.push({
                ...doc,
                order_id: order.order_id,
                patient_name: order.patient_name || statusData.order?.patient_name || 'Unknown',
                order_status: statusData.order?.status || order.status,
              });
            });
          }
        });

        setDocuments(allDocs);
      } catch (error) {
        console.error('Failed to load documents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const filtered = documents.filter(doc => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      doc.filename?.toLowerCase().includes(q) ||
      doc.patient_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight">Documents</h1>
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest text-[10px]">
          PDFs uploaded via intake orders
        </p>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-lg shadow-black/5 rounded-2xl bg-card/50 backdrop-blur-sm border-white/20 overflow-hidden">
        <CardContent className="p-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by filename or patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl text-base transition-all"
            />
          </div>
        </CardContent>
      </Card>

      {/* Documents Content */}
      <Card className="border-none shadow-xl shadow-black/[0.03] rounded-[2.5rem] bg-card overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <Table>
              <TableColumns />
              <TableBody>
                {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
              </TableBody>
            </Table>
          ) : documents.length === 0 ? (
            <div className="py-32 text-center">
              <div className="max-w-md mx-auto space-y-6 px-6">
                <div className="w-20 h-20 bg-muted rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                  <FileText className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black tracking-tight">Documents appear here after orders are processed</h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    Upload patient documents by creating a new order. Once extracted, all documents will be listed here with their classification, confidence scores, and linked order.
                  </p>
                </div>
                <Button asChild className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                  <Link to="/admin/intake/new">
                    Create New Order
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableColumns />
              <TableBody>
                {filtered.map((doc, idx) => (
                  <TableRow key={doc.doc_id || idx} className="hover:bg-muted/5 transition-colors">
                    <TableCell className="pl-8">
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                        <span className="text-xs font-bold font-mono truncate max-w-[200px]" title={doc.filename}>
                          {doc.filename?.length > 35 ? doc.filename.substring(0, 35) + '…' : doc.filename}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[9px] font-black bg-muted px-1.5 py-0.5 rounded text-muted-foreground/70 uppercase">
                        {doc.doc_type || 'unclassified'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/admin/intake/orders/${doc.order_id}`}
                        className="text-xs font-black font-mono text-primary hover:underline"
                      >
                        {doc.order_id?.substring(0, 8)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium">{doc.patient_name || 'Unknown'}</span>
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={doc.order_status} />
                    </TableCell>
                    <TableCell>
                      <ConfidenceDot score={doc.confidence_score} />
                    </TableCell>
                    <TableCell className="pr-8">
                      <span className="text-xs text-muted-foreground font-medium">
                        {doc.uploaded_at
                          ? new Date(doc.uploaded_at).toLocaleDateString()
                          : doc.created_at
                          ? new Date(doc.created_at).toLocaleDateString()
                          : '—'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDocuments;
