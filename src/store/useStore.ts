import { create } from 'zustand';
import { Tool, Line, Theme, Point, ViewState } from '../types';
import { GameState } from '../types/game';
import { persist } from 'zustand/middleware';

interface DoodleState {
  // Main Canvas State
  tool: Tool;
  lines: Line[];
  lineThickness: number;
  selectedColor: string;
  zoomLevel: number;
  undoStack: Line[][];
  redoStack: Line[][];
  selectedLines: string[];
  viewState: ViewState;
  lastActivePosition: { x: number; y: number } | null;
  isModalOpen: boolean;

  // Game Canvas State
  gameTool: Tool;
  gameLines: Line[];
  gameLineThickness: number;
  gameUndoStack: Line[][];
  gameRedoStack: Line[][];
  gameMode: boolean;
  gameState: GameState | null;

  // Shared State
  theme: Theme;

  // Main Canvas Actions
  setTool: (tool: Tool) => void;
  addLine: (line: Line) => void;
  removeLine: (id: string) => void;
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

  // Game Canvas Actions
  setGameTool: (tool: Tool) => void;
  addGameLine: (line: Line) => void;
  removeGameLine: (id: string) => void;
  setGameLineThickness: (thickness: number) => void;
  gameUndo: () => void;
  gameRedo: () => void;
  eraseGameLine: (id: string) => void;
  setGameMode: (active: boolean) => void;
  setGameState: (state: GameState | null) => void;

  // Shared Actions
  toggleTheme: () => void;
}

export const useStore = create<DoodleState>()(
  persist(
    (set) => ({
      // Main Canvas Initial State
      tool: 'line',
      lines: [],
      lineThickness: 3,
      selectedColor: '#FFFFFF',
      zoomLevel: 1,
      undoStack: [],
      redoStack: [],
      selectedLines: [],
      viewState: { offsetX: 0, offsetY: 0 },
      lastActivePosition: null,
      isModalOpen: false,

      // Game Canvas Initial State
      gameTool: 'line',
      gameLines: [],
      gameLineThickness: 4,
      gameUndoStack: [],
      gameRedoStack: [],
      gameMode: false,
      gameState: null,

      // Shared Initial State
      theme: 'dark',

      // Main Canvas Actions
      setTool: (tool) => set((state) => {
        if (tool !== 'select' && state.selectedLines.length > 0) {
          return { tool, selectedLines: [] };
        }
        return { tool };
      }),
      addLine: (line) => set((state) => ({
        lines: [...state.lines, line],
        undoStack: [...state.undoStack, state.lines],
        redoStack: []
      })),
      removeLine: (id) => set((state) => ({
        lines: state.lines.filter((line) => line.id !== id)
      })),
      setLineThickness: (thickness) => set({ lineThickness: thickness }),
      setSelectedColor: (color) => set({ selectedColor: color }),
      setZoomLevel: (level) => set({ zoomLevel: level }),
      undo: () => set((state) => {
        if (state.undoStack.length === 0) return state;
        const previousLines = state.undoStack[state.undoStack.length - 1];
        return {
          lines: previousLines,
          undoStack: state.undoStack.slice(0, -1),
          redoStack: [state.lines, ...state.redoStack],
          selectedLines: []
        };
      }),
      redo: () => set((state) => {
        if (state.redoStack.length === 0) return state;
        const nextLines = state.redoStack[0];
        return {
          lines: nextLines,
          undoStack: [...state.undoStack, state.lines],
          redoStack: state.redoStack.slice(1),
          selectedLines: []
        };
      }),
      eraseLine: (id) => set((state) => ({
        lines: state.lines.filter(line => line.id !== id),
        undoStack: [...state.undoStack, state.lines],
        redoStack: [],
        selectedLines: state.selectedLines.filter(lineId => lineId !== id)
      })),
      selectLine: (id, isMultiSelect = false) => set((state) => {
        if (isMultiSelect) {
          return {
            selectedLines: state.selectedLines.includes(id)
              ? state.selectedLines.filter(lineId => lineId !== id)
              : [...state.selectedLines, id]
          };
        }
        return { selectedLines: [id] };
      }),
      deselectAllLines: () => set({ selectedLines: [] }),
      updateLine: (id, points) => set((state) => ({
        lines: state.lines.map(line => 
          line.id === id ? { ...line, points } : line
        ),
        undoStack: [...state.undoStack, state.lines],
        redoStack: []
      })),
      updateLineThickness: (ids, thickness) => set((state) => ({
        lines: state.lines.map(line => 
          ids.includes(line.id) ? { ...line, thickness } : line
        ),
        undoStack: [...state.undoStack, state.lines],
        redoStack: []
      })),
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
        return {
          lines: state.lines.filter(line => !state.selectedLines.includes(line.id)),
          undoStack: [...state.undoStack, state.lines],
          redoStack: [],
          selectedLines: []
        };
      }),
      setModalOpen: (isOpen) => set({ isModalOpen: isOpen }),

      // Game Canvas Actions
      setGameTool: (tool) => set({ gameTool: tool }),
      addGameLine: (line) => set((state) => ({
        gameLines: [...state.gameLines, line],
        gameUndoStack: [...state.gameUndoStack, state.gameLines],
        gameRedoStack: []
      })),
      removeGameLine: (id) => set((state) => ({
        gameLines: state.gameLines.filter((line) => line.id !== id)
      })),
      setGameLineThickness: (thickness) => set({ gameLineThickness: thickness }),
      gameUndo: () => set((state) => {
        if (state.gameUndoStack.length === 0) return state;
        const previousLines = state.gameUndoStack[state.gameUndoStack.length - 1];
        return {
          gameLines: previousLines,
          gameUndoStack: state.gameUndoStack.slice(0, -1),
          gameRedoStack: [state.gameLines, ...state.gameRedoStack]
        };
      }),
      gameRedo: () => set((state) => {
        if (state.gameRedoStack.length === 0) return state;
        const nextLines = state.gameRedoStack[0];
        return {
          gameLines: nextLines,
          gameUndoStack: [...state.gameUndoStack, state.gameLines],
          gameRedoStack: state.gameRedoStack.slice(1)
        };
      }),
      eraseGameLine: (id) => set((state) => ({
        gameLines: state.gameLines.filter(line => line.id !== id),
        gameUndoStack: [...state.gameUndoStack, state.gameLines],
        gameRedoStack: []
      })),
      setGameMode: (active) => set({ gameMode: active }),
      setGameState: (state) => set({ gameState: state }),

      // Shared Actions
      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'dark' ? 'light' : 'dark';
        const newColor = newTheme === 'dark' ? '#FFFFFF' : '#000000';
        
        const updatedLines = state.lines.map(line => ({
          ...line,
          color: line.color === '#FFFFFF' ? '#000000' : '#FFFFFF'
        }));

        const updatedGameLines = state.gameLines.map(line => ({
          ...line,
          color: line.color === '#FFFFFF' ? '#000000' : '#FFFFFF'
        }));

        return {
          theme: newTheme,
          selectedColor: newColor,
          lines: updatedLines,
          gameLines: updatedGameLines
        };
      })
    }),
    {
      name: 'doodle-storage',
      partialize: (state) => ({
        lines: state.lines,
        undoStack: state.undoStack,
        redoStack: state.redoStack,
        theme: state.theme
      })
    }
  )
);