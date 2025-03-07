export type Point = {
  x: number;
  y: number;
  snapX: number;
  snapY: number;
};

export type Line = {
  id: string;
  points: Point[];
  thickness: number;
  color: string;
  selected?: boolean;
};

export type Tool = 'select' | 'line' | 'eraser' | 'hand';

export type Theme = 'light' | 'dark';

export type SelectionBox = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

export type DrawingState = {
  isDrawing: boolean;
  startPoint: Point | null;
  currentPoints: Point[];
  isDragging?: boolean;
  dragStartPoint?: Point;
  selectedLines: string[];
  selectionBox: SelectionBox | null;
  isMultiSelect: boolean;
  isPanning: boolean;
};

export type ZoomLevel = {
  value: number;
  label: string;
};

export type ViewState = {
  offsetX: number;
  offsetY: number;
};

export type DownloadOptions = {
  showGrid: boolean;
  format: 'png' | 'jpeg';
  fileName: string;
  backgroundColor?: string;
};