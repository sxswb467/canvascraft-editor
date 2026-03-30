import { useEffect, useRef, useState } from 'react';
import { demoImageSrc } from '../demoData';

type RedactionMode = 'pixelate' | 'blackout';

export function RedactionLab() {
  const [mode, setMode] = useState<RedactionMode>('pixelate');
  const [brushSize, setBrushSize] = useState(28);
  const [hasRedactions, setHasRedactions] = useState(false);
  const [lastResetData, setLastResetData] = useState<ImageData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const image = new Image();
    image.src = demoImageSrc;
    image.onload = () => {
      imageRef.current = image;
      resetCanvas(canvasRef.current, image);
      setHasRedactions(false);
    };
  }, []);

  const applyRedaction = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    const size = brushSize;
    const left = Math.max(0, Math.floor(x - size));
    const top = Math.max(0, Math.floor(y - size));
    const width = Math.min(canvas.width - left, size * 2);
    const height = Math.min(canvas.height - top, size * 2);

    setHasRedactions(true);

    if (mode === 'blackout') {
      context.fillStyle = '#020617';
      context.fillRect(left, top, width, height);
      return;
    }

    const block = 10;
    const imageData = context.getImageData(left, top, width, height);
    const { data } = imageData;
    for (let row = 0; row < height; row += block) {
      for (let column = 0; column < width; column += block) {
        const index = (row * width + column) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        for (let yOffset = 0; yOffset < block; yOffset += 1) {
          for (let xOffset = 0; xOffset < block; xOffset += 1) {
            const px = column + xOffset;
            const py = row + yOffset;
            if (px >= width || py >= height) continue;
            const pxIndex = (py * width + px) * 4;
            data[pxIndex] = r;
            data[pxIndex + 1] = g;
            data[pxIndex + 2] = b;
          }
        }
      }
    }
    context.putImageData(imageData, left, top);
  };

  const resetRedaction = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    setLastResetData(context.getImageData(0, 0, canvas.width, canvas.height));
    resetCanvas(canvas, image);
    setHasRedactions(false);
  };

  const restoreReset = () => {
    if (!lastResetData || !canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;
    context.putImageData(lastResetData, 0, 0);
    setHasRedactions(true);
    setLastResetData(null);
  };

  return (
    <section className="card redaction-card">
      <div className="redaction-header">
        <div>
          <p className="eyebrow">Canvas pixel manipulation</p>
          <h2>Redaction lab</h2>
        </div>
        <div className="toolbar-group">
          <button className={`toolbar-chip ${mode === 'pixelate' ? 'active-chip' : ''}`} onClick={() => setMode('pixelate')}>Pixelate</button>
          <button className={`toolbar-chip ${mode === 'blackout' ? 'active-chip' : ''}`} onClick={() => setMode('blackout')}>Blackout</button>
          <button className="ghost-button" onClick={resetRedaction}>Reset</button>
          <button className="ghost-button" disabled={!lastResetData} onClick={restoreReset}>Restore</button>
        </div>
      </div>
      <div className="redaction-controls">
        <label>
          Brush size
          <input type="range" min={14} max={60} value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} />
        </label>
        <span className="status-pill">{mode === 'pixelate' ? 'Pixel block brush' : 'Blackout brush'} · {brushSize}px</span>
      </div>
      <div className="redaction-help" aria-live="polite">
        <strong>{hasRedactions ? 'Redactions applied' : 'Try the brush'}</strong>
        <p>
          {hasRedactions
            ? 'Use Restore after a reset if you want to recover the previous masked state.'
            : 'Drag across the image to mask sensitive details, then reset if you want to start over.'}
        </p>
      </div>
      <canvas
        ref={canvasRef}
        className="redaction-canvas"
        width={960}
        height={560}
        aria-label="Interactive redaction canvas"
        onPointerDown={(event) => {
          drawingRef.current = true;
          applyRedaction(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (!drawingRef.current) return;
          applyRedaction(event.clientX, event.clientY);
        }}
        onPointerUp={() => {
          drawingRef.current = false;
        }}
        onPointerLeave={() => {
          drawingRef.current = false;
        }}
      />
    </section>
  );
}

function resetCanvas(canvas: HTMLCanvasElement | null, image: HTMLImageElement | null) {
  if (!canvas || !image) return;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
}
