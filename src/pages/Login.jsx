import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, registerUser, clearError } from '../store/authSlice';
import { useThemeStore } from '../store';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Eye, EyeOff, Shield, Sun, Moon,
  FileCheck, Stethoscope, Sparkles, ArrowRight, UserPlus,
  Lock, Mail, User, ShieldCheck, HeartPulse, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import PageLoader from '../components/ui/PageLoader';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formMode, setFormMode] = useState('login'); // 'login' | 'register'
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error, isAuthenticated, user } = useSelector((state) => state.auth);
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    if (isAuthenticated && user && !isRedirecting && !isInitialLoading) {
      const role = user.role || 'admin';
      setIsRedirecting(true);
      setTimeout(() => {
        if (role === 'superadmin') navigate('/superadmin');
        else if (role === 'admin') navigate('/admin');
        else navigate('/user');
      }, 1500);
    }
  }, [isAuthenticated, user, navigate, isRedirecting, isInitialLoading]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      const u = result.payload.user || result.payload;
      const role = u?.role || 'admin';
      toast.success(`Welcome back, ${u?.full_name || u?.name || email}!`);
      setIsRedirecting(true);
      setTimeout(() => {
        if (role === 'superadmin') navigate('/superadmin');
        else if (role === 'admin') navigate('/admin');
        else navigate('/user');
      }, 2000);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) { toast.error('Please enter your full name'); return; }
    const result = await dispatch(registerUser({ full_name: fullName, email, password }));
    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created! Please sign in.');
      setFormMode('login');
      setFullName('');
    }
  };

  if (isInitialLoading || isRedirecting) return <PageLoader />;

  return (
    <div className="h-screen w-full flex overflow-hidden bg-background transition-colors duration-700">
      
      {/* ── Left Side: Brand Introduction ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden p-12 flex-col justify-between">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[40rem] h-[40rem] bg-white/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[30rem] h-[30rem] bg-black/10 rounded-full blur-[100px]" />
        
        {/* Top: Branding */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex items-center gap-4 text-white"
        >
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tighter">Kenqo</h2>
        </motion.div>

        {/* Bottom: Quote / Intro */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 max-w-xl space-y-6"
        >
          <blockquote className="text-2xl font-bold text-white leading-relaxed tracking-tight">
            “Streamline your clinical data, optimize your workflow, and take control of your 
            healthcare intelligence with precision and ease.”
          </blockquote>
          <div>
            <p className="text-white/90 font-black text-sm uppercase tracking-widest">Kenqo Management Team</p>
            <p className="text-white/60 text-xs font-bold mt-1 uppercase tracking-widest">Clinical Excellence Platform</p>
          </div>
        </motion.div>
      </div>

      {/* ── Right Side: Login Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative">
        
        {/* Theme Toggle (Mobile-friendly) */}
        <button
          onClick={toggleTheme}
          className="absolute top-8 right-8 p-3 rounded-2xl bg-muted/50 border border-border/50 hover:bg-muted transition-all duration-300 group"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          ) : (
            <Sun className="w-5 h-5 text-yellow-500 group-hover:text-yellow-400 transition-colors" />
          )}
        </button>

        <div className="w-full max-w-xl space-y-12 animate-in fade-in slide-in-from-right-10 duration-700">
          
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-5xl font-black text-foreground tracking-tight leading-tight">
              {formMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-base text-muted-foreground font-bold opacity-70 tracking-wide">
              {formMode === 'login' 
                ? 'Sign in to access your intelligence dashboard' 
                : 'Join our clinical intelligence network'}
            </p>
          </div>

          {/* Form Mode Switcher */}
          <div className="flex p-2 bg-muted rounded-2xl border-2 border-border/40 shadow-inner">
            <button
              onClick={() => setFormMode('login')}
              className={`flex-1 py-4 rounded-xl text-sm font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                formMode === 'login' 
                  ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setFormMode('register')}
              className={`flex-1 py-4 rounded-xl text-sm font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                formMode === 'register' 
                  ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={formMode === 'login' ? handleLogin : handleRegister} className="space-y-8">
            <AnimatePresence mode="wait">
              {formMode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <label className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground/80 ml-2">Full Name</label>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Jane Smith"
                    className="h-16 px-8 rounded-3xl bg-muted/30 border-2 border-border/40 focus:border-primary/50 text-lg font-bold shadow-sm transition-all"
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground/80 ml-2">Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@healthcare.com"
                className="h-16 px-8 rounded-3xl bg-muted/30 border-2 border-border/40 focus:border-primary/50 text-lg font-bold shadow-sm transition-all"
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center ml-2">
                <label className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground/80">Password</label>
                {formMode === 'login' && (
                  <button type="button" className="text-[11px] font-black text-primary hover:text-primary/80 uppercase tracking-[0.15em] transition-colors">Forgot Password?</button>
                )}
              </div>
              <div className="relative group">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-16 px-8 rounded-3xl bg-muted/30 border-2 border-border/40 focus:border-primary/50 text-lg font-bold pr-16 shadow-sm transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 p-2.5 rounded-2xl hover:bg-muted/50 transition-all duration-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground" /> : <Eye className="w-5 h-5 text-muted-foreground" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-20 rounded-3xl bg-primary hover:bg-primary/95 text-white font-black text-xl shadow-2xl shadow-primary/30 transition-all hover:scale-[1.01] active:scale-[0.98] group relative overflow-hidden"
            >
              {isLoading ? (
                <div className="flex items-center gap-6">
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <span className="tracking-tight">{formMode === 'login' ? 'Enter Dashboard' : 'Create Account'}</span>
                  <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-2" />
                </div>
              )}
            </Button>
          </form>

          {/* Footer Branding */}
          <div className="pt-4 flex flex-col items-center gap-6 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center leading-relaxed">
              Powered by Kenqo Intelligence Engine • HIPAA Certified
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
