import React, { useEffect, useRef, useCallback } from 'react';
import type { ReferenceTransform } from '../../types';
import { RotateCw, FlipHorizontal, RotateCcw, FolderOpen, X, Sliders } from 'lucide-react';
import { triggerHaptic } from '../../utils/audio';

interface ContextualReferenceBarProps {
  isOpen: boolean;
  onClose: () => void;
  opacity: number;
  setOpacity: (opacity: number) => void;
  transform: ReferenceTransform;
  setTransform: React.Dispatch<React.SetStateAction<ReferenceTransform>>;
  onResetTransform: () => void;
  onOpenDrawer: () => void;
  onRemoveReference: () => void;
  onNotify: (msg: string) => void;
}

export const ContextualReferenceBar: React.FC<ContextualReferenceBarProps> = ({
  isOpen,
  onClose,
  opacity,
  setOpacity,
  transform,
  setTransform,
  onResetTransform,
  onOpenDrawer,
  onRemoveReference,
  onNotify,
}) => {
  const autoHideTimerRef = useRef<number | null>(null);

  // Auto-collapse after 3 seconds of inactivity
  const resetInactivityTimer = useCallback(() => {
    if (autoHideTimerRef.current) {
      window.clearTimeout(autoHideTimerRef.current);
    }
    autoHideTimerRef.current = window.setTimeout(() => {
      onClose();
    }, 3200);
  }, [onClose]);

  // Start timer on open and clear on unmount/close
  useEffect(() => {
    if (isOpen) {
      resetInactivityTimer();
    } else {
      if (autoHideTimerRef.current) {
        window.clearTimeout(autoHideTimerRef.current);
        autoHideTimerRef.current = null;
      }
    }
    return () => {
      if (autoHideTimerRef.current) {
        window.clearTimeout(autoHideTimerRef.current);
      }
    };
  }, [isOpen, resetInactivityTimer]);

  if (!isOpen) return null;

  const handleOpacitySliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    resetInactivityTimer();
    const val = Number(e.target.value);
    setOpacity(val);
    onNotify(`Opacity ${val}%`);
  };

  const handlePresetClick = (preset: number) => {
    resetInactivityTimer();
    triggerHaptic('light');
    setOpacity(preset);
    onNotify(`Opacity ${preset}%`);
  };

  const handleRotate = () => {
    resetInactivityTimer();
    triggerHaptic('light');
    const newRotation = (transform.rotation + 90) % 360;
    setTransform((prev) => ({
      ...prev,
      rotation: newRotation,
    }));
    onNotify(`Rotated ${newRotation}°`);
  };

  const handleFlip = () => {
    resetInactivityTimer();
    triggerHaptic('light');
    setTransform((prev) => ({
      ...prev,
      flipped: !prev.flipped,
    }));
    onNotify(transform.flipped ? 'Unflipped' : 'Flipped horizontally');
  };

  const handleReset = () => {
    resetInactivityTimer();
    triggerHaptic('medium');
    onResetTransform();
    onNotify('Reference Reset');
  };

  const handleMorePresets = () => {
    triggerHaptic('light');
    onClose();
    onOpenDrawer();
  };

  const handleRemove = () => {
    triggerHaptic('medium');
    onClose();
    onRemoveReference();
    onNotify('Reference Removed');
  };

  const isTransformModified =
    transform.x !== 0 ||
    transform.y !== 0 ||
    transform.scale !== 1 ||
    transform.rotation !== 0 ||
    transform.flipped;

  return (
    <div
      className="contextual-ref-container animate-slide-up"
      onPointerDown={resetInactivityTimer}
      onTouchStart={resetInactivityTimer}
      aria-label="Contextual Reference Controls"
    >
      <div className="contextual-ref-card">
        {/* Row 1: Compact Opacity Slider & Quick Presets */}
        <div className="ref-slider-row">
          <div className="ref-slider-label">
            <Sliders size={14} className="opacity-icon" />
            <span>Opacity</span>
          </div>

          <div className="ref-slider-track-wrap">
            <input
              type="range"
              min="5"
              max="100"
              step="1"
              value={opacity}
              onChange={handleOpacitySliderChange}
              className="thumb-range-slider"
              aria-label="Reference Opacity Slider"
            />
          </div>

          <span className="ref-opacity-value">{opacity}%</span>

          {/* Minimal Text Presets */}
          <div className="ref-preset-chips" aria-label="Opacity Presets">
            {[25, 50, 75].map((preset) => (
              <button
                key={preset}
                type="button"
                className={`preset-chip-btn ${opacity === preset ? 'active' : ''}`}
                onClick={() => handlePresetClick(preset)}
                aria-label={`Set Opacity to ${preset}%`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Subtle Divider */}
        <div className="ref-card-divider" />

        {/* Row 2: Secondary Quick Actions */}
        <div className="ref-actions-row">
          <button
            type="button"
            className="ref-action-pill"
            onClick={handleRotate}
            title="Rotate 90°"
            aria-label="Rotate Reference 90°"
          >
            <RotateCw size={15} />
            <span>Rotate</span>
          </button>

          <button
            type="button"
            className={`ref-action-pill ${transform.flipped ? 'active' : ''}`}
            onClick={handleFlip}
            title="Flip Horizontal"
            aria-label="Flip Reference Horizontal"
          >
            <FlipHorizontal size={15} />
            <span>Flip</span>
          </button>

          {isTransformModified && (
            <button
              type="button"
              className="ref-action-pill highlight"
              onClick={handleReset}
              title="Reset Position & Scale"
              aria-label="Reset Reference Position and Scale"
            >
              <RotateCcw size={15} />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            className="ref-action-pill"
            onClick={handleMorePresets}
            title="Browse Reference Library"
            aria-label="Browse Reference Library"
          >
            <FolderOpen size={15} />
            <span>Library</span>
          </button>

          <button
            type="button"
            className="ref-action-pill danger"
            onClick={handleRemove}
            title="Remove Reference"
            aria-label="Remove Reference Image"
          >
            <X size={15} />
            <span>Remove</span>
          </button>
        </div>
      </div>
    </div>
  );
};
