import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { useThemeStore } from '../store';
import { Button } from '../components/ui/button';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  LogOut,
  Shield,
  Sun,
  Moon,
  ChevronRight,
  Menu,
  X,
  ChevronLeft,
  Database,
  Settings,
  Layers,
  GitBranch,
  Map,
  MessageSquare,
  Activity,
} from 'lucide-react';

const SuperAdminLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navSections = [
    {
      label: 'OVERVIEW',
      items: [
        { path: '/superadmin', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: 'KNOWLEDGE BASE',
      items: [
        { path: '/superadmin/knowledge-base', label: 'Rules', icon: GitBranch, badge: 14 },
        { path: '/superadmin/documents', label: 'Documents', icon: FileText, badge: 5 },
        { path: '/superadmin/chunks', label: 'Chunks', icon: Layers },
      ],
    },
    {
      label: 'CONFIGURATION',
      items: [
        { path: '/superadmin/extraction-schema', label: 'Extraction Schema', icon: Database },
        { path: '/superadmin/agents', label: 'Agents', icon: Activity },
        { path: '/superadmin/classifier', label: 'Classifier', icon: Settings },
        { path: '/superadmin/mapping', label: 'Mapping', icon: Map },
        { path: '/superadmin/prompts', label: 'Prompts', icon: MessageSquare },
      ],
    },
    {
      label: 'PLATFORM',
      items: [
        { path: '/superadmin/users', label: 'Users', icon: Users },
        { path: '/superadmin/diseases', label: 'Diseases', icon: BookOpen },
      ],
    },
  ];

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <div className="min-h-screen bg-background flex transition-colors duration-300 font-sans">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} w-72 bg-sidebar text-sidebar-foreground border-r border-sidebar-border h-screen flex flex-col fixed left-0 top-0 z-[70] transition-all duration-300 ease-in-out
        lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className={`h-16 flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'} border-b border-sidebar-border/50 flex-shrink-0 relative`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            {!isSidebarCollapsed && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="font-bold text-sidebar-foreground tracking-tight text-sm">Kenqo</span>
                <p className="text-[9px] text-sidebar-foreground/50 font-bold uppercase tracking-widest">Knowledge Base — Superadmin</p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-sidebar-border border border-sidebar-border rounded-full items-center justify-center hover:bg-primary hover:text-white transition-all z-50 shadow-md"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>

          <button
            className="lg:hidden ml-auto p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${isSidebarCollapsed ? 'p-2' : 'p-3'} overflow-y-auto scrollbar-none`}>
          {navSections.map((section) => (
            <div key={section.label} className="mb-3">
              {!isSidebarCollapsed && (
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-sidebar-foreground/40 px-3 py-2">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={isSidebarCollapsed ? item.label : ''}
                      className={`group flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3'} py-2 rounded-lg transition-all duration-200 ${
                        active
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : 'text-sidebar-foreground/40 group-hover:text-sidebar-accent-foreground'}`} />
                      {!isSidebarCollapsed && (
                        <span className="text-sm truncate flex-1">{item.label}</span>
                      )}
                      {!isSidebarCollapsed && item.badge && (
                        <span className="text-[10px] font-black bg-primary text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className={`${isSidebarCollapsed ? 'p-2' : 'p-3'} border-t border-sidebar-border/50 flex-shrink-0`}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3'} py-2 rounded-lg text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all w-full mb-1 group`}
          >
            {theme === 'light'
              ? <Moon className="w-4 h-4 shrink-0" />
              : <Sun className="w-4 h-4 shrink-0 text-yellow-400" />}
            {!isSidebarCollapsed && <span className="text-sm">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>

          {/* User Info */}
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2.5 px-3 py-2 bg-sidebar-accent/40 rounded-xl border border-sidebar-border/20 mb-1">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-black text-primary">
                  {(user?.full_name || user?.name || 'S').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sidebar-foreground text-xs truncate">{user?.full_name || user?.name || 'Super Admin'}</p>
                <p className="text-[9px] text-sidebar-foreground/50 font-bold uppercase tracking-widest">{user?.role || 'superadmin'}</p>
              </div>
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            </div>
          )}

          <Button
            variant="ghost"
            onClick={handleLogout}
            className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3 gap-2.5'} text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-lg py-2 h-auto transition-all text-sm`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} min-h-screen flex flex-col transition-all duration-300`}>
        {/* Top Header for Mobile */}
        <header className="h-14 bg-background/95 backdrop-blur sticky top-0 z-40 px-4 flex items-center justify-between lg:hidden border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold tracking-tight text-sm">Kenqo</span>
          </div>
          <button
            className="p-2 hover:bg-accent rounded-xl transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Content Area */}
        <div className="p-4 sm:p-6 max-w-screen-2xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SuperAdminLayout;
