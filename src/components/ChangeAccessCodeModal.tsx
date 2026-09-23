import React, { useState } from 'react';
import { changeAccessCode } from '../utils/accessCodeUtils';
import { X, KeyRound, Check, AlertTriangle } from 'lucide-react';

interface ChangeAccessCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangeAccessCodeModal: React.FC<ChangeAccessCodeModalProps> = ({ isOpen, onClose }) => {
  const [currentCode, setCurrentCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newCode.trim().length < 4) {
      setError("Le nouveau code doit contenir au moins 4 caractères.");
      return;
    }
    if (newCode !== confirmCode) {
      setError('Les deux nouveaux codes ne correspondent pas.');
      return;
    }

    setBusy(true);
    const ok = await changeAccessCode(currentCode, newCode);
    setBusy(false);

    if (!ok) {
      setError('Le code actuel est incorrect.');
      return;
    }

    setSuccess(true);
    setCurrentCode('');
    setNewCode('');
    setConfirmCode('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm">
      <div className="card-elegant rounded-3xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-stone-100">
          <h2 className="text-lg font-bold font-serif text-stone-900 flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-[#a8791f]" strokeWidth={1.75} />
            <span>Changer le code d'accès</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Check className="w-5 h-5" />
            </div>
            <p className="text-sm text-stone-700">
              Le nouveau code d'accès est actif. Communiquez-le aux membres de la famille.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-[#e4c680] text-sm font-semibold transition-colors"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                Code actuel
              </label>
              <input
                type="text"
                value={currentCode}
                onChange={(e) => setCurrentCode(e.target.value)}
                className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#a8791f]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                Nouveau code
              </label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#a8791f]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                Confirmer le nouveau code
              </label>
              <input
                type="text"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#a8791f]/20"
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
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-[#e4c680] text-sm font-semibold transition-colors disabled:opacity-60"
            >
              <KeyRound className="w-4 h-4" strokeWidth={1.75} />
              <span>{busy ? 'Mise à jour…' : 'Mettre à jour le code'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
