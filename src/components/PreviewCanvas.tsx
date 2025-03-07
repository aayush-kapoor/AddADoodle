import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Line, Point } from '../types';

const GRID_SIZE = 20;
const DOT_RADIUS = 1;

interface PreviewCanvasProps {
  showGrid: boolean;
  selectedLines: Line[];
  theme: 'light' | 'dark';
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  showGrid,
  selectedLines,
  theme
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || selectedLines.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate bounds of selected lines
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedLines.forEach(line => {
      line.points.forEach(point => {
        minX = Math.min(minX, point.snapX);
        minY = Math.min(minY, point.snapY);
        maxX = Math.max(maxX, point.snapX);
        maxY = Math.max(maxY, point.snapY);
      });
    });

    // Add padding of 2 grid points
    const padding = GRID_SIZE * 2;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    // Calculate dimensions
    const width = maxX - minX;
    const height = maxY - minY;

    // Set canvas size with device pixel ratio
    const scale = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
    // Calculate scale to fit the preview area while maintaining aspect ratio
    const scaleX = displayWidth / width;
    const scaleY = displayHeight / height;
    const scaleFactor = Math.min(scaleX, scaleY);

    canvas.width = displayWidth * scale;
    canvas.height = displayHeight * scale;
    ctx.scale(scale, scale);

    // Clear canvas
    ctx.fillStyle = theme === 'dark' ? '#000000' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set up transform to center the content
    ctx.save();
    ctx.translate(displayWidth / 2, displayHeight / 2);
    ctx.scale(scaleFactor, scaleFactor);
    ctx.translate(-width / 2 - minX, -height / 2 - minY);

    // Draw grid if enabled
    if (showGrid) {
      const startX = Math.floor(minX / GRID_SIZE) * GRID_SIZE;
      const startY = Math.floor(minY / GRID_SIZE) * GRID_SIZE;
      const endX = Math.ceil(maxX / GRID_SIZE) * GRID_SIZE;
      const endY = Math.ceil(maxY / GRID_SIZE) * GRID_SIZE;

      for (let x = startX; x <= endX; x += GRID_SIZE) {
        for (let y = startY; y <= endY; y += GRID_SIZE) {
          ctx.beginPath();
          ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = theme === 'dark'
            ? 'rgba(255, 255, 255, 0.3)'
            : 'rgba(0, 0, 0, 0.3)';
          ctx.fill();
        }
      }
    }

    // Draw lines
    selectedLines.forEach(line => {
      if (line.points.length < 2) return;
      
      ctx.beginPath();
      ctx.moveTo(line.points[0].snapX, line.points[0].snapY);
      
      for (let i = 1; i < line.points.length; i++) {
        ctx.lineTo(line.points[i].snapX, line.points[i].snapY);
      }
      
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.thickness;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
    });

    ctx.restore();
  }, [selectedLines, showGrid, theme]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ aspectRatio: '16/9' }}
    />
  );
};