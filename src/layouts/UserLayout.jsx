import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { useThemeStore } from '../store';
import { Button } from '../components/ui/button';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  User,
  LogOut,
  Building2,
  Sun,
  Moon,
  ChevronRight,
  Menu,
  X,
  ChevronLeft,
} from 'lucide-react';

const UserLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { path: '/user', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/user/documents', label: 'Documents', icon: FileText },
    { path: '/user/profile', label: 'Profile', icon: User },
  ];

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
        <div className={`h-20 flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'px-6'} border-b border-sidebar-border/50 flex-shrink-0 relative`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            {!isSidebarCollapsed && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="font-bold text-sidebar-foreground tracking-tight text-base">Kenqo</span>
                <p className="text-[10px] text-sidebar-foreground/60 font-bold uppercase tracking-widest">Portal</p>
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
        <nav className={`flex-1 ${isSidebarCollapsed ? 'p-3' : 'p-4'} space-y-1.5 overflow-y-auto scrollbar-none`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isSidebarCollapsed ? item.label : ''}
                className={`group flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30 font-semibold'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary-foreground' : 'text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground'}`} />
                {!isSidebarCollapsed && <span className="text-sm truncate animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>}
                {isActive && !isSidebarCollapsed && <ChevronRight className="w-4 h-4 ml-auto opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className={`${isSidebarCollapsed ? 'p-3' : 'p-4'} border-t border-sidebar-border/50 flex-shrink-0 bg-sidebar-background/50`}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={isSidebarCollapsed ? (theme === 'light' ? 'Dark Mode' : 'Light Mode') : ''}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300 w-full mb-2 group`}
          >
            <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 group-hover:rotate-12 shrink-0">
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            {!isSidebarCollapsed && <span className="font-medium text-sm animate-in fade-in slide-in-from-left-2 duration-300">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>

          {/* User Info & Logout */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'gap-3 p-3'} bg-sidebar-accent/50 rounded-2xl border border-sidebar-border/30 mb-2`}>
            <div className="relative group cursor-pointer shrink-0" onClick={() => navigate('/user/profile')}>
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=random`}
                alt={user?.name}
                className="w-8 h-8 rounded-lg bg-sidebar-accent object-cover ring-2 ring-sidebar-border/20 group-hover:ring-primary/50 transition-all"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-sidebar-background rounded-full" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                <p className="font-semibold text-sidebar-foreground text-xs truncate">{user?.companyName || user?.name}</p>
                <p className="text-[10px] text-sidebar-foreground/50 font-bold uppercase tracking-widest">{user?.role}</p>
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            onClick={handleLogout}
            title={isSidebarCollapsed ? 'Sign Out' : ''}
            className={`w-full ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-4'} text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-xl py-3 h-auto transition-all`}
          >
            <LogOut className={`w-5 h-5 ${isSidebarCollapsed ? '' : 'mr-3'} shrink-0`} />
            {!isSidebarCollapsed && <span className="text-sm font-medium animate-in fade-in slide-in-from-left-2 duration-300">Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} min-h-screen flex flex-col transition-all duration-300`}>
        {/* Top Header for Mobile */}
        <header className="h-16 glass sticky top-0 z-40 px-6 flex items-center justify-between lg:hidden border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold tracking-tight text-base">Kenqo</span>
          </div>
          <button 
            className="p-2 hover:bg-accent rounded-xl transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Content Area */}
        <div className="p-4 sm:p-6 lg:p-10 max-w-screen-2xl mx-auto w-full transition-all duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default UserLayout;
