import React, { useRef } from 'react';
import type { ReferenceImage, ReferenceTransform } from '../../types';
import { PRESET_REFERENCES } from '../../utils/presets';
import {
  Upload,
  RotateCw,
  FlipHorizontal,
  RotateCcw,
  Trash2,
  ZoomIn,
  ZoomOut,
  Check,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/audio';

interface ReferenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  referenceImage: ReferenceImage | null;
  onSelectReference: (img: ReferenceImage) => void;
  onRemoveReference: () => void;
  opacity: number;
  setOpacity: (opacity: number) => void;
  transform: ReferenceTransform;
  setTransform: React.Dispatch<React.SetStateAction<ReferenceTransform>>;
  onResetTransform: () => void;
}

export const ReferenceDrawer: React.FC<ReferenceDrawerProps> = ({
  isOpen,
  onClose,
  referenceImage,
  onSelectReference,
  onRemoveReference,
  opacity,
  setOpacity,
  transform,
  setTransform,
  onResetTransform,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerHaptic('light');
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (src) {
        onSelectReference({
          id: `custom-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          src,
          isPreset: false,
        });
        // Reset transform to default when new image is loaded
        onResetTransform();
      }
    };
    reader.readAsDataURL(file);
    // Reset file input value so same file can be re-selected if desired
    e.target.value = '';
  };

  const handleRotate = () => {
    triggerHaptic('light');
    setTransform((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  };

  const handleFlip = () => {
    triggerHaptic('light');
    setTransform((prev) => ({
      ...prev,
      flipped: !prev.flipped,
    }));
  };

  const handleReset = () => {
    triggerHaptic('medium');
    onResetTransform();
  };

  const handleZoom = (delta: number) => {
    triggerHaptic('light');
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(0.2, Math.min(5.0, Number((prev.scale + delta).toFixed(2)))),
    }));
  };

  return (
    <div className="drawer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="reference-bottom-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Drag handle for mobile */}
        <div className="sheet-handle-bar" />

        {/* Header */}
        <div className="sheet-header">
          <div className="sheet-title-group">
            <h3 className="sheet-title">Reference Overlay</h3>
            {referenceImage && (
              <span className="sheet-subtitle truncate">
                {referenceImage.name}
              </span>
            )}
          </div>
          <button
            type="button"
            className="sheet-done-btn"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
          >
            Done
          </button>
        </div>

        <div className="sheet-body-scrollable">
          {/* If reference image is active, show its transform and opacity controls */}
          {referenceImage ? (
            <div className="active-reference-section">
              {/* Opacity slider */}
              <div className="control-group">
                <div className="control-group-header">
                  <label htmlFor="drawer-opacity" className="control-label">
                    Opacity
                  </label>
                  <span className="control-value-text">{opacity}%</span>
                </div>
                <input
                  id="drawer-opacity"
                  type="range"
                  min="0"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="drawer-slider"
                />
              </div>

              {/* Scale / Zoom */}
              <div className="control-group">
                <div className="control-group-header">
                  <label className="control-label">Size / Scale</label>
                  <span className="control-value-text">
                    {(transform.scale * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="scale-controls-row">
                  <button
                    type="button"
                    className="icon-action-btn"
                    onClick={() => handleZoom(-0.1)}
                    title="Scale Down"
                  >
                    <ZoomOut size={18} />
                  </button>
                  <input
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.05"
                    value={transform.scale}
                    onChange={(e) =>
                      setTransform((prev) => ({
                        ...prev,
                        scale: Number(e.target.value),
                      }))
                    }
                    className="drawer-slider flex-1"
                  />
                  <button
                    type="button"
                    className="icon-action-btn"
                    onClick={() => handleZoom(0.1)}
                    title="Scale Up"
                  >
                    <ZoomIn size={18} />
                  </button>
                </div>
              </div>

              {/* Quick Transform Action Buttons */}
              <div className="transform-actions-grid">
                <button
                  type="button"
                  className="transform-action-card"
                  onClick={handleRotate}
                >
                  <RotateCw size={20} />
                  <span>Rotate 90°</span>
                </button>
                <button
                  type="button"
                  className={`transform-action-card ${transform.flipped ? 'active' : ''}`}
                  onClick={handleFlip}
                >
                  <FlipHorizontal size={20} />
                  <span>Flip Horizontal</span>
                </button>
                <button
                  type="button"
                  className="transform-action-card"
                  onClick={handleReset}
                >
                  <RotateCcw size={20} />
                  <span>Reset Fit</span>
                </button>
              </div>

              {/* Replace / Remove Row */}
              <div className="sheet-buttons-row">
                <button
                  type="button"
                  className="sheet-secondary-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={18} />
                  <span>Replace Photo</span>
                </button>
                <button
                  type="button"
                  className="sheet-danger-btn"
                  onClick={() => {
                    triggerHaptic('medium');
                    onRemoveReference();
                  }}
                >
                  <Trash2 size={18} />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ) : (
            /* No reference selected - Primary upload CTA */
            <div className="empty-upload-card">
              <button
                type="button"
                className="sheet-primary-upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="upload-icon-circle">
                  <Upload size={28} />
                </div>
                <div className="upload-text-group">
                  <span className="upload-main-text">Upload Reference Photo</span>
                  <span className="upload-sub-text">
                    Choose from device library or take a photo
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* Hidden File Picker Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden-file-input"
            onChange={handleFileUpload}
          />

          {/* Preset Composition Guides Section */}
          <div className="presets-section">
            <div className="section-divider">
              <span className="divider-text">Or Choose Composition Preset</span>
            </div>

            <div className="presets-grid">
              {PRESET_REFERENCES.map((preset) => {
                const isSelected = referenceImage?.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`preset-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      triggerHaptic('light');
                      onSelectReference(preset);
                      onResetTransform();
                    }}
                  >
                    <div className="preset-thumb-frame">
                      <img src={preset.src} alt={preset.name} />
                      {isSelected && (
                        <div className="preset-selected-badge">
                          <Check size={14} />
                        </div>
                      )}
                    </div>
                    <span className="preset-name">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
