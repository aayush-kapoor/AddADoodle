import React, { useRef, useEffect, useState, useLayoutEffect, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { Point, DrawingState } from '../../types';
import { GridPoint } from '../../types/game';

const GRID_DIMENSIONS = 5;
const MIN_GRID_SIZE = 40;
const DOT_RADIUS = 2;
const HIGHLIGHT_RADIUS = 3;
const LINE_HOVER_THRESHOLD = 2;
const SNAP_RADIUS = 20;

const getDistanceFromPoint = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

const generateLineKey = (start: GridPoint, end: GridPoint): string => {
  if (start.x < end.x || (start.x === end.x && start.y < end.y)) {
    return `${start.x},${start.y}-${end.x},${end.y}`;
  }
  return `${end.x},${end.y}-${start.x},${start.y}`;
};

export const SubmitCanvas: React.FC = () => {
  const { 
    theme,
    submitTool: tool,
    submitLineThickness: lineThickness,
    selectedColor,
    submitLines: lines,
    addSubmitLine: addLine,
    eraseSubmitLine: eraseLine,
    updateLastActivePosition
  } = useStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  
  const [hoveredPoint, setHoveredPoint] = useState<GridPoint | null>(null);
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(MIN_GRID_SIZE);
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 });

  const calculateResponsiveGrid = useCallback(() => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const leftMargin = windowWidth < 768 ? 60 : windowWidth >= 768 && windowWidth < 1024 ? 80 : 100;
    const rightMargin = windowWidth < 768 ? 0 : windowWidth >= 768 && windowWidth < 1024 ? 25 : 0;
    const topMargin = windowWidth < 768 ? 150 : windowWidth >= 768 && windowWidth < 1024 ? 160 : 200;
    const bottomMargin = windowWidth < 768 ? 80 : windowWidth >= 768 && windowWidth < 1024 ? 100 : 120;

    const availableWidth = windowWidth - (leftMargin + rightMargin);
    const availableHeight = windowHeight - (topMargin + bottomMargin);

    const maxGridDimension = Math.min(availableWidth, availableHeight);
    const newGridSize = Math.max(MIN_GRID_SIZE, Math.floor(maxGridDimension / GRID_DIMENSIONS));

    const totalGridWidth = newGridSize * GRID_DIMENSIONS;
    const totalGridHeight = newGridSize * GRID_DIMENSIONS;

    const offsetX = leftMargin + Math.round((availableWidth - totalGridWidth) / 2);
    const offsetY = topMargin + Math.round((availableHeight - totalGridHeight) / 2);

    setGridSize(newGridSize);
    setGridOffset({ x: offsetX, y: offsetY });
  }, []);

  useLayoutEffect(() => {
    calculateResponsiveGrid();
  }, [calculateResponsiveGrid]);

  useEffect(() => {
    window.addEventListener('resize', calculateResponsiveGrid);
    return () => window.removeEventListener('resize', calculateResponsiveGrid);
  }, [calculateResponsiveGrid]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdKey = isMac ? e.metaKey : e.ctrlKey;

    if (!cmdKey && !e.shiftKey && !e.altKey) {
      switch (e.key.toLowerCase()) {
        case 'p':
          e.preventDefault();
          useStore.getState().setSubmitTool('line');
          break;
        case 'e':
          e.preventDefault();
          useStore.getState().setSubmitTool('eraser');
          break;
      }
    }

    if (cmdKey && !e.shiftKey && !e.altKey) {
      switch (e.key) {
        case 'z':
          e.preventDefault();
          useStore.getState().submitUndo();
          break;
        case 'r':
          e.preventDefault();
          useStore.getState().submitRedo();
          break;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const screenToGrid = (x: number, y: number): GridPoint | null => {
    const screenX = x - gridOffset.x;
    const screenY = y - gridOffset.y;
    
    for (let gridX = 0; gridX < GRID_DIMENSIONS; gridX++) {
      for (let gridY = 0; gridY < GRID_DIMENSIONS; gridY++) {
        const pointX = gridX * gridSize + gridOffset.x;
        const pointY = gridY * gridSize + gridOffset.y;
        
        const distance = getDistanceFromPoint(x, y, pointX, pointY);
        
        if (distance <= SNAP_RADIUS) {
          return {
            x: gridX,
            y: gridY
          };
        }
      }
    }
    
    return null;
  };

  const gridToScreen = (point: GridPoint): Point => {
    return {
      x: point.x * gridSize + gridOffset.x,
      y: point.y * gridSize + gridOffset.y,
      snapX: point.x * gridSize,
      snapY: point.y * gridSize
    };
  };

  const findIntermediateGridPoints = (start: GridPoint, end: GridPoint): GridPoint[] => {
    const points: GridPoint[] = [];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(start.x + dx * t);
      const y = Math.round(start.y + dy * t);
      points.push({ x, y });
    }
    
    return points;
  };

  const isPointNearLine = (point: GridPoint, linePoints: GridPoint[]): boolean => {
    for (let i = 0; i < linePoints.length - 1; i++) {
      const start = linePoints[i];
      const end = linePoints[i + 1];
      
      if (
        (point.x === start.x && point.y === start.y) ||
        (point.x === end.x && point.y === end.y)
      ) {
        return true;
      }
      
      if (
        point.x >= Math.min(start.x, end.x) &&
        point.x <= Math.max(start.x, end.x) &&
        point.y >= Math.min(start.y, end.y) &&
        point.y <= Math.max(start.y, end.y)
      ) {
        if (start.x === end.x || start.y === end.y) {
          return true;
        }
        if (Math.abs(start.x - end.x) === Math.abs(start.y - end.y)) {
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const slope = dy / dx;
          const expectedY = start.y + slope * (point.x - start.x);
          return point.y === Math.round(expectedY);
        }
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

      for (let x = 0; x < GRID_DIMENSIONS; x++) {
        for (let y = 0; y < GRID_DIMENSIONS; y++) {
          const screenPoint = gridToScreen({ x, y });
          ctx.beginPath();
          ctx.arc(screenPoint.x, screenPoint.y, DOT_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = theme === 'dark'
            ? 'rgba(255, 255, 255, 0.3)'
            : 'rgba(0, 0, 0, 0.3)';
          ctx.fill();
        }
      }

      lines.forEach(line => {
        if (line.points.length < 2) return;
        
        for (let i = 0; i < line.points.length - 1; i++) {
          const start = gridToScreen(line.points[i]);
          const end = gridToScreen(line.points[i + 1]);
          
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);

          if (tool === 'eraser' && line.id === hoveredLine) {
            ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 0, 0, 0.8)' : 'rgba(255, 0, 0, 0.6)';
          } else {
            ctx.strokeStyle = line.color;
          }
          
          ctx.lineWidth = line.thickness;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      });

      if (drawingState.isDrawing && drawingState.currentPoints.length > 0) {
        const screenStart = gridToScreen(drawingState.currentPoints[0]);
        ctx.beginPath();
        ctx.moveTo(screenStart.x, screenStart.y);
        
        drawingState.currentPoints.forEach((point, i) => {
          if (i === 0) return;
          const screenPoint = gridToScreen(point);
          ctx.lineTo(screenPoint.x, screenPoint.y);
        });
        
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = lineThickness;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      if (hoveredPoint && tool === 'line') {
        const screenPoint = gridToScreen(hoveredPoint);
        ctx.beginPath();
        ctx.arc(screenPoint.x, screenPoint.y, HIGHLIGHT_RADIUS, 0, Math.PI * 2);
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
    theme, lines, drawingState, lineThickness, selectedColor,
    hoveredPoint, hoveredLine, tool, gridSize, gridOffset
  ]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const gridPoint = screenToGrid(x, y);

    if (e.pointerType === 'mouse') {
      setHoveredPoint(gridPoint);
    }

    if (tool === 'eraser' && gridPoint) {
      const hoveredLineId = lines.find(line => isPointNearLine(gridPoint, line.points))?.id || null;
      setHoveredLine(hoveredLineId);
    } else {
      setHoveredLine(null);
    }

    if (drawingState.isDrawing && tool === 'line' && gridPoint) {
      const lastPoint = drawingState.currentPoints[drawingState.currentPoints.length - 1];
      if (!lastPoint) return;

      if (drawingState.currentPoints.length > 1) {
        const secondLastPoint = drawingState.currentPoints[drawingState.currentPoints.length - 2];
        if (gridPoint.x === secondLastPoint.x && gridPoint.y === secondLastPoint.y) {
          setDrawingState(prev => ({
            ...prev,
            currentPoints: prev.currentPoints.slice(0, -1)
          }));
          return;
        }
      }

      const existingKeys = new Set(
        lines.flatMap(line => 
          line.points.slice(0, -1).map((start, i) => 
            generateLineKey(start, line.points[i + 1])
          )
        )
      );

      const newSegmentKey = generateLineKey(lastPoint, gridPoint);
      
      if (existingKeys.has(newSegmentKey)) {
        return;
      }

      const intermediatePoints = findIntermediateGridPoints(lastPoint, gridPoint);
      
      let canAddPoints = true;
      for (let i = 0; i < intermediatePoints.length; i++) {
        const start = i === 0 ? lastPoint : intermediatePoints[i - 1];
        const end = intermediatePoints[i];
        const segmentKey = generateLineKey(start, end);
        if (existingKeys.has(segmentKey)) {
          canAddPoints = false;
          break;
        }
      }
      
      if (canAddPoints && intermediatePoints.length > 0) {
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
    const gridPoint = screenToGrid(x, y);

    if (!gridPoint) return;

    if (tool === 'eraser') {
      if (hoveredLine) {
        eraseLine(hoveredLine);
      }
      return;
    }
    
    if (tool !== 'line') return;

    setDrawingState({
      isDrawing: true,
      startPoint: gridPoint,
      currentPoints: [gridPoint],
      isDragging: false,
      dragStartPoint: undefined,
      selectedLines: [],
      selectionBox: null,
      isMultiSelect: false,
      isPanning: false
    });

    updateLastActivePosition({
      x: gridPoint.x,
      y: gridPoint.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!drawingState.isDrawing || !drawingState.currentPoints.length) {
      return;
    }

    if (drawingState.currentPoints.length > 1) {
      const newLine = {
        id: Date.now().toString(),
        points: drawingState.currentPoints,
        thickness: lineThickness,
        color: selectedColor
      };
      addLine(newLine);
    }

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
    <div
      className="fixed inset-0 z-0 touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <canvas ref={canvasRef} />
    </div>
  );
};