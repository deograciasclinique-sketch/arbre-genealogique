import React, { useState } from 'react';
import {
  InviteRequestPayload,
  InviteSubmissionPayload,
  encodePayload,
  buildAppUrl,
  buildWhatsAppLink,
} from '../utils/inviteUtils';
import { optimizeImageForStorage } from '../utils/imageOptimizer';
import { GitBranch, Send, Copy, Check, Camera, User, PartyPopper } from 'lucide-react';

interface PublicMemberRequestPageProps {
  request: InviteRequestPayload;
}

export const PublicMemberRequestPage: React.FC<PublicMemberRequestPageProps> = ({ request }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'M' | 'F' | 'other'>('M');
  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [currentResidence, setCurrentResidence] = useState('');
  const [occupation, setOccupation] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const relationText = request.relationLabel ? `en tant que ${request.relationLabel}` : '';

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoBusy(true);
    try {
      // Keep it tiny — the photo travels inside a URL sent back over WhatsApp.
      const result = await optimizeImageForStorage(file, { maxWidth: 120, maxHeight: 120, quality: 0.6 });
      setPhotoUrl(result.dataUrl);
    } catch {
      setError("Impossible de traiter cette photo. Vous pouvez continuer sans.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('Le prénom et le nom sont obligatoires.');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  const submissionPayload: InviteSubmissionPayload = {
    v: 2,
    type: 'submission',
    familyName: request.familyName,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    gender,
    birthDate: birthDate || undefined,
    birthPlace: birthPlace.trim() || undefined,
    currentResidence: currentResidence.trim() || undefined,
    occupation: occupation.trim() || undefined,
    bio: bio.trim() || undefined,
    photoUrl: photoUrl || undefined,
    referenceId: request.referenceId,
    referenceName: request.referenceName,
    relation: request.relation,
    side: request.side,
    relationLabel: request.relationLabel,
  };

  const encoded = encodePayload(submissionPayload);
  const returnLink = buildAppUrl('fiche', encoded);
  const returnMessage = `Voici ma fiche pour l'arbre de la famille ${
    request.familyName || ''
  } : ${returnLink}`;
  const whatsappReturnLink = buildWhatsAppLink(returnMessage);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(returnLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — user can still select the field manually
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center px-4 py-8 sm:py-14">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center text-[#c9a24b] border border-[#a8791f]/40 mb-3">
            <GitBranch className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-stone-900">
            Famille {request.familyName || ''}
          </h1>
          <p className="text-sm text-stone-500 mt-1 max-w-sm">
            On vous invite à compléter votre fiche pour l'arbre généalogique de la famille
            {relationText ? <> — vous serez ajouté(e) <strong>{relationText}</strong>.</> : '.'}
          </p>
        </div>

        {submitted ? (
          <div className="card-elegant rounded-3xl p-6 sm:p-8 text-center space-y-5">
            <PartyPopper className="w-10 h-10 text-[#a8791f] mx-auto" />
            <div>
              <h2 className="font-serif font-bold text-lg text-stone-900">Merci {firstName} !</h2>
              <p className="text-sm text-stone-500 mt-1">
                Il ne reste qu'une étape : renvoyez ce lien à la personne qui vous a invité(e), pour
                qu'elle ajoute votre fiche à l'arbre en un clic.
              </p>
            </div>

            <a
              href={whatsappReturnLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full bg-[#25D366] hover:bg-[#1fb855] text-white font-semibold text-sm transition-colors"
            >
              <Send className="w-4 h-4" strokeWidth={1.75} />
              <span>Renvoyer via WhatsApp</span>
            </a>

            <div className="flex items-center gap-2">
              <input
                readOnly
                value={returnLink}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 min-w-0 text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-600 truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors"
                title="Copier le lien"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card-elegant rounded-3xl p-5 sm:p-7 space-y-4">
            <div className="flex items-center gap-4">
              <label className="relative shrink-0 cursor-pointer group">
                <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center overflow-hidden ring-1 ring-stone-900/[0.08]">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Votre photo" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-stone-400" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-stone-900 text-[#e4c680] flex items-center justify-center border-2 border-white">
                  <Camera className="w-3 h-3" />
                </div>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
              <p className="text-xs text-stone-500">
                {photoBusy ? 'Optimisation de la photo…' : 'Photo (optionnelle, gardée légère pour l\'envoi WhatsApp)'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  Prénom *
                </label>
                <input
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#a8791f]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  Nom *
                </label>
                <input
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#a8791f]/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  Genre
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'M' | 'F' | 'other')}
                  className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-[#a8791f]/20"
                >
                  <option value="M">Homme</option>
                  <option value="F">Femme</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                  Date de naissance
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-[#a8791f]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                Lieu de naissance
              </label>
              <input
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#a8791f]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                Résidence actuelle
              </label>
              <input
                value={currentResidence}
                onChange={(e) => setCurrentResidence(e.target.value)}
                className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#a8791f]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                Profession
              </label>
              <input
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#a8791f]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
                Quelques mots sur vous (optionnel)
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#a8791f]/20 resize-none"
              />
            </div>

            {error && <p className="text-xs text-rose-600">{error}</p>}

            <button
              type="submit"
              className="w-full px-4 py-3 rounded-full bg-stone-900 hover:bg-stone-800 text-[#e4c680] font-semibold text-sm transition-colors"
            >
              Valider ma fiche
            </button>
          </form>
        )}

        <p className="text-center text-[11px] text-stone-400 mt-6">
          Vos informations restent sur cet appareil jusqu'à ce que vous les renvoyiez vous-même.
        </p>
      </div>
    </div>
  );
};
