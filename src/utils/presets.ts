import type { ReferenceImage } from '../types';

function createSvgDataUrl(svgContent: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent.trim())}`;
}

// 1. Classic Portrait Headshot
const portraitSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0.05"/>
    </linearGradient>
  </defs>
  <!-- Background border -->
  <rect x="10" y="10" width="580" height="780" rx="24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="8 8" opacity="0.4"/>
  
  <!-- Eye line guide -->
  <line x1="120" y1="280" x2="480" y2="280" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4 4" opacity="0.8"/>
  <text x="300" y="270" text-anchor="middle" fill="#f59e0b" font-family="sans-serif" font-size="14" font-weight="bold" letter-spacing="1">EYE LEVEL</text>
  
  <!-- Head silhouette -->
  <ellipse cx="300" cy="270" rx="110" ry="145" fill="url(#grad1)" stroke="#38bdf8" stroke-width="3.5"/>
  
  <!-- Eyes guides -->
  <circle cx="250" cy="280" r="10" fill="none" stroke="#38bdf8" stroke-width="2"/>
  <circle cx="350" cy="280" r="10" fill="none" stroke="#38bdf8" stroke-width="2"/>
  
  <!-- Nose & Mouth cues -->
  <line x1="300" y1="305" x2="300" y2="335" stroke="#38bdf8" stroke-width="2"/>
  <path d="M 275 365 Q 300 375 325 365" fill="none" stroke="#38bdf8" stroke-width="2"/>
  
  <!-- Neck and Shoulders -->
  <path d="M 260 410 C 255 460 210 500 130 550 L 110 770 L 490 770 L 470 550 C 390 500 345 460 340 410" 
        fill="url(#grad1)" stroke="#38bdf8" stroke-width="3"/>
  
  <!-- Center Axis -->
  <line x1="300" y1="60" x2="300" y2="740" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="6 6" opacity="0.35"/>
  <text x="300" y="750" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="13" font-weight="600">HEADSHOT COMPOSITION</text>
</svg>
`;

// 2. Full-Body Pose Guide
const fullBodySvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900">
  <defs>
    <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ec4899" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.05"/>
    </linearGradient>
  </defs>
  <!-- Frame -->
  <rect x="15" y="15" width="570" height="870" rx="20" fill="none" stroke="#ec4899" stroke-width="2" stroke-dasharray="6 6" opacity="0.4"/>
  
  <!-- Head -->
  <ellipse cx="300" cy="130" rx="45" ry="60" fill="url(#grad2)" stroke="#ec4899" stroke-width="3"/>
  
  <!-- Neck & Torso -->
  <path d="M 285 190 L 315 190 L 345 280 L 335 440 L 265 440 L 255 280 Z" fill="url(#grad2)" stroke="#ec4899" stroke-width="3"/>
  
  <!-- Arms pose (hand on hip fashion pose) -->
  <path d="M 255 280 L 200 340 L 265 390" fill="none" stroke="#ec4899" stroke-width="3" stroke-linecap="round"/>
  <path d="M 345 280 L 390 350 L 370 480" fill="none" stroke="#ec4899" stroke-width="3" stroke-linecap="round"/>
  
  <!-- Legs (slight crossing pose) -->
  <path d="M 275 440 L 270 630 L 265 820" fill="none" stroke="#ec4899" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M 325 440 L 320 630 L 335 820" fill="none" stroke="#ec4899" stroke-width="3.5" stroke-linecap="round"/>
  
  <!-- Feet baseline -->
  <line x1="160" y1="835" x2="440" y2="835" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4 4"/>
  <text x="300" y="860" text-anchor="middle" fill="#ec4899" font-family="sans-serif" font-size="13" font-weight="700">FULL BODY OUTFIT POSE</text>
</svg>
`;

// 3. Golden Ratio & Rule of Thirds
const goldenRatioSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
  <!-- Rule of thirds lines -->
  <line x1="200" y1="0" x2="200" y2="800" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="6 6" opacity="0.6"/>
  <line x1="400" y1="0" x2="400" y2="800" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="6 6" opacity="0.6"/>
  <line x1="0" y1="267" x2="600" y2="267" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="6 6" opacity="0.6"/>
  <line x1="0" y1="533" x2="600" y2="533" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="6 6" opacity="0.6"/>

  <!-- Intersection power points -->
  <circle cx="200" cy="267" r="16" fill="none" stroke="#f59e0b" stroke-width="3"/>
  <circle cx="200" cy="267" r="5" fill="#f59e0b"/>
  <circle cx="400" cy="267" r="16" fill="none" stroke="#f59e0b" stroke-width="3"/>
  <circle cx="400" cy="267" r="5" fill="#f59e0b"/>
  <circle cx="200" cy="533" r="16" fill="none" stroke="#f59e0b" stroke-width="3"/>
  <circle cx="200" cy="533" r="5" fill="#f59e0b"/>
  <circle cx="400" cy="533" r="16" fill="none" stroke="#f59e0b" stroke-width="3"/>
  <circle cx="400" cy="533" r="5" fill="#f59e0b"/>

  <!-- Dynamic composition spiral -->
  <path d="M 600 800 A 600 600 0 0 1 0 200 A 370 370 0 0 1 370 0 A 230 230 0 0 1 600 230 A 140 140 0 0 1 460 370 A 90 90 0 0 1 370 280" 
        fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" opacity="0.75"/>
  <text x="300" y="760" text-anchor="middle" fill="#10b981" font-family="sans-serif" font-size="14" font-weight="700">GOLDEN RATIO SPIRAL</text>
</svg>
`;

// 4. Duo / Couple Composition
const duoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700" width="600" height="700">
  <defs>
    <linearGradient id="duoGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#a855f7" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.05"/>
    </linearGradient>
  </defs>
  <!-- Person 1 (Left, slightly taller) -->
  <ellipse cx="210" cy="220" rx="75" ry="95" fill="url(#duoGrad)" stroke="#a855f7" stroke-width="3"/>
  <path d="M 180 315 C 160 360 120 400 60 450 L 50 640 L 260 640 L 250 420 C 230 380 220 330 215 315" 
        fill="url(#duoGrad)" stroke="#a855f7" stroke-width="2.5"/>

  <!-- Person 2 (Right, leaning in) -->
  <ellipse cx="390" cy="250" rx="70" ry="90" fill="url(#duoGrad)" stroke="#ec4899" stroke-width="3"/>
  <path d="M 360 340 C 340 380 290 420 250 450 L 260 640 L 550 640 L 530 460 C 470 410 430 370 420 340" 
        fill="url(#duoGrad)" stroke="#ec4899" stroke-width="2.5"/>

  <!-- Connection / Heart cue -->
  <circle cx="300" cy="270" r="12" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="3 3"/>
  <text x="300" y="670" text-anchor="middle" fill="#cbd5e1" font-family="sans-serif" font-size="14" font-weight="700">COUPLE / DUO PORTRAIT</text>
</svg>
`;

export const PRESET_REFERENCES: ReferenceImage[] = [
  {
    id: 'preset-portrait',
    name: 'Portrait Headshot',
    src: createSvgDataUrl(portraitSvg),
    aspectRatio: 3 / 4,
    isPreset: true,
  },
  {
    id: 'preset-full-body',
    name: 'Full Body Pose',
    src: createSvgDataUrl(fullBodySvg),
    aspectRatio: 2 / 3,
    isPreset: true,
  },
  {
    id: 'preset-golden-ratio',
    name: 'Golden Ratio Grid',
    src: createSvgDataUrl(goldenRatioSvg),
    aspectRatio: 3 / 4,
    isPreset: true,
  },
  {
    id: 'preset-duo',
    name: 'Couple / Duo Pose',
    src: createSvgDataUrl(duoSvg),
    aspectRatio: 6 / 7,
    isPreset: true,
  },
];
