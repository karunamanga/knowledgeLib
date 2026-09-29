import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { GraduationCap, Lock, Mail, Sparkles, ArrowRight, UserPlus } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await login(email, password);
      success('Welcome back! Successfully authenticated.', 'Signed In');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.message || err.response?.data?.message || 'Invalid email or password. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Left Column: Brand Hero */}
      <div className="relative flex-1 flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950 border-b lg:border-b-0 lg:border-r border-slate-800">
        {/* Abstract Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[28rem] h-[28rem] bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Organisation Portal</h1>
            <p className="text-xs text-indigo-300 font-medium">Learning & Knowledge Platform</p>
          </div>
        </div>

        {/* Pitch */}
        <div className="relative z-10 my-12 lg:my-0 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Enterprise Knowledge & Learning</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
            Learn from what your organisation{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400">
              already knows.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-light">
            One central platform for employees, interns, freshers, and mentors to discover architecture guides, consume knowledge resources, and build institutional expertise.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
            <div>
              <p className="font-semibold text-slate-200 text-sm">Secure Authentication</p>
              <p className="mt-0.5">Enterprise identity & JWT session protection</p>
            </div>
            <div>
              <p className="font-semibold text-slate-200 text-sm">Knowledge Repository</p>
              <p className="mt-0.5">Documents, architecture diagrams, links & media</p>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="relative z-10 text-xs text-slate-500 flex items-center justify-between">
          <span>Enterprise Portal</span>
          <span>Role-Based Access Control</span>
        </div>
      </div>

      {/* Right Column: Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-slate-950 relative">
        <div className="w-full max-w-md space-y-8 animate-slide-up">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">Sign In</h3>
            <p className="text-xs text-slate-400">
              Enter your credentials to access your organization portal.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. employee@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="gradient"
              className="w-full py-2.5 text-sm font-semibold shadow-glow-primary"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Portal
            </Button>
          </form>

          {/* Link to Register */}
          <div className="pt-6 border-t border-slate-800/80 text-center space-y-3">
            <p className="text-xs text-slate-400">
              Don't have an account yet?
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create an account</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
