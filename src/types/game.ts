export interface Shape {
  id: string;
  name: string;
  difficulty_level: number;
  min_lines_required: number;
  grid_data: ShapeGridData;
  active_date: string;
}

export interface ShapeGridData {
  lines: ShapeLine[];
}

export interface ShapeLine {
  start: GridPoint;
  end: GridPoint;
}

export interface GridPoint {
  x: number; // Grid coordinate (0-4)
  y: number; // Grid coordinate (0-4)
}

export interface GameLine {
  id: string;
  points: GridPoint[];
  thickness: number;
  color: string;
}

export interface Attempt {
  id: string;
  user_id: string;
  shape_id: string;
  attempt_number: number;
  lines_used: number;
  correct_lines: number;
  created_at: string;
}

export interface GameState {
  isActive: boolean;
  currentAttempt: number;
  maxAttempts: number;
  minLinesRequired?: number;
  drawnLines: GameLine[];
  correctLines: string[];
  connectedButWrongLines: string[];
  wrongLines: string[];
  timeLeft?: number;
  gridData?: ShapeGridData;
}
