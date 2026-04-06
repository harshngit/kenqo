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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Users, Search, ShieldCheck, ShieldAlert, Loader2, RefreshCw, AlertCircle, UserCog } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

const BASE_URL = 'https://kenqo-api-409744260053.asia-south1.run.app';

const SuperAdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  // Manage Role Dialog state
  const [roleDialog, setRoleDialog] = useState({ open: false, user: null });
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [roleError, setRoleError] = useState(null);

  // Get current logged-in user id from redux store
  const authUser = useSelector((state) => state.auth?.user);
  const superadminId = authUser?.user_id || authUser?.id || '';

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/auth/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': superadminId,
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.detail || data?.message || 'Failed to fetch users');
      }
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [superadminId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(
    (user) =>
      (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.role || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openRoleDialog = (user) => {
    setRoleError(null);
    setRoleDialog({ open: true, user });
  };

  const closeRoleDialog = () => {
    setRoleDialog({ open: false, user: null });
    setRoleError(null);
  };

  // Superadmin → admin only (no promotion back to superadmin)
  const canChangeRole = (user) => user.role === 'superadmin';

  const handleRoleChange = async () => {
    const targetUser = roleDialog.user;
    if (!targetUser) return;
    setIsUpdatingRole(true);
    setRoleError(null);
    try {
      const response = await fetch(`${BASE_URL}/auth/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': superadminId,
        },
        body: JSON.stringify({ 
          user_id: targetUser.user_id, 
          new_role: 'admin' 
        }),
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data?.detail || data?.message || 'Failed to update role');
      }
      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === targetUser.user_id ? { ...u, role: 'admin' } : u
        )
      );
      closeRoleDialog();
    } catch (err) {
      setRoleError(err.message || 'Could not update role. Please try again.');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const roleConfig = {
    superadmin: {
      label: 'Superadmin',
      icon: ShieldCheck,
      className: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
      dot: 'bg-violet-500',
    },
    admin: {
      label: 'Admin',
      icon: ShieldAlert,
      className: 'bg-primary/10 text-primary border-primary/20',
      dot: 'bg-primary',
    },
    user: {
      label: 'User',
      icon: Users,
      className: 'bg-muted text-muted-foreground border-border',
      dot: 'bg-muted-foreground',
    },
  };

  if (isInitialLoading) {
    return (
      <div className="h-[calc(100vh-5.5rem)] lg:h-[calc(100vh-3rem)] flex flex-col items-center justify-center animate-in fade-in duration-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center relative">
            <Users className="w-8 h-8 text-primary" />
            <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-2xl animate-spin" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold tracking-tight">Loading System Users</h2>
            <p className="text-xs text-muted-foreground mt-1">Please wait while we fetch the latest data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
            <Users className="w-3.5 h-3.5" /> User Management
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            System Users
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Manage roles and monitor all registered platform users
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <Button
            variant="outline"
            onClick={fetchUsers}
            disabled={isLoading}
            className="h-11 px-5 rounded-2xl font-black text-sm gap-2 border-border/60 hover:bg-muted transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative group max-w-2xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
        <Input
          placeholder="Search users by name, email, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-14 h-14 bg-card border-2 border-border/40 focus:border-primary/40 rounded-[1.25rem] transition-all shadow-sm focus:shadow-md text-sm font-medium placeholder:text-muted-foreground/40"
        />
      </div>

      {/* Users Table */}
      <Card className="border-2 border-border/40 rounded-[2.5rem] shadow-lg overflow-hidden transition-all duration-500 bg-card">
        <CardHeader className="px-8 py-6 border-b-2 border-border/10 bg-muted/5">
          <CardTitle className="text-lg font-black flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                <Users className="w-5 h-5" />
              </div>
              <span>System User Directory</span>
            </div>
            <span className="text-xs font-black px-4 py-1.5 rounded-full bg-primary/10 text-primary shadow-inner">
              {isLoading ? '...' : filteredUsers.length} Users
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 relative">
          {/* Refresh/Subsequent Loading Overlay */}
          {isLoading && !isInitialLoading && (
            <div className="absolute inset-0 z-10 bg-background/40 backdrop-blur-[1px] flex items-center justify-center animate-in fade-in duration-300">
              <div className="bg-card border-2 border-border/50 shadow-2xl rounded-3xl p-8 flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm font-black tracking-tight">Updating user records...</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && isInitialLoading && (
            <div className="py-32 flex flex-col items-center gap-6 animate-pulse">
              <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center relative">
                <Users className="w-8 h-8 text-primary" />
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-3xl animate-spin" />
              </div>
              <p className="font-black text-lg">Loading Directory</p>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="py-24 flex flex-col items-center gap-6 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-destructive/10 rounded-[2.5rem] flex items-center justify-center shadow-inner">
                <AlertCircle className="w-10 h-10 text-destructive" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-black text-xl text-destructive">Connection Failed</p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto font-medium">{error}</p>
              </div>
              <Button onClick={fetchUsers} className="rounded-2xl px-8 h-12 font-black bg-destructive hover:bg-destructive/90 shadow-xl shadow-destructive/20 transition-all active:scale-95">
                Retry Connection
              </Button>
            </div>
          )}

          {/* Table */}
          {!isLoading && !error && filteredUsers.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b-2 border-border/10">
                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">User Profile</TableHead>
                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Contact Email</TableHead>
                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Access Role</TableHead>
                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Activity</TableHead>
                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Last Access</TableHead>
                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const rc = roleConfig[user.role] || roleConfig.user;
                    const RoleIcon = rc.icon;
                    return (
                      <TableRow key={user.user_id} className="group hover:bg-primary/[0.02] border-b border-border/10 transition-colors">
                        {/* User */}
                        <TableCell className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-inner relative overflow-hidden">
                              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                              <span className="text-primary font-black text-base">
                                {(user.full_name || user.email || '?')[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-black text-base tracking-tight group-hover:text-primary transition-colors">
                                {user.full_name || '—'}
                              </p>
                              <p className="text-[11px] text-muted-foreground/60 font-mono font-medium">ID: {user.user_id?.slice(0, 8)}…</p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Email */}
                        <TableCell className="px-8 py-6">
                          <p className="text-sm font-medium text-foreground/80">{user.email}</p>
                        </TableCell>

                        {/* Role */}
                        <TableCell className="px-8 py-6">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 shadow-sm ${rc.className}`}>
                            <RoleIcon className="w-3.5 h-3.5" />
                            {rc.label}
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="px-8 py-6">
                          <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                            user.is_active
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : 'bg-muted text-muted-foreground border-border/50'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                            {user.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </TableCell>

                        {/* Last Login */}
                        <TableCell className="px-8 py-6">
                          <p className="text-xs font-bold text-muted-foreground/70">
                            {user.last_login
                              ? new Date(user.last_login).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Never'}
                          </p>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="px-8 py-6 text-right">
                          {canChangeRole(user) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRoleDialog(user)}
                              className="h-10 px-4 text-xs rounded-xl font-black gap-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all active:scale-95 shadow-sm"
                            >
                              <UserCog className="w-4 h-4" />
                              Manage Access
                            </Button>
                          ) : (
                            <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/30 italic">Restricted</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredUsers.length === 0 && (
            <div className="py-24 flex flex-col items-center gap-6 animate-in zoom-in-95 bg-muted/5">
              <div className="w-20 h-20 bg-muted rounded-[2.5rem] flex items-center justify-center shadow-inner opacity-20">
                <Search className="w-10 h-10" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-black text-xl text-muted-foreground">No users found</p>
                <p className="text-sm text-muted-foreground/60 font-medium max-w-xs mx-auto">
                  {searchQuery ? 'Try adjusting your search terms or filters.' : 'The user directory is currently empty.'}
                </p>
              </div>
              <Button onClick={() => setSearchQuery('')} variant="outline" className="rounded-2xl px-8 h-12 font-black border-border/60 transition-all active:scale-95">
                Clear Search
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manage Role Dialog */}
      <Dialog open={roleDialog.open} onOpenChange={(v) => !v && closeRoleDialog()}>
        <DialogContent className="sm:max-w-xl rounded-3xl p-0 overflow-hidden flex flex-col max-h-[90vh] border-none shadow-2xl">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-border/40 shrink-0 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.08) 0%, transparent 100%)' }}>
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <UserCog className="w-24 h-24" />
            </div>
            <DialogHeader className="relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-inner shrink-0">
                  <UserCog className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="font-black text-xl tracking-tight">
                    Manage Access — {roleDialog.user?.full_name || 'User'}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground font-medium mt-0.5">
                    Modify platform permissions and access level.
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>

          {roleDialog.user && (
            <div className="px-8 py-6 flex-1 overflow-y-auto space-y-6">
              <div className="bg-muted/30 border-2 border-border/40 rounded-[1.5rem] p-6 space-y-2 shadow-inner">
                <div className="flex items-center justify-between">
                  <p className="font-black text-lg tracking-tight">{roleDialog.user.full_name || 'N/A'}</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 bg-violet-500/10 text-violet-600 border-violet-500/20 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Superadmin
                  </div>
                </div>
                <p className="text-sm font-bold text-muted-foreground/70">{roleDialog.user.email}</p>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                  Change Role To
                </label>
                <div className="group flex items-center gap-4 p-5 border-2 border-primary/40 bg-primary/5 rounded-[1.5rem] shadow-sm transition-all hover:shadow-md">
                  <div className="w-12 h-12 bg-primary/15 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                    <ShieldAlert className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-black text-base tracking-tight text-primary">Admin Access</p>
                    <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed mt-0.5">
                      Grant permissions to manage users, configurations, and system settings.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 bg-amber-500/5 border-2 border-amber-500/20 rounded-[1.5rem]">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-wider text-amber-700">Warning: Demotion</p>
                  <p className="text-xs font-bold text-amber-700/70 leading-relaxed">
                    This action will demote <strong>{roleDialog.user.full_name}</strong> to Admin. This cannot be reversed from this dashboard.
                  </p>
                </div>
              </div>

              {roleError && (
                <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-xs text-destructive font-bold animate-in shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {roleError}
                </div>
              )}
            </div>
          )}

          <div className="px-8 py-6 border-t border-border/40 bg-muted/10 flex justify-between items-center shrink-0">
            <button
              onClick={closeRoleDialog}
              disabled={isUpdatingRole}
              className="text-sm font-black text-muted-foreground hover:text-foreground transition-colors px-2"
            >
              Cancel
            </button>
            <Button
              onClick={handleRoleChange}
              disabled={isUpdatingRole}
              className="rounded-2xl font-black text-sm h-12 px-8 bg-violet-600 hover:bg-violet-700 text-white shadow-xl shadow-violet-500/25 gap-2 transition-all active:scale-95"
            >
              {isUpdatingRole ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCog className="w-4 h-4" />}
              {isUpdatingRole ? 'Updating Access…' : 'Confirm Role Change'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminUsers;