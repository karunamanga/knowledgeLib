import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { GraduationCap, Lock, Mail, User, Building, Briefcase, BadgePercent, ArrowRight, LogIn } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setErrorMsg('Please fill in all required fields (Name, Email, Password).');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await register({
        fullName,
        email,
        password,
        department: department || undefined,
        designation: designation || undefined,
        employeeId: employeeId || undefined,
      });
      success('Account created successfully! Welcome to the portal.', 'Registration Successful');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.message || err.response?.data?.message || 'Failed to create account. Please check your details.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Left Column: Brand Hero */}
      <div className="relative flex-1 flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950 border-b lg:border-b-0 lg:border-r border-slate-800">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[28rem] h-[28rem] bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Organisation Portal</h1>
            <p className="text-xs text-indigo-300 font-medium">Learning & Knowledge Platform</p>
          </div>
        </div>

        <div className="relative z-10 my-12 lg:my-0 max-w-lg space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-[1.2]">
            Join your organisation's{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400">
              knowledge hub.
            </span>
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed font-light">
            Register to access team documentation, architectural blueprints, development standards, and learning resources.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-500 flex items-center justify-between">
          <span>Enterprise Portal</span>
          <span>Self-Service Onboarding</span>
        </div>
      </div>

      {/* Right Column: Registration Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-slate-950 relative overflow-y-auto">
        <div className="w-full max-w-md space-y-6 animate-slide-up py-4">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-white tracking-tight">Create Account</h3>
            <p className="text-xs text-slate-400">
              Enter your details to create your employee profile.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <Input
              label="Full Name *"
              type="text"
              placeholder="e.g. Sarah Connor"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="Work Email *"
              type="email"
              placeholder="e.g. sarah.connor@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Department"
                type="text"
                placeholder="e.g. Engineering"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                leftIcon={<Building className="w-4 h-4" />}
              />
              <Input
                label="Designation"
                type="text"
                placeholder="e.g. Software Engineer"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                leftIcon={<Briefcase className="w-4 h-4" />}
              />
            </div>

            <Input
              label="Employee ID (Optional)"
              type="text"
              placeholder="e.g. EMP-1042"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              leftIcon={<BadgePercent className="w-4 h-4" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Password *"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
              <Input
                label="Confirm Password *"
                type="password"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full py-2.5 text-sm font-semibold shadow-glow-primary mt-2"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Register & Enter Portal
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign in here</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
