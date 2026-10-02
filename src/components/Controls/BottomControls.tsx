import React, { useRef } from 'react';
import type { ReferenceImage, CameraFacingMode } from '../../types';
import { RotateCw, Plus } from 'lucide-react';
import { triggerHaptic } from '../../utils/audio';

interface BottomControlsProps {
  onCapture: () => void;
  onSwitchCamera: () => void;
  onToggleContextualBar: () => void;
  onOpenReferenceDrawer: () => void;
  referenceImage: ReferenceImage | null;
  facingMode: CameraFacingMode;
  isCapturing: boolean;
  isCountingDown: boolean;
  isContextualBarOpen: boolean;
  opacity: number;
  onOpacityChange: (newOpacity: number) => void;
  onNotify: (msg: string) => void;
}

export const BottomControls: React.FC<BottomControlsProps> = ({
  onCapture,
  onSwitchCamera,
  onToggleContextualBar,
  onOpenReferenceDrawer,
  referenceImage,
  isCapturing,
  isCountingDown,
  isContextualBarOpen,
  opacity,
  onOpacityChange,
  onNotify,
}) => {
  const swipeStartYRef = useRef<number | null>(null);
  const swipeStartOpacityRef = useRef<number>(opacity);
  const hasSwipedRef = useRef<boolean>(false);

  const handleCaptureClick = () => {
    if (isCapturing || isCountingDown) return;
    triggerHaptic('shutter');
    onCapture();
  };

  const handleSwitchClick = () => {
    triggerHaptic('light');
    onSwitchCamera();
  };

  // Thumbnail Touch/Pointer handlers for vertical swipe opacity control
  const handlePointerDown = (e: React.PointerEvent) => {
    swipeStartYRef.current = e.clientY;
    swipeStartOpacityRef.current = opacity;
    hasSwipedRef.current = false;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (swipeStartYRef.current === null || !referenceImage) return;
    const deltaY = swipeStartYRef.current - e.clientY; // positive = dragging up

    if (Math.abs(deltaY) > 8) {
      hasSwipedRef.current = true;
      // 100px swipe = ~50% opacity change
      const opacityChange = Math.round(deltaY / 2.2);
      const newOpacity = Math.max(5, Math.min(100, swipeStartOpacityRef.current + opacityChange));
      onOpacityChange(newOpacity);
      onNotify(`Opacity ${newOpacity}%`);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (swipeStartYRef.current !== null) {
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
      swipeStartYRef.current = null;

      // If it was just a tap without significant vertical swipe, trigger standard toggle/open
      if (!hasSwipedRef.current) {
        triggerHaptic('light');
        if (referenceImage) {
          onToggleContextualBar();
        } else {
          onOpenReferenceDrawer();
        }
      }
      hasSwipedRef.current = false;
    }
  };

  return (
    <footer className="camera-bottombar safe-bottom" aria-label="Camera Shutter and Controls">
      {/* Left Slot: Reference Thumbnail Button */}
      <div className="bottombar-slot left">
        <button
          type="button"
          className={`bottom-reference-btn ${referenceImage ? 'has-reference' : ''} ${isContextualBarOpen ? 'active-border' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label={referenceImage ? 'Reference Photo (swipe up/down for opacity, tap for controls)' : 'Add Reference Photo'}
          title={referenceImage ? 'Tap for reference controls, or swipe up/down to adjust opacity' : 'Add Reference Photo'}
        >
          {referenceImage ? (
            <div className="thumbnail-frame">
              <img src={referenceImage.src} alt="" aria-hidden="true" draggable={false} />
              <span className="reference-status-dot" />
            </div>
          ) : (
            <div className="thumbnail-empty-frame">
              <Plus size={20} />
            </div>
          )}
          <span className="bottom-btn-subtext">Reference</span>
        </button>
      </div>

      {/* Center Slot: Dominant Camera Shutter Button */}
      <div className="bottombar-slot center">
        <button
          type="button"
          className={`hero-shutter-btn ${isCountingDown ? 'counting-down' : ''} ${isCapturing ? 'capturing' : ''}`}
          onClick={handleCaptureClick}
          disabled={isCapturing}
          aria-label={isCountingDown ? 'Counting Down Shutter' : 'Take Picture'}
          title="Take Picture"
        >
          <div className="hero-shutter-outer">
            {isCountingDown && <div className="shutter-countdown-spinner" />}
            <div className="hero-shutter-inner" />
          </div>
        </button>
      </div>

      {/* Right Slot: Camera Switch (↻ Camera) */}
      <div className="bottombar-slot right">
        <button
          type="button"
          className="bottom-switch-btn"
          onClick={handleSwitchClick}
          aria-label="Switch Camera"
          title="Switch Front / Rear Camera"
        >
          <div className="switch-circle">
            <RotateCw size={21} />
          </div>
          <span className="bottom-btn-subtext">Camera</span>
        </button>
      </div>
    </footer>
  );
};
