import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Gavel, Phone, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Loader2, XCircle } from 'lucide-react';
import { authApi, setToken } from '../utils/api';
import { ADMIN_ROUTES } from '../utils/routes';

export default function AdminLogin() {
  const { setCurrentUser } = useApp();
  const nav = useNavigate();

  const [phoneDigits, setPhoneDigits] = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched]         = useState<Record<string, boolean>>({});
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const phoneError = touched.phone
    ? phoneDigits.length === 0 ? 'Phone number is required'
      : phoneDigits.length < 9 ? `${9 - phoneDigits.length} more digit${9 - phoneDigits.length > 1 ? 's' : ''} needed`
      : !/^[79]/.test(phoneDigits) ? 'Number must start with 9 or 7'
      : null
    : null;

  const isValid = phoneDigits.length === 9 && /^[79]/.test(phoneDigits) && password.length > 0;

  function blur(field: string) {
    setTouched(prev => ({ ...prev, [field]: true }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ phone: true, password: true });
    if (!isValid) return;

    setError('');
    setLoading(true);
    try {
      const fullPhone = `+251${phoneDigits}`;
      const res = await authApi.login(fullPhone, password);
      const u = res.data.user;

      if (!['admin', 'customer_support', 'customersupport', 'support_agent'].includes(u.role)) {
        setError('Access denied. Admin account required.');
        return;
      }

      setToken(res.data.token);
      setCurrentUser({
        id:            u.id,
        name:          u.name,
        email:         u.email,
        phone:         u.phone ?? fullPhone,
        role:          u.role,
        walletBalance: Number(u.wallet_balance ?? 0),
        credits:       Number(u.credits ?? 0),
        status:        u.status,
        joinedAt:      u.joined_at ?? new Date().toISOString().split('T')[0],
        wonAuctions:   u.won_auctions ?? [],
        photo:         u.photo_url ?? undefined,
      });

      nav(ADMIN_ROUTES.DASHBOARD);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Gavel className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-black text-2xl text-white tracking-tight">BidLow</span>
            <p className="text-xs text-slate-400 font-medium">Admin Console</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">Admin Sign In</h2>
            <p className="text-xs text-slate-400 mt-1">Enter your phone number & password</p>
          </div>

          {error && (
            <div className="p-3 bg-rose-950 text-rose-400 rounded-xl text-xs font-bold border border-rose-800 flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Phone Number
              </label>
              <div className="flex">
                <span className="inline-flex items-center gap-1.5 px-3 bg-slate-800 border border-r-0 border-slate-700 rounded-l-xl text-sm font-bold text-slate-400 select-none whitespace-nowrap">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  +251
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phoneDigits}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setPhoneDigits(digits);
                  }}
                  onBlur={() => blur('phone')}
                  className={`flex-1 bg-slate-800 border border-slate-700 text-white rounded-r-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500 ${
                    phoneError ? 'border-rose-700 focus:ring-rose-500' : ''
                  }`}
                  placeholder="9XXXXXXXX"
                  maxLength={9}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                {phoneError
                  ? <p className="text-rose-400 text-xs font-medium">{phoneError}</p>
                  : <span />}
                <span className={`text-xs font-medium ml-auto ${phoneDigits.length === 9 ? 'text-emerald-500' : 'text-slate-500'}`}>
                  {phoneDigits.length}/9
                </span>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={() => blur('password')}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing In…</>
                : <>Sign In to Console <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Admin access only — unauthorized attempts are logged</span>
          </div>
        </div>
      </div>
    </div>
  );
}
