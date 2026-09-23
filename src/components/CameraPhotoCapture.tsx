import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  Check,
  RotateCcw,
  AlertCircle,
  Zap,
  Sparkles,
  HardDrive,
} from 'lucide-react';
import { optimizeImageForStorage, formatBytes, OptimizationResult } from '../utils/imageOptimizer';

interface CameraPhotoCaptureProps {
  currentPhotoUrl: string;
  onPhotoSelected: (optimizedDataUrl: string) => void;
  onCancel?: () => void;
}

export const CameraPhotoCapture: React.FC<CameraPhotoCaptureProps> = ({
  currentPhotoUrl,
  onPhotoSelected,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('upload');

  // Camera states
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  // File Upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [optResult, setOptResult] = useState<OptimizationResult | null>(null);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Start camera helper
  const startCamera = useCallback(async (facing: 'user' | 'environment' = facingMode) => {
    stopCamera();
    setCameraError(null);
    setCapturedSnapshot(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Votre navigateur ou cet environnement ne prend pas en charge l'accès direct à la caméra. Veuillez sélectionner un fichier photo.");
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((e) => console.warn('Video play error:', e));
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Erreur caméra:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError("Autorisation d'accès à la caméra refusée. Veuillez autoriser l'accès dans les paramètres de votre navigateur ou utiliser un fichier local.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError("Aucune caméra n'a été détectée sur votre appareil.");
      } else {
        setCameraError("Impossible d'activer la caméra (" + (err.message || 'erreur inconnue') + "). Vous pouvez importer une photo depuis votre appareil.");
      }
      setIsCameraActive(false);
    }
  }, [facingMode, stopCamera]);

  // Clean up on unmount or tab switch
  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab, startCamera, stopCamera]);

  // Toggle front/back camera
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Snap photo from camera stream
  const handleCaptureFromCamera = async () => {
    if (!videoRef.current) return;
    setIsTakingPhoto(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const size = Math.min(video.videoWidth || 480, video.videoHeight || 480);
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Center crop the video square
        const sX = ((video.videoWidth || size) - size) / 2;
        const sY = ((video.videoHeight || size) - size) / 2;

        // If front camera, mirror image for natural reflection
        if (facingMode === 'user') {
          ctx.translate(size, 0);
          ctx.scale(-1, 1);
        }

        ctx.drawImage(video, sX, sY, size, size, 0, 0, size, size);
        const rawData = canvas.toDataURL('image/jpeg', 0.9);

        // Optimize for localStorage
        const optimized = await optimizeImageForStorage(rawData, {
          maxWidth: 360,
          maxHeight: 360,
          quality: 0.82,
          cropSquare: true,
        });

        setCapturedSnapshot(optimized.dataUrl);
        setOptResult(optimized);
        stopCamera();
      }
    } catch (e) {
      console.error('Erreur de capture:', e);
    } finally {
      setIsTakingPhoto(false);
    }
  };

  // Process selected file
  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await optimizeImageForStorage(file, {
        maxWidth: 360,
        maxHeight: 360,
        quality: 0.82,
        cropSquare: true,
      });

      setOptResult(result);
      onPhotoSelected(result.dataUrl);
    } catch (err: any) {
      alert("Erreur lors de l'optimisation de l'image : " + (err.message || 'Format non supporté'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  // Confirm photo captured from camera
  const handleConfirmCapturedPhoto = () => {
    if (capturedSnapshot) {
      onPhotoSelected(capturedSnapshot);
    }
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedSnapshot(null);
    setOptResult(null);
    startCamera();
  };

  return (
    <div className="space-y-3">
      {/* Sub-tabs: Camera vs File Upload */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-100/90 rounded-xl border border-stone-200">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'upload'
              ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Upload className="w-3.5 h-3.5 text-amber-700" />
          <span>Fichier local</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('camera')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'camera'
              ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Camera className="w-3.5 h-3.5 text-amber-700" />
          <span>Prendre avec la Caméra</span>
        </button>
      </div>

      {/* Mode 1: File Upload (Local selection with drag & drop) */}
      {activeTab === 'upload' && (
        <div className="space-y-2">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-amber-600 bg-amber-50/50 scale-[0.99]'
                : 'border-stone-300 hover:border-amber-400 bg-stone-50/50 hover:bg-stone-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*"
              className="hidden"
            />

            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-2">
              <Upload className="w-5 h-5" />
            </div>

            <p className="text-xs font-bold text-stone-800">
              {isProcessing ? 'Optimisation de la photo...' : 'Glissez une photo ou cliquez pour parcourir'}
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">
              JPG, PNG ou WebP • Compression automatique pour le stockage
            </p>
          </div>
        </div>
      )}

      {/* Mode 2: Camera Viewfinder */}
      {activeTab === 'camera' && (
        <div className="space-y-3">
          {cameraError ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-stone-700 text-xs space-y-2">
              <div className="flex items-start gap-2 text-amber-800 font-semibold">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Accès caméra non disponible</span>
              </div>
              <p className="text-stone-600 leading-relaxed">{cameraError}</p>
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Réessayer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choisir un fichier à la place</span>
                </button>
              </div>
            </div>
          ) : capturedSnapshot ? (
            /* Review captured picture */
            <div className="bg-stone-900 rounded-2xl p-4 text-center space-y-3">
              <div className="relative inline-block mx-auto">
                <img
                  src={capturedSnapshot}
                  alt="Capture caméra"
                  className="w-44 h-44 rounded-2xl object-cover ring-4 ring-amber-400/80 shadow-xl mx-auto"
                />
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-stone-900/80 text-[10px] text-emerald-300 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Photo capturée
                </span>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reprendre</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmCapturedPhoto}
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Utiliser cette photo</span>
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera Stream */
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-square max-w-[280px] mx-auto shadow-inner flex flex-col items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Portrait guide circle */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-3/4 h-3/4 rounded-full border-2 border-dashed border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]"></div>
              </div>

              {/* Shutter flash animation overlay */}
              {isTakingPhoto && (
                <div className="absolute inset-0 bg-white animate-fade-out pointer-events-none"></div>
              )}

              {/* Camera controls bar */}
              <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-4 px-4">
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  title="Changer de caméra (avant / arrière)"
                  className="p-2 rounded-full bg-stone-900/70 hover:bg-stone-900 text-white transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleCaptureFromCamera}
                  disabled={!isCameraActive || isTakingPhoto}
                  className="w-12 h-12 rounded-full bg-white hover:bg-amber-100 text-stone-900 p-1 flex items-center justify-center ring-4 ring-white/50 active:scale-95 transition-all shadow-lg"
                >
                  <div className="w-9 h-9 rounded-full bg-amber-600 flex items-center justify-center text-white">
                    <Camera className="w-5 h-5" />
                  </div>
                </button>

                <div className="w-8" /> {/* Balance spacer */}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Storage Optimization Feedback Banner */}
      {optResult && (
        <div className="p-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-center justify-between text-[11px] text-emerald-900">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              Taille optimisée : <strong>{formatBytes(optResult.compressedSize)}</strong>
              {optResult.originalSize > optResult.compressedSize && (
                <span className="text-emerald-700"> (gain de {optResult.savedPercentage}%)</span>
              )}
            </span>
          </div>
          <span className="text-emerald-700 font-medium px-2 py-0.5 rounded-md bg-emerald-100/60 text-[10px]">
            Format carré 360x360
          </span>
        </div>
      )}
    </div>
  );
};
