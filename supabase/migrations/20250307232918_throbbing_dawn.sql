/*
  # Create game-related tables

  1. New Tables
    - `shapes`: Stores the daily doodle shapes
      - `id` (uuid, primary key)
      - `name` (text)
      - `difficulty_level` (int)
      - `min_lines_required` (int)
      - `grid_data` (jsonb, stores line coordinates)
      - `active_date` (date)
    
    - `attempts`: Stores user attempts for each shape
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `shape_id` (uuid, references shapes)
      - `attempt_number` (int)
      - `lines_used` (int)
      - `correct_lines` (int)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create shapes table
CREATE TABLE IF NOT EXISTS shapes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  difficulty_level int NOT NULL DEFAULT 1,
  min_lines_required int NOT NULL,
  grid_data jsonb NOT NULL,
  active_date date UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create attempts table
CREATE TABLE IF NOT EXISTS attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  shape_id uuid REFERENCES shapes NOT NULL,
  attempt_number int NOT NULL,
  lines_used int NOT NULL,
  correct_lines int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE shapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read shapes"
  ON shapes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create their own attempts"
  ON attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own attempts"
  ON attempts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);