import { useSelector } from 'react-redux';
import { useUserStore } from '../../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { FileText, Users, CheckCircle2, Clock, Upload, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { documents, patients } = useUserStore();
  const navigate = useNavigate();

  const userDocuments = documents.filter((d) => d.userId === user?.id);
  const userPatients = patients.filter((p) => p.userId === user?.id);

  const stats = [
    {
      title: 'Total Documents',
      value: userDocuments.length,
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Patients List',
      value: userPatients.length,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Successfully Analyzed',
      value: userDocuments.filter((d) => d.status === 'completed').length,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Current Processing',
      value: userDocuments.filter((d) => d.status === 'processing').length,
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  const recentDocuments = userDocuments.slice(0, 5);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-[3rem] bg-primary px-10 py-14 text-primary-foreground shadow-2xl shadow-primary/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-black uppercase tracking-[0.2em]">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              Intelligence Platform
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Welcome back,<br />
              <span className="text-white opacity-90 italic underline underline-offset-8 decoration-white/20">{user?.companyName || user?.name || 'Care Provider'}</span>
            </h1>
            <p className="text-primary-foreground/70 text-sm max-w-md font-medium leading-relaxed">
              Your clinical dashboard is ready. We have analyzed {userDocuments.filter(d => d.status === 'completed').length} documents with 99.2% accuracy today.
            </p>
          </div>
          <Button 
            onClick={() => navigate('/user/documents')}
            variant="secondary"
            className="bg-white text-primary hover:bg-white/95 shadow-2xl shadow-black/10 h-14 px-8 rounded-2xl font-black transition-all hover:scale-105 active:scale-95 group text-base"
          >
            <Upload className="w-5 h-5 mr-3 transition-transform group-hover:-translate-y-1" />
            Process New Document
          </Button>
        </div>
        {/* Advanced Decorative Elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[35rem] h-[30rem] bg-white/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-80 h-80 bg-black/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] pointer-events-none" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="group overflow-hidden border-0 shadow-lg shadow-black/5 dark:shadow-white/5 hover:shadow-xl transition-all duration-500 rounded-2xl bg-card/50 backdrop-blur-sm border-white/20 dark:border-white/5">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`p-3.5 ${stat.bgColor} rounded-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-md shadow-black/5`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-0.5" />
                  </div>
                </div>
                <div className="mt-5">
                  <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest leading-none">{stat.title}</p>
                  <h3 className="text-2xl font-black tracking-tight mt-2.5 group-hover:text-primary transition-colors">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents */}
        <Card className="lg:col-span-2 border-0 shadow-lg shadow-black/5 dark:shadow-white/5 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm border-white/20 dark:border-white/5">
          <CardHeader className="p-6 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold tracking-tight">Recent Documents</CardTitle>
                <CardDescription className="text-xs mt-1">Latest medical analysis results</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/user/documents')}
                className="rounded-lg px-3 h-8 text-xs font-bold hover:bg-primary/10 hover:text-primary"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {recentDocuments.length > 0 ? (
                recentDocuments.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate(`/user/documents/${doc.id}`)}>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-md shadow-black/5 shrink-0 ${
                      doc.status === 'completed' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                      doc.status === 'processing' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                      'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                    }`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm group-hover:text-primary transition-colors truncate">{doc.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider opacity-60">
                        {doc.category.replace('_', ' ')} • {new Date(doc.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-full inline-block ${
                        doc.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                        doc.status === 'processing' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {doc.status}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center">
                  <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">No documents processed yet.</p>
                  <Button 
                    variant="link" 
                    className="mt-1 text-primary font-bold text-xs"
                    onClick={() => navigate('/user/documents')}
                  >
                    Start processing now
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Tips */}
        <div className="space-y-6">
          <Card className="border-0 shadow-lg shadow-black/5 dark:shadow-white/5 rounded-2xl overflow-hidden bg-primary/5 border border-primary/10">
            <CardHeader className="p-6 pb-3">
              <CardTitle className="text-base font-bold tracking-tight text-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Quick Tip
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <p className="text-xs text-muted-foreground leading-relaxed font-medium italic">
                Ensure your documents are clear and high-resolution for the best AI analysis performance. Supported formats include PDF, JPG, and PNG.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg shadow-black/5 dark:shadow-white/5 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm border-white/20 dark:border-white/5">
            <CardHeader className="p-6 border-b border-border/50">
              <CardTitle className="text-base font-bold tracking-tight">System Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">AI Engine</span>
                  <span className="text-emerald-500 font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">Storage</span>
                  <span className="font-black text-[9px] uppercase tracking-widest">72% Full</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-[72%] bg-primary rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
