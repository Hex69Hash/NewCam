import { useState, useEffect, useRef, useCallback } from 'react';
import type { CameraFacingMode, CameraPermissionStatus, CapturedPhoto } from '../types';

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  facingMode: CameraFacingMode;
  permissionStatus: CameraPermissionStatus;
  errorMessage: string | null;
  hasTorch: boolean;
  torchOn: boolean;
  isSimulated: boolean;
  startCamera: (mode?: CameraFacingMode) => Promise<boolean>;
  switchCamera: () => Promise<void>;
  toggleTorch: () => Promise<void>;
  enableSimulation: () => void;
  capturePhoto: (mirrorSelfie?: boolean) => CapturedPhoto | null;
  stopCamera: () => void;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<CameraFacingMode>('user');
  const facingModeRef = useRef<CameraFacingMode>('user');

  const [permissionStatus, setPermissionStatus] = useState<CameraPermissionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const isSimulatedRef = useRef<boolean>(false);

  useEffect(() => {
    facingModeRef.current = facingMode;
  }, [facingMode]);

  useEffect(() => {
    isSimulatedRef.current = isSimulated;
  }, [isSimulated]);

  const simulationAnimRef = useRef<number | null>(null);
  const simulationCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const updateStream = useCallback((newStream: MediaStream | null) => {
    streamRef.current = newStream;
    setStream(newStream);
  }, []);

  // Stop active stream tracks
  const stopCamera = useCallback(() => {
    if (simulationAnimRef.current) {
      cancelAnimationFrame(simulationAnimRef.current);
      simulationAnimRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      updateStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [updateStream]);

  // Inspect capabilities of current active video track
  const checkTrackCapabilities = useCallback((videoTrack: MediaStreamTrack) => {
    try {
      if (typeof videoTrack.getCapabilities === 'function') {
        const capabilities = videoTrack.getCapabilities() as unknown as { torch?: boolean };
        setHasTorch(Boolean(capabilities && capabilities.torch));
      } else {
        setHasTorch(false);
      }
    } catch {
      setHasTorch(false);
    }
  }, []);

  // Simulation mode (for dev or when camera is blocked/denied)
  const enableSimulation = useCallback(() => {
    stopCamera();
    setIsSimulated(true);
    setPermissionStatus('simulated');
    setErrorMessage(null);

    // Create synthetic 1080x1440 canvas stream
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 960;
    simulationCanvasRef.current = canvas;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    let tick = 0;
    const renderSimulation = () => {
      tick++;
      // Background gradient simulation
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle dynamic camera noise/grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Animated "subject" standing in frame
      const floatY = Math.sin(tick * 0.03) * 12;
      const headX = canvas.width / 2;
      const headY = 320 + floatY;

      // Body silhouette
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(headX, headY, 85, 110, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shoulders
      ctx.beginPath();
      ctx.moveTo(headX - 60, headY + 100);
      ctx.quadraticCurveTo(headX - 180, headY + 220, headX - 220, canvas.height);
      ctx.lineTo(headX + 220, canvas.height);
      ctx.quadraticCurveTo(headX + 180, headY + 220, headX + 60, headY + 100);
      ctx.closePath();
      ctx.fillStyle = '#1e293b';
      ctx.fill();

      // Simulated lighting glow
      const glow = ctx.createRadialGradient(headX, headY - 50, 20, headX, headY, 260);
      glow.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
      glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(headX, headY, 260, 0, Math.PI * 2);
      ctx.fill();

      // Timestamp watermark in simulation
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '14px monospace';
      ctx.fillText(`SIMULATED FEED • 60 FPS • ${new Date().toLocaleTimeString()}`, 30, 50);

      simulationAnimRef.current = requestAnimationFrame(renderSimulation);
    };

    renderSimulation();

    const simStream = canvas.captureStream(30);
    updateStream(simStream);

    if (videoRef.current) {
      videoRef.current.srcObject = simStream;
      videoRef.current.play().catch(() => {});
    }
  }, [stopCamera, updateStream]);

  // Request actual camera stream
  const startCamera = useCallback(
    async (targetFacingMode?: CameraFacingMode): Promise<boolean> => {
      const mode = targetFacingMode || facingModeRef.current;

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionStatus('unsupported');
        setErrorMessage('Camera access is not supported by your browser or environment.');
        return false;
      }

      setPermissionStatus('prompt');
      setErrorMessage(null);

      // Stop previous tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (simulationAnimRef.current) {
        cancelAnimationFrame(simulationAnimRef.current);
        simulationAnimRef.current = null;
      }

      try {
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        updateStream(newStream);
        setFacingMode(mode);
        facingModeRef.current = mode;
        setPermissionStatus('granted');
        setIsSimulated(false);
        isSimulatedRef.current = false;

        const videoTrack = newStream.getVideoTracks()[0];
        if (videoTrack) {
          checkTrackCapabilities(videoTrack);
        }

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          await videoRef.current.play().catch(() => {});
        }

        return true;
      } catch (err: unknown) {
        console.warn('Camera access failed, testing fallback:', err);
        const error = err as Error;

        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setPermissionStatus('denied');
          setErrorMessage('Camera permission was denied. Please allow camera permissions in your browser address bar.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setPermissionStatus('denied');
          setErrorMessage('No camera device found on this machine.');
        } else {
          setPermissionStatus('denied');
          setErrorMessage(error.message || 'Unable to access the camera.');
        }
        return false;
      }
    },
    [checkTrackCapabilities, updateStream]
  );

  // Switch between front and rear cameras
  const switchCamera = useCallback(async () => {
    const nextMode = facingModeRef.current === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    facingModeRef.current = nextMode;
    if (isSimulatedRef.current) {
      return;
    }
    await startCamera(nextMode);
  }, [startCamera]);

  // Toggle flash/torch
  const toggleTorch = useCallback(async () => {
    const currentStream = streamRef.current;
    if (!currentStream || !hasTorch) return;
    const videoTrack = currentStream.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const nextTorch = !torchOn;
      const track = videoTrack as unknown as { applyConstraints: (c: Record<string, unknown>) => Promise<void> };
      if (typeof track.applyConstraints === 'function') {
        await track.applyConstraints({
          advanced: [{ torch: nextTorch }],
        });
      }
      setTorchOn(nextTorch);
    } catch (err) {
      console.warn('Failed to toggle torch:', err);
    }
  }, [hasTorch, torchOn]);

  // Capture purely the video element without reference overlay
  const capturePhoto = useCallback(
    (mirrorSelfie = true): CapturedPhoto | null => {
      const video = videoRef.current;
      if (!video) return null;

      // Handle video dimensions
      const width = video.videoWidth || (simulationCanvasRef.current ? simulationCanvasRef.current.width : 1080);
      const height = video.videoHeight || (simulationCanvasRef.current ? simulationCanvasRef.current.height : 1440);

      if (width === 0 || height === 0) return null;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // If front camera and mirrorSelfie is true, flip horizontally to match user's preview
      const shouldMirror = facingMode === 'user' && mirrorSelfie;
      if (shouldMirror) {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }

      // Draw pure video frame ONLY
      ctx.drawImage(video, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

      return {
        id: `photo-${Date.now()}`,
        dataUrl,
        timestamp: Date.now(),
        width,
        height,
        facingMode,
      };
    },
    [facingMode]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulationAnimRef.current) {
        cancelAnimationFrame(simulationAnimRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    stream,
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
    stopCamera,
  };
}
