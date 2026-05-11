import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  Eye, EyeOff, ShieldCheck, Store, Lock, Users,
  BarChart3, Package, Zap, ArrowRight, CheckCircle,
  ShoppingCart, TrendingUp, Globe, Star, ShoppingBag
} from 'lucide-react';

const TESTIMONIALS = [
  { text: '"Rizqara transformed our retail operations. Sales tracking is now effortless."', author: 'Maxwear, Dhaka' },
  { text: '"Best POS software for Bangladeshi businesses. Supports bKash, Nagad out of the box."', author: 'Maxwear Fashion House' },
  { text: '"The inventory alerts alone saved us from stockouts multiple times."', author: 'City Electronics, CTG' },
];

/* ─── Premium Splash Screen ─── */
function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'loading' | 'done'>('loading');

  useEffect(() => {
    // Trigger fade-out
    setTimeout(() => setPhase('done'), 1800);
    setTimeout(() => onDone(), 2300);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white"
      style={{
        opacity: phase === 'done' ? 0 : 1,
        transition: 'opacity 0.4s ease-in-out',
      }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="w-8 h-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        
        {/* Mini Text */}
        <div 
          className="text-blue-600 tracking-tight" 
          style={{ 
            fontWeight: 700, 
            fontSize: '14px',
            fontFamily: 'Inter, system-ui, sans-serif' 
          }}
        >
          Rizqara Solution
        </div>
      </div>
    </div>
  );
}

/* ─── Main Login Component ─── */
export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'super_admin') navigate('/super-admin');
      else navigate('/shop');
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % TESTIMONIALS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = login(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <>
      {/* Splash screen */}
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}

      <div
        className="min-h-screen flex overflow-hidden"
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          opacity: splashDone ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out',
        }}
      >
        {/* ===== LEFT BRAND PANEL ===== */}
        <div className="hidden lg:flex lg:w-1/2 relative flex-col overflow-hidden bg-[#020617]">
          {/* Deep gradient background */}
          <div className="absolute inset-0 bg-[#020617]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.08)_0%,transparent_70%)]" />

          {/* Animated grid pattern */}
          <div className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Soft ambient glows */}
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-blue-500 opacity-[0.15] blur-2xl" />

          {/* Floating decorative rings */}
          <div className="absolute top-20 right-16 w-32 h-32 rounded-full border border-white/10" />
          <div className="absolute top-24 right-20 w-24 h-24 rounded-full border border-white/5" />
          <div className="absolute bottom-32 left-20 w-20 h-20 rounded-full border border-[#D4A853]/20" />

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
            <div className="flex items-center gap-4 mb-auto">
              <div className="relative">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                    boxShadow: '0 8px 24px rgba(79, 70, 229, 0.2)',
                  }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15),transparent)]" />
                  <ShoppingBag size={24} className="text-white relative z-10" strokeWidth={1.5} />
                </div>
              </div>
              <div>
                <div className="text-xl font-black tracking-tighter text-white">
                  Rizqara <span className="text-indigo-400">Solution</span>
                </div>
                <div className="text-slate-500 text-[10px] tracking-[3px] uppercase mt-0.5" style={{ fontWeight: 600 }}>Premium Platform</div>
              </div>
            </div>

            {/* Hero copy */}
            <div className="mt-12 mb-10">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
                <Zap size={12} className="text-indigo-400" />
                <span className="text-slate-400 text-xs font-medium">Built for Bangladeshi Retailers</span>
              </div>

              <h1 className="text-white mb-6" style={{ fontWeight: 800, fontSize: '3.4rem', lineHeight: 1, letterSpacing: '-2.5px' }}>
                Sell <span className="text-indigo-400 italic">faster.</span><br />
                Track <span className="text-indigo-400 italic">smarter.</span>
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed max-w-sm mb-12">
                Elevate your business with our enterprise-grade POS system. 
                Seamlessly manage inventory, sales, and analytics with ease.
              </p>
            </div>

            {/* Testimonial rotator */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className="text-[#D4A853] fill-[#D4A853]" />
                ))}
              </div>
              <div className="transition-all duration-500 min-h-[80px]">
                <p className="text-slate-300 text-sm leading-relaxed mb-3 font-medium">
                  {TESTIMONIALS[activeTestimonial].text}
                </p>
                <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest">
                  {TESTIMONIALS[activeTestimonial].author}
                </p>
              </div>
              <div className="flex gap-1.5 mt-4">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className={`h-1 rounded-full transition-all duration-300 ${i === activeTestimonial ? 'bg-indigo-500 w-8' : 'bg-white/10 w-2'}`}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto text-white/30 text-xs py-4">
              © 2026 <a href="https://www.rizqara.tech" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">Rizqara</a> Solution
            </div>
          </div>
        </div>

        {/* ===== RIGHT FORM PANEL ===== */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Mobile top bar */}
          <div className="lg:hidden flex items-center gap-3 px-6 pt-8 pb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
              }}
            >
              <ShoppingBag size={20} className="text-white" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-lg font-black tracking-tighter text-gray-900">
                Rizqara <span className="text-blue-600">Solution</span>
              </div>
              <div className="text-gray-400 text-xs">Smart POS Platform</div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-20 py-10 max-w-xl mx-auto w-full">
            {/* Welcome header */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-5">
                <div className="h-1 w-8 rounded-full bg-blue-600" />
                <div className="h-1 w-4 rounded-full bg-blue-300" />
                <div className="h-1 w-2 rounded-full bg-blue-100" />
              </div>
              <h2 className="text-gray-900 mb-2" style={{ fontWeight: 800, fontSize: '2.2rem', letterSpacing: '-1px' }}>
                Welcome back
              </h2>
              <p className="text-gray-600 text-sm font-medium">Sign in to your Rizqara account to continue</p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 text-xs" style={{ fontWeight: 700 }}>!</span>
                </div>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-gray-800 text-sm mb-2" style={{ fontWeight: 600 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all bg-gray-50 focus:bg-white"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-800 text-sm" style={{ fontWeight: 600 }}>
                    Password
                  </label>
                  <button type="button" className="text-blue-600 text-xs hover:text-blue-700 hover:underline" style={{ fontWeight: 500 }}>
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all bg-white"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full relative overflow-hidden text-white py-3.5 rounded-xl text-sm disabled:opacity-60 transition-all duration-200 group"
                style={{
                  fontWeight: 700,
                  background: loading ? '#6366F1' : 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                  boxShadow: '0 10px 25px rgba(79, 70, 229, 0.25)',
                }}
              >
                {/* Shimmer effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                    transform: 'skewX(-20deg)',
                  }}
                />
                <div className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-8">
              <div className="flex items-center gap-1.5 text-gray-500 text-[10px] sm:text-[11px] font-medium">
                <CheckCircle size={13} className="text-green-500" />
                <span>256-bit SSL Secure</span>
              </div>
              <div className="hidden sm:block w-px h-3 bg-gray-200" />
              <div className="flex items-center gap-1.5 text-gray-500 text-[10px] sm:text-[11px] font-medium">
                <CheckCircle size={13} className="text-green-500" />
                <span>GDPR Compliant</span>
              </div>
              <div className="hidden sm:block w-px h-3 bg-gray-200" />
              <div className="flex items-center gap-1.5 text-gray-500 text-[10px] sm:text-[11px] font-medium">
                <CheckCircle size={13} className="text-green-500" />
                <span>Data Encrypted</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-gray-100 mt-auto">
            <div className="flex items-center justify-between max-w-xl mx-auto w-full">
              <div className="text-gray-400 text-xs">
                © 2026 <a href="https://www.rizqara.tech" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">Rizqara</a> Solution
              </div>
              <div className="flex gap-4">
                <Link to="/privacy" className="text-gray-400 hover:text-blue-600 text-xs transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="text-gray-400 hover:text-blue-600 text-xs transition-colors">Terms of Service</Link>
                <Link to="/support" className="text-gray-400 hover:text-blue-600 text-xs transition-colors">Support</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
