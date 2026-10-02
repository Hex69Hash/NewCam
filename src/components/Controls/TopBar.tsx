import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { TimerDuration, ReferenceTransform } from '../../types';
import { Timer, Grid3X3, MoreHorizontal, Zap, ZapOff, RotateCcw } from 'lucide-react';
import { triggerHaptic } from '../../utils/audio';

interface TopBarProps {
  timer: TimerDuration;
  setTimer: (timer: TimerDuration) => void;
  showGrid: boolean;
  setShowGrid: React.Dispatch<React.SetStateAction<boolean>>;
  hasTorch: boolean;
  torchOn: boolean;
  onToggleTorch: () => void;
  isSimulated: boolean;
  referenceTransform: ReferenceTransform;
  hasReference: boolean;
  onResetTransform: () => void;
  onNotify: (msg: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  timer,
  setTimer,
  showGrid,
  setShowGrid,
  hasTorch,
  torchOn,
  onToggleTorch,
  isSimulated,
  referenceTransform,
  hasReference,
  onResetTransform,
  onNotify,
}) => {
  const [activeMenu, setActiveMenu] = useState<'timer' | 'more' | null>(null);
  const autoCloseTimerRef = useRef<number | null>(null);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-close menu after 3s of inactivity
  const resetMenuInactivityTimer = useCallback(() => {
    if (autoCloseTimerRef.current) {
      window.clearTimeout(autoCloseTimerRef.current);
    }
    autoCloseTimerRef.current = window.setTimeout(() => {
      setActiveMenu(null);
    }, 3000);
  }, []);

  useEffect(() => {
    if (activeMenu) {
      resetMenuInactivityTimer();
    } else {
      if (autoCloseTimerRef.current) {
        window.clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
    }
    return () => {
      if (autoCloseTimerRef.current) {
        window.clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, [activeMenu, resetMenuInactivityTimer]);

  const handleTimerClick = () => {
    triggerHaptic('light');
    setActiveMenu((prev) => (prev === 'timer' ? null : 'timer'));
  };

  const handleSelectTimer = (duration: TimerDuration) => {
    triggerHaptic('light');
    setTimer(duration);
    setActiveMenu(null);
    onNotify(duration === 0 ? 'Timer Off' : `Timer ${duration}s`);
  };

  const handleGridClick = () => {
    triggerHaptic('light');
    setShowGrid((prev) => {
      const next = !prev;
      onNotify(next ? 'Grid On' : 'Grid Off');
      return next;
    });
    setActiveMenu(null);
  };

  const handleMoreClick = () => {
    triggerHaptic('light');
    setActiveMenu((prev) => (prev === 'more' ? null : 'more'));
  };

  const handleTorchToggle = () => {
    triggerHaptic('light');
    onToggleTorch();
    setActiveMenu(null);
    onNotify(!torchOn ? 'Torch On' : 'Torch Off');
  };

  const handleReset = () => {
    triggerHaptic('medium');
    onResetTransform();
    setActiveMenu(null);
    onNotify('Reference Reset');
  };

  const isTransformModified =
    hasReference &&
    (referenceTransform.x !== 0 ||
      referenceTransform.y !== 0 ||
      referenceTransform.scale !== 1 ||
      referenceTransform.rotation !== 0 ||
      referenceTransform.flipped);

  return (
    <header className="camera-topbar safe-top" aria-label="Camera Controls Bar" ref={menuContainerRef}>
      {/* Left: Minimal, Unobtrusive Branding */}
      <div className="topbar-left">
        <span className="brand-minimal">RefCam</span>
        {isSimulated && <span className="demo-dot-badge" title="Demo Mode" />}
      </div>

      {/* Right: Small Circular Minimal Controls */}
      <div className="topbar-right">
        {/* Grid Button */}
        <button
          type="button"
          className={`top-circle-btn ${showGrid ? 'active' : ''}`}
          onClick={handleGridClick}
          title={showGrid ? 'Hide Grid' : 'Show Grid'}
          aria-label="Toggle Composition Grid"
        >
          <Grid3X3 size={17} />
        </button>

        {/* Timer Button */}
        <div className="top-control-anchor">
          <button
            type="button"
            className={`top-circle-btn ${timer > 0 ? 'active' : ''} ${activeMenu === 'timer' ? 'menu-open' : ''}`}
            onClick={handleTimerClick}
            title={`Timer: ${timer === 0 ? 'Off' : `${timer}s`}`}
            aria-label={`Timer: ${timer === 0 ? 'Off' : `${timer}s`}`}
          >
            <Timer size={17} />
            {timer > 0 && <span className="timer-active-tag">{timer}s</span>}
          </button>

          {/* Contextual Timer Dropdown */}
          {activeMenu === 'timer' && (
            <div
              className="top-popover-menu timer-popover animate-fade-in"
              onPointerDown={resetMenuInactivityTimer}
            >
              {([0, 3, 5, 10] as TimerDuration[]).map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`menu-option-chip ${timer === val ? 'active' : ''}`}
                  onClick={() => handleSelectTimer(val)}
                >
                  {val === 0 ? 'Off' : `${val}s`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* More Settings Button */}
        <div className="top-control-anchor">
          <button
            type="button"
            className={`top-circle-btn ${activeMenu === 'more' ? 'menu-open' : ''}`}
            onClick={handleMoreClick}
            title="More Options"
            aria-label="More Camera Options"
          >
            <MoreHorizontal size={17} />
          </button>

          {/* Contextual More Dropdown */}
          {activeMenu === 'more' && (
            <div
              className="top-popover-menu more-popover animate-fade-in"
              onPointerDown={resetMenuInactivityTimer}
            >
              {hasTorch && (
                <button
                  type="button"
                  className="popover-row-btn"
                  onClick={handleTorchToggle}
                >
                  {torchOn ? <Zap size={16} className="text-amber-400" /> : <ZapOff size={16} />}
                  <span>{torchOn ? 'Torch On' : 'Torch Off'}</span>
                </button>
              )}

              {isTransformModified && (
                <button
                  type="button"
                  className="popover-row-btn"
                  onClick={handleReset}
                >
                  <RotateCcw size={16} />
                  <span>Reset Reference</span>
                </button>
              )}

              <div className="popover-info-note">
                <span>1-finger drag • 2-finger zoom/rotate</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
