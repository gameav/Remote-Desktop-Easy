import React, { useState } from 'react';
import { AuthUser } from '../types';
import { hashPassword, encryptVault, decryptVault } from '../lib/security';
import { 
  Lock, 
  Mail, 
  User, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Monitor, 
  Smartphone, 
  CheckCircle2,
  Sparkles,
  Globe
} from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: AuthUser) => void;
}

interface EncryptedAccountRecord {
  email: string;
  passwordHash: string; // SHA-256 Hashed
  username: string;
  tag: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [username, setUsername] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Retrieve & decrypt registered accounts vault
  const getRegisteredAccountsVault = async (): Promise<EncryptedAccountRecord[]> => {
    try {
      const encryptedStored = localStorage.getItem('pulsegrid_vault_encrypted');
      if (encryptedStored) {
        const decrypted = decryptVault<EncryptedAccountRecord[]>(encryptedStored);
        if (decrypted && Array.isArray(decrypted)) {
          return decrypted;
        }
      }

      // Check legacy store if present and migrate
      const legacyStored = localStorage.getItem('pulsegrid_registered_accounts');
      let baseAccounts: EncryptedAccountRecord[] = [];

      if (legacyStored) {
        try {
          const parsedLegacy = JSON.parse(legacyStored);
          if (Array.isArray(parsedLegacy)) {
            for (const item of parsedLegacy) {
              const hash = await hashPassword(item.password || 'password123');
              baseAccounts.push({
                email: item.email,
                passwordHash: hash,
                username: item.username,
                tag: item.tag
              });
            }
          }
        } catch {}
        localStorage.removeItem('pulsegrid_registered_accounts');
      }

      if (baseAccounts.length === 0) {
        // Seed default encrypted account
        const defaultHash = await hashPassword('password123');
        baseAccounts = [
          {
            email: 'anayvoratutor@gmail.com',
            passwordHash: defaultHash,
            username: 'dashav100',
            tag: '20273089'
          }
        ];
      }

      // Save encrypted vault
      const cipher = encryptVault(baseAccounts);
      localStorage.setItem('pulsegrid_vault_encrypted', cipher);
      return baseAccounts;
    } catch {
      return [];
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    if (!cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsProcessing(true);

    try {
      const accounts = await getRegisteredAccountsVault();
      const enteredPasswordHash = await hashPassword(cleanPassword);

      if (isSignUp) {
        // --- SIGN UP LOGIC ---
        if (cleanPassword.length < 4) {
          setErrorMsg('Password must be at least 4 characters long.');
          setIsProcessing(false);
          return;
        }

        const existingAccount = accounts.find(acc => acc.email === cleanEmail);
        if (existingAccount) {
          setErrorMsg('An account with this email already exists. Please click "Sign In".');
          setIsProcessing(false);
          return;
        }

        const cleanUsername = username.trim() || cleanEmail.split('@')[0];
        const newTag = Math.floor(10000000 + Math.random() * 90000000).toString();

        const newAccount: EncryptedAccountRecord = {
          email: cleanEmail,
          passwordHash: enteredPasswordHash,
          username: cleanUsername,
          tag: newTag
        };

        accounts.push(newAccount);

        // Encrypt whole list with AES cipher before storing
        const cipherPayload = encryptVault(accounts);
        localStorage.setItem('pulsegrid_vault_encrypted', cipherPayload);

        const authenticatedUser: AuthUser = {
          username: newAccount.username,
          tag: newAccount.tag,
          email: newAccount.email,
          isGuest: false
        };

        if (rememberMe) {
          localStorage.setItem('pulsegrid_user', encryptVault(authenticatedUser));
        }

        onLogin(authenticatedUser);
      } else {
        // --- SIGN IN LOGIC ---
        const foundAccount = accounts.find(acc => acc.email === cleanEmail);

        if (!foundAccount) {
          setErrorMsg('No account found with this email. Please click "Create Account" first to register.');
          setIsProcessing(false);
          return;
        }

        if (foundAccount.passwordHash !== enteredPasswordHash) {
          setErrorMsg('Incorrect password. Please check your credentials and try again.');
          setIsProcessing(false);
          return;
        }

        // Valid Encrypted Credentials Verified!
        const authenticatedUser: AuthUser = {
          username: foundAccount.username,
          tag: foundAccount.tag,
          email: foundAccount.email,
          isGuest: false
        };

        if (rememberMe) {
          localStorage.setItem('pulsegrid_user', encryptVault(authenticatedUser));
        }

        onLogin(authenticatedUser);
      }
    } catch {
      setErrorMsg('Authentication error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGuestLogin = () => {
    const guestUser: AuthUser = {
      username: 'GuestUser',
      tag: Math.floor(10000000 + Math.random() * 90000000).toString(),
      email: 'guest@pulsegrid.app',
      isGuest: true
    };
    localStorage.setItem('pulsegrid_user', JSON.stringify(guestUser));
    onLogin(guestUser);
  };

  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsProcessing(true);
    try {
      const accounts = await getRegisteredAccountsVault();
      const account = accounts.find(acc => acc.email === cleanEmail);

      if (!account) {
        setErrorMsg('No account found with this email address.');
        setIsProcessing(false);
        return;
      }

      // Generate 6-digit verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setResetStep(2);
      setSuccessMsg(`Verification code dispatched to ${cleanEmail}!`);
    } catch {
      setErrorMsg('Failed to process password reset request.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (verificationCode.trim() !== generatedCode) {
      setErrorMsg('Invalid 6-digit verification code. Please check the code and try again.');
      return;
    }

    if (newPassword.trim().length < 4) {
      setErrorMsg('New password must be at least 4 characters long.');
      return;
    }

    setIsProcessing(true);
    try {
      const accounts = await getRegisteredAccountsVault();
      const cleanEmail = email.trim().toLowerCase();
      const accountIndex = accounts.findIndex(acc => acc.email === cleanEmail);

      if (accountIndex === -1) {
        setErrorMsg('Account not found.');
        setIsProcessing(false);
        return;
      }

      const newHash = await hashPassword(newPassword.trim());
      accounts[accountIndex].passwordHash = newHash;

      // Save updated vault
      localStorage.setItem('pulsegrid_vault_encrypted', encryptVault(accounts));

      setSuccessMsg('Password updated successfully! You can now sign in with your new password.');
      setIsResettingPassword(false);
      setPassword(newPassword.trim());
      setNewPassword('');
      setVerificationCode('');
    } catch {
      setErrorMsg('Failed to reset password.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e12] text-slate-100 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden select-none">
      {/* Background Subtle Crimson Glow Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-[#16171e] border border-[#272a38] rounded-2xl p-8 shadow-2xl z-10 space-y-6 relative">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2.5 px-3 py-1 rounded-full bg-rose-600/20 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold tracking-wide">
            <Zap className="w-3.5 h-3.5" />
            <span>PULSEGRID REMOTE DESKTOP</span>
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight pt-1">
            {isResettingPassword 
              ? (resetStep === 1 ? 'Reset Your Password' : 'Verify & Set Password') 
              : (isSignUp ? 'Create Your Account' : 'Sign In to Your PC')}
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {isResettingPassword
              ? (resetStep === 1 
                  ? 'Enter your registered email to receive a 6-digit security verification code.' 
                  : `Enter the code sent to ${email} and your new password.`)
              : (isSignUp 
                  ? 'Get instant 60 FPS remote access to your computer from any device.' 
                  : 'Enter your credentials to manage and connect to your remote hosts.')}
          </p>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="p-3 bg-emerald-600/20 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs font-medium space-y-2">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
            {generatedCode && resetStep === 2 && (
              <div className="p-2.5 bg-[#101116] rounded border border-emerald-500/30 font-mono text-[11px] text-emerald-200 flex items-center justify-between">
                <span>Verification Code: <strong className="text-white text-xs tracking-widest">{generatedCode}</strong></span>
                <button
                  type="button"
                  onClick={() => setVerificationCode(generatedCode)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-0.5 rounded text-[10px] cursor-pointer"
                >
                  Auto-Fill
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="p-3 bg-rose-600/20 border border-rose-500/40 rounded-lg text-rose-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* RESET PASSWORD MODE */}
        {isResettingPassword ? (
          <div className="space-y-4 text-xs">
            {resetStep === 1 ? (
              <form onSubmit={handleRequestResetCode} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Registered Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-[#101116] border border-[#2b2d3c] rounded-lg px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-all shadow-lg active:scale-95 cursor-pointer uppercase tracking-wider text-xs flex items-center justify-center space-x-2"
                >
                  <span>{isProcessing ? 'SENDING CODE...' : 'SEND 6-DIGIT CODE'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmResetPassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>6-Digit Verification Code</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="e.g. 492810"
                    required
                    className="w-full bg-[#101116] border border-[#2b2d3c] rounded-lg px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono tracking-widest text-center text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>New Password</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    className="w-full bg-[#101116] border border-[#2b2d3c] rounded-lg px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all shadow-lg active:scale-95 cursor-pointer uppercase tracking-wider text-xs flex items-center justify-center space-x-2"
                >
                  <span>{isProcessing ? 'UPDATING...' : 'RESET PASSWORD & SIGN IN'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => {
                setIsResettingPassword(false);
                setResetStep(1);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="w-full text-center text-slate-400 hover:text-slate-200 text-xs pt-2 underline cursor-pointer"
            >
              ← Back to Sign In
            </button>
          </div>
        ) : (
          /* STANDARD AUTH MODE (SIGN IN / SIGN UP) */
          <>
            {/* Tab Switcher */}
            <div className="flex bg-[#101116] p-1 rounded-xl border border-[#222432] text-xs font-bold">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  !isSignUp ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  isSignUp ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleAuth} className="space-y-4 text-xs">
              {isSignUp && (
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Username</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. GamerPro100"
                    className="w-full bg-[#101116] border border-[#2b2d3c] rounded-lg px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-sans"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-300 font-medium flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#101116] border border-[#2b2d3c] rounded-lg px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-sans"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Password</span>
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsResettingPassword(true);
                        setResetStep(1);
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-rose-400 hover:text-rose-300 text-[11px] cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#101116] border border-[#2b2d3c] rounded-lg px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-sans"
                />
              </div>

              {!isSignUp && (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-400 text-[11px]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 accent-rose-600 rounded"
                    />
                    <span>Remember this device</span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-all shadow-lg active:scale-95 cursor-pointer uppercase tracking-wider text-xs flex items-center justify-center space-x-2"
              >
                <span>{isProcessing ? 'PROCESSING...' : (isSignUp ? 'CREATE FREE ACCOUNT' : 'SIGN IN')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-[#232534] w-full" />
              <span className="bg-[#16171e] px-3 text-[10px] text-slate-500 font-mono font-bold uppercase shrink-0">
                OR TEST INSTANTLY
              </span>
              <div className="border-t border-[#232534] w-full" />
            </div>

            {/* Guest Mode Button */}
            <button
              onClick={handleGuestLogin}
              type="button"
              className="w-full py-2.5 bg-[#20222e] hover:bg-[#282b3a] border border-[#33374a] text-slate-200 font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Continue as Guest (Instant Demo Mode)</span>
            </button>
          </>
        )}

        {/* Feature Badges */}
        <div className="pt-2 grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono">
          <div className="flex items-center space-x-1.5 bg-[#101116] p-2 rounded border border-[#202230]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>End-to-End Encrypted</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-[#101116] p-2 rounded border border-[#202230]">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>iPhone & iPad Safari</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-slate-500 font-mono mt-6">
        PulseGrid Desktop V150-104a • 100% Free & Open Remote Desktop
      </div>
    </div>
  );
};
