import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { Point, DrawingState } from '../types';
import { GameToolbar } from './GameToolbar';
import { GameUndoRedo } from './GameUndoRedo';

// Constants for grid configuration
const GRID_DIMENSIONS = 9; // 8x8 grid
const MIN_GRID_SIZE = 40; // Minimum size for each grid cell
const DOT_RADIUS = 2;
const HIGHLIGHT_RADIUS = 3; // Smaller highlight radius for better precision
const LINE_HOVER_THRESHOLD = 2;
const SNAP_THRESHOLD = 1; // Threshold in pixels for snapping to grid (approx. 0.1 cm, scaled by devicePixelRatio)

const calculateDynamicMargins = (width: number, height: number) => {
  let leftMargin: number, rightMargin: number, topMargin: number, bottomMargin: number;

  // Mobile: width < 768px
  if (width < 768) {
    leftMargin = 60;
    rightMargin = 15;
    topMargin = 100;
    bottomMargin = 20;
  }
  // Tablet: 768px <= width < 1024px
  else if (width >= 768 && width < 1024) {
    leftMargin = 80;
    rightMargin = 25;
    topMargin = 120;
    bottomMargin = 40;
  }
  // Desktop: width >= 1024px
  else {
    leftMargin = 100;
    rightMargin = 40;
    topMargin = 130;
    bottomMargin = 60;
  }

  return { leftMargin, rightMargin, topMargin, bottomMargin };
};

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { 
    theme, 
    gameTool,
    gameLineThickness,
    selectedColor,
    gameLines,
    addGameLine,
    eraseGameLine,
    updateLastActivePosition,
    isModalOpen
  } = useStore();
  
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startPoint: null,
    currentPoints: [],
    isDragging: false,
    dragStartPoint: undefined,
    selectedLines: [],
    selectionBox: null,
    isMultiSelect: false,
    isPanning: false
  });
  
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(MIN_GRID_SIZE);
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 });

  const calculateResponsiveGrid = useCallback(() => {
    if (!canvasRef.current) return;

    // Get window dimensions
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Calculate dynamic margins based on screen size
    const { leftMargin, rightMargin, topMargin, bottomMargin } = calculateDynamicMargins(windowWidth, windowHeight);

    // Calculate available space considering dynamic margins
    const availableWidth = windowWidth - (leftMargin + rightMargin);
    const availableHeight = windowHeight - (topMargin + bottomMargin);

    // Calculate the maximum grid size that will fit in the available space
    const maxGridDimension = Math.min(availableWidth, availableHeight);

    // Calculate the size of each grid cell to maintain proportions
    const newGridSize = Math.max(MIN_GRID_SIZE, Math.floor(maxGridDimension / GRID_DIMENSIONS));

    // Calculate total grid size
    const totalGridWidth = newGridSize * GRID_DIMENSIONS;
    const totalGridHeight = newGridSize * GRID_DIMENSIONS;

    // Center the grid in the available space, accounting for dynamic margins
    const offsetX = leftMargin + Math.round((availableWidth - totalGridWidth) / 2);
    const offsetY = topMargin + Math.round((availableHeight - totalGridHeight) / 2);

    setGridSize(newGridSize);
    setGridOffset({ x: offsetX, y: offsetY });
  }, []);

  // Recalculate grid on window resize
  useEffect(() => {
    calculateResponsiveGrid();
    window.addEventListener('resize', calculateResponsiveGrid);
    return () => window.removeEventListener('resize', calculateResponsiveGrid);
  }, [calculateResponsiveGrid]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isModalOpen) return;

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdKey = isMac ? e.metaKey : e.ctrlKey;

    if (!cmdKey && !e.shiftKey && !e.altKey) {
      switch (e.key.toLowerCase()) {
        case 'p':
          e.preventDefault();
          useStore.getState().setGameTool('line');
          break;
        case 'e':
          e.preventDefault();
          useStore.getState().setGameTool('eraser');
          break;
      }
    }

    if (cmdKey && !e.shiftKey && !e.altKey) {
      switch (e.key) {
        case 'z':
          e.preventDefault();
          useStore.getState().gameUndo();
          break;
        case 'r':
          e.preventDefault();
          useStore.getState().gameRedo();
          break;
      }
    }
  }, [isModalOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const snapToGrid = (x: number, y: number): Point => {
    const scale = window.devicePixelRatio || 1; 
    const threshold = SNAP_THRESHOLD * scale; 

    const screenX = x - gridOffset.x;
    const screenY = y - gridOffset.y;

    const gridX = Math.floor(screenX / gridSize);
    const gridY = Math.floor(screenY / gridSize);

    const snapX = gridX * gridSize;
    const snapY = gridY * gridSize;

    const dx = Math.abs(screenX - snapX);
    const dy = Math.abs(screenY - snapY);
    const distance = Math.sqrt(dx * dx + dy * dy);

    const finalX = distance <= threshold ? snapX : screenX;
    const finalY = distance <= threshold ? snapY : screenY;

    const constrainedGridX = Math.max(0, Math.min(GRID_DIMENSIONS - 1, Math.round(finalX / gridSize)));
    const constrainedGridY = Math.max(0, Math.min(GRID_DIMENSIONS - 1, Math.round(finalY / gridSize)));

    const constrainedSnapX = constrainedGridX * gridSize;
    const constrainedSnapY = constrainedGridY * gridSize;

    return {
      x: finalX,
      y: finalY,
      snapX: constrainedSnapX,
      snapY: constrainedSnapY
    };
  };

  const findIntermediatePoints = (start: Point, end: Point): Point[] => {
    const points: Point[] = [];
    const dx = end.x - start.x; // Use raw x/y for smoother interpolation
    const dy = end.y - start.y;
    const steps = Math.max(Math.abs(dx / gridSize), Math.abs(dy / gridSize));

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = start.x + dx * t;
      const y = start.y + dy * t;
      points.push(snapToGrid(x + gridOffset.x, y + gridOffset.y));
    }
    return points;
  };

  const getDistanceToLineSegment = (point: Point, start: Point, end: Point): number => {
    const A = point.x - start.snapX;
    const B = point.y - start.snapY;
    const C = end.snapX - start.snapX;
    const D = end.snapY - start.snapY;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = start.snapX;
      yy = start.snapY;
    } else if (param > 1) {
      xx = end.snapX;
      yy = end.snapY;
    } else {
      xx = start.snapX + param * C;
      yy = start.snapY + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const isPointNearLine = (point: Point, linePoints: Point[]): boolean => {
    for (let i = 0; i < linePoints.length - 1; i++) {
      const start = linePoints[i];
      const end = linePoints[i + 1];
      
      const distance = getDistanceToLineSegment(point, start, end);
      if (distance < LINE_HOVER_THRESHOLD) {
        return true;
      }
    }
    return false;
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      const scale = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * scale;
      canvas.height = window.innerHeight * scale;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(scale, scale);
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);

    const drawGrid = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid dots
      for (let x = 0; x < GRID_DIMENSIONS; x++) {
        for (let y = 0; y < GRID_DIMENSIONS; y++) {
          const dotX = x * gridSize + gridOffset.x;
          const dotY = y * gridSize + gridOffset.y;
          
          ctx.beginPath();
          ctx.arc(dotX, dotY, DOT_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = theme === 'dark'
            ? 'rgba(255, 255, 255, 0.3)'
            : 'rgba(0, 0, 0, 0.3)';
          ctx.fill();
        }
      }

      // Draw existing lines
      gameLines.forEach(line => {
        if (line.points.length < 2) return;
        
        ctx.beginPath();
        ctx.moveTo(line.points[0].snapX + gridOffset.x, line.points[0].snapY + gridOffset.y);
        
        for (let i = 1; i < line.points.length; i++) {
          ctx.lineTo(line.points[i].snapX + gridOffset.x, line.points[i].snapY + gridOffset.y);
        }
        
        if (gameTool === 'eraser' && line.id === hoveredLine) {
          ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 0, 0, 0.8)' : 'rgba(255, 0, 0, 0.6)';
        } else {
          ctx.strokeStyle = line.color;
        }
        
        ctx.lineWidth = line.thickness;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
      });

      // Draw current line preview
      if (drawingState.isDrawing && drawingState.currentPoints.length > 0) {
        ctx.beginPath();
        ctx.moveTo(
          drawingState.currentPoints[0].snapX + gridOffset.x,
          drawingState.currentPoints[0].snapY + gridOffset.y
        );
        
        drawingState.currentPoints.forEach((point, i) => {
          if (i === 0) return;
          ctx.lineTo(
            point.snapX + gridOffset.x,
            point.snapY + gridOffset.y
          );
        });
        
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = gameLineThickness;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Draw hovered point highlight
      if (hoveredPoint && gameTool === 'line') {
        ctx.beginPath();
        ctx.arc(
          hoveredPoint.snapX + gridOffset.x,
          hoveredPoint.snapY + gridOffset.y,
          HIGHLIGHT_RADIUS,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
      }
    };

    let animationFrame: number;
    const animate = () => {
      drawGrid();
      animationFrame = requestAnimationFrame(animate);
    };

    animate();
    
    return () => {
      window.removeEventListener('resize', updateSize);
      cancelAnimationFrame(animationFrame);
    };
  }, [
    theme, gameLines, drawingState, gameLineThickness, selectedColor,
    hoveredPoint, hoveredLine, gameTool, gridOffset, gridSize
  ]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point = snapToGrid(x, y);

    // Update hover point for mouse interactions only
    if (e.pointerType === 'mouse') {
      setHoveredPoint(point);
    }

    // Handle line hovering for eraser tool
    if (gameTool === 'eraser' && point) {
      const hoveredLineId = gameLines.find(line => isPointNearLine(point, line.points))?.id || null;
      setHoveredLine(hoveredLineId);
    } else {
      setHoveredLine(null);
    }

    // Handle line drawing
    if (drawingState.isDrawing && gameTool === 'line' && point) {
      const lastPoint = drawingState.currentPoints[drawingState.currentPoints.length - 1];
      
      if (!lastPoint) return;

      if (drawingState.currentPoints.length > 1) {
        const secondLastPoint = drawingState.currentPoints[drawingState.currentPoints.length - 2];
        if (point.snapX === secondLastPoint.snapX && point.snapY === secondLastPoint.snapY) {
          setDrawingState(prev => ({
            ...prev,
            currentPoints: prev.currentPoints.slice(0, -1)
          }));
          return;
        }
      }

      const intermediatePoints = findIntermediatePoints(lastPoint, point);
      
      if (intermediatePoints.length > 0) {
        setDrawingState(prev => ({
          ...prev,
          currentPoints: [...prev.currentPoints, ...intermediatePoints]
        }));
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point = snapToGrid(x, y);

    if (gameTool === 'eraser') {
      if (hoveredLine) {
        eraseGameLine(hoveredLine);
      }
      return;
    }
    
    if (gameTool !== 'line') return;

    // Start a new line from the current point
    setDrawingState({
      isDrawing: true,
      startPoint: point,
      currentPoints: [point],
      isDragging: false,
      dragStartPoint: undefined,
      selectedLines: [],
      selectionBox: null,
      isMultiSelect: false,
      isPanning: false
    });

    // Update last active position
    updateLastActivePosition({
      x: point.snapX,
      y: point.snapY
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!drawingState.isDrawing || !drawingState.currentPoints.length) {
      return;
    }

    // Complete the current line if it has points
    if (drawingState.currentPoints.length > 1) {
      const newLine = {
        id: Date.now().toString(),
        points: drawingState.currentPoints,
        thickness: gameLineThickness,
        color: selectedColor
      };
      addGameLine(newLine);
    }

    // Reset drawing state completely
    setDrawingState({
      isDrawing: false,
      startPoint: null,
      currentPoints: [],
      isDragging: false,
      dragStartPoint: undefined,
      selectedLines: [],
      selectionBox: null,
      isMultiSelect: false,
      isPanning: false
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 z-0 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <canvas ref={canvasRef} />
      </div>
      <GameToolbar />
      <GameUndoRedo />
    </>
  );
};