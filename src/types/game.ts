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
  x: number;
  y: number;
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
  drawnLines: ShapeLine[];
  correctLines: number[];
  connectedButWrongLines: number[];
  wrongLines: number[];
  timeLeft?: number;
}