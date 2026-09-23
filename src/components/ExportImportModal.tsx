import React, { useRef, useState } from 'react';
import { FamilyData } from '../types';
import { getLocalStorageUsage } from '../utils/imageOptimizer';
import {
  X,
  Download,
  Upload,
  Printer,
  Check,
  AlertCircle,
  FileText,
  Trash2,
  HardDrive,
  Zap,
} from 'lucide-react';

interface ExportImportModalProps {
  data: FamilyData;
  onUpdateFamilyName: (name: string, motto: string) => void;
  onImportData: (newData: FamilyData) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  data,
  onUpdateFamilyName,
  onImportData,
  onClearAll,
  onClose,
}) => {
  const [familyName, setFamilyName] = useState(data.familyName);
  const [motto, setMotto] = useState(data.motto || '');
  const [hasSavedName, setHasSavedName] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const storageInfo = getLocalStorageUsage();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateFamilyName(familyName.trim() || 'Ma Famille', motto.trim());
    setHasSavedName(true);
    setTimeout(() => setHasSavedName(false), 2000);
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const fileName = `${data.familyName.toLowerCase().replace(/\s+/g, '-')}-arbre-genealogique.json`;
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed.members || !Array.isArray(parsed.members)) {
          throw new Error('Format de fichier invalide : liste des membres manquante.');
        }
        onImportData({
          familyName: parsed.familyName || 'Arbre Familial',
          motto: parsed.motto || '',
          members: parsed.members,
          events: parsed.events || [],
        });
        alert('Arbre généalogique importé avec succès !');
        onClose();
      } catch (err: any) {
        setErrorMsg('Erreur lors de la lecture du fichier : ' + (err.message || 'JSON invalide'));
      }
    };
    reader.readAsText(file);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-bold text-lg">Sauvegarde & Paramètres de l'Arbre</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Family Name & Motto */}
          <form onSubmit={handleSaveName} className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Identité de la Famille
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Nom de famille principal
                </label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Devise familiale (optionnel)
                </label>
                <input
                  type="text"
                  value={motto}
                  onChange={(e) => setMotto(e.target.value)}
                  placeholder="Ex: Unis par le cœur..."
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600/30"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {hasSavedName ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                <span>{hasSavedName ? 'Enregistré !' : 'Mettre à jour'}</span>
              </button>
            </div>
          </form>

          {/* Section: Storage Usage Diagnostics */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-stone-700">
                <HardDrive className="w-3.5 h-3.5 text-amber-700" />
                <span>Stockage Local (localStorage)</span>
              </div>
              <span className="font-semibold text-stone-700">
                {storageInfo.itemFormatted} utilisés
              </span>
            </div>

            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(2, storageInfo.percentage)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-500">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Photos optimisées automatiquement (~20-40 Ko)</span>
              </span>
              <span>{storageInfo.limitFormatted} disponibles</span>
            </div>
          </div>

          {/* Section 2: Export & Backup */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Exportation & Impression
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleDownloadJSON}
                className="p-4 rounded-2xl border border-stone-200 hover:border-amber-300 hover:bg-amber-50/30 transition-all text-left group"
              >
                <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs sm:text-sm mb-1">
                  <Download className="w-4 h-4" />
                  <span>Télécharger le fichier (JSON)</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-normal">
                  Sauvegarde complète de vos {data.members.length} membres et {data.events.length} événements.
                </p>
              </button>

              <button
                onClick={handlePrint}
                className="p-4 rounded-2xl border border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-all text-left group"
              >
                <div className="flex items-center gap-2 text-stone-800 font-semibold text-xs sm:text-sm mb-1">
                  <Printer className="w-4 h-4" />
                  <span>Imprimer / Exporter en PDF</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-normal">
                  Générer une version imprimable propre pour vos archives ou albums papier.
                </p>
              </button>
            </div>
          </div>

          {/* Section 3: Import Existing File */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Importer un Arbre
            </h4>

            <div className="p-4 rounded-2xl border-2 border-dashed border-stone-300 text-center bg-stone-50/50">
              <Upload className="w-6 h-6 text-stone-400 mx-auto mb-1" />
              <p className="text-xs text-stone-700 font-medium mb-1">
                Restaurer un fichier JSON précédemment exporté
              </p>
              <p className="text-[11px] text-stone-400 mb-3">
                Remplacera l'arbre actuel par les données contenues dans le fichier
              </p>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                Choisir un fichier .JSON
              </button>

              {errorMsg && (
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-rose-600">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Reset Options */}
          <div className="pt-4 border-t border-stone-100 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Réinitialisation
            </h4>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      'Êtes-vous sûr de vouloir vider tout l’arbre pour commencer à zéro ?'
                    )
                  ) {
                    onClearAll();
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Commencer un arbre vierge (vide)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
