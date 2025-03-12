export interface Shape {
  id: string;
  name: string;
  difficulty_level: number;
  min_lines_required: number;
  grid_data: ShapeGridData;
  line_keys: string[];
  active_date: string;
  total_lines_limit: number;
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

export interface LineSegment {
  id: string;
  start: GridPoint;
  end: GridPoint;
  parentLineId: string;
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
  totalLinesLimit?: number;
  totalLinesUsed: number;
  drawnLines: GameLine[];
  correctLines: string[]; // Stores segment IDs in format "lineId-segmentIndex"
  wrongLines: string[]; // Stores segment IDs in format "lineId-segmentIndex"
  disabledSegments: Set<string>; // Store line segments that can't be drawn
  correctSegments: string[]; // Store correct line segments
  timeLeft?: number;
  gridData?: ShapeGridData;
}