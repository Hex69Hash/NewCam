import React, { useState } from 'react';
import type { CameraFacingMode, ReferenceImage, ReferenceTransform } from '../types';
import { useGesture } from '../hooks/useGesture';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  facingMode: CameraFacingMode;
  referenceImage: ReferenceImage | null;
  transform: ReferenceTransform;
  setTransform: React.Dispatch<React.SetStateAction<ReferenceTransform>>;
  opacity: number;
  showGrid: boolean;
  isFlashing: boolean;
  countdown: number | null;
  onDismissControls: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  videoRef,
  facingMode,
  referenceImage,
  transform,
  setTransform,
  opacity,
  showGrid,
  isFlashing,
  countdown,
  onDismissControls,
}) => {
  const [isInteracting, setIsInteracting] = useState(false);

  // Gesture handling for reference overlay (drag, pinch-to-zoom, rotate)
  const { handlers } = useGesture({
    transform,
    setTransform,
    enabled: Boolean(referenceImage),
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsInteracting(true);
    handlers.onPointerDown(e);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsInteracting(false);
    handlers.onPointerUp(e);
  };

  const handleViewportClick = () => {
    // If user tapped directly on the camera viewport (not actively dragging reference),
    // dismiss open contextual panels/menus so they get a pure clean composition view.
    if (!isInteracting) {
      onDismissControls();
    }
  };

  return (
    <div
      className="camera-viewport-container"
      onClick={handleViewportClick}
      role="region"
      aria-label="Camera Viewfinder"
    >
      {/* Live Camera Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`camera-video ${facingMode === 'user' ? 'mirrored' : ''}`}
      />

      {/* Subtle Composition Grid (Rule of Thirds) */}
      {showGrid && (
        <div className="camera-grid-overlay" aria-hidden="true">
          <div className="grid-line vertical line-1" />
          <div className="grid-line vertical line-2" />
          <div className="grid-line horizontal line-1" />
          <div className="grid-line horizontal line-2" />
          <div className="grid-intersection p1" />
          <div className="grid-intersection p2" />
          <div className="grid-intersection p3" />
          <div className="grid-intersection p4" />
        </div>
      )}

      {/* Direct Gesture Layer for Reference Image */}
      {referenceImage && (
        <div
          className={`reference-gesture-layer ${isInteracting ? 'interacting' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlers.onPointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handlers.onWheel}
          onTouchStart={handlers.onTouchStart}
          onTouchMove={handlers.onTouchMove}
          onTouchEnd={handlers.onTouchEnd}
          onTouchCancel={handlers.onTouchCancel}
        >
          <div
            className="reference-transform-wrapper"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotation}deg) scaleX(${transform.flipped ? -1 : 1})`,
              opacity: opacity / 100,
            }}
          >
            <img
              src={referenceImage.src}
              alt="Reference Overlay"
              className="reference-image"
              draggable={false}
            />

            {/* Subtle boundary indicator only while actively manipulating */}
            {isInteracting && (
              <div className="reference-active-bounds" aria-hidden="true">
                <span className="bounds-corner tl" />
                <span className="bounds-corner tr" />
                <span className="bounds-corner bl" />
                <span className="bounds-corner br" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shutter Flash Animation */}
      {isFlashing && <div className="camera-shutter-flash" aria-hidden="true" />}

      {/* Timer Countdown Big Display */}
      {countdown !== null && (
        <div className="timer-countdown-overlay" aria-live="assertive">
          <div className="countdown-number" key={countdown}>
            {countdown}
          </div>
        </div>
      )}
    </div>
  );
};
