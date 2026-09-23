import React, { useState, useRef } from 'react';
import { FamilyEvent, FamilyMember, EventType, EVENT_TYPE_INFO } from '../types';
import { optimizeImageForStorage } from '../utils/imageOptimizer';
import { photoOrPlaceholder } from '../utils/avatarUtils';
import {
  X,
  Calendar,
  MapPin,
  Sparkles,
  Upload,
  Users,
  Image as ImageIcon,
} from 'lucide-react';

interface EventFormModalProps {
  initialEvent?: FamilyEvent | null;
  presetMemberId?: string;
  allMembers: FamilyMember[];
  onSave: (event: FamilyEvent) => void;
  onClose: () => void;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  initialEvent,
  presetMemberId,
  allMembers,
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(initialEvent);

  const [title, setTitle] = useState(initialEvent?.title || '');
  const [date, setDate] = useState(initialEvent?.date || '');
  const [type, setType] = useState<EventType>(initialEvent?.type || 'anniversary');
  const [location, setLocation] = useState(initialEvent?.location || '');
  const [description, setDescription] = useState(initialEvent?.description || '');
  const [photoUrl, setPhotoUrl] = useState(initialEvent?.photoUrl || '');
  const [isHighlight, setIsHighlight] = useState(initialEvent?.isHighlight || false);

  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    initialEvent?.memberIds || (presetMemberId ? [presetMemberId] : [])
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const optimized = await optimizeImageForStorage(file, {
          maxWidth: 640,
          maxHeight: 480,
          quality: 0.8,
          cropSquare: false,
        });
        setPhotoUrl(optimized.dataUrl);
      } catch (err) {
        console.error("Erreur d'optimisation de l'image de souvenir:", err);
      }
    }
  };

  const toggleMemberSelection = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      alert('Veuillez renseigner au moins un titre et une date pour cet événement.');
      return;
    }

    const updatedEvent: FamilyEvent = {
      id: initialEvent?.id || `ev-${Date.now()}`,
      title: title.trim(),
      date,
      type,
      location: location.trim() || undefined,
      description: description.trim(),
      photoUrl: photoUrl.trim() || undefined,
      isHighlight,
      memberIds: selectedMemberIds,
    };

    onSave(updatedEvent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 to-amber-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-bold text-lg">
              {isEditing ? 'Modifier l’événement' : 'Ajouter un souvenir marquant'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-stone-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Titre de l'événement <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: 50 ans de mariage, Naissance de Lucas, Voyage en Provence..."
              className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30"
            />
          </div>

          {/* Type & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Catégorie d'événement
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none"
              >
                {Object.entries(EVENT_TYPE_INFO).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Date de l'événement <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Lieu / Ville (optionnel)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Lyon, Gordes (Luberon), Annecy..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Description & Souvenirs
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Racontez le déroulement, qui était présent, anecdotes et émotions..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30"
            />
          </div>

          {/* Associated Members */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-700" />
                <span>Membres de la famille concernés ({selectedMemberIds.length})</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  if (selectedMemberIds.length === allMembers.length) {
                    setSelectedMemberIds([]);
                  } else {
                    setSelectedMemberIds(allMembers.map((m) => m.id));
                  }
                }}
                className="text-[11px] text-amber-800 hover:text-amber-950 font-medium"
              >
                {selectedMemberIds.length === allMembers.length ? 'Tout désélectionner' : 'Toute la famille'}
              </button>
            </div>

            <div className="max-h-36 overflow-y-auto p-2 bg-stone-50 rounded-2xl border border-stone-200/80 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {allMembers.map((member) => {
                const isChecked = selectedMemberIds.includes(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleMemberSelection(member.id)}
                    className={`flex items-center gap-2 p-1.5 rounded-xl text-left text-xs transition-colors ${
                      isChecked
                        ? 'bg-amber-100/80 text-amber-950 border border-amber-300 font-semibold'
                        : 'hover:bg-stone-100 text-stone-700 border border-transparent'
                    }`}
                  >
                    <img
                      src={photoOrPlaceholder(member.photoUrl)}
                      alt={member.firstName}
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                    />
                    <span className="truncate">
                      {member.firstName} {member.lastName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photo illustration */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
            <label className="block text-xs font-semibold text-stone-700">
              Photo souvenir (optionnel)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Lien URL de la photo..."
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600/30"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs font-medium rounded-xl transition-colors shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Téléverser</span>
              </button>
            </div>
            {photoUrl && (
              <div className="relative w-20 h-16 rounded-xl overflow-hidden border border-stone-200 mt-2">
                <img src={photoUrl} alt="Aperçu" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="absolute top-1 right-1 p-0.5 bg-black/60 rounded text-white text-[10px]"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Highlight toggle */}
          <div className="flex items-center gap-2 p-3 bg-amber-50/60 rounded-xl border border-amber-200/60">
            <input
              type="checkbox"
              id="isHighlight"
              checked={isHighlight}
              onChange={(e) => setIsHighlight(e.target.checked)}
              className="rounded text-amber-700 focus:ring-amber-600"
            />
            <label htmlFor="isHighlight" className="text-xs text-amber-950 font-medium cursor-pointer flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Marquer comme événement marquant / jalon majeur de la famille</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm text-stone-600 hover:text-stone-900 font-medium rounded-xl hover:bg-stone-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-xs transition-colors"
            >
              {isEditing ? 'Enregistrer les modifications' : 'Ajouter à la chronologie'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
