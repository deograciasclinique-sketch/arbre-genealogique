import React, { useState, useRef, useEffect } from 'react';
import { FamilyMember, Gender } from '../types';
import { CameraPhotoCapture } from './CameraPhotoCapture';
import {
  X,
  Camera,
  User,
  Heart,
  Calendar,
  MapPin,
  Briefcase,
  Sparkles,
  Link,
} from 'lucide-react';

interface MemberFormModalProps {
  initialMember?: FamilyMember | null;
  allMembers: FamilyMember[];
  presetParentId?: string;
  presetSpouseId?: string;
  onSave: (member: FamilyMember) => void;
  onClose: () => void;
}

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  initialMember,
  allMembers,
  presetParentId,
  presetSpouseId,
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(initialMember);

  const [firstName, setFirstName] = useState(initialMember?.firstName || '');
  const [lastName, setLastName] = useState(initialMember?.lastName || '');
  const [gender, setGender] = useState<Gender>(initialMember?.gender || 'M');
  const [birthDate, setBirthDate] = useState(initialMember?.birthDate || '');
  const [isDeceased, setIsDeceased] = useState(initialMember?.isDeceased || false);
  const [deathDate, setDeathDate] = useState(initialMember?.deathDate || '');
  const [photoUrl, setPhotoUrl] = useState(initialMember?.photoUrl || '');
  const [photoPreviewError, setPhotoPreviewError] = useState(false);
  useEffect(() => setPhotoPreviewError(false), [photoUrl]);
  const [occupation, setOccupation] = useState(initialMember?.occupation || '');
  const [birthPlace, setBirthPlace] = useState(initialMember?.birthPlace || '');
  const [currentResidence, setCurrentResidence] = useState(initialMember?.currentResidence || '');
  const [bio, setBio] = useState(initialMember?.bio || '');

  // Relationships
  const [parent1Id, setParent1Id] = useState(
    initialMember?.parentIds[0] || presetParentId || ''
  );
  const [parent2Id, setParent2Id] = useState(initialMember?.parentIds[1] || '');
  const [spouseId, setSpouseId] = useState(
    initialMember?.spouseId || presetSpouseId || ''
  );

  const [photoMode, setPhotoMode] = useState<'camera-upload' | 'url'>('camera-upload');

  // Exclude self from potential parents / spouses
  const availableMembers = allMembers.filter((m) => m.id !== initialMember?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      alert('Veuillez renseigner au moins le prénom et le nom de famille.');
      return;
    }

    const parentIds: string[] = [];
    if (parent1Id) parentIds.push(parent1Id);
    if (parent2Id && parent2Id !== parent1Id) parentIds.push(parent2Id);

    const updatedMember: FamilyMember = {
      id: initialMember?.id || `member-${Date.now()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender,
      birthDate,
      deathDate: isDeceased ? deathDate : undefined,
      isDeceased,
      photoUrl,
      occupation: occupation.trim() || undefined,
      birthPlace: birthPlace.trim() || undefined,
      currentResidence: currentResidence.trim() || undefined,
      bio: bio.trim() || undefined,
      parentIds,
      spouseId: spouseId || undefined,
      childrenIds: initialMember?.childrenIds || [],
    };

    onSave(updatedMember);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-bold text-lg">
              {isEditing ? 'Modifier la fiche de ' + initialMember?.firstName : 'Nouveau membre de la famille'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Photo & Identity */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Photo Avatar Preview */}
            <div className="flex flex-col items-center gap-2 self-center sm:self-start">
              <div className="relative group">
                {photoUrl && !photoPreviewError ? (
                  <img
                    src={photoUrl}
                    alt="Aperçu photo"
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-amber-100 shadow-md bg-stone-100"
                    referrerPolicy="no-referrer"
                    onError={() => setPhotoPreviewError(true)}
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl ring-4 ring-amber-100 shadow-md bg-stone-100 flex items-center justify-center text-stone-400">
                    <User className="w-9 h-9" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setPhotoMode('camera-upload')}
                  className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium cursor-pointer"
                  title="Prendre une photo ou sélectionner un fichier"
                >
                  <Camera className="w-5 h-5 mb-1" />
                  <span>Changer</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setPhotoMode('imagen')}
                className="mt-0.5 px-2.5 py-1 rounded-lg bg-amber-100/90 hover:bg-amber-200 text-amber-900 text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer border border-amber-300/50 shadow-2xs"
                title="Générer une illustration de portrait avec Imagen"
              >
                <Sparkles className="w-3 h-3 text-amber-700" />
                <span>Illustration IA</span>
              </button>
            </div>

            {/* Inputs: First Name, Last Name, Gender */}
            <div className="flex-1 w-full space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Prénom(s) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ex: Henri, Marie-Claire..."
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nom de famille <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ex: Beaumont, Dupont..."
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30"
                  />
                </div>
              </div>

              {/* Gender Radio */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Genre</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === 'M'}
                      onChange={() => setGender('M')}
                      className="text-amber-700 focus:ring-amber-600"
                    />
                    <span>Homme</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === 'F'}
                      onChange={() => setGender('F')}
                      className="text-amber-700 focus:ring-amber-600"
                    />
                    <span>Femme</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === 'other'}
                      onChange={() => setGender('other')}
                      className="text-amber-700 focus:ring-amber-600"
                    />
                    <span>Autre</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Selection Tabs */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-stone-700">Source de la photo :</span>
              <div className="flex flex-wrap items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setPhotoMode('camera-upload')}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                    photoMode === 'camera-upload'
                      ? 'bg-white text-amber-900 font-bold shadow-xs border border-stone-200/70'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5 text-amber-700" />
                  <span>Caméra / Fichier</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoMode('url')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    photoMode === 'url'
                      ? 'bg-white text-amber-900 font-bold shadow-xs border border-stone-200/70'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <span>Lien URL</span>
                </button>
              </div>
            </div>

            {photoMode === 'camera-upload' && (
              <CameraPhotoCapture
                currentPhotoUrl={photoUrl}
                onPhotoSelected={(newUrl) => setPhotoUrl(newUrl)}
              />
            )}

            {photoMode === 'url' && (
              <div className="mt-1 space-y-2">
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://exemple.com/ma-photo.jpg"
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600/30 font-mono"
                />
                <p className="text-[11px] text-stone-500">
                  Collez l'adresse web d'une photo existante. Pour une conservation hors-ligne garantie, privilégiez l'onglet <strong>Caméra / Fichier</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Dates & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Date de naissance
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-stone-700">Statut</label>
                <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDeceased}
                    onChange={(e) => setIsDeceased(e.target.checked)}
                    className="rounded text-stone-800 focus:ring-stone-600"
                  />
                  <span>Est décédé(e)</span>
                </label>
              </div>

              {isDeceased ? (
                <input
                  type="date"
                  value={deathDate}
                  onChange={(e) => setDeathDate(e.target.value)}
                  placeholder="Date de décès"
                  className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30"
                />
              ) : (
                <div className="px-3 py-2 text-xs text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200/60 font-medium">
                  Membre vivant de la famille
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Places & Occupation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Lieu de naissance
              </label>
              <input
                type="text"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                placeholder="Ex: Lyon, France"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Ville / Résidence actuelle
              </label>
              <input
                type="text"
                value={currentResidence}
                onChange={(e) => setCurrentResidence(e.target.value)}
                placeholder="Ex: Avignon, France"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Profession / Métier
              </label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="Ex: Architecte, Enseignant..."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30"
              />
            </div>
          </div>

          {/* Section 4: Family Ties / Relationships */}
          <div className="p-4 bg-stone-50/80 rounded-2xl border border-stone-200/80 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Link className="w-4 h-4 text-amber-700" />
              <span>Liens de Parenté</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Parent 1
                </label>
                <select
                  value={parent1Id}
                  onChange={(e) => setParent1Id(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none"
                >
                  <option value="">-- Aucun --</option>
                  {availableMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Parent 2
                </label>
                <select
                  value={parent2Id}
                  onChange={(e) => setParent2Id(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none"
                >
                  <option value="">-- Aucun --</option>
                  {availableMembers
                    .filter((m) => m.id !== parent1Id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Conjoint / Époux
                </label>
                <select
                  value={spouseId}
                  onChange={(e) => setSpouseId(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none"
                >
                  <option value="">-- Aucun / Célibataire --</option>
                  {availableMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Bio & Anecdotes */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Biographie & Anecdotes familiales
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Racontez une passion, un souvenir marquant ou un trait de caractère..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30"
            />
          </div>

          {/* Submit Actions */}
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
              {isEditing ? 'Enregistrer les modifications' : 'Ajouter à la famille'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
