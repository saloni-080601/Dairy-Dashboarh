import React, { useState } from 'react';
import { LockKeyhole, Milk } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';

interface LoginPageProps {
  onLogin: () => void;
  onOpenSupabase: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onOpenSupabase }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const client = getSupabaseClient();
    if (!client) {
      setError('Login ke liye pehle Supabase connect karein.');
      return;
    }

    setIsLoading(true);
    try {
      const { error: authError } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) {
        setError(authError.message);
        return;
      }
      onLogin();
    } catch {
      setError('Login nahi ho paaya. Connection check karke dobara try karein.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4">
      <section className="w-full max-w-md rounded-2xl border border-orange-100 bg-white p-7 shadow-xl sm:p-9">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-700"><Milk className="h-7 w-7" /></span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Piyush’s Farm</h1>
          <p className="mt-1 text-sm text-slate-500">Dairy collection dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-800"><LockKeyhole className="h-4 w-4 text-orange-600" />Login to your account</h2>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input autoComplete="username" type="email" required value={email} onChange={event => setEmail(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input autoComplete="current-password" type="password" required value={password} onChange={event => setPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
          </label>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={isLoading} className="btn-primary min-h-11 w-full disabled:opacity-60">{isLoading ? 'Logging in…' : 'Login'}</button>
        </form>

        <button type="button" onClick={onOpenSupabase} className="mt-5 w-full text-center text-xs font-medium text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-orange-700">Supabase connection settings</button>
      </section>
    </main>
  );
};
