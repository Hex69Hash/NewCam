import React, { useState } from 'react';
import type { CameraPermissionStatus } from '../../types';
import { Camera, AlertCircle, HelpCircle, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { triggerHaptic } from '../../utils/audio';

interface PermissionModalProps {
  status: CameraPermissionStatus;
  errorMessage: string | null;
  onRequestPermission: () => void;
  onEnableSimulation: () => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  status,
  errorMessage,
  onRequestPermission,
  onEnableSimulation,
}) => {
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  // If granted or simulated, don't show
  if (status === 'granted' || status === 'simulated') return null;

  const isDenied = status === 'denied' || status === 'unsupported';

  return (
    <div className="permission-overlay" role="dialog" aria-modal="true">
      <div className="permission-card animate-scale-in">
        <div className={`permission-icon-circle ${isDenied ? 'denied' : ''}`}>
          {isDenied ? <AlertCircle size={36} /> : <Camera size={36} />}
        </div>

        <h2 className="permission-title">
          {isDenied ? 'Camera Access Needed' : 'Enable Camera'}
        </h2>

        <p className="permission-description">
          {isDenied
            ? errorMessage ||
              'RefCam was unable to access your camera. You can retry permissions or switch to demo simulation mode.'
            : 'Camera access is needed to overlay reference photos onto your live camera feed so you can align poses and composition.'}
        </p>

        <div className="permission-actions">
          <button
            type="button"
            className="btn-primary-enable"
            onClick={() => {
              triggerHaptic('medium');
              onRequestPermission();
            }}
          >
            <Camera size={20} />
            <span>{isDenied ? 'Retry Camera Access' : 'Allow Camera'}</span>
          </button>

          <button
            type="button"
            className="btn-secondary-sim"
            onClick={() => {
              triggerHaptic('light');
              onEnableSimulation();
            }}
          >
            <Play size={18} />
            <span>Try Interactive Demo Mode</span>
          </button>
        </div>

        {/* Browser specific help guide */}
        {isDenied && (
          <div className="troubleshoot-accordion">
            <button
              type="button"
              className="troubleshoot-toggle"
              onClick={() => setShowTroubleshoot((prev) => !prev)}
            >
              <HelpCircle size={16} />
              <span>How to enable camera permissions</span>
              {showTroubleshoot ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showTroubleshoot && (
              <div className="troubleshoot-content animate-fade">
                <div className="guide-item">
                  <strong>iOS Safari:</strong> Tap the <em>aA</em> icon or page settings in the URL bar &rarr; Website Settings &rarr; set Camera to <strong>Allow</strong>.
                </div>
                <div className="guide-item">
                  <strong>Chrome &amp; Android:</strong> Tap the lock / tune icon in the address bar &rarr; Permissions &rarr; Camera &rarr; <strong>Allow</strong>.
                </div>
                <div className="guide-item">
                  <strong>Desktop:</strong> Check that your webcam is connected and not currently used by another application.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
