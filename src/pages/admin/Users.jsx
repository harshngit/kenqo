import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Users, Search, Phone, MapPin, Plus, Building2 } from 'lucide-react';
import { useState } from 'react';

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dummy users data
  const usersList = [
    {
      id: '2',
      name: 'Northeast Lymphedema & Wound Care',
      email: 'user@healthcare.com',
      phone: '(401) 555-0217',
      address: '88 University Ave, Suite 2B Providence, RI 02906',
      status: 'active',
      documentsCount: 2,
    },
    {
      id: '3',
      name: 'Providence Medical Clinic',
      email: 'clinic@healthcare.com',
      phone: '+1 (555) 345-6789',
      address: '789 Health St, Chicago, IL 60601',
      status: 'active',
      documentsCount: 0,
    },
  ];

  const filteredUsers = usersList.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
            <Users className="w-3.5 h-3.5" />
            User Management
          </div>
          <h1 className="text-2xl font-black tracking-tight">System Users</h1>
          <p className="text-muted-foreground text-sm">Manage and monitor all registered healthcare providers</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-10 px-5 rounded-xl font-bold text-sm group">
          <Plus className="w-4 h-4 mr-2 transition-transform group-hover:rotate-90" />
          Add New User
        </Button>
      </div>

      {/* Search & Filter */}
      <Card className="border-0 shadow-lg shadow-black/5 dark:shadow-white/5 rounded-2xl bg-card/50 backdrop-blur-sm border-white/20 dark:border-white/5 overflow-hidden">
        <CardContent className="p-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search users by name, email, or organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl text-base transition-all"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-0 shadow-lg shadow-black/5 dark:shadow-white/5 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm border-white/20 dark:border-white/5">
        <CardHeader className="p-6 border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold tracking-tight">
              All Users <span className="text-primary ml-2 opacity-50 font-black">{filteredUsers.length}</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-lg px-3 h-8 text-xs">Export CSV</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Organization & User</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contact Information</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Docs</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="group hover:bg-primary/[0.02] border-border/40 transition-colors">
                      <TableCell className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 shrink-0">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">{user.name}</p>
                            <p className="text-xs text-muted-foreground font-medium">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs text-foreground/80 font-medium">
                            <Phone className="w-3.5 h-3.5 text-primary/60" />
                            {user.phone}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground max-w-[180px] leading-relaxed">
                            <MapPin className="w-3.5 h-3.5 text-primary/40 shrink-0" />
                            {user.address}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-center">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold text-xs">
                          {user.documentsCount}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          user.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${user.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                          {user.status}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-right">
                        <Button variant="ghost" className="rounded-lg h-8 px-3 text-xs hover:bg-primary/10 hover:text-primary font-bold">
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-5">
                <Search className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">No users found</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Try adjusting your search terms to find what you're looking for.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
