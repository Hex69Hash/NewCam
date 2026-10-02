export type CameraFacingMode = 'user' | 'environment';

export type CameraPermissionStatus = 
  | 'idle' 
  | 'prompt' 
  | 'granted' 
  | 'denied' 
  | 'unsupported' 
  | 'simulated';

export type TimerDuration = 0 | 3 | 5 | 10;

export interface ReferenceTransform {
  x: number; // offset in pixels
  y: number; // offset in pixels
  scale: number; // scale multiplier, default 1
  rotation: number; // rotation in degrees
  flipped: boolean; // horizontal flip
}

export interface ReferenceImage {
  id: string;
  name: string;
  src: string;
  aspectRatio?: number;
  isPreset?: boolean;
}

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: number;
  width: number;
  height: number;
  facingMode: CameraFacingMode;
  referenceImage?: ReferenceImage | null;
}

export interface CameraCapabilities {
  hasTorch: boolean;
  hasMultipleCameras: boolean;
  canSwitchCamera: boolean;
}
