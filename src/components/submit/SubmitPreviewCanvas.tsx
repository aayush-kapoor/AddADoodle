import React, { useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { GameLine } from '../../types/game';

const GRID_SIZE = 40; // Increased for better visibility
const DOT_RADIUS = 2;
const GRID_DIMENSIONS = 5;

interface SubmitPreviewCanvasProps {
  selectedLines: GameLine[];
  theme: 'light' | 'dark';
}

export const SubmitPreviewCanvas: React.FC<SubmitPreviewCanvasProps> = ({
  selectedLines,
  theme
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate dimensions
    const padding = GRID_SIZE;
    const totalWidth = GRID_SIZE * (GRID_DIMENSIONS - 1) + padding * 2;
    const totalHeight = totalWidth; // Keep it square

    // Set canvas size with device pixel ratio
    const scale = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
    canvas.width = displayWidth * scale;
    canvas.height = displayHeight * scale;
    ctx.scale(scale, scale);

    // Calculate scale to fit the preview area
    const scaleX = displayWidth / totalWidth;
    const scaleY = displayHeight / totalHeight;
    const scaleFactor = Math.min(scaleX, scaleY);

    // Clear canvas
    ctx.fillStyle = theme === 'dark' ? '#000000' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Center the content
    ctx.save();
    ctx.translate(displayWidth / 2, displayHeight / 2);
    ctx.scale(scaleFactor, scaleFactor);
    ctx.translate(-totalWidth / 2, -totalHeight / 2);

    // Draw grid dots
    for (let x = 0; x < GRID_DIMENSIONS; x++) {
      for (let y = 0; y < GRID_DIMENSIONS; y++) {
        const screenX = x * GRID_SIZE + padding;
        const screenY = y * GRID_SIZE + padding;
        
        ctx.beginPath();
        ctx.arc(screenX, screenY, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = theme === 'dark'
          ? 'rgba(255, 255, 255, 0.3)'
          : 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
      }
    }

    // Draw lines
    selectedLines.forEach(line => {
      if (line.points.length < 2) return;
      
      ctx.beginPath();
      
      // Convert grid coordinates to screen coordinates
      const start = line.points[0];
      const screenStart = {
        x: start.x * GRID_SIZE + padding,
        y: start.y * GRID_SIZE + padding
      };
      
      ctx.moveTo(screenStart.x, screenStart.y);
      
      for (let i = 1; i < line.points.length; i++) {
        const point = line.points[i];
        const screenPoint = {
          x: point.x * GRID_SIZE + padding,
          y: point.y * GRID_SIZE + padding
        };
        ctx.lineTo(screenPoint.x, screenPoint.y);
      }
      
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 3; // Fixed line thickness
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
    });

    ctx.restore();
  }, [selectedLines, theme]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ aspectRatio: '1/1' }}
    />
  );
};