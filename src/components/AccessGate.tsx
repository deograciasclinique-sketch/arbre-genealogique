import React, { useState } from 'react';
import {
  hasAccessCode,
  setAccessCode,
  verifyAccessCode,
  isSessionUnlocked,
  markSessionUnlocked,
} from '../utils/accessCodeUtils';
import { GitBranch, Lock, ShieldCheck, KeyRound, AlertTriangle } from 'lucide-react';

interface AccessGateProps {
  children: React.ReactNode;
}

export const AccessGate: React.FC<AccessGateProps> = ({ children }) => {
  const [codeExists, setCodeExists] = useState(hasAccessCode());
  const [unlocked, setUnlocked] = useState(isSessionUnlocked());

  // --- Setup screen: no access code has ever been created on this device ---
  if (!codeExists) {
    return <CreateCodeScreen onCreated={() => setCodeExists(true)} />;
  }

  // --- Lock screen: a code exists but this browser session hasn't unlocked it yet ---
  if (!unlocked) {
    return (
      <LockScreen
        onUnlocked={() => {
          markSessionUnlocked();
          setUnlocked(true);
        }}
      />
    );
  }

  return <>{children}</>;
};

const CreateCodeScreen: React.FC<{ onCreated: () => void }> = ({ onCreated }) => {
  const [code, setCode] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 4) {
      setError('Choisissez un code d\'au moins 4 caractères.');
      return;
    }
    if (code !== confirm) {
      setError('Les deux codes ne correspondent pas.');
      return;
    }
    setError('');
    setBusy(true);
    await setAccessCode(code);
    markSessionUnlocked();
    setBusy(false);
    onCreated();
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center text-[#c9a24b] border border-[#a8791f]/40 mb-3">
            <GitBranch className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <h1 className="text-xl font-bold font-serif text-stone-900">Bienvenue</h1>
          <p className="text-sm text-stone-500 mt-1.5">
            En tant que premier utilisateur de cet appareil, vous êtes le <strong>chef de famille</strong>.
            Créez le code d'accès que vous communiquerez vous-même aux autres membres — vous
            pourrez le changer à tout moment.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card-elegant rounded-3xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
              Nouveau code d'accès
            </label>
            <input
              type="text"
              inputMode="text"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex. 4826 ou un mot"
              className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#a8791f]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
              Confirmer le code
            </label>
            <input
              type="text"
              inputMode="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#a8791f]/20"
            />
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-rose-600">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-stone-900 hover:bg-stone-800 text-[#e4c680] font-semibold text-sm transition-colors disabled:opacity-60"
          >
            <KeyRound className="w-4 h-4" strokeWidth={1.75} />
            <span>{busy ? 'Création…' : "Créer le code et continuer"}</span>
          </button>

          <div className="flex items-start gap-2 text-[11px] text-stone-400 bg-stone-50 border border-stone-200/70 rounded-xl px-3 py-2.5">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Ce code verrouille l'app sur <strong>cet appareil</strong> uniquement — notez-le
              précieusement, il n'y a aucun moyen de le récupérer automatiquement s'il est perdu.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

const LockScreen: React.FC<{ onUnlocked: () => void }> = ({ onUnlocked }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const ok = await verifyAccessCode(code);
    setBusy(false);
    if (ok) {
      onUnlocked();
    } else {
      setError('Code incorrect. Demandez-le au chef de famille.');
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center text-[#c9a24b] border border-[#a8791f]/40 mb-3">
            <Lock className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <h1 className="text-xl font-bold font-serif text-stone-900">Accès protégé</h1>
          <p className="text-sm text-stone-500 mt-1.5">
            Cette famille a protégé son arbre avec un code. Demandez-le au chef de famille pour
            entrer.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card-elegant rounded-3xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
              Code d'accès
            </label>
            <input
              type="text"
              inputMode="text"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#a8791f]/20"
            />
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-rose-600">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !code}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-stone-900 hover:bg-stone-800 text-[#e4c680] font-semibold text-sm transition-colors disabled:opacity-60"
          >
            <Lock className="w-4 h-4" strokeWidth={1.75} />
            <span>{busy ? 'Vérification…' : 'Déverrouiller'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            className="w-full text-center text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            Code oublié ?
          </button>

          {showHelp && (
            <div className="flex items-start gap-2 text-[11px] text-stone-500 bg-stone-50 border border-stone-200/70 rounded-xl px-3 py-2.5">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Seul le chef de famille connaît le code. Il n'existe aucune récupération
                automatique — contactez-le directement pour l'obtenir.
              </span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
