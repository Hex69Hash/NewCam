import { useRef, useCallback } from 'react';
import type { ReferenceTransform } from '../types';

interface TouchPoint {
  clientX: number;
  clientY: number;
}

interface GestureOptions {
  transform: ReferenceTransform;
  setTransform: React.Dispatch<React.SetStateAction<ReferenceTransform>>;
  enabled: boolean;
}

export function useGesture({ transform, setTransform, enabled }: GestureOptions) {
  const isDraggingRef = useRef(false);
  const startPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialTransformRef = useRef<ReferenceTransform>(transform);

  // Multi-touch tracking
  const touchStateRef = useRef<{
    startDist: number;
    startAngle: number;
    startScale: number;
    startRotation: number;
    touchCount: number;
  }>({
    startDist: 0,
    startAngle: 0,
    startScale: 1,
    startRotation: 0,
    touchCount: 0,
  });

  const getDistance = (t1: TouchPoint, t2: TouchPoint) => {
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    return Math.hypot(dx, dy);
  };

  const getAngle = (t1: TouchPoint, t2: TouchPoint) => {
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };

  // Pointer / Mouse events for single-touch / mouse drag
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return;
      // If it's a mouse event or 1 touch
      isDraggingRef.current = true;
      startPointerRef.current = { x: e.clientX, y: e.clientY };
      initialTransformRef.current = { ...transform };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [enabled, transform]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current || !enabled) return;
      // If touch is handling 2 fingers, don't drag via pointer
      if (touchStateRef.current.touchCount > 1) return;

      const dx = e.clientX - startPointerRef.current.x;
      const dy = e.clientY - startPointerRef.current.y;

      setTransform((prev) => ({
        ...prev,
        x: initialTransformRef.current.x + dx,
        y: initialTransformRef.current.y + dy,
      }));
    },
    [enabled, setTransform]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        try {
          (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
        } catch {
          // Ignore
        }
      }
    },
    []
  );

  // Wheel zoom on desktop
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!enabled) return;
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setTransform((prev) => ({
        ...prev,
        scale: Math.max(0.15, Math.min(6.0, Number((prev.scale * zoomFactor).toFixed(3)))),
      }));
    },
    [enabled, setTransform]
  );

  // Multi-touch gestures: Pinch to zoom and Rotate
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      const touches = e.touches;
      touchStateRef.current.touchCount = touches.length;

      if (touches.length === 2) {
        // Pinch & Rotate gesture start
        const dist = getDistance(touches[0], touches[1]);
        const angle = getAngle(touches[0], touches[1]);
        touchStateRef.current.startDist = dist;
        touchStateRef.current.startAngle = angle;
        touchStateRef.current.startScale = transform.scale;
        touchStateRef.current.startRotation = transform.rotation;
      } else if (touches.length === 1) {
        startPointerRef.current = { x: touches[0].clientX, y: touches[0].clientY };
        initialTransformRef.current = { ...transform };
        isDraggingRef.current = true;
      }
    },
    [enabled, transform]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      const touches = e.touches;
      touchStateRef.current.touchCount = touches.length;

      if (touches.length === 2) {
        e.preventDefault(); // Stop native page pinch
        const currentDist = getDistance(touches[0], touches[1]);
        const currentAngle = getAngle(touches[0], touches[1]);

        const scaleRatio = currentDist / (touchStateRef.current.startDist || 1);
        const newScale = Math.max(
          0.15,
          Math.min(6.0, Number((touchStateRef.current.startScale * scaleRatio).toFixed(3)))
        );

        const angleDelta = currentAngle - touchStateRef.current.startAngle;
        const newRotation = Math.round((touchStateRef.current.startRotation + angleDelta) % 360);

        setTransform((prev) => ({
          ...prev,
          scale: newScale,
          rotation: newRotation,
        }));
      } else if (touches.length === 1 && isDraggingRef.current) {
        const dx = touches[0].clientX - startPointerRef.current.x;
        const dy = touches[0].clientY - startPointerRef.current.y;

        setTransform((prev) => ({
          ...prev,
          x: initialTransformRef.current.x + dx,
          y: initialTransformRef.current.y + dy,
        }));
      }
    },
    [enabled, setTransform]
  );

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    touchStateRef.current.touchCount = e.touches.length;
    if (e.touches.length === 0) {
      isDraggingRef.current = false;
    }
  }, []);

  return {
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onWheel,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel: onTouchEnd,
    },
  };
}
