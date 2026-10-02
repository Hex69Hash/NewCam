import React, { useState } from 'react';
import type { CapturedPhoto, ReferenceImage } from '../../types';
import { Download, RotateCcw, Share2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { triggerHaptic } from '../../utils/audio';

interface PhotoReviewProps {
  photo: CapturedPhoto;
  referenceImage: ReferenceImage | null;
  onRetake: () => void;
  onClose: () => void;
}

export const PhotoReview: React.FC<PhotoReviewProps> = ({
  photo,
  referenceImage,
  onRetake,
}) => {
  const [showCompareOverlay, setShowCompareOverlay] = useState(false);
  const [compareOpacity, setCompareOpacity] = useState(50);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Download captured photograph
  const handleDownload = () => {
    triggerHaptic('light');
    const a = document.createElement('a');
    a.href = photo.dataUrl;
    const dateStr = new Date(photo.timestamp)
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);
    a.download = `refcam-capture-${dateStr}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Native Web Share API if available
  const handleShare = async () => {
    triggerHaptic('light');
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        // Convert dataURL to File for sharing
        const res = await fetch(photo.dataUrl);
        const blob = await res.blob();
        const file = new File([blob], 'refcam-photo.jpg', { type: 'image/jpeg' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Captured with RefCam',
            text: 'Recreated photo composition using RefCam',
          });
          return;
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.warn('Share failed, falling back to download:', err);
          handleDownload();
        }
        return;
      }
    }
    // Fallback to download
    handleDownload();
  };

  return (
    <div className="photo-review-modal" role="dialog" aria-modal="true" aria-label="Photo Preview">
      {/* Top bar with quick metadata and compare toggle */}
      <header className="review-topbar safe-top">
        <div className="review-meta">
          <span className="review-title">Captured Photo</span>
          <span className="review-dimens">
            {photo.width} × {photo.height}
          </span>
        </div>

        {referenceImage && (
          <button
            type="button"
            className={`compare-toggle-btn ${showCompareOverlay ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setShowCompareOverlay((prev) => !prev);
            }}
          >
            {showCompareOverlay ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>{showCompareOverlay ? 'Hide Ref' : 'Compare Ref'}</span>
          </button>
        )}
      </header>

      {/* Main Photo Canvas Display Area */}
      <div className="review-photo-container">
        <img
          src={photo.dataUrl}
          alt="Captured photograph"
          className="captured-photo-img"
        />

        {/* Optional Reference Comparison Overlay */}
        {referenceImage && showCompareOverlay && (
          <div
            className="review-compare-overlay"
            style={{ opacity: compareOpacity / 100 }}
          >
            <img src={referenceImage.src} alt="Reference comparison" />
          </div>
        )}

        {/* Saved Success Toast */}
        {savedSuccess && (
          <div className="saved-toast animate-slide-up">
            <CheckCircle size={18} />
            <span>Saved to device</span>
          </div>
        )}
      </div>

      {/* Comparison slider if compare mode enabled */}
      {referenceImage && showCompareOverlay && (
        <div className="compare-slider-box animate-fade">
          <span>Compare Blend: {compareOpacity}%</span>
          <input
            type="range"
            min="0"
            max="100"
            value={compareOpacity}
            onChange={(e) => setCompareOpacity(Number(e.target.value))}
            className="thumb-range-slider"
          />
        </div>
      )}

      {/* Bottom Action Buttons */}
      <footer className="review-bottombar safe-bottom">
        <button
          type="button"
          className="review-btn retake-btn"
          onClick={() => {
            triggerHaptic('light');
            onRetake();
          }}
        >
          <RotateCcw size={20} />
          <span>Retake</span>
        </button>

        {'share' in navigator ? (
          <button
            type="button"
            className="review-btn share-btn"
            onClick={handleShare}
          >
            <Share2 size={20} />
            <span>Share</span>
          </button>
        ) : null}

        <button
          type="button"
          className="review-btn save-btn"
          onClick={handleDownload}
        >
          <Download size={20} />
          <span>Save Photo</span>
        </button>
      </footer>
    </div>
  );
};
