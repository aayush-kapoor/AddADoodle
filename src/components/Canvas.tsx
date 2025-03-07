import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Point, DrawingState, SelectionBox } from '../types';

const GRID_SIZE = 20;
const DOT_RADIUS = 1;
const HIGHLIGHT_RADIUS = 4;
const CAPTURE_RADIUS = 8;
const LINE_HOVER_THRESHOLD = 5;

export const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { 
    theme, 
    tool, 
    lineThickness, 
    selectedColor, 
    lines, 
    addLine,
    eraseLine,
    zoomLevel,
    selectedLines,
    selectLine,
    deselectAllLines,
    updateLine,
    viewState,
    updateViewState,
    updateLastActivePosition,
    deleteSelectedLines,
    setTool,
    setZoomLevel,
    undo,
    redo,
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
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isModalOpen) return;

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdKey = isMac ? e.metaKey : e.ctrlKey;

    // Tool Selection
    if (!cmdKey && !e.shiftKey && !e.altKey) {
      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          setTool('select');
          break;
        case 'p':
          e.preventDefault();
          setTool('line');
          break;
        case 'e':
          e.preventDefault();
          setTool('eraser');
          break;
        case 'h':
          e.preventDefault();
          setTool('hand');
          break;
        case 'escape':
          e.preventDefault();
          deselectAllLines();
          break;
        case 'delete':
        case 'backspace':
          if (selectedLines.length > 0) {
            e.preventDefault();
            deleteSelectedLines();
          }
          break;
      }
    }

    // View Controls (with Command/Ctrl)
    if (cmdKey && !e.shiftKey && !e.altKey) {
      switch (e.key) {
        case '=': // Plus key (without shift)
        case '+':
          e.preventDefault();
          const currentIndex = [0.5, 0.75, 1, 1.5, 2].indexOf(zoomLevel);
          if (currentIndex < 4) {
            setZoomLevel([0.5, 0.75, 1, 1.5, 2][currentIndex + 1]);
          }
          break;
        case '-':
          e.preventDefault();
          const currentIdx = [0.5, 0.75, 1, 1.5, 2].indexOf(zoomLevel);
          if (currentIdx > 0) {
            setZoomLevel([0.5, 0.75, 1, 1.5, 2][currentIdx - 1]);
          }
          break;
        case 'z':
          e.preventDefault();
          undo();
          break;
        case 'r':
          e.preventDefault();
          redo();
          break;
      }
    }
  }, [
    isModalOpen,
    setTool, deselectAllLines, selectedLines, deleteSelectedLines,
    zoomLevel, setZoomLevel, undo, redo
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const snapToGrid = (x: number, y: number): Point => {
    const screenX = (x - viewState.offsetX) / zoomLevel;
    const screenY = (y - viewState.offsetY) / zoomLevel;
    
    const gridX = Math.round(screenX / GRID_SIZE) * GRID_SIZE;
    const gridY = Math.round(screenY / GRID_SIZE) * GRID_SIZE;
    
    return {
      x: screenX,
      y: screenY,
      snapX: gridX,
      snapY: gridY
    };
  };

  const findIntermediatePoints = (start: Point, end: Point): Point[] => {
    const points: Point[] = [];
    const dx = end.snapX - start.snapX;
    const dy = end.snapY - start.snapY;
    const steps = Math.max(Math.abs(dx / GRID_SIZE), Math.abs(dy / GRID_SIZE));
    
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = start.snapX + dx * t;
      const y = start.snapY + dy * t;
      const point = snapToGrid(
        x * zoomLevel + viewState.offsetX,
        y * zoomLevel + viewState.offsetY
      );
      points.push(point);
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
      if (distance < LINE_HOVER_THRESHOLD / zoomLevel) {
        return true;
      }
    }
    return false;
  };

  const isLineInSelectionBox = (line: Point[], box: SelectionBox): boolean => {
    const minX = Math.min(box.startX, box.endX);
    const maxX = Math.max(box.startX, box.endX);
    const minY = Math.min(box.startY, box.endY);
    const maxY = Math.max(box.startY, box.endY);

    return line.some(point => 
      point.snapX >= minX && point.snapX <= maxX &&
      point.snapY >= minY && point.snapY <= maxY
    );
  };

  const moveSelectedLine = (line: Point[], dx: number, dy: number): Point[] => {
    return line.map(point => ({
      ...point,
      x: point.x + dx,
      y: point.y + dy,
      snapX: point.snapX + dx,
      snapY: point.snapY + dy
    }));
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
      
      ctx.save();
      ctx.scale(zoomLevel, zoomLevel);
      ctx.translate(viewState.offsetX / zoomLevel, viewState.offsetY / zoomLevel);

      const visibleWidth = canvas.width / zoomLevel;
      const visibleHeight = canvas.height / zoomLevel;
      
      const startX = Math.floor(-viewState.offsetX / (GRID_SIZE * zoomLevel)) * GRID_SIZE - GRID_SIZE * 2;
      const startY = Math.floor(-viewState.offsetY / (GRID_SIZE * zoomLevel)) * GRID_SIZE - GRID_SIZE * 2;
      const endX = startX + visibleWidth + GRID_SIZE * 4;
      const endY = startY + visibleHeight + GRID_SIZE * 4;

      // Draw grid dots
      for (let x = startX; x < endX; x += GRID_SIZE) {
        for (let y = startY; y < endY; y += GRID_SIZE) {
          ctx.beginPath();
          ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = theme === 'dark'
            ? 'rgba(255, 255, 255, 0.3)'
            : 'rgba(0, 0, 0, 0.3)';
          ctx.fill();
        }
      }

      // Draw existing lines
      lines.forEach(line => {
        if (line.points.length < 2) return;
        
        ctx.beginPath();
        ctx.moveTo(line.points[0].snapX, line.points[0].snapY);
        for (let i = 1; i < line.points.length; i++) {
          ctx.lineTo(line.points[i].snapX, line.points[i].snapY);
        }
        
        if (selectedLines.includes(line.id)) {
          ctx.strokeStyle = theme === 'dark' ? 'rgba(0, 255, 255, 0.8)' : 'rgba(0, 128, 255, 0.8)';
        } else if (tool === 'eraser' && line.id === hoveredLine) {
          ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 0, 0, 0.8)' : 'rgba(255, 0, 0, 0.6)';
        } else if (tool === 'select' && line.id === hoveredLine) {
          ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
        } else {
          ctx.strokeStyle = line.color;
        }
        
        ctx.lineWidth = line.thickness;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();

        if (selectedLines.includes(line.id) && tool === 'select') {
          line.points.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.snapX, point.snapY, HIGHLIGHT_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = theme === 'dark' ? 'rgba(0, 255, 255, 0.5)' : 'rgba(0, 128, 255, 0.5)';
            ctx.fill();
          });
        }
      });

      // Draw current line preview
      if (drawingState.isDrawing && drawingState.currentPoints.length > 0) {
        ctx.beginPath();
        ctx.moveTo(drawingState.currentPoints[0].snapX, drawingState.currentPoints[0].snapY);
        drawingState.currentPoints.forEach((point, i) => {
          if (i === 0) return;
          ctx.lineTo(point.snapX, point.snapY);
        });
        
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = lineThickness;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Draw selection box
      if (drawingState.selectionBox && tool === 'select') {
        const { startX, startY, endX, endY } = drawingState.selectionBox;
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = theme === 'dark' ? 'rgba(0, 255, 255, 0.5)' : 'rgba(0, 128, 255, 0.5)';
        ctx.fillStyle = theme === 'dark' ? 'rgba(0, 255, 255, 0.1)' : 'rgba(0, 128, 255, 0.1)';
        ctx.rect(startX, startY, endX - startX, endY - startY);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw hovered point highlight
      if (hoveredPoint && (tool === 'line' || tool === 'select')) {
        ctx.beginPath();
        ctx.arc(hoveredPoint.snapX, hoveredPoint.snapY, HIGHLIGHT_RADIUS / zoomLevel, 0, Math.PI * 2);
        ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
      }

      ctx.restore();
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
    theme, lines, drawingState, lineThickness, selectedColor, zoomLevel,
    hoveredPoint, hoveredLine, tool, selectedLines, viewState
  ]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point = snapToGrid(x, y);

    // Handle panning with hand tool
    if (tool === 'hand' && panStart) {
      const dx = x - panStart.x;
      const dy = y - panStart.y;
      
      updateViewState({
        offsetX: viewState.offsetX + dx,
        offsetY: viewState.offsetY + dy
      });
      
      setPanStart({ x, y });
      return;
    }

    // Update hover point for mouse interactions only
    if (e.pointerType === 'mouse') {
      setHoveredPoint(point);
    }

    // Handle selection box
    if (tool === 'select' && drawingState.selectionBox) {
      setDrawingState(prev => ({
        ...prev,
        selectionBox: {
          ...prev.selectionBox!,
          endX: point.x,
          endY: point.y
        }
      }));
      return;
    }

    // Handle line hovering for eraser and select tools
    if ((tool === 'eraser' || tool === 'select') && point) {
      const hoveredLineId = lines.find(line => isPointNearLine(point, line.points))?.id || null;
      setHoveredLine(hoveredLineId);
    } else {
      setHoveredLine(null);
    }

    // Handle dragging selected lines
    if (drawingState.isDragging && point && selectedLines.length > 0) {
      const startPoint = drawingState.dragStartPoint;
      if (startPoint) {
        const dx = point.snapX - startPoint.snapX;
        const dy = point.snapY - startPoint.snapY;
        
        selectedLines.forEach(lineId => {
          const line = lines.find(l => l.id === lineId);
          if (line) {
            const newPoints = moveSelectedLine(line.points, dx, dy);
            updateLine(lineId, newPoints);
          }
        });
        
        setDrawingState(prev => ({
          ...prev,
          dragStartPoint: point
        }));
      }
      return;
    }

    // Handle line drawing
    if (drawingState.isDrawing && tool === 'line' && point) {
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

    if (tool === 'hand') {
      setPanStart({ x, y });
      document.body.classList.add('cursor-hand-active');
      return;
    }

    if (tool === 'eraser') {
      if (hoveredLine) {
        eraseLine(hoveredLine);
      }
      return;
    }

    if (tool === 'select') {
      const isShiftClick = e.shiftKey;
      
      if (hoveredLine) {
        if (selectedLines.includes(hoveredLine)) {
          if (point) {
            setDrawingState({
              ...drawingState,
              isDragging: true,
              dragStartPoint: point,
              selectedLines: selectedLines,
              selectionBox: null,
              isMultiSelect: false
            });
          }
        } else {
          selectLine(hoveredLine, isShiftClick);
          if (point) {
            setDrawingState({
              ...drawingState,
              isDragging: true,
              dragStartPoint: point,
              selectedLines: isShiftClick ? [...selectedLines, hoveredLine] : [hoveredLine],
              selectionBox: null,
              isMultiSelect: isShiftClick
            });
          }
        }
      } else {
        if (!isShiftClick) {
          deselectAllLines();
        }
        
        setDrawingState({
          ...drawingState,
          isDragging: false,
          dragStartPoint: undefined,
          selectedLines: isShiftClick ? selectedLines : [],
          selectionBox: {
            startX: point.x,
            startY: point.y,
            endX: point.x,
            endY: point.y
          },
          isMultiSelect: isShiftClick
        });
      }
      return;
    }
    
    if (tool !== 'line') return;

    // Start a new line from the current point
    setDrawingState({
      isDrawing: true,
      startPoint: point,
      currentPoints: [point],
      isDragging: false,
      dragStartPoint: undefined,
      selectedLines: [],
      selectionBox: null,
      isMultiSelect: false
    });

    // Update last active position
    updateLastActivePosition({
      x: point.snapX,
      y: point.snapY
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (tool === 'hand') {
      setPanStart(null);
      document.body.classList.remove('cursor-hand-active');
      return;
    }

    if (drawingState.selectionBox) {
      const selectedLineIds = lines
        .filter(line => isLineInSelectionBox(line.points, drawingState.selectionBox!))
        .map(line => line.id);

      if (selectedLineIds.length > 0) {
        if (drawingState.isMultiSelect) {
          selectedLineIds.forEach(id => selectLine(id, true));
        } else {
          deselectAllLines();
          selectedLineIds.forEach(id => selectLine(id, true));
        }
      }
    }

    if (drawingState.isDragging) {
      setDrawingState(prev => ({
        ...prev,
        isDragging: false,
        dragStartPoint: undefined,
        selectionBox: null
      }));
      return;
    }

    if (!drawingState.isDrawing || !drawingState.currentPoints.length) {
      setDrawingState(prev => ({
        ...prev,
        selectionBox: null
      }));
      return;
    }

    // Complete the current line if it has points
    if (drawingState.currentPoints.length > 1) {
      const newLine = {
        id: Date.now().toString(),
        points: drawingState.currentPoints,
        thickness: lineThickness,
        color: selectedColor
      };
      addLine(newLine);
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
      isMultiSelect: false
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