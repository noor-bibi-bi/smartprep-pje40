export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Difficulty = "easy" | "medium" | "hard";
export type SourceType = "pdf" | "text";
export type EngineUsed = "cloud" | "offline";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      quizzes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          module_tag: string | null;
          source_type: SourceType;
          difficulty: Difficulty;
          engine_used: EngineUsed;
          created_at: string;
          pdf_name: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title?: string;
          module_tag?: string | null;
          source_type?: SourceType;
          difficulty?: Difficulty;
          engine_used?: EngineUsed;
          created_at?: string;
          pdf_name?: string;
        };
        Update: Partial<Database["public"]["Tables"]["quizzes"]["Insert"]>;
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          quiz_id: string;
          user_id: string;
          position: number;
          question_text: string;
          options: string[];
          correct_index: number;
          explanation: string | null;
          ease_factor: number;
          interval_days: number;
          repetitions: number;
          next_review_at: string;
          last_reviewed_at: string | null;
          correct_answer?: string;
          order_index?: number;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          user_id?: string;
          position?: number;
          question_text: string;
          options: string[];
          correct_index?: number;
          explanation?: string | null;
          ease_factor?: number;
          interval_days?: number;
          repetitions?: number;
          next_review_at?: string;
          last_reviewed_at?: string | null;
          correct_answer?: string;
          order_index?: number;
        };
        Update: Partial<Database["public"]["Tables"]["questions"]["Insert"]>;
        Relationships: [];
      };
      quiz_attempts: {
        Row: {
          id: string;
          user_id: string;
          quiz_id: string;
          score: number;
          total: number;
          duration_seconds: number | null;
          answers: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quiz_id: string;
          score: number;
          total: number;
          duration_seconds?: number | null;
          answers?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["quiz_attempts"]["Insert"]>;
        Relationships: [];
      };
      attempts: {
        Row: {
          id: string;
          quiz_id: string;
          user_id: string | null;
          score: number;
          total_questions: number;
          answers: string[] | null;
          completed_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          user_id?: string | null;
          score: number;
          total_questions: number;
          answers?: string[] | null;
          completed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attempts"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      handle_new_user: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
