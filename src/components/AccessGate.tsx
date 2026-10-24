import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, KeyRound, Loader2 } from 'lucide-react';
import {
  PURCHASE_URL,
  checkAccessPassword,
  isAccessUnlocked,
  saveAccessUnlocked,
} from '../config/access';

interface AccessGateProps {
  children: React.ReactNode;
}

/**
 * Tela de ativação mostrada antes do app. Depois que a senha certa é digitada,
 * o desbloqueio fica salvo neste navegador e a tela não aparece mais.
 */
export const AccessGate: React.FC<AccessGateProps> = ({ children }) => {
  const [unlocked, setUnlocked] = useState(() => isAccessUnlocked());
  const [password, setPassword] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // O App aplica o tema só depois de montar; aqui aplicamos o tema salvo já na tela de acesso.
  useEffect(() => {
    if (unlocked) return;
    try {
      const saved = localStorage.getItem('theme');
      document.documentElement.setAttribute('data-theme', saved === 'dark' ? 'dark' : 'light');
    } catch {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    inputRef.current?.focus();
  }, [unlocked]);

  if (unlocked) return <>{children}</>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || checking) return;
    setChecking(true);
    setError(false);
    const ok = await checkAccessPassword(password);
    setChecking(false);
    if (ok) {
      saveAccessUnlocked();
      setUnlocked(true);
    } else {
      setError(true);
      inputRef.current?.select();
    }
  };

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 text-txt font-sans antialiased">
      <div className="w-full max-w-md animate-fadeIn">
        <div className="flex items-center gap-2.5 mb-6 justify-center">
          <svg
            className="w-6 h-6 text-brand"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" x2="12" y1="22.08" y2="12" />
          </svg>
          <span className="font-semibold text-[17px] tracking-tight">3D Price</span>
        </div>

        <section className="bg-surface rounded-xl border border-border p-6 sm:p-7 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-light text-brand flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <span className="font-mono text-[11px] text-txt-muted uppercase tracking-wider font-medium">
              Ativação
            </span>
          </div>

          <h1 className="text-[20px] font-semibold tracking-tight mt-1 mb-2">
            Ative seu acesso
          </h1>
          <p className="text-[13px] text-txt-muted leading-relaxed mb-5">
            Digite a senha que está na página{' '}
            <strong className="text-txt font-medium">Seu acesso à 3D Price</strong>, logo no
            começo do e-book <em>Venda Antes de Imprimir</em>.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="access-password" className="block text-[12px] font-medium mb-1.5">
              Senha de acesso
            </label>
            <input
              ref={inputRef}
              id="access-password"
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              placeholder="3DPRICE-XXXX-XXXX"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(false);
              }}
              aria-invalid={error}
              aria-describedby={error ? 'access-error' : undefined}
              className={`w-full px-3 py-2.5 rounded-md bg-canvas border font-mono text-[14px] tracking-wider uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-txt-muted/60 transition-colors ${
                error ? 'border-semantic-danger' : 'border-border focus:border-brand'
              }`}
            />
            {error && (
              <p id="access-error" role="alert" className="text-[12px] text-semantic-danger mt-2 leading-relaxed">
                Senha incorreta. Confira no e-book. Maiúsculas, espaços e hífens não fazem diferença.
              </p>
            )}

            <button
              type="submit"
              disabled={checking || !password.trim()}
              className="w-full mt-4 py-2.5 px-4 rounded-md bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-[13px] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {checking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Liberar acesso</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-[12px] text-txt-muted mt-4 text-center">
            Você só precisa fazer isso uma vez neste navegador.
          </p>
        </section>

        {PURCHASE_URL && (
          <a
            href={PURCHASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 text-[13px] text-txt-muted hover:text-brand transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>Ainda não tem o e-book? Garanta seu acesso</span>
          </a>
        )}
      </div>
    </main>
  );
};
