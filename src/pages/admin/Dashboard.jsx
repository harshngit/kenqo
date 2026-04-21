import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  CheckCircle2,
  Clock,
  FilePlus,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { listPatients } from '../../services/intakeApi';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await listPatients();
        setPatients(data.patients || []);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { label: 'Total Patients', value: patients.length, icon: Users, color: 'bg-primary/10 text-primary' },
    { label: 'Pending Review', value: 0, icon: Clock, color: 'bg-amber-500/10 text-amber-600' },
    { label: 'Completed Orders', value: 0, icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-600' },
    { label: 'Active Orders', value: 0, icon: ClipboardList, color: 'bg-blue-500/10 text-blue-600' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary to-primary/80 px-10 py-12 text-white shadow-2xl shadow-primary/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">
              Welcome back, {user?.full_name || user?.name || 'Admin'}
            </h1>
            <p className="text-white/70 text-sm font-medium">
              Manage your DME intake orders and patient records
            </p>
          </div>
          <Button 
            onClick={() => navigate('/admin/intake/new')}
            className="bg-white text-primary hover:bg-white/90 rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px] shadow-xl"
          >
            <FilePlus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        </div>
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-black/10 rounded-full blur-2xl" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="border-none shadow-xl shadow-black/[0.03] rounded-[2rem] bg-card overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-black tracking-tighter">{stat.value}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <Card className="border-none shadow-xl shadow-black/[0.03] rounded-[2.5rem] bg-card flex flex-col">
          <div className="p-8 border-b border-border/10">
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Recent Patients
            </h3>
          </div>
          <CardContent className="flex-1 p-0">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-muted/20 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : patients.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-muted-foreground">No patients yet</p>
                  <p className="text-xs text-muted-foreground/60">Patients appear here after your first order</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border/10">
                {patients.slice(0, 5).map((p) => (
                  <div key={p.patient_id} className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary text-xs font-black uppercase">
                        {p.first_name?.[0] ?? '?'}{p.last_name?.[0] ?? ''}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black">{p.first_name} {p.last_name}</p>
                          {p.identity_incomplete && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">DOB: {p.dob || '—'}</p>
                      </div>
                    </div>
                    <Button asChild variant="ghost" size="sm" className="text-primary font-black uppercase tracking-widest text-[9px]">
                      <Link to="/admin/intake/patients">View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {patients.length > 0 && (
            <div className="p-6 border-t border-border/10 text-center">
              <Link to="/admin/intake/patients" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center justify-center gap-2">
                View all patients <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="border-none shadow-xl shadow-black/[0.03] rounded-[2.5rem] bg-card">
          <div className="p-8 border-b border-border/10">
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-primary" /> Quick Actions
            </h3>
          </div>
          <CardContent className="p-4 space-y-3">
            {[
              { 
                label: 'New Order', 
                desc: 'Upload patient documents and start extraction', 
                path: '/admin/intake/new', 
                icon: FilePlus, 
                color: 'bg-primary/10 text-primary' 
              },
              { 
                label: 'View Orders', 
                desc: 'Check status of submitted orders', 
                path: '/admin/intake', 
                icon: ClipboardList, 
                color: 'bg-blue-500/10 text-blue-600' 
              },
              { 
                label: 'Patients', 
                desc: 'Manage your patient records', 
                path: '/admin/intake/patients', 
                icon: Users, 
                color: 'bg-emerald-500/10 text-emerald-600' 
              },
            ].map((action, idx) => (
              <Link key={idx} to={action.path}>
                <div className="p-5 rounded-[2rem] bg-muted/5 border border-border/20 flex items-center justify-between group hover:bg-muted/10 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-black uppercase tracking-tight">{action.label}</p>
                      <p className="text-[10px] font-medium text-muted-foreground">{action.desc}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-border/40 flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
