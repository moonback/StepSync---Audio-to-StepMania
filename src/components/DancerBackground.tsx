import React, { useRef, useEffect, useCallback } from 'react';

// ─── StepMania / ITG Color Palette ───────────────────────
// Quantization colors (beat subdivision)
const QUANT_COLORS: Record<number, { fill: string; dark: string; shine: string }> = {
  1: { fill: '#ec1c24', dark: '#8b0000', shine: '#ff8888' }, // 4th  - red
  2: { fill: '#1e90ff', dark: '#00008b', shine: '#88ccff' }, // 8th  - blue
  3: { fill: '#aa00ff', dark: '#550080', shine: '#dd88ff' }, // 12th - purple
  4: { fill: '#ffdd00', dark: '#886600', shine: '#ffee88' }, // 16th - yellow
  6: { fill: '#ff6600', dark: '#883300', shine: '#ffaa88' }, // 24th - orange
  8: { fill: '#00cc44', dark: '#005522', shine: '#88ffaa' }, // 32nd - green
  12: { fill: '#cc00aa', dark: '#660055', shine: '#ff88dd' }, // 48th - pink
  16: { fill: '#00cccc', dark: '#006666', shine: '#88ffff' }, // 64th - cyan
};

// Arrow directions: L D U R (ITG/SM standard)
const DIRS = ['left', 'down', 'up', 'right'] as const;
type Dir = typeof DIRS[number];

// Rotation per direction (arrow points UP by default; canvas rotates clockwise)
const DIR_ROTATION: Record<Dir, number> = {
  left: -90,
  down: 180,
  up: 0,
  right: 90,
};

// ─── Arrow SVG path (StepMania style: chunky with notch) ──
function buildArrowPath(cx: number, cy: number, size: number): string {
  const s = size;
  const h = s * 0.5;
  const n = s * 0.28; // notch depth
  // Arrow pointing UP, centered at cx, cy
  // Tip at top, two "wing" corners, notched bottom
  return [
    `M ${cx} ${cy - h * 1.05}`,           // tip
    `L ${cx + h} ${cy + n * 0.2}`,        // right wing outer
    `L ${cx + h * 0.55} ${cy + n * 0.2}`, // right inner top
    `L ${cx + h * 0.55} ${cy + h}`,       // right inner bottom
    `L ${cx - h * 0.55} ${cy + h}`,       // left inner bottom
    `L ${cx - h * 0.55} ${cy + n * 0.2}`, // left inner top
    `L ${cx - h} ${cy + n * 0.2}`,        // left wing outer
    `Z`,
  ].join(' ');
}

// ─── Note types ───────────────────────────────────────────
type NoteType = 'tap' | 'hold_head' | 'hold_body' | 'hold_tail' | 'mine';

interface Note {
  id: string;
  col: number;
  beat: number;       // beat position (float)
  quantDiv: number;   // 1=4th, 2=8th, 4=16th, etc.
  type: NoteType;
  holdEndBeat?: number;
}

// ─── Generate a realistic SM chart ───────────────────────
function generateChart(totalBeats: number): Note[] {
  const notes: Note[] = [];
  let id = 0;

  // Patterns typical in StepMania: runs, holds, jumps, streams
  // Simplified and reduced density
  const patterns = [
    // 8th note small stream (4 notes)
    (startBeat: number, col: number) => {
      for (let i = 0; i < 4; i++) {
        notes.push({ id: `${id++}`, col: (col + i) % 4, beat: startBeat + i * 0.5, quantDiv: 2, type: 'tap' });
      }
    },
    // Single Jump (two cols same beat)
    (startBeat: number, col: number) => {
      const c1 = col % 4, c2 = (col + 2) % 4;
      notes.push({ id: `${id++}`, col: c1, beat: startBeat, quantDiv: 1, type: 'tap' });
      notes.push({ id: `${id++}`, col: c2, beat: startBeat, quantDiv: 1, type: 'tap' });
    },
    // Single Note
    (startBeat: number, col: number) => {
      notes.push({ id: `${id++}`, col: col % 4, beat: startBeat, quantDiv: 1, type: 'tap' });
    },
    // Slow 4th note pattern (2 notes)
    (startBeat: number, col: number) => {
      for (let i = 0; i < 2; i++) {
        notes.push({ id: `${id++}`, col: (col + i * 2) % 4, beat: startBeat + i, quantDiv: 1, type: 'tap' });
      }
    }
  ];

  let beat = 2;
  let colCursor = 0;
  while (beat < totalBeats - 4) {
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    pattern(beat, colCursor);
    colCursor = (colCursor + 1 + Math.floor(Math.random() * 3)) % 4;
    // Add significant space between patterns so the screen isn't overwhelmed
    beat += 3 + Math.floor(Math.random() * 5);
  }

  return notes.sort((a, b) => a.beat - b.beat);
}

// ─── Main Canvas Renderer ─────────────────────────────────
interface LaneConfig {
  x: number;
  noteWidth: number;
  receptorY: number;
  scrollDir: 'up'; // SM default: notes scroll upward
}

const BPM = 105;
const BEATS_PER_SEC = BPM / 60;
const PIXELS_PER_BEAT = 110; // faster, stiffer scroll speed

// Color per column (L=red, D=blue, U=green, R=yellow) — ITG standard
const COL_COLORS = [
  { fill: '#ee2222', dark: '#7a0000', shine: '#ff9999', mid: '#cc1111' }, // L - red
  { fill: '#2299ff', dark: '#003a80', shine: '#99ccff', mid: '#1166cc' }, // D - blue
  { fill: '#22cc55', dark: '#005520', shine: '#99ffbb', mid: '#119933' }, // U - green
  { fill: '#ffcc00', dark: '#664400', shine: '#ffee88', mid: '#cc9900' }, // R - yellow
];

function drawArrow(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number,
  dir: Dir,
  col: number,
  alpha: number = 1,
  isReceptor: boolean = false,
) {
  const rotation = (DIR_ROTATION[dir] * Math.PI) / 180;
  const colors = COL_COLORS[col];

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  const h = size * 0.5;
  const path = new Path2D();
  path.moveTo(0, -h * 1.05);
  path.lineTo(h, h * 0.28 * 0.2);
  path.lineTo(h * 0.55, h * 0.28 * 0.2);
  path.lineTo(h * 0.55, h);
  path.lineTo(-h * 0.55, h);
  path.lineTo(-h * 0.55, h * 0.28 * 0.2);
  path.lineTo(-h, h * 0.28 * 0.2);
  path.closePath();

  if (isReceptor) {
    // Dark receptor with outline (SM style)
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fill(path);
    ctx.strokeStyle = colors.fill;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = alpha * 0.55;
    ctx.stroke(path);

    // Inner dim arrow shape
    ctx.globalAlpha = alpha * 0.18;
    ctx.fillStyle = colors.fill;
    ctx.fill(path);
  } else {
    // Main fill gradient
    const grad = ctx.createLinearGradient(-h, -h, h, h);
    grad.addColorStop(0, colors.shine);
    grad.addColorStop(0.35, colors.fill);
    grad.addColorStop(0.7, colors.mid);
    grad.addColorStop(1, colors.dark);
    ctx.fillStyle = grad;
    ctx.fill(path);

    // Black outline
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.lineWidth = 2;
    ctx.stroke(path);

    // Shine overlay (top-left highlight)
    const shineGrad = ctx.createLinearGradient(-h * 0.8, -h * 0.8, 0, 0);
    shineGrad.addColorStop(0, 'rgba(255,255,255,0.55)');
    shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shineGrad;
    ctx.globalAlpha = alpha * 0.7;
    ctx.fill(path);

    // Dark vignette on outer edge
    ctx.strokeStyle = colors.dark;
    ctx.lineWidth = 1;
    ctx.globalAlpha = alpha * 0.4;
    ctx.stroke(path);
  }

  ctx.restore();
}

function drawMine(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number,
  alpha: number,
  time: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.rotate(time * 3);

  const r = size * 0.42;
  const spikes = 8;

  // Outer spiky ring
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.62;
    if (i === 0) ctx.moveTo(Math.cos(angle) * rad, Math.sin(angle) * rad);
    else ctx.lineTo(Math.cos(angle) * rad, Math.sin(angle) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = '#cc0000';
  ctx.fill();
  ctx.strokeStyle = '#ff4444';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Inner circle
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
  ctx.fillStyle = '#440000';
  ctx.fill();
  ctx.strokeStyle = '#ff2222';
  ctx.lineWidth = 1;
  ctx.stroke();

  // M label
  ctx.fillStyle = '#ff4444';
  ctx.font = `bold ${size * 0.3}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('M', 0, 0);

  ctx.restore();
}

function drawHoldBody(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  bottomY: number,
  size: number,
  col: number,
  active: boolean,
) {
  const colors = COL_COLORS[col];
  const w = size * 0.55;

  // Body gradient
  const grad = ctx.createLinearGradient(cx - w, 0, cx + w, 0);
  grad.addColorStop(0, active ? colors.shine : colors.dark);
  grad.addColorStop(0.3, active ? colors.fill : colors.mid + '88');
  grad.addColorStop(0.5, active ? colors.mid : colors.dark + '66');
  grad.addColorStop(0.7, active ? colors.fill : colors.mid + '88');
  grad.addColorStop(1, active ? colors.shine : colors.dark);

  ctx.save();
  ctx.globalAlpha = active ? 0.95 : 0.55;
  ctx.fillStyle = grad;
  ctx.fillRect(cx - w, topY, w * 2, bottomY - topY);

  // Center stripe (SM-style highlight)
  ctx.fillStyle = active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)';
  ctx.fillRect(cx - w * 0.18, topY, w * 0.36, bottomY - topY);

  // Side borders
  ctx.strokeStyle = active ? colors.shine : colors.dark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - w, topY); ctx.lineTo(cx - w, bottomY);
  ctx.moveTo(cx + w, topY); ctx.lineTo(cx + w, bottomY);
  ctx.stroke();

  // Tail cap
  ctx.beginPath();
  ctx.ellipse(cx, bottomY, w, w * 0.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = active ? colors.mid : colors.dark;
  ctx.fill();
  ctx.strokeStyle = active ? colors.fill : colors.dark;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

// ─── Score Container ──────────────────────────────────────
function drawScore(ctx: CanvasRenderingContext2D, cx: number, cy: number, score: number, size: number) {
  const scoreStr = Math.floor(score).toString().padStart(9, '0');
  const formattedScore = scoreStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  ctx.save();
  ctx.translate(cx, cy);

  // Hexagon/Diamond container
  const w = size * 4;
  const h = size * 1.1;

  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.lineTo(-w / 2 + h / 2, -h / 2);
  ctx.lineTo(w / 2 - h / 2, -h / 2);
  ctx.lineTo(w / 2, 0);
  ctx.lineTo(w / 2 - h / 2, h / 2);
  ctx.lineTo(-w / 2 + h / 2, h / 2);
  ctx.closePath();

  // Gradient fill
  const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  grad.addColorStop(0, '#0f172a'); // slate-900
  grad.addColorStop(0.5, '#1e3a8a'); // blue-900
  grad.addColorStop(1, '#020617'); // slate-950
  ctx.fillStyle = grad;
  ctx.fill();

  // Glow / Border
  ctx.strokeStyle = '#38bdf8'; // sky-400
  ctx.lineWidth = 2;
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 10;
  ctx.stroke();

  // Score Text
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#e0f2fe'; // sky-100
  ctx.font = `bold ${size * 0.6}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(formattedScore, 0, 1);

  ctx.restore();
}

// ─── Beat explosion effect ────────────────────────────────
interface Explosion {
  col: number;
  x: number;
  y: number;
  birth: number;
  col_idx: number;
}

// ─── The actual component ─────────────────────────────────
export function StepManiaBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startTime = useRef(performance.now());
  const notesRef = useRef<Note[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const lastBeatRef = useRef(-1);

  // Bubble physics state
  const bubblesRef = useRef<(HTMLDivElement | null)[]>([]);
  const bubblesState = useRef([
    { x: 50, y: 50, vx: 120, vy: 90, text: "Special Stepmania", size: "text-lg md:text-xl" },
    { x: 300, y: 150, vx: -140, vy: 110, text: "Gratuit", size: "text-sm md:text-base" },
    { x: 100, y: 400, vx: 100, vy: -130, text: "Auto-Sync", size: "text-sm md:text-base" },
    { x: 500, y: 300, vx: -110, vy: -150, text: "BPM Auto", size: "text-sm md:text-base" },
    { x: 700, y: 100, vx: 130, vy: 160, text: "Multi-Mode", size: "text-sm md:text-base" },
  ]);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    // Generate a very long chart so it never ends
    notesRef.current = generateChart(10000);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const now = performance.now();
    const dt = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;
    const elapsed = (now - startTime.current) / 1000;

    // Current beat position (continuous)
    const currentBeat = (elapsed * BEATS_PER_SEC);

    // Update Bubble positions
    bubblesState.current.forEach((state, i) => {
      const el = bubblesRef.current[i];
      if (el) {
        const bubbleW = el.offsetWidth || 200;
        const bubbleH = el.offsetHeight || 80;

        state.x += state.vx * dt;
        state.y += state.vy * dt;

        if (state.x <= 0) { state.x = 0; state.vx *= -1; }
        if (state.x + bubbleW >= W) { state.x = W - bubbleW; state.vx *= -1; }
        if (state.y <= 0) { state.y = 0; state.vy *= -1; }
        if (state.y + bubbleH >= H) { state.y = H - bubbleH; state.vy *= -1; }

        el.style.transform = `translate(${state.x}px, ${state.y}px)`;
      }
    });

    ctx.clearRect(0, 0, W, H);

    // ── Background: dark gradient ────────────────────────
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#000005');
    bg.addColorStop(0.4, '#02050f');
    bg.addColorStop(1, '#000008');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ── Determine how many lanes and their layout ────────
    // 2 players spread across the full width
    const noteSize = Math.min(52, Math.max(36, W / 14));
    const laneSpacing = noteSize + 8;
    const laneGroupW = laneSpacing * 4;

    // Push the playfield down so the score is clear of the header
    const receptorY = Math.max(160, H * 0.34);

    // Player 1 on the left side, Player 2 on the right side
    const edgeMargin = noteSize * 1.5;
    const players: { xStart: number; beatOffset: number }[] = [
      { xStart: edgeMargin, beatOffset: 0 },
      { xStart: W - laneGroupW - edgeMargin + laneSpacing, beatOffset: 8 },
    ];

    players.forEach(({ xStart }, pIdx) => {
      // ── Draw Simulated Score ─────────────────────────
      const centerX = xStart + 1.5 * laneSpacing;
      const scoreY = receptorY - noteSize * 1.8;
      // Start with base scores ending in 0
      const baseScore = pIdx === 0 ? 58278130 : 46791560;
      
      // Count how many notes have actually passed the receptor
      let notesPassed = 0;
      for (const note of notesRef.current) {
        if (note.beat <= currentBeat) {
          notesPassed++;
        } else {
          break; // Notes are sorted, so we can stop counting early
        }
      }
      
      const pointsPerHit = pIdx === 0 ? 3250 : 3120;
      const currentScore = baseScore + (notesPassed * pointsPerHit);
      drawScore(ctx, centerX, scoreY, currentScore, noteSize);

      // ── Beat line / measure grid ─────────────────────
      for (let b = 0; b <= 16; b += 0.25) {
        const beatDist = b - (currentBeat % 16);
        const y = receptorY + beatDist * PIXELS_PER_BEAT;
        if (y < 0 || y > H) continue;

        const isBar = b % 4 === 0;
        const isBeat = b % 1 === 0;
        ctx.save();
        ctx.globalAlpha = isBar ? 0.35 : isBeat ? 0.18 : 0.07;
        ctx.strokeStyle = isBar ? '#ffffff' : '#8888cc';
        ctx.lineWidth = isBar ? 1.5 : 0.75;
        ctx.setLineDash(isBar ? [] : [3, 4]);
        ctx.beginPath();
        ctx.moveTo(xStart - laneSpacing * 0.5, y);
        ctx.lineTo(xStart + laneGroupW - laneSpacing * 0.5, y);
        ctx.stroke();
        ctx.restore();
      }

      // ── Lane separators ──────────────────────────────
      for (let col = 0; col <= 4; col++) {
        const lx = xStart + col * laneSpacing - laneSpacing * 0.5;
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.strokeStyle = '#6666aa';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lx, 0); ctx.lineTo(lx, H);
        ctx.stroke();
        ctx.restore();
      }

      // ── Draw hold bodies BELOW notes ────────────────
      notesRef.current.forEach((note) => {
        if (note.type !== 'hold_head' || note.holdEndBeat == null) return;
        const beatDist = note.beat - currentBeat;
        const endBeatDist = note.holdEndBeat - currentBeat;
        const noteY = receptorY + beatDist * PIXELS_PER_BEAT;
        const endY = receptorY + endBeatDist * PIXELS_PER_BEAT;
        if (noteY > H + noteSize || endY < 0) return;

        const cx = xStart + note.col * laneSpacing;
        const active = beatDist < 0 && endBeatDist > 0;
        const topY = Math.max(0, active ? receptorY : noteY);
        const bottomY = Math.min(H + 20, endY);
        if (bottomY > topY) {
          drawHoldBody(ctx, cx, topY, bottomY, noteSize, note.col, active);
        }
      });

      // ── Draw notes ───────────────────────────────────
      notesRef.current.forEach((note) => {
        const beatDist = note.beat - currentBeat;
        const noteY = receptorY + beatDist * PIXELS_PER_BEAT;
        if (noteY < -noteSize * 2 || noteY > H + noteSize) return;

        const cx = xStart + note.col * laneSpacing;
        const dir = DIRS[note.col];

        if (note.type === 'mine') {
          const alpha = Math.min(1, Math.max(0, 1 - Math.max(0, -beatDist - 0.2) * 8));
          if (alpha > 0) drawMine(ctx, cx, noteY, noteSize, alpha, elapsed);
          return;
        }

        // Fade out notes that have passed
        const passAlpha = beatDist < 0
          ? Math.max(0, 1 + beatDist * 6)
          : 1;
        if (passAlpha <= 0) return;

        drawArrow(ctx, cx, noteY, noteSize, dir, note.col, passAlpha);
      });

      // ── Receptors ────────────────────────────────────
      // Beat flash: receptors pulse on each beat
      const beatPhase = currentBeat % 1;
      const beatFlash = Math.pow(Math.max(0, 1 - beatPhase * 4), 2);

      DIRS.forEach((dir, col) => {
        const cx = xStart + col * laneSpacing;
        const colors = COL_COLORS[col];

        // Receptor glow on beat
        if (beatFlash > 0.01) {
          ctx.save();
          ctx.globalAlpha = beatFlash * 0.4;
          const glow = ctx.createRadialGradient(cx, receptorY, 0, cx, receptorY, noteSize * 1.2);
          glow.addColorStop(0, colors.fill);
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.fillRect(cx - noteSize * 1.5, receptorY - noteSize * 1.5, noteSize * 3, noteSize * 3);
          ctx.restore();
        }

        drawArrow(ctx, cx, receptorY, noteSize, dir, col, 0.75 + beatFlash * 0.25, true);
      });

      // ── Hit explosions ───────────────────────────────
      explosionsRef.current = explosionsRef.current.filter((exp) => {
        const age = (now - exp.birth) / 1000;
        if (age > 0.4) return false;
        const progress = age / 0.4;
        const alpha = 1 - progress;
        const scale = 1 + progress * 2.5;
        const colors = COL_COLORS[exp.col_idx];

        ctx.save();
        ctx.globalAlpha = alpha * 0.9;
        ctx.translate(exp.x, exp.y);

        // Starburst
        const numRays = 8;
        for (let i = 0; i < numRays; i++) {
          const angle = (i / numRays) * Math.PI * 2;
          const len = noteSize * scale * (0.6 + 0.4 * (i % 2));
          ctx.strokeStyle = i % 2 === 0 ? colors.shine : colors.fill;
          ctx.lineWidth = 3 * (1 - progress);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(angle) * len * 0.3, Math.sin(angle) * len * 0.3);
          ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
          ctx.stroke();
        }

        // Center flash
        ctx.globalAlpha = alpha * 0.7;
        const flashGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, noteSize * scale * 0.7);
        flashGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
        flashGrad.addColorStop(0.3, colors.shine + 'aa');
        flashGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = flashGrad;
        ctx.beginPath();
        ctx.arc(0, 0, noteSize * scale * 0.7, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        return true;
      });

      // ── Auto-hit: trigger explosions on beat ─────────
      const beatInt = Math.floor(currentBeat * 2) / 2; // 8th note resolution
      if (beatInt !== lastBeatRef.current) {
        lastBeatRef.current = beatInt;
        // Find notes near current beat to "hit"
        notesRef.current.forEach((note) => {
          if (Math.abs(note.beat - currentBeat) < 0.5 && note.type === 'tap') {
            explosionsRef.current.push({
              col: note.col,
              x: xStart + note.col * laneSpacing,
              y: receptorY,
              birth: now,
              col_idx: note.col,
            });
          }
        });
      }
    });

    // ── Vignette overlay ─────────────────────────────────
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // ── Top/bottom fade ──────────────────────────────────
    const topFade = ctx.createLinearGradient(0, 0, 0, H * 0.06);
    topFade.addColorStop(0, 'rgba(0,0,0,0.95)');
    topFade.addColorStop(1, 'transparent');
    ctx.fillStyle = topFade;
    ctx.fillRect(0, 0, W, H * 0.06);

    const botFade = ctx.createLinearGradient(0, H * 0.85, 0, H);
    botFade.addColorStop(0, 'transparent');
    botFade.addColorStop(1, 'rgba(0,0,8,0.98)');
    ctx.fillStyle = botFade;
    ctx.fillRect(0, H * 0.85, W, H * 0.15);

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    animRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [draw]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          background: '#000008',
        }}
      />
      {/* Floating Bouncing Bubbles - Discreet Styling */}
      {bubblesState.current.map((bubble, i) => (
        <div
          key={i}
          ref={(el) => { bubblesRef.current[i] = el; }}
          className="absolute top-0 left-0 flex items-center justify-center px-4 py-1.5 rounded-full border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)] bg-indigo-900/10 backdrop-blur-[2px] opacity-40 mix-blend-screen"
          style={{
            willChange: 'transform',
            zIndex: 10
          }}
        >
          <h1
            className={`${bubble.size} font-medium uppercase tracking-widest text-indigo-200/60`}
          >
            {bubble.text}
          </h1>
        </div>
      ))}
    </div>
  );
}