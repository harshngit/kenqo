import { useSelector } from 'react-redux';
import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Camera, Building2, Mail, Phone, MapPin, Save, X, User } from 'lucide-react';
import { toast } from 'sonner';

const UserProfile = () => {
  const { user } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.companyName || user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.companyName || user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
    });
    setIsEditing(false);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
            <User className="w-3.5 h-3.5" />
            Account Settings
          </div>
          <h1 className="text-2xl font-black tracking-tight">Organization Profile</h1>
          <p className="text-muted-foreground text-sm">Manage your clinical practice details and credentials</p>
        </div>
        {!isEditing ? (
          <Button 
            onClick={() => setIsEditing(true)} 
            variant="outline"
            className="h-10 px-5 rounded-xl font-bold border-border/50 hover:bg-primary/5 hover:text-primary transition-all text-xs"
          >
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={handleCancel}
              className="h-10 px-5 rounded-xl font-bold text-xs"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="h-10 px-5 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-xs"
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Summary Card */}
        <Card className="lg:col-span-4 border-0 shadow-lg shadow-black/5 dark:shadow-white/5 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm border-white/20 dark:border-white/5 h-fit">
          <CardContent className="p-8 flex flex-col items-center text-center">
            <div className="relative group">
              <Avatar className="w-32 h-32 rounded-2xl shadow-xl ring-4 ring-primary/10 transition-transform group-hover:scale-105 duration-500">
                <AvatarImage src={user?.avatar} alt={user?.name} className="object-cover" />
                <AvatarFallback className="text-3xl font-black bg-primary/10 text-primary">
                  {user?.companyName ? getInitials(user.companyName) : 'U'}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-1 right-1 p-2 rounded-xl bg-primary text-white shadow-lg hover:scale-110 transition-all opacity-0 group-hover:opacity-100 duration-300">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mt-6 space-y-1.5">
              <h2 className="text-xl font-black tracking-tight">{user?.companyName || user?.name}</h2>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-0 font-bold px-3 py-1 rounded-full text-[9px] uppercase tracking-[0.15em]">
                {user?.role || 'Provider'}
              </Badge>
            </div>

            <div className="w-full mt-8 pt-8 border-t border-border/50 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Status</p>
                <p className="text-xs font-bold text-emerald-500 flex items-center justify-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Joined</p>
                <p className="text-xs font-bold">April 2024</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Information Card */}
        <Card className="lg:col-span-8 border-0 shadow-lg shadow-black/5 dark:shadow-white/5 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm border-white/20 dark:border-white/5">
          <CardHeader className="p-8 border-b border-border/50">
            <CardTitle className="text-xl font-bold tracking-tight">Organization Details</CardTitle>
            <CardDescription className="text-sm font-medium">Update your professional contact information and practice location</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Practice Name</label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="h-12 pl-11 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all text-base font-medium disabled:opacity-70 disabled:bg-muted/30"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Work Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="h-12 pl-11 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all text-base font-medium disabled:opacity-70 disabled:bg-muted/30"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Primary Phone</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="h-12 pl-11 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all text-base font-medium disabled:opacity-70 disabled:bg-muted/30"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Office Address</label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="h-12 pl-11 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all text-base font-medium disabled:opacity-70 disabled:bg-muted/30"
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="mt-10 pt-8 border-t border-border/50 flex items-center gap-4 bg-primary/5 -mx-8 px-8 py-5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Save className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">You have unsaved changes</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Click "Save Profile" above to apply your updates.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Section */}
      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm border-white/20 dark:border-white/5">
        <CardHeader className="p-8 border-b border-border/50">
          <CardTitle className="text-xl font-bold tracking-tight">Security</CardTitle>
          <CardDescription className="text-sm">Manage your account security settings</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex items-center justify-between p-5 bg-muted/30 border border-border/50 rounded-2xl">
            <div>
              <p className="font-bold text-sm text-foreground">Account Password</p>
              <p className="text-xs text-muted-foreground font-medium">Last changed 30 days ago</p>
            </div>
            <Button variant="outline" className="rounded-xl h-9 px-4 text-xs font-bold border-border/50">Change Password</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
