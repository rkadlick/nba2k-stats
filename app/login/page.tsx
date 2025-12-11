'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    // Add a small delay to ensure session state is properly cleared after logout
    if (isSupabaseConfigured && supabase) {
      const checkSession = async () => {
        // Wait a bit to ensure any logout operations have completed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!supabase) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push('/');
        }
      };
      
      checkSession();
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured. Please set up your .env.local file.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--color-background)] text-[color:var(--color-text)] transition-colors">
      <div className="max-w-md w-full bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-xl shadow-lg p-8 transition-colors">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[color:var(--color-text)] mb-2">2KCompare</h1>
          <p className="text-[color:var(--color-text-muted)]">NBA 2K25 Stat Tracking & Comparison</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> Supabase is not configured. Please set up your <code className="bg-red-100 px-1 rounded">.env.local</code> file with your Supabase credentials.
            </p>
            <p className="text-xs text-red-700 mt-2">
              See <code className="bg-red-100 px-1 rounded">SUPABASE_SETUP.md</code> for instructions.
            </p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[color:var(--color-border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[color:var(--color-surface-muted)] text-[color:var(--color-text)] font-semibold placeholder:text-[color:var(--color-text-muted)] transition-colors"
              placeholder="player@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[color:var(--color-border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[color:var(--color-surface-muted)] text-[color:var(--color-text)] font-semibold placeholder:text-[color:var(--color-text-muted)] transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[color:var(--color-text-muted)]">
          <p>Two-user private stat tracking app</p>
        </div>
      </div>
    </div>
  );
}

