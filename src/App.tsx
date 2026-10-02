import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCamera } from './hooks/useCamera';
import { CameraView } from './components/CameraView';
import { TopBar } from './components/Controls/TopBar';
import { BottomControls } from './components/Controls/BottomControls';
import { ContextualReferenceBar } from './components/Controls/ContextualReferenceBar';
import { ReferenceDrawer } from './components/ReferenceModal/ReferenceDrawer';
import { PhotoReview } from './components/PhotoReview/PhotoReview';
import { PermissionModal } from './components/PermissionModal/PermissionModal';
import type {
  ReferenceImage,
  ReferenceTransform,
  TimerDuration,
  CapturedPhoto,
} from './types';
import { playShutterSound, playTimerBeep, triggerHaptic } from './utils/audio';

const DEFAULT_TRANSFORM: ReferenceTransform = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  flipped: false,
};

export const App: React.FC = () => {
  // Camera hook
  const {
    videoRef,
    facingMode,
    permissionStatus,
    errorMessage,
    hasTorch,
    torchOn,
    isSimulated,
    startCamera,
    switchCamera,
    toggleTorch,
    enableSimulation,
    capturePhoto,
  } = useCamera();

  // App & Reference States
  const [referenceImage, setReferenceImage] = useState<ReferenceImage | null>(null);
  const [referenceOpacity, setReferenceOpacity] = useState<number>(50); // Default 50%
  const [referenceTransform, setTransform] = useState<ReferenceTransform>(DEFAULT_TRANSFORM);

  // Interface States
  const [timer, setTimer] = useState<TimerDuration>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [isContextualBarOpen, setIsContextualBarOpen] = useState<boolean>(false);
  const [isReferenceDrawerOpen, setIsReferenceDrawerOpen] = useState<boolean>(false);
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Transient Toast Notification
  const [transientToast, setTransientToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const countdownIntervalRef = useRef<number | null>(null);

  // Show a sleek transient toast pill (e.g. "Opacity 63%")
  const showNotification = useCallback((message: string) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setTransientToast(message);
    toastTimerRef.current = window.setTimeout(() => {
      setTransientToast(null);
      toastTimerRef.current = null;
    }, 1600);
  }, []);

  // Attempt initial camera start on mount
  useEffect(() => {
    startCamera('user').catch(() => {
      // Handled via permissionStatus state
    });
  }, [startCamera]);

  // Reset overlay position, scale, rotation and orientation
  const handleResetTransform = useCallback(() => {
    setTransform(DEFAULT_TRANSFORM);
  }, []);

  // Pure camera capture execution
  const executeCapture = useCallback(() => {
    setIsCapturing(true);
    // 1. Shutter sound & haptics
    playShutterSound();
    triggerHaptic('shutter');

    // 2. Visual flash animation
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    // 3. Capture camera frame ONLY (never bake the reference overlay)
    const photo = capturePhoto(true);

    if (photo) {
      if (referenceImage) {
        photo.referenceImage = referenceImage;
      }
      setCapturedPhoto(photo);
    }
    setIsCapturing(false);
  }, [capturePhoto, referenceImage]);

  // Handle capture button press with optional timer countdown
  const handleCaptureTrigger = useCallback(() => {
    if (isCapturing || countdown !== null) return;

    // Immediately dismiss any open contextual controls when shooting
    setIsContextualBarOpen(false);

    if (timer === 0) {
      executeCapture();
      return;
    }

    // Begin countdown
    let remaining = timer;
    setCountdown(remaining);
    playTimerBeep(false);

    countdownIntervalRef.current = window.setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        setCountdown(remaining);
        playTimerBeep(remaining === 1);
        triggerHaptic('light');
      } else {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdown(null);
        executeCapture();
      }
    }, 1000);
  }, [isCapturing, countdown, timer, executeCapture]);

  // Clear countdown timer if unmounting or resetting
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Keyboard accessibility on desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (capturedPhoto) {
        if (e.key === 'Escape') setCapturedPhoto(null);
        return;
      }
      if (isReferenceDrawerOpen) {
        if (e.key === 'Escape') setIsReferenceDrawerOpen(false);
        return;
      }

      // Spacebar to take photo
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        handleCaptureTrigger();
      } else if (e.key === 'r' || e.key === 'R') {
        switchCamera();
      } else if (e.key === 'o' || e.key === 'O') {
        if (referenceImage) {
          setIsContextualBarOpen((prev) => !prev);
        } else {
          setIsReferenceDrawerOpen(true);
        }
      } else if (e.key === 'g' || e.key === 'G') {
        setShowGrid((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsContextualBarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [capturedPhoto, isReferenceDrawerOpen, referenceImage, handleCaptureTrigger, switchCamera]);

  return (
    <div className="refcam-app-shell">
      {/* Main Camera Workspace Container */}
      <main className="camera-workspace">
        {/* Top Minimal Controls Bar */}
        <TopBar
          timer={timer}
          setTimer={setTimer}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          hasTorch={hasTorch}
          torchOn={torchOn}
          onToggleTorch={toggleTorch}
          isSimulated={isSimulated}
          referenceTransform={referenceTransform}
          hasReference={Boolean(referenceImage)}
          onResetTransform={handleResetTransform}
          onNotify={showNotification}
        />

        {/* Live Camera View with Directly Manipulable Reference Overlay */}
        <CameraView
          videoRef={videoRef}
          facingMode={facingMode}
          referenceImage={referenceImage}
          transform={referenceTransform}
          setTransform={setTransform}
          opacity={referenceOpacity}
          showGrid={showGrid}
          isFlashing={isFlashing}
          countdown={countdown}
          onDismissControls={() => {
            setIsContextualBarOpen(false);
          }}
        />

        {/* Transient Floating Toast Notification Pill */}
        {transientToast && (
          <div className="transient-toast-pill animate-fade-in" aria-live="polite">
            <span>{transientToast}</span>
          </div>
        )}

        {/* Contextual Floating Reference Bar (Near bottom, auto-dismissible) */}
        {referenceImage && (
          <ContextualReferenceBar
            isOpen={isContextualBarOpen}
            onClose={() => setIsContextualBarOpen(false)}
            opacity={referenceOpacity}
            setOpacity={setReferenceOpacity}
            transform={referenceTransform}
            setTransform={setTransform}
            onResetTransform={handleResetTransform}
            onOpenDrawer={() => setIsReferenceDrawerOpen(true)}
            onRemoveReference={() => {
              setReferenceImage(null);
              handleResetTransform();
              setIsContextualBarOpen(false);
              showNotification('Reference Removed');
            }}
            onNotify={showNotification}
          />
        )}

        {/* Bottom Shutter & Primary Actions Bar */}
        <BottomControls
          onCapture={handleCaptureTrigger}
          onSwitchCamera={switchCamera}
          onToggleContextualBar={() => setIsContextualBarOpen((prev) => !prev)}
          onOpenReferenceDrawer={() => setIsReferenceDrawerOpen(true)}
          referenceImage={referenceImage}
          facingMode={facingMode}
          isCapturing={isCapturing}
          isCountingDown={countdown !== null}
          isContextualBarOpen={isContextualBarOpen}
          opacity={referenceOpacity}
          onOpacityChange={(newOpacity) => {
            setReferenceOpacity(newOpacity);
          }}
          onNotify={showNotification}
        />
      </main>

      {/* Reference Library Bottom Sheet (Presets & Upload) */}
      <ReferenceDrawer
        isOpen={isReferenceDrawerOpen}
        onClose={() => setIsReferenceDrawerOpen(false)}
        referenceImage={referenceImage}
        onSelectReference={(img) => {
          setReferenceImage(img);
          setReferenceOpacity(50); // Default 50% opacity
          handleResetTransform();
          setIsReferenceDrawerOpen(false);
          setIsContextualBarOpen(true); // Contextual bar appears briefly so user knows it's active
          showNotification('Reference Added');
        }}
        onRemoveReference={() => {
          setReferenceImage(null);
          handleResetTransform();
          setIsReferenceDrawerOpen(false);
          setIsContextualBarOpen(false);
          showNotification('Reference Removed');
        }}
        opacity={referenceOpacity}
        setOpacity={setReferenceOpacity}
        transform={referenceTransform}
        setTransform={setTransform}
        onResetTransform={handleResetTransform}
      />

      {/* Captured Photo Preview & Export Modal */}
      {capturedPhoto && (
        <PhotoReview
          photo={capturedPhoto}
          referenceImage={referenceImage}
          onRetake={() => setCapturedPhoto(null)}
          onClose={() => setCapturedPhoto(null)}
        />
      )}

      {/* Camera Permission / Error / Simulation Fallback */}
      <PermissionModal
        status={permissionStatus}
        errorMessage={errorMessage}
        onRequestPermission={() => startCamera(facingMode)}
        onEnableSimulation={enableSimulation}
      />
    </div>
  );
};

export default App;
