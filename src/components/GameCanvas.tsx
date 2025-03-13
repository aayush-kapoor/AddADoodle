import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { Point, DrawingState } from '../types';
import { GameHeader } from './game/GameHeader';
import { GridPoint } from '../types/game';

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

const getExistingLineKeys = (lines: GameLine[]): Set<string> => {
  const keys = new Set<string>();
  lines.forEach(line => {
    if (line.points.length < 2) return;
    for (let i = 0; i < line.points.length - 1; i++) {
      const key = generateLineKey(line.points[i], line.points[i + 1]);
      keys.add(key);
    }
  });
  return keys;
};

const calculateDynamicMargins = (width: number, height: number) => {
  let leftMargin: number, rightMargin: number, topMargin: number, bottomMargin: number;

  if (width < 768) {
    leftMargin = 60;
    rightMargin = 0;
    topMargin = 150;
    bottomMargin = 80;
  } else if (width >= 768 && width < 1024) {
    leftMargin = 80;
    rightMargin = 25;
    topMargin = 160;
    bottomMargin = 100;
  } else {
    leftMargin = 100;
    rightMargin = 0;
    topMargin = 200;
    bottomMargin = 120;
  }

  return { leftMargin, rightMargin, topMargin, bottomMargin };
};

const isSegmentInList = (line: { points: GridPoint[] }, segmentIndex: number, idList: string[]): boolean => {
  const segmentId = `${line.id}-${segmentIndex}`;
  return idList.includes(segmentId);
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
    isModalOpen,
    gameState,
    setGameState,
    removeGameLineSegments,
    setGameLines
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
  
  const [hoveredPoint, setHoveredPoint] = useState<GridPoint | null>(null);
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(MIN_GRID_SIZE);
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 });

  const calculateResponsiveGrid = useCallback(() => {
    if (!canvasRef.current) return;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const { leftMargin, rightMargin, topMargin, bottomMargin } = calculateDynamicMargins(windowWidth, windowHeight);

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

      if (gameState?.correctSegments.length > 0) {
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = theme === 'dark' ? 'rgba(0, 255, 128, 0.8)' : 'rgba(0, 200, 100, 0.92)';
        ctx.lineWidth = gameLineThickness;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        gameState.drawnLines.forEach(line => {
          if (line.points.length < 2) return;
          
          for (let i = 0; i < line.points.length - 1; i++) {
            const segmentId = `${line.id}-${i}`;
            if (gameState.correctSegments.includes(segmentId)) {
              const start = gridToScreen(line.points[i]);
              const end = gridToScreen(line.points[i + 1]);
              
              ctx.beginPath();
              ctx.moveTo(start.x, start.y);
              ctx.lineTo(end.x, end.y);
              ctx.stroke();
            }
          }
        });
        ctx.restore();
      }

      if (gameState?.disabledSegments.size > 0) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 0, 0, 0.6)' : 'rgba(255, 0, 0, 0.6)';
        ctx.lineWidth = gameLineThickness;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        gameState.drawnLines.forEach(line => {
          if (line.points.length < 2) return;
          
          for (let i = 0; i < line.points.length - 1; i++) {
            const segmentId = `${line.id}-${i}`;
            if (gameState.disabledSegments.has(segmentId)) {
              const start = gridToScreen(line.points[i]);
              const end = gridToScreen(line.points[i + 1]);
              
              ctx.beginPath();
              ctx.moveTo(start.x, start.y);
              ctx.lineTo(end.x, end.y);
              ctx.stroke();
            }
          }
        });
        ctx.restore();
      }

      gameLines.forEach(line => {
        if (line.points.length < 2) return;
        
        for (let i = 0; i < line.points.length - 1; i++) {
          const start = gridToScreen(line.points[i]);
          const end = gridToScreen(line.points[i + 1]);
          
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);

          const segmentId = `${line.id}-${i}`;
          if (gameState?.correctLines.includes(segmentId)) {
            ctx.strokeStyle = theme === 'dark' ? 'rgba(0, 255, 128, 0.8)' : 'rgba(0, 200, 100, 0.8)';
          } else if (gameState?.wrongLines.includes(segmentId)) {
            ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 64, 64, 0.8)' : 'rgba(255, 0, 0, 0.6)';
          } else if (gameTool === 'eraser' && line.id === hoveredLine) {
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
        ctx.lineWidth = gameLineThickness;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      if (hoveredPoint && gameTool === 'line') {
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
    theme, gameLines, drawingState, gameLineThickness, selectedColor,
    hoveredPoint, hoveredLine, gameTool, gridOffset, gridSize, gameState
  ]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const gridPoint = screenToGrid(x, y);

    // Only update hover states if we have a valid grid point
    if (e.pointerType === 'mouse') {
      setHoveredPoint(gridPoint);
    }

    if (gameTool === 'eraser' && gridPoint) {
      const hoveredLineId = gameLines.find(line => isPointNearLine(gridPoint, line.points))?.id || null;
      setHoveredLine(hoveredLineId);
    } else {
      setHoveredLine(null);
    }

    // Only handle line drawing if we have a valid grid point and are in drawing mode
    if (drawingState.isDrawing && gameTool === 'line' && gridPoint) {
      const lastPoint = drawingState.currentPoints[drawingState.currentPoints.length - 1];
      if (!lastPoint) return;

      // Check for backtracking
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

      // Check for existing lines
      const existingKeys = getExistingLineKeys(gameLines);
      const newSegmentKey = generateLineKey(lastPoint, gridPoint);
      
      if (existingKeys.has(newSegmentKey)) {
        return;
      }

      // Find and validate intermediate points
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

    // Only proceed if we have a valid grid point
    if (!gridPoint) return;

    // Handle validation state reset
    if (gameState?.wrongLines.length) {
      removeGameLineSegments(gameState.wrongLines);
      setGameState({
        ...gameState,
        wrongLines: [],
        disabledSegments: new Set([...gameState.disabledSegments, ...gameState.wrongLines])
      });
    }

    // Handle eraser tool
    if (gameTool === 'eraser') {
      if (hoveredLine) {
        eraseGameLine(hoveredLine);
      }
      return;
    }
    
    if (gameTool !== 'line') return;

    // Check for disabled segments
    if (gameState?.disabledSegments.size) {
      const isDisabled = Array.from(gameState.disabledSegments).some(segmentId => {
        const [lineId, segmentIndex] = segmentId.split('-');
        const line = gameState.drawnLines.find(l => l.id === lineId);
        if (!line) return false;

        const start = line.points[parseInt(segmentIndex)];
        const end = line.points[parseInt(segmentIndex) + 1];
        
        return generateLineKey(start, end).includes(generateLineKey(gridPoint, gridPoint));
      });

      if (isDisabled) return;
    }

    // Start drawing
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

    const hasDisabledIntersection = drawingState.currentPoints.some((point, i) => {
      if (i === 0) return false;
      const prevPoint = drawingState.currentPoints[i - 1];
      const segmentKey = generateLineKey(prevPoint, point);
      
      return Array.from(gameState?.disabledSegments || []).some(disabledId => {
        const [lineId, segmentIndex] = disabledId.split('-');
        const line = gameState?.drawnLines.find(l => l.id === lineId);
        if (!line) return false;
        
        const start = line.points[parseInt(segmentIndex)];
        const end = line.points[parseInt(segmentIndex) + 1];
        return generateLineKey(start, end) === segmentKey;
      });
    });

    if (!hasDisabledIntersection && drawingState.currentPoints.length > 1) {
      const newLine = {
        id: Date.now().toString(),
        points: drawingState.currentPoints,
        thickness: gameLineThickness,
        color: selectedColor
      };
      addGameLine(newLine);
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
    <>
      <GameHeader />
      <div
        className="fixed inset-0 z-0 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <canvas ref={canvasRef} />
      </div>
    </>
  );
};