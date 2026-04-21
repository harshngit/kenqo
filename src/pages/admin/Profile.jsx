import { useSelector } from 'react-redux';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Database,
  Fingerprint,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

const ProfileField = ({ icon: Icon, label, value, color = "text-primary bg-primary/5" }) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/5 border border-border/20 group hover:bg-muted/10 transition-colors duration-300">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-300`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="space-y-0.5">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</p>
      <p className="text-sm font-bold tracking-tight text-foreground">{value || '—'}</p>
    </div>
  </div>
);

const AdminProfile = () => {
  const { user } = useSelector((state) => state.auth);

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
            <User className="w-3.5 h-3.5" /> Identity & Access
          </div>
          <h1 className="text-3xl font-black tracking-tight">Account Profile</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Manage your administrative identity and system permissions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card className="lg:col-span-1 border-none shadow-2xl shadow-black/[0.03] rounded-[2.5rem] bg-card overflow-hidden">
          <CardContent className="p-0">
            <div className="relative h-32 bg-primary">
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                <div className="w-24 h-24 rounded-[2rem] bg-card p-2 shadow-2xl">
                  <div className="w-full h-full rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary">
                    <User className="w-10 h-10" />
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-16 pb-10 px-8 text-center space-y-4">
              <div className="space-y-1">
                <h3 className="text-xl font-black tracking-tight">{user?.full_name || user?.name || 'System Admin'}</h3>
                <p className="text-sm text-muted-foreground font-medium">{user?.email}</p>
              </div>
              <div className="flex justify-center gap-2">
                <Badge className="bg-primary/10 text-primary border-none font-black uppercase tracking-widest text-[9px] px-3 py-1 rounded-full">
                  <Shield className="w-3 h-3 mr-1.5" /> Admin Access
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Info */}
        <Card className="lg:col-span-2 border-none shadow-2xl shadow-black/[0.03] rounded-[2.5rem] bg-card overflow-hidden">
          <CardHeader className="px-10 pt-10 pb-6 border-b border-border/50">
            <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" /> Detailed Information
            </CardTitle>
            <CardDescription className="text-xs font-medium">System-level identifier and account metadata.</CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfileField 
                icon={Mail} 
                label="Primary Email" 
                value={user?.email} 
              />
              <ProfileField 
                icon={Fingerprint} 
                label="User Identifier" 
                value={user?.id || user?._id} 
                color="text-amber-600 bg-amber-500/10"
              />
              <ProfileField 
                icon={Database} 
                label="Knowledge Base ID" 
                value={user?.kb_id || 'System Default'} 
                color="text-blue-600 bg-blue-500/10"
              />
              <ProfileField 
                icon={Calendar} 
                label="Account Created" 
                value={formatDate(user?.created_at) || 'N/A'} 
                color="text-emerald-600 bg-emerald-500/10"
              />
            </div>

            <div className="mt-10 p-6 rounded-[2rem] bg-primary/5 border border-primary/10">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-widest">Administrative Privileges</h4>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    You have full read/write access to the clinical intake pipeline, patient records, and system configuration. 
                    Profile editing is currently managed via central directory services.
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

export default AdminProfile;
