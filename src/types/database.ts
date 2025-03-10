export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      shapes: {
        Row: {
          id: string
          name: string
          difficulty_level: number
          min_lines_required: number
          grid_data: Json
          active_date: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          difficulty_level?: number
          min_lines_required: number
          grid_data: Json
          active_date: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          difficulty_level?: number
          min_lines_required?: number
          grid_data?: Json
          active_date?: string
          created_at?: string | null
        }
      }
      attempts: {
        Row: {
          id: string
          user_id: string
          shape_id: string
          attempt_number: number
          lines_used: number
          correct_lines: number
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          shape_id: string
          attempt_number: number
          lines_used: number
          correct_lines: number
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          shape_id?: string
          attempt_number?: number
          lines_used?: number
          correct_lines?: number
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}