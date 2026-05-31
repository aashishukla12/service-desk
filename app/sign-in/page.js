'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Hexagon, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import styles from './SignIn.module.css';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError(result?.error || 'Invalid email or password.');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      {/* Ambient background decorations */}
      <div className={styles.bgPattern} aria-hidden="true" />
      <div className={styles.bgGlow} aria-hidden="true" />

      <div className={styles.card}>
        {/* Logo & branding */}
        <div className={styles.brand}>
          <div className={styles.logoWrap}>
            <Hexagon size={28} />
          </div>
          <span className={styles.logoText}>ServiceDesk</span>
        </div>

        {/* Heading */}
        <div className={styles.heading}>
          <h1>Welcome back</h1>
          <p>Sign in to your account</p>
        </div>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className={styles.inputGroup}>
            <label htmlFor="signin-email" className={styles.label}>
              Email
            </label>
            <div className={styles.inputWrap}>
              <Mail size={18} className={styles.inputIcon} />
              <input
                id="signin-email"
                type="email"
                className={styles.input}
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className={styles.inputGroup}>
            <label htmlFor="signin-password" className={styles.label}>
              Password
            </label>
            <div className={styles.inputWrap}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                id="signin-password"
                type={showPassword ? 'text' : 'password'}
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div className={styles.options}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <a href="#" className={styles.forgot}>
              Forgot password?
            </a>
          </div>

          {/* Error */}
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className={styles.submit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className={styles.spinner} />
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className={styles.cardFooter}>
          Don&apos;t have an account?{' '}
          <a href="#">Contact your administrator</a>
        </p>
      </div>
    </div>
  );
}
