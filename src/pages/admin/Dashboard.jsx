import { useSelector } from 'react-redux';
import { useUserStore } from '../../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Users, FileText, CheckCircle2, Clock, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Button } from '../../components/ui/button';

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { documents } = useUserStore();

  const stats = [
    {
      title: 'Total Users',
      value: 3,
      icon: Users,
      trend: '+12%',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Documents',
      value: documents.length,
      icon: FileText,
      trend: '+25%',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Processed',
      value: documents.filter((d) => d.status === 'completed').length,
      icon: CheckCircle2,
      trend: '+18%',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Processing',
      value: documents.filter((d) => d.status === 'processing').length,
      icon: Clock,
      trend: '-5%',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-primary px-8 py-12 text-primary-foreground shadow-2xl shadow-primary/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              System Live
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
            <p className="text-primary-foreground/80 text-base max-w-xl leading-relaxed">
              Welcome back, <span className="font-bold text-white underline underline-offset-4 decoration-white/30">{user?.name}</span>! System performance is optimal today with {documents.filter(d => d.status === 'processing').length} active tasks.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" className="bg-white/10 hover:bg-white/20 border-white/10 text-white backdrop-blur-md px-5 h-10 rounded-xl text-sm">
              System Logs
            </Button>
            <Button variant="secondary" className="bg-white text-primary hover:bg-white/90 shadow-xl px-5 h-10 rounded-xl font-bold text-sm">
              Quick Actions
            </Button>
          </div>
        </div>
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[25rem] h-[25rem] bg-white/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-black/10 rounded-full blur-[60px]" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="group overflow-hidden border-0 shadow-lg shadow-black/5 dark:shadow-white/5 hover:shadow-xl transition-all duration-500 rounded-2xl bg-card/50 backdrop-blur-sm border-white/20 dark:border-white/5">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`p-3 ${stat.bgColor} rounded-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    <TrendingUp className="w-3 h-3" />
                    {stat.trend}
                  </div>
                </div>
                <div className="mt-5">
                  <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest">{stat.title}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">{stat.value}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-0 shadow-lg shadow-black/5 dark:shadow-white/5 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm border-white/20 dark:border-white/5">
          <CardHeader className="p-6 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold tracking-tight">Recent Activity</CardTitle>
                <CardDescription className="text-xs mt-1">Real-time system updates and events</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="rounded-lg px-3 text-xs h-8">View All</Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {documents.slice(0, 4).map((doc, idx) => (
                <div key={idx} className="flex items-center gap-4 group">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shrink-0 ${
                    doc.status === 'completed' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                    doc.status === 'processing' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                    'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm group-hover:text-primary transition-colors truncate">{doc.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Category: <span className="text-foreground/70 font-medium capitalize">{doc.category.replace('_', ' ')}</span></p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full inline-block ${
                      doc.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                      doc.status === 'processing' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {doc.status}
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 mt-1 font-medium">{new Date(doc.uploadDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="border-0 shadow-lg shadow-black/5 dark:shadow-white/5 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm border-white/20 dark:border-white/5">
          <CardHeader className="p-6 border-b border-border/50">
            <CardTitle className="text-lg font-bold tracking-tight">System Health</CardTitle>
            <CardDescription className="text-xs mt-1">Real-time performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {[
                { label: 'CPU Usage', value: 24, color: 'bg-primary' },
                { label: 'Memory', value: 45, color: 'bg-blue-500' },
                { label: 'Storage', value: 68, color: 'bg-emerald-500' },
              ].map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-muted-foreground/80 uppercase tracking-widest text-[10px]">{item.label}</span>
                    <span className="text-primary">{item.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}

              <div className="pt-5 mt-5 border-t border-border/50">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="font-bold text-[11px] tracking-tight">All systems operational</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    System maintenance scheduled for next Sunday at 02:00 AM UTC.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
