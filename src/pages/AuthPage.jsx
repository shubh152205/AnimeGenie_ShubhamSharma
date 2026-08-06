import React, { useState } from 'react';
import { Lock, Mail, User, KeyRound, ShieldCheck, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AuthPage({
  authMode,
  setAuthMode,
  onLogin,
  onRegister,
  loading
}) {
  const [username, setUsername] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('admin123');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (authMode === 'login') {
      onLogin(username, password);
    } else {
      onRegister(username, email, password);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#0f172a] text-slate-100 flex flex-col justify-center items-center relative overflow-hidden p-4 sm:p-6 selection:bg-indigo-500 selection:text-white">
      
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
        
        {/* Left Side: Branding & Info */}
        <div className="p-8 sm:p-10 bg-gradient-to-br from-indigo-950/60 to-slate-900/90 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/40">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">SalesGenie AI</h1>
                <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Lead Intelligence CRM</p>
              </div>
            </div>

            {/* Tagline */}
            <h2 className="text-2xl font-bold text-white tracking-tight mb-3">
              Secure Sales Intelligence Platform
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Access AI-driven lead scoring, call intelligence summaries, and CRM synchronization with enterprise JWT token authentication.
            </p>

            {/* Feature Bullets */}
            <div className="space-y-3">
              {[
                "JWT-Signed Access Tokens & Session Security",
                "Kaggle Pre-Trained ML Lead Scoring Model",
                "Whisper Speech-to-Text & Sentiment Extraction",
                "HubSpot & Salesforce Bi-Directional CRM Sync"
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* JWT Security Badge */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">OAuth2 JWT Protection Active</p>
              <p className="text-[11px] text-slate-400">HS256 Standard Bearer Token Authorization</p>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center bg-slate-900/40">
          
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white tracking-tight">
              {authMode === 'login' ? 'Sign In to Your Account' : 'Register New Rep Account'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {authMode === 'login'
                ? 'Enter your credentials to receive a signed JWT access token'
                : 'Create an account to access SalesGenie AI'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Username / JWT ID
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>
            </div>

            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rep@salesgenie.ai"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{authMode === 'login' ? 'Sign In & Get JWT Token' : 'Register Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Hint */}
          {authMode === 'login' && (
            <div className="mt-4 p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
              <span className="font-semibold text-indigo-400">Default Demo Credentials:</span>
              <div className="mt-1 flex items-center justify-center gap-2 text-slate-200 font-mono text-[11px]">
                <span>ID: <code className="text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded">admin</code></span>
                <span>•</span>
                <span>Pass: <code className="text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded">admin123</code></span>
              </div>
            </div>
          )}

          {/* Mode Switch */}
          <div className="mt-6 text-center text-xs text-slate-400">
            {authMode === 'login' ? (
              <p>
                Need a new account?{' '}
                <button
                  onClick={() => setAuthMode('register')}
                  className="text-indigo-400 font-semibold hover:underline"
                >
                  Create One Now
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => setAuthMode('login')}
                  className="text-indigo-400 font-semibold hover:underline"
                >
                  Sign In with JWT
                </button>
              </p>
            )}
          </div>

        </div>

      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-[11px] text-slate-500 font-medium">
        SalesGenie AI Platform • Milestone 3 JWT Authentication Gateway
      </div>

    </div>
  );
}
