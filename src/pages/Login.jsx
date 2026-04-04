import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, registerUser, clearError } from '../store/authSlice';
import { useThemeStore } from '../store';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import {
  Building2, Eye, EyeOff, Shield, Sun, Moon,
  FileCheck, Stethoscope, Sparkles, ArrowRight, UserPlus
} from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formMode, setFormMode] = useState('login'); // 'login' | 'register'

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error, isAuthenticated, user } = useSelector((state) => state.auth);
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') navigate('/admin');
      else navigate('/user');
    }
  }, [isAuthenticated, user, navigate]);

  // Show API errors via toast
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
      navigate(role === 'admin' ? '/admin' : '/user');
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-700">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40rem] h-[40rem] bg-blue-500/5 rounded-full blur-[120px] animate-pulse-slow" />
      </div>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-8 right-8 p-4 rounded-2xl bg-card/50 backdrop-blur-md border border-border/50 shadow-2xl hover:shadow-primary/20 hover:scale-110 transition-all duration-500 z-50 group"
      >
        {theme === 'light' ? (
          <Moon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
        ) : (
          <Sun className="w-6 h-6 text-yellow-500 group-hover:text-yellow-400 transition-colors" />
        )}
      </button>

      <div className="w-full max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:block space-y-16 animate-in fade-in slide-in-from-left-12 duration-1000">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-primary text-xs font-black uppercase tracking-[0.2em] border border-primary/10">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Intelligence Platform
              </div>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_rgba(var(--primary),0.3)] rotate-6 hover:rotate-0 transition-all duration-700 group cursor-pointer">
                  <Building2 className="w-10 h-10 text-white transition-transform group-hover:scale-110" />
                </div>
                <div>
                  <h1 className="text-5xl font-black text-foreground tracking-tighter leading-none">Kenqo</h1>
                  <p className="text-xl text-muted-foreground/60 font-medium tracking-tight mt-2 italic">Clinical Excellence, Reimagined.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pr-12">
              {[
                { icon: Shield, title: 'HIPAA Compliant', desc: 'Enterprise-grade security standards for medical data.' },
                { icon: Stethoscope, title: 'Clinical AI', desc: 'Advanced analysis for healthcare documentation.' },
                { icon: FileCheck, title: 'Smart Validation', desc: 'Real-time accuracy checking for clinical records.' },
                { icon: Sparkles, title: 'Insights Engine', desc: 'Automated extraction of key medical findings.' }
              ].map((feature, i) => (
                <div key={i} className="group p-6 rounded-[2rem] hover:bg-card/50 hover:shadow-xl transition-all duration-500 border border-transparent hover:border-border/50">
                  <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-base mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground/70 leading-relaxed font-medium">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="animate-in fade-in slide-in-from-right-12 duration-1000">
            <Card className="border-0 shadow-[0_30px_100px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_100px_rgba(255,255,255,0.02)] rounded-[3rem] bg-card/40 backdrop-blur-xl border-white/20 dark:border-white/5 overflow-hidden">
              <CardContent className="p-10 sm:p-14">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-black text-foreground tracking-tight mb-3">
                    {formMode === 'login' ? 'Sign In' : 'Create Account'}
                  </h2>
                  <p className="text-sm text-muted-foreground font-medium">
                    {formMode === 'login'
                      ? 'Access your healthcare intelligence dashboard'
                      : 'Join Kenqo as an admin'}
                  </p>
                </div>

                {/* Mode Switcher */}
                <div className="flex p-1.5 bg-muted/50 rounded-2xl mb-8 border border-border/50 backdrop-blur-sm">
                  <button
                    onClick={() => setFormMode('login')}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-500 ${
                      formMode === 'login'
                        ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-[1.02]'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setFormMode('register')}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-500 ${
                      formMode === 'register'
                        ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-[1.02]'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
                    }`}
                  >
                    Register
                  </button>
                </div>

                <form onSubmit={formMode === 'login' ? handleLogin : handleRegister} className="space-y-5">
                  {formMode === 'register' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Full Name</label>
                      <Input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Dr. Jane Smith"
                        className="h-12 px-6 rounded-2xl bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all text-base font-medium"
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Email Address</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="doctor@healthcare.com"
                      className="h-12 px-6 rounded-2xl bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all text-base font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-2 relative">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80">Password</label>
                      {formMode === 'login' && (
                        <button type="button" className="text-[10px] font-bold text-primary hover:underline underline-offset-4 uppercase tracking-wider">Forgot?</button>
                      )}
                    </div>
                    <div className="relative group">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-12 px-6 rounded-2xl bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all text-base font-medium pr-14"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/95 text-white font-black text-lg shadow-xl shadow-primary/30 transition-all hover:scale-[1.01] active:scale-[0.98] group mt-2"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{formMode === 'login' ? 'Authenticating...' : 'Creating Account...'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        {formMode === 'register' ? <UserPlus className="w-5 h-5" /> : null}
                        <span>{formMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                        {formMode === 'login' && <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />}
                      </div>
                    )}
                  </Button>
                </form>

                <p className="mt-10 text-center text-muted-foreground/60 font-bold text-sm">
                  Powered by Kenqo AI • HIPAA Certified Environment
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
