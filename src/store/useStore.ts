import { create } from 'zustand';
import { Tool, Line, Theme, Point, ViewState } from '../types';
import { GameState } from '../types/game';

interface DoodleState {
  tool: Tool;
  lines: Line[];
  theme: Theme;
  lineThickness: number;
  selectedColor: string;
  zoomLevel: number;
  undoStack: Line[][];
  redoStack: Line[][];
  selectedLines: string[];
  viewState: ViewState;
  lastActivePosition: { x: number; y: number } | null;
  isModalOpen: boolean;
  gameMode: boolean;
  gameState: GameState | null;
  setTool: (tool: Tool) => void;
  addLine: (line: Line) => void;
  removeLine: (id: string) => void;
  toggleTheme: () => void;
  setLineThickness: (thickness: number) => void;
  setSelectedColor: (color: string) => void;
  setZoomLevel: (level: number) => void;
  undo: () => void;
  redo: () => void;
  eraseLine: (id: string) => void;
  selectLine: (id: string, isMultiSelect?: boolean) => void;
  deselectAllLines: () => void;
  updateLine: (id: string, points: Point[]) => void;
  updateLineThickness: (ids: string[], thickness: number) => void;
  updateViewState: (newState: Partial<ViewState>) => void;
  updateLastActivePosition: (position: { x: number; y: number } | null) => void;
  centerOnLastActive: () => void;
  deleteSelectedLines: () => void;
  setModalOpen: (isOpen: boolean) => void;
  setGameMode: (active: boolean) => void;
  setGameState: (state: GameState | null) => void;
}

export const useStore = create<DoodleState>((set) => ({
  tool: 'line',
  lines: [],
  theme: 'dark',
  lineThickness: 2,
  selectedColor: '#FFFFFF',
  zoomLevel: 1,
  undoStack: [],
  redoStack: [],
  selectedLines: [],
  viewState: { offsetX: 0, offsetY: 0 },
  lastActivePosition: null,
  isModalOpen: false,
  gameMode: false,
  gameState: null,
  setTool: (tool) => set((state) => {
    if (tool !== 'select' && state.selectedLines.length > 0) {
      return { tool, selectedLines: [] };
    }
    return { tool };
  }),
  addLine: (line) => set((state) => {
    const newLines = [...state.lines, line];
    return {
      lines: newLines,
      undoStack: [...state.undoStack, state.lines],
      redoStack: []
    };
  }),
  removeLine: (id) => set((state) => ({
    lines: state.lines.filter((line) => line.id !== id)
  })),
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    const newColor = newTheme === 'dark' ? '#FFFFFF' : '#000000';
    
    const updatedLines = state.lines.map(line => ({
      ...line,
      color: line.color === '#FFFFFF' ? '#000000' : '#FFFFFF'
    }));

    return {
      theme: newTheme,
      selectedColor: newColor,
      lines: updatedLines
    };
  }),
  setLineThickness: (thickness) => set({ lineThickness: thickness }),
  setSelectedColor: (color) => set({ selectedColor: color }),
  setZoomLevel: (level) => set({ zoomLevel: level }),
  undo: () => set((state) => {
    if (state.undoStack.length === 0) return state;
    
    const previousLines = state.undoStack[state.undoStack.length - 1];
    const newUndoStack = state.undoStack.slice(0, -1);
    
    return {
      lines: previousLines,
      undoStack: newUndoStack,
      redoStack: [state.lines, ...state.redoStack],
      selectedLines: []
    };
  }),
  redo: () => set((state) => {
    if (state.redoStack.length === 0) return state;
    
    const nextLines = state.redoStack[0];
    const newRedoStack = state.redoStack.slice(1);
    
    return {
      lines: nextLines,
      undoStack: [...state.undoStack, state.lines],
      redoStack: newRedoStack,
      selectedLines: []
    };
  }),
  eraseLine: (id) => set((state) => {
    const newLines = state.lines.filter(line => line.id !== id);
    return {
      lines: newLines,
      undoStack: [...state.undoStack, state.lines],
      redoStack: [],
      selectedLines: state.selectedLines.filter(lineId => lineId !== id)
    };
  }),
  selectLine: (id, isMultiSelect = false) => set((state) => {
    if (isMultiSelect) {
      if (state.selectedLines.includes(id)) {
        return {
          selectedLines: state.selectedLines.filter(lineId => lineId !== id)
        };
      }
      return {
        selectedLines: [...state.selectedLines, id]
      };
    }
    return {
      selectedLines: [id]
    };
  }),
  deselectAllLines: () => set({ selectedLines: [] }),
  updateLine: (id, points) => set((state) => {
    const newLines = state.lines.map(line => 
      line.id === id ? { ...line, points } : line
    );
    return {
      lines: newLines,
      undoStack: [...state.undoStack, state.lines],
      redoStack: []
    };
  }),
  updateLineThickness: (ids, thickness) => set((state) => {
    const newLines = state.lines.map(line => 
      ids.includes(line.id) ? { ...line, thickness } : line
    );
    
    return {
      lines: newLines,
      undoStack: [...state.undoStack, state.lines],
      redoStack: []
    };
  }),
  updateViewState: (newState) => set((state) => ({
    viewState: { ...state.viewState, ...newState }
  })),
  updateLastActivePosition: (position) => set({
    lastActivePosition: position
  }),
  centerOnLastActive: () => set((state) => {
    if (state.lastActivePosition) {
      return {
        viewState: {
          offsetX: -state.lastActivePosition.x * state.zoomLevel + window.innerWidth / 2,
          offsetY: -state.lastActivePosition.y * state.zoomLevel + window.innerHeight / 2
        }
      };
    }
    return state;
  }),
  deleteSelectedLines: () => set((state) => {
    if (state.selectedLines.length === 0) return state;
    
    const newLines = state.lines.filter(line => !state.selectedLines.includes(line.id));
    
    return {
      lines: newLines,
      undoStack: [...state.undoStack, state.lines],
      redoStack: [],
      selectedLines: []
    };
  }),
  setModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
  setGameMode: (active) => set({ gameMode: active }),
  setGameState: (state) => set({ gameState: state })
}));