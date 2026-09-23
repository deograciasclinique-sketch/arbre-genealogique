import React, { useState } from 'react';
import {
  getOrCreateMeetingRoom,
  createNewMeetingRoom,
  buildMeetingUrl,
  buildMeetingEmbedUrl,
} from '../utils/meetingUtils';
import { buildWhatsAppLink } from '../utils/inviteUtils';
import { Video, Send, Copy, Check, RefreshCw, Users, ShieldCheck, X } from 'lucide-react';

interface MeetingViewProps {
  familyName: string;
}

export const MeetingView: React.FC<MeetingViewProps> = ({ familyName }) => {
  const [room, setRoom] = useState(() => getOrCreateMeetingRoom(familyName));
  const [displayName, setDisplayName] = useState('');
  const [inCall, setInCall] = useState(false);
  const [copied, setCopied] = useState(false);

  const link = buildMeetingUrl(room);
  const message = `Réunion familiale en visio pour la famille ${familyName || ''} : rejoignez-nous ici → ${link}`;
  const whatsappLink = buildWhatsAppLink(message);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API may be unavailable; user can still select the field manually
    }
  };

  const handleNewRoom = () => {
    if (
      window.confirm(
        "Créer une nouvelle salle changera le lien de réunion — les personnes ayant l'ancien lien ne pourront plus rejoindre. Continuer ?"
      )
    ) {
      const fresh = createNewMeetingRoom(familyName);
      setRoom(fresh);
      setInCall(false);
    }
  };

  if (inCall) {
    return (
      <div className="fixed inset-0 z-40 bg-stone-950 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2.5 bg-stone-900 text-stone-200">
          <div className="flex items-center gap-2 text-sm">
            <Video className="w-4 h-4 text-[#e4c680]" />
            <span className="font-medium truncate">Réunion — Famille {familyName || ''}</span>
          </div>
          <button
            type="button"
            onClick={() => setInCall(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-xs font-medium transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Quitter la visio</span>
          </button>
        </div>
        <iframe
          key={room}
          src={buildMeetingEmbedUrl(room, displayName)}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="flex-1 w-full border-0"
          title="Réunion familiale"
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="card-elegant rounded-3xl p-6 sm:p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-stone-900 text-[#e4c680] flex items-center justify-center mx-auto mb-4">
          <Video className="w-6 h-6" strokeWidth={1.75} />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900">
          Réunion familiale en visioconférence
        </h2>
        <p className="text-sm text-stone-500 mt-2 max-w-md mx-auto">
          Une salle vidéo privée pour la famille {familyName || ''}, sans compte à créer.
          Partagez le lien et rejoignez l'appel directement depuis l'app.
        </p>

        <div className="mt-6 max-w-xs mx-auto">
          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 text-left">
            Votre nom (affiché aux autres participants)
          </label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Ex. Jean Dupont"
            className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#a8791f]/20"
          />
        </div>

        <button
          type="button"
          onClick={() => setInCall(true)}
          className="mt-5 w-full max-w-xs mx-auto flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-stone-900 hover:bg-stone-800 text-[#e4c680] font-semibold text-sm transition-colors"
        >
          <Video className="w-4 h-4" strokeWidth={1.75} />
          <span>Rejoindre la réunion</span>
        </button>

        <div className="mt-6 pt-6 border-t border-stone-100 text-left space-y-3">
          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide">
            Lien de la réunion
          </label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={link}
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

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full bg-[#25D366] hover:bg-[#1fb855] text-white font-semibold text-sm transition-colors"
          >
            <Send className="w-4 h-4" strokeWidth={1.75} />
            <span>Inviter la famille via WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={handleNewRoom}
            className="flex items-center justify-center gap-1.5 w-full px-4 py-2 rounded-full text-stone-500 hover:text-stone-800 hover:bg-stone-100 text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Créer une nouvelle salle (nouveau lien)</span>
          </button>
        </div>

        <div className="mt-4 flex items-start gap-2 text-[11px] text-stone-400 text-left bg-stone-50 border border-stone-200/70 rounded-xl px-3 py-2.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            La visio est assurée par Jitsi Meet, un service gratuit indépendant — l'app n'héberge
            pas l'appel elle-même. Seules les personnes ayant ce lien peuvent rejoindre la salle.
          </span>
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
          <Users className="w-3.5 h-3.5" />
          <span>Fonctionne sur ordinateur et mobile, sans installation.</span>
        </div>
      </div>
    </div>
  );
};
