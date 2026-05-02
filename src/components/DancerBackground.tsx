import React, { useRef, useEffect, useCallback } from 'react';

// ─── StepMania / ITG Color Palette (Neon Pro) ───────────
const DIRS = ['left', 'down', 'up', 'right'] as const;
type Dir = typeof DIRS[number];

const DIR_ROTATION: Record<Dir, number> = {
  left: -90,
  down: 180,
  up: 0,
  right: 90,
};

// P1 Colors (Pink/Cyan)
const P1_COLORS = [
  { fill: '#ff2edb', dark: '#4a003e', shine: '#ffffff' }, // Left
  { fill: '#00f5ff', dark: '#004a4d', shine: '#ffffff' }, // Down
  { fill: '#ff2edb', dark: '#4a003e', shine: '#ffffff' }, // Up
  { fill: '#00f5ff', dark: '#004a4d', shine: '#ffffff' }, // Right
];

// P2 Colors (Green/Yellow)
const P2_COLORS = [
  { fill: '#39ff14', dark: '#114d06', shine: '#ffffff' },
  { fill: '#ffe600', dark: '#4d4500', shine: '#ffffff' },
  { fill: '#39ff14', dark: '#114d06', shine: '#ffffff' },
  { fill: '#ffe600', dark: '#4d4500', shine: '#ffffff' },
];

type NoteType = 'tap' | 'mine';

interface Note {
  id: string;
  col: number;
  beat: number;
  type: NoteType;
}

function generateChart(totalBeats: number): Note[] {
  const notes: Note[] = [];
  let id = 0;
  let beat = 4;
  let colCursor = 0;
  
  while (beat < totalBeats - 10) {
    // 4-note stream
    if (Math.random() > 0.5) {
      for (let i = 0; i < 4; i++) {
        notes.push({ id: `${id++}`, col: (colCursor + i) % 4, beat: beat + i * 0.5, type: 'tap' });
      }
      beat += 2;
    } else {
      // Jumps
      const c1 = colCursor % 4, c2 = (colCursor + 2) % 4;
      notes.push({ id: `${id++}`, col: c1, beat: beat, type: 'tap' });
      notes.push({ id: `${id++}`, col: c2, beat: beat, type: 'tap' });
      beat += 1;
    }
    colCursor = (colCursor + 1 + Math.floor(Math.random() * 3)) % 4;
    beat += 3 + Math.floor(Math.random() * 6); // Slower, less dense chart
  }
  return notes.sort((a, b) => a.beat - b.beat);
}

const BPM = 120;
const BEATS_PER_SEC = BPM / 60;
const PIXELS_PER_BEAT = 100; // Slower, more readable scroll

function drawArrow(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number,
  dir: Dir,
  col: number,
  palette: any[],
  alpha: number = 1,
  isReceptor: boolean = false,
  glow: boolean = false
) {
  const rotation = (DIR_ROTATION[dir] * Math.PI) / 180;
  const colors = palette[col];

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  const h = size * 0.5;
  const path = new Path2D();
  path.moveTo(0, -h * 1.1);
  path.lineTo(h, h * 0.1);
  path.lineTo(h * 0.6, h * 0.1);
  path.lineTo(h * 0.6, h);
  path.lineTo(-h * 0.6, h);
  path.lineTo(-h * 0.6, h * 0.1);
  path.lineTo(-h, h * 0.1);
  path.closePath();

  if (glow) {
    ctx.shadowBlur = 20;
    ctx.shadowColor = colors.fill;
  }

  if (isReceptor) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fill(path);
    ctx.strokeStyle = colors.fill;
    ctx.lineWidth = 3;
    ctx.globalAlpha = alpha * 0.7;
    ctx.stroke(path);
    
    // Inner bright ring for receptor
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.globalAlpha = alpha * 0.3;
    ctx.stroke(path);
  } else {
    // Note rendering
    const grad = ctx.createLinearGradient(-h, -h, h, h);
    grad.addColorStop(0, colors.shine);
    grad.addColorStop(0.3, colors.fill);
    grad.addColorStop(1, colors.dark);
    ctx.fillStyle = grad;
    ctx.fill(path);
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = alpha * 0.8;
    ctx.stroke(path);
  }

  ctx.restore();
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface Explosion {
  col: number;
  x: number;
  y: number;
  birth: number;
  pIdx: number;
}

export function StepManiaBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startTime = useRef(performance.now());
  const notesRef = useRef<Note[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastBeatRef = useRef(-1);

  // Dynamic Camera Shake
  const shakeRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    notesRef.current = generateChart(30000); // More notes
  }, []);

  const spawnParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.4 + Math.random() * 0.3,
        color
      });
    }
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const now = performance.now();
    const elapsed = (now - startTime.current) / 1000;
    const currentBeat = (elapsed * BEATS_PER_SEC);
    const beatFraction = currentBeat % 1;

    // --- Camera Shake ---
    // Subtle shake on every beat
    const shakeIntensity = Math.max(0, 1 - beatFraction * 4) * 1.5;
    shakeRef.current = {
      x: (Math.random() - 0.5) * shakeIntensity,
      y: (Math.random() - 0.5) * shakeIntensity
    };

    ctx.save();
    ctx.translate(shakeRef.current.x, shakeRef.current.y);

    // --- Background ---
    ctx.fillStyle = '#010205';
    ctx.fillRect(0, 0, W, H);

    // --- 3D Cyberpunk Grid Floor ---
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.15)'; // Cyan grid
    ctx.lineWidth = 1;
    
    const vpX = W / 2;
    const vpY = H * 0.4;
    
    // Vertical vanishing lines
    ctx.beginPath();
    for (let i = -10; i <= 10; i++) {
      const bottomX = vpX + i * 150;
      ctx.moveTo(vpX, vpY);
      ctx.lineTo(bottomX, H);
    }
    ctx.stroke();

    // Horizontal scrolling lines (perspective math)
    const gridSpeed = (elapsed * 0.8) % 1; // Slower grid
    for (let i = 0; i < 15; i++) {
      const z = i + gridSpeed;
      const y = vpY + (H - vpY) * (z / 15);
      const alpha = Math.min(1, z / 2) * 0.15; // Fade near horizon
      ctx.strokeStyle = `rgba(0, 245, 255, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();


    const isMobile = W < 768;
    const noteSize = isMobile ? 28 : 50;
    const laneSpacing = noteSize + (isMobile ? 4 : 10);
    const highwayW = laneSpacing * 4;
    const receptorY = isMobile ? H * 0.15 : H * 0.25;

    const margin = isMobile ? 5 : 60;
    const players = [
      { id: 'P1', xStart: margin, palette: P1_COLORS, beatOffset: 0 },
      { id: 'P2', xStart: W - highwayW - margin, palette: P2_COLORS, beatOffset: 4 }, // Different phase
    ];

    // --- Versus UI ---
    if (!isMobile) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      // Vertical Separator
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(255, 46, 219, 0)');
      grad.addColorStop(0.5, 'rgba(255, 46, 219, 0.5)');
      grad.addColorStop(1, 'rgba(0, 245, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(W / 2 - 1, 0, 2, H);

      // VERSUS Text
      ctx.font = 'black italic 140px Outfit';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const vsScale = 1 + Math.max(0, 1 - beatFraction * 3) * 0.05; // Pulse scale
      ctx.translate(W / 2, H / 2);
      ctx.scale(vsScale, vsScale);
      
      ctx.shadowBlur = 40;
      ctx.shadowColor = 'rgba(255, 46, 219, 0.4)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.fillText('VERSUS', 0, 0);
      
      // Inner glowing stroke
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.1)';
      ctx.strokeText('VERSUS', 0, 0);

      ctx.font = 'black 16px Outfit';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.letterSpacing = '10px';
      ctx.fillText('STAGE 01 - BATTLE MODE', 0, 90);
      ctx.restore();
    }

    // --- Draw Highways & Notes ---
    players.forEach((p, pIdx) => {
      const { xStart, palette, id: pId } = p;
      const centerX = xStart + highwayW / 2;

      // P1/P2 Label
      ctx.save();
      ctx.font = 'black 18px Outfit';
      ctx.fillStyle = palette[0].fill;
      ctx.shadowBlur = 10;
      ctx.shadowColor = palette[0].fill;
      ctx.fillText(pId, xStart, receptorY - noteSize * 1.5);
      ctx.restore();

      // Highway Background
      ctx.save();
      const hwGrad = ctx.createLinearGradient(0, receptorY, 0, H);
      hwGrad.addColorStop(0, 'rgba(255,255,255,0.05)');
      hwGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = hwGrad;
      ctx.fillRect(xStart - 10, receptorY, highwayW + 20, H - receptorY);
      
      // Lane borders
      ctx.strokeStyle = palette[1].fill;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(xStart - 10, 0); ctx.lineTo(xStart - 10, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xStart + highwayW + 10, 0); ctx.lineTo(xStart + highwayW + 10, H); ctx.stroke();
      ctx.restore();

      // Receptors (Glowing on beat)
      const receptorGlow = Math.max(0, 1 - beatFraction * 4);
      DIRS.forEach((dir, col) => {
        const cx = xStart + col * laneSpacing + noteSize/2;
        drawArrow(ctx, cx, receptorY, noteSize, dir, col, palette, 0.5 + receptorGlow * 0.5, true, receptorGlow > 0.1);
      });

      // Notes
      notesRef.current.forEach((note) => {
        const beatDist = (note.beat + p.beatOffset) - currentBeat;
        // Don't draw if too far or past receptor
        if (beatDist < -0.5 || beatDist > 10) return;

        const noteY = receptorY + beatDist * PIXELS_PER_BEAT;
        const cx = xStart + note.col * laneSpacing + noteSize/2;
        
        // Motion Blur Trail for fast notes
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = palette[note.col].fill;
        ctx.fillRect(cx - 2, noteY, 4, 40); // Trail
        ctx.restore();

        const alpha = beatDist < 0 ? Math.max(0, 1 + beatDist * 4) : 1;
        drawArrow(ctx, cx, noteY, noteSize, DIRS[note.col], note.col, palette, alpha, false, beatDist < 0.5);
      });
    });

    // --- Explosions (Shockwaves) ---
    explosionsRef.current = explosionsRef.current.filter((exp) => {
      const age = (now - exp.birth) / 1000;
      if (age > 0.25) return false; // Faster explosions
      const progress = age / 0.25;
      const colors = players[exp.pIdx].palette[exp.col];
      
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 1 - progress;
      ctx.strokeStyle = colors.fill;
      ctx.lineWidth = 5 * (1 - progress);
      
      // Circle shockwave
      ctx.beginPath();
      ctx.arc(exp.x, exp.y, noteSize * (0.5 + progress * 1.5), 0, Math.PI * 2);
      ctx.stroke();

      // Flash
      if (progress < 0.3) {
        ctx.fillStyle = 'white';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, noteSize * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return true;
    });

    // --- Particles (Sparks) ---
    particlesRef.current = particlesRef.current.filter((p) => {
      p.life -= 1 / 60; // assume 60fps
      if (p.life <= 0) return false;
      
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // Gravity
      
      const progress = p.life / p.maxLife;
      
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = progress;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2 + progress * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return true;
    });

    // --- Auto-hit Logic & Spawning ---
    const beatInt = Math.floor(currentBeat * 4); // Check 16th notes
    if (beatInt !== lastBeatRef.current) {
      lastBeatRef.current = beatInt;
      players.forEach((p, pIdx) => {
        notesRef.current.forEach((note) => {
          if (Math.abs((note.beat + p.beatOffset) - currentBeat) < 0.05) {
            const x = p.xStart + note.col * laneSpacing + noteSize/2;
            const color = p.palette[note.col].fill;
            
            // Spawn Explosion
            explosionsRef.current.push({
              col: note.col, x, y: receptorY, birth: now, pIdx: pIdx
            });
            
            // Spawn Particles
            spawnParticles(x, receptorY, color);
          }
        });
      });
    }

    // --- Judgments & Combos ---
    players.forEach((p, pIdx) => {
      const { xStart } = p;
      const centerX = xStart + highwayW / 2;
      const judgmentY = receptorY + noteSize * 2.5;
      
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalCompositeOperation = 'screen';
      
      // Perfect/Great pop-up animation
      // We use a fast sawtooth wave synced to the beat for popups
      const hitProgress = (currentBeat % 1); // 0 to 1 every beat
      
      // Render only briefly after the beat
      if (hitProgress < 0.3) {
        const popScale = 1 + (0.3 - hitProgress) * 2; // Scales down from 1.6 to 1.0
        const popAlpha = 1 - (hitProgress / 0.3);
        
        ctx.save();
        ctx.translate(centerX, judgmentY);
        ctx.scale(popScale, popScale);
        ctx.globalAlpha = popAlpha;
        
        const isPerfect = Math.random() > 0.1; // 90% perfects for simulation
        const text = isPerfect ? 'MARVELOUS' : 'PERFECT';
        const color = isPerfect ? '#ffffff' : (pIdx === 0 ? '#ff2edb' : '#ffe600');
        
        ctx.font = 'black italic 28px Outfit';
        ctx.fillStyle = color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        ctx.fillText(text, 0, 0);
        ctx.restore();
      }

      // Combo Counter
      const combo = Math.floor(currentBeat * 10) + (pIdx * 100);
      
      // Combo Fire/Glow
      ctx.globalAlpha = 0.8;
      ctx.font = 'black 14px Outfit';
      ctx.fillStyle = '#00f5ff';
      ctx.fillText('COMBO', centerX, judgmentY + 30);
      
      // Make the number pulse heavily
      const comboScale = 1 + Math.max(0, 1 - beatFraction * 4) * 0.2;
      ctx.save();
      ctx.translate(centerX, judgmentY + 60);
      ctx.scale(comboScale, comboScale);
      ctx.font = 'black italic 40px Outfit';
      
      // Gradient for combo number
      const cg = ctx.createLinearGradient(0, -20, 0, 20);
      cg.addColorStop(0, '#ffffff');
      cg.addColorStop(1, pIdx === 0 ? '#ff2edb' : '#39ff14');
      
      ctx.fillStyle = cg;
      ctx.shadowBlur = 15;
      ctx.shadowColor = pIdx === 0 ? '#ff2edb' : '#39ff14';
      ctx.fillText(combo.toString(), 0, 0);
      ctx.restore();
      
      ctx.restore();
    });

    ctx.restore(); // Restore camera shake
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
    <div style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none', background: '#010205' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      {/* Heavy vignette for dramatic arcade look */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />
      {/* Scanlines HTML overlay for crispness */}
      <div className="absolute inset-0 sm-scanlines opacity-50 pointer-events-none mix-blend-overlay" />
    </div>
  );
}