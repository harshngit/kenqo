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
    <div className="h-[calc(100vh-5.5rem)] lg:h-[calc(100vh-3rem)] flex flex-col space-y-6 animate-in fade-in duration-700 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 flex-shrink-0">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
            <Users className="w-3.5 h-3.5" />
            User Management
          </div>
          <h1 className="text-2xl font-black tracking-tight">System Users</h1>
          <p className="text-muted-foreground text-sm">Manage roles and monitor all registered platform users</p>
        </div>
        <Button
          variant="outline"
          onClick={fetchUsers}
          disabled={isLoading}
          className="h-10 px-5 rounded-xl font-bold text-sm gap-2 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-lg shadow-black/5 dark:shadow-white/5 rounded-2xl bg-card/50 backdrop-blur-sm border-white/20 dark:border-white/5 overflow-hidden flex-shrink-0">
        <CardContent className="p-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search users by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl text-base transition-all"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="flex-1 min-h-0 border-0 shadow-lg shadow-black/5 dark:shadow-white/5 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm border-white/20 dark:border-white/5 flex flex-col">
        <CardHeader className="p-6 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold tracking-tight">
              All Users{' '}
              <span className="text-primary ml-2 opacity-50 font-black">
                {isLoading ? '...' : filteredUsers.length}
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-y-auto scrollbar-none relative">
          {/* Refresh/Subsequent Loading Overlay */}
          {isLoading && !isInitialLoading && (
            <div className="absolute inset-0 z-10 bg-background/40 backdrop-blur-[1px] flex items-center justify-center animate-in fade-in duration-300">
              <div className="bg-card border border-border/50 shadow-2xl rounded-2xl p-6 flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm font-bold tracking-tight">Updating users list...</p>
              </div>
            </div>
          )}

          {/* Loading State (Only for actual empty initial load) */}
          {isLoading && isInitialLoading && (
            <div className="py-24 flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground font-medium">Loading users...</p>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="py-16 flex flex-col items-center gap-4 px-6">
              <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-destructive" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-bold text-sm text-destructive">Failed to load users</p>
                <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
              </div>
              <Button size="sm" onClick={fetchUsers} className="rounded-xl px-4 h-9 text-sm font-bold">
                Try Again
              </Button>
            </div>
          )}

          {/* Table */}
          {!isLoading && !error && filteredUsers.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">User</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Role</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Last Login</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const rc = roleConfig[user.role] || roleConfig.user;
                    const RoleIcon = rc.icon;
                    return (
                      <TableRow key={user.user_id} className="group hover:bg-primary/[0.02] border-border/40 transition-colors">
                        {/* User */}
                        <TableCell className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3">
                              <span className="text-primary font-black text-sm">
                                {(user.full_name || user.email || '?')[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-bold text-sm group-hover:text-primary transition-colors">
                                {user.full_name || '—'}
                              </p>
                              <p className="text-[11px] text-muted-foreground font-mono">{user.user_id?.slice(0, 8)}…</p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Email */}
                        <TableCell className="px-6 py-5">
                          <p className="text-sm text-foreground/80">{user.email}</p>
                        </TableCell>

                        {/* Role */}
                        <TableCell className="px-6 py-5">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${rc.className}`}>
                            <RoleIcon className="w-3 h-3" />
                            {rc.label}
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="px-6 py-5">
                          <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            user.is_active
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                            {user.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </TableCell>

                        {/* Last Login */}
                        <TableCell className="px-6 py-5">
                          <p className="text-xs text-muted-foreground">
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
                        <TableCell className="px-6 py-5 text-right">
                          {canChangeRole(user) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRoleDialog(user)}
                              className="rounded-lg h-8 px-3 text-xs font-bold gap-1.5 hover:bg-violet-500/10 hover:text-violet-600 hover:border-violet-500/30 transition-colors"
                            >
                              <UserCog className="w-3.5 h-3.5" />
                              Manage Role
                            </Button>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/40 italic">No action</span>
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
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-5">
                <Search className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">No users found</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {searchQuery ? 'Try adjusting your search terms.' : 'No users are registered on the platform yet.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manage Role Dialog */}
      <Dialog open={roleDialog.open} onOpenChange={(v) => !v && closeRoleDialog()}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <UserCog className="w-5 h-5 text-violet-500" />
              Manage Role
            </DialogTitle>
          </DialogHeader>

          {roleDialog.user && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/40 rounded-xl p-4 space-y-1">
                <p className="font-bold text-sm">{roleDialog.user.full_name || roleDialog.user.email}</p>
                <p className="text-xs text-muted-foreground">{roleDialog.user.email}</p>
                <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  Superadmin
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Change role to</p>
                <div className="flex items-center gap-3 p-3 border border-primary/30 bg-primary/5 rounded-xl">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Admin</p>
                    <p className="text-[11px] text-muted-foreground">Can manage users and platform settings</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                ⚠️ This action will demote <strong>{roleDialog.user.full_name}</strong> from Superadmin to Admin. This cannot be reversed from this panel.
              </div>

              {roleError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {roleError}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={closeRoleDialog} disabled={isUpdatingRole} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={isUpdatingRole}
              className="rounded-xl font-bold bg-violet-600 hover:bg-violet-700 text-white gap-2"
            >
              {isUpdatingRole ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <UserCog className="w-3.5 h-3.5" />
                  Confirm Role Change
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminUsers;