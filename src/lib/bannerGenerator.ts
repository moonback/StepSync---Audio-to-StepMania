/**
 * Generates a stylized banner image using HTML5 Canvas
 */
export async function generateBannerWithText(title: string, artist: string): Promise<File> {
  const width = 418;
  const height = 164;
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Could not get canvas context');
  
  // 1. Draw Background Gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#4f46e5'); // Indigo 600
  gradient.addColorStop(1, '#7c3aed'); // Purple 600
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // 2. Add some decorative patterns (circles/blobs)
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(width * 0.8, height * 0.2, 80, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(width * 0.1, height * 0.8, 60, 0, Math.PI * 2);
  ctx.fill();
  
  // 3. Add Text
  ctx.globalAlpha = 1.0;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Title - Smart Wrap if too long
  ctx.font = '900 32px "Inter", "system-ui", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 15;
  
  const words = title.toUpperCase().split(' ');
  let line1 = '';
  let line2 = '';
  let currentLine = 1;
  const maxWidth = width - 40;
  
  for (const word of words) {
    const testLine = (currentLine === 1 ? line1 : line2) + word + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine === 1) {
      currentLine = 2;
      line2 = word + ' ';
    } else {
      if (currentLine === 1) line1 = testLine;
      else line2 = testLine;
    }
  }
  
  if (line2.trim()) {
    ctx.fillText(line1.trim(), width / 2, height / 2 - 25);
    ctx.fillText(line2.trim(), width / 2, height / 2 + 10);
  } else {
    ctx.fillText(line1.trim(), width / 2, height / 2 - 12);
  }
  
  // Artist - Clean and clear
  ctx.font = '600 14px "Inter", "system-ui", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.shadowBlur = 4;
  ctx.fillText(`—  ${artist.toUpperCase()}  —`, width / 2, line2.trim() ? height / 2 + 50 : height / 2 + 30);
  
  // 4. Add a decorative accent line
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 40, height / 2 + 10);
  ctx.lineTo(width / 2 + 40, height / 2 + 10);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, width - 20, height - 20);
  
  // Convert to file
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], 'generated_banner.png', { type: 'image/png' }));
      }
    }, 'image/png');
  });
}
