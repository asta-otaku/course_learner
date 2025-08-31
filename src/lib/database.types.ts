export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number | null
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          color: string | null
          created_at: string
          created_by: string
          description: string | null
          icon: string | null
          id: string
          is_public: boolean | null
          level: number
          metadata: Json | null
          name: string
          order_index: number | null
          parent_id: string | null
          path: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean | null
          level?: number
          metadata?: Json | null
          name: string
          order_index?: number | null
          parent_id?: string | null
          path: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean | null
          level?: number
          metadata?: Json | null
          name?: string
          order_index?: number | null
          parent_id?: string | null
          path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      curricula: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_public: boolean | null
          metadata: Json | null
          objectives: string[] | null
          order_index: number | null
          prerequisites: string[] | null
          resources: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          objectives?: string[] | null
          order_index?: number | null
          prerequisites?: string[] | null
          resources?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          objectives?: string[] | null
          order_index?: number | null
          prerequisites?: string[] | null
          resources?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curricula_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curricula_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          level: number
          max_age: number | null
          min_age: number | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          level: number
          max_age?: number | null
          min_age?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          level?: number
          max_age?: number | null
          min_age?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          activities: Json | null
          content: string | null
          created_at: string
          created_by: string
          curriculum_id: string
          description: string | null
          difficulty_level: number | null
          duration_minutes: number | null
          id: string
          is_public: boolean | null
          is_published: boolean | null
          learning_objectives: string[] | null
          metadata: Json | null
          order_index: number
          prerequisites: string[] | null
          quiz_id: string | null
          resources: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          activities?: Json | null
          content?: string | null
          created_at?: string
          created_by?: string
          curriculum_id: string
          description?: string | null
          difficulty_level?: number | null
          duration_minutes?: number | null
          id?: string
          is_public?: boolean | null
          is_published?: boolean | null
          learning_objectives?: string[] | null
          metadata?: Json | null
          order_index: number
          prerequisites?: string[] | null
          quiz_id?: string | null
          resources?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          activities?: Json | null
          content?: string | null
          created_at?: string
          created_by?: string
          curriculum_id?: string
          description?: string | null
          difficulty_level?: number | null
          duration_minutes?: number | null
          id?: string
          is_public?: boolean | null
          is_published?: boolean | null
          learning_objectives?: string[] | null
          metadata?: Json | null
          order_index?: number
          prerequisites?: string[] | null
          quiz_id?: string | null
          resources?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curricula"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quiz_stats"
            referencedColumns: ["quiz_id"]
          },
          {
            foreignKeyName: "lessons_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      question_answers: {
        Row: {
          content: string
          created_at: string
          explanation: string | null
          grading_criteria: string | null
          id: string
          is_correct: boolean | null
          order_index: number | null
          question_id: string
          sample_answer: string | null
          test_cases: Json | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          explanation?: string | null
          grading_criteria?: string | null
          id?: string
          is_correct?: boolean | null
          order_index?: number | null
          question_id: string
          sample_answer?: string | null
          test_cases?: Json | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          explanation?: string | null
          grading_criteria?: string | null
          id?: string
          is_correct?: boolean | null
          order_index?: number | null
          question_id?: string
          sample_answer?: string | null
          test_cases?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_attempts: {
        Row: {
          answer_content: string | null
          created_at: string
          feedback: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          is_correct: boolean | null
          points_earned: number | null
          question_id: string
          quiz_attempt_id: string
          selected_answer_id: string | null
          time_spent: number | null
          updated_at: string
        }
        Insert: {
          answer_content?: string | null
          created_at?: string
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id: string
          quiz_attempt_id: string
          selected_answer_id?: string | null
          time_spent?: number | null
          updated_at?: string
        }
        Update: {
          answer_content?: string | null
          created_at?: string
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id?: string
          quiz_attempt_id?: string
          selected_answer_id?: string | null
          time_spent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_attempts_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_attempts_quiz_attempt_id_fkey"
            columns: ["quiz_attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_attempts_selected_answer_id_fkey"
            columns: ["selected_answer_id"]
            isOneToOne: false
            referencedRelation: "question_answers"
            referencedColumns: ["id"]
          },
        ]
      }
      question_collections: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          order_index: number | null
          question_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          order_index?: number | null
          question_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          order_index?: number | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_collections_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_folders: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          metadata: Json | null
          name: string
          order_index: number | null
          parent_id: string | null
          path: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          metadata?: Json | null
          name: string
          order_index?: number | null
          parent_id?: string | null
          path?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          metadata?: Json | null
          name?: string
          order_index?: number | null
          parent_id?: string | null
          path?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_folders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "question_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          category_id: string | null
          content: string
          correct_feedback: string | null
          created_at: string
          created_by: string
          folder_id: string | null
          grade_id: string | null
          hint: string | null
          id: string
          image_url: string | null
          incorrect_feedback: string | null
          is_public: boolean
          metadata: Json | null
          time_limit: number | null
          type: Database["public"]["Enums"]["question_type"]
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          content: string
          correct_feedback?: string | null
          created_at?: string
          created_by: string
          folder_id?: string | null
          grade_id?: string | null
          hint?: string | null
          id?: string
          image_url?: string | null
          incorrect_feedback?: string | null
          is_public?: boolean
          metadata?: Json | null
          time_limit?: number | null
          type: Database["public"]["Enums"]["question_type"]
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          content?: string
          correct_feedback?: string | null
          created_at?: string
          created_by?: string
          folder_id?: string | null
          grade_id?: string | null
          hint?: string | null
          id?: string
          image_url?: string | null
          incorrect_feedback?: string | null
          is_public?: boolean
          metadata?: Json | null
          time_limit?: number | null
          type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "question_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          attempt_number: number
          completed_at: string | null
          created_at: string
          feedback: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          metadata: Json | null
          percentage: number | null
          quiz_id: string
          score: number | null
          started_at: string
          status: Database["public"]["Enums"]["attempt_status"]
          submitted_at: string | null
          time_spent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json | null
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          metadata?: Json | null
          percentage?: number | null
          quiz_id: string
          score?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["attempt_status"]
          submitted_at?: string | null
          time_spent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json | null
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          metadata?: Json | null
          percentage?: number | null
          quiz_id?: string
          score?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["attempt_status"]
          submitted_at?: string | null
          time_spent?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quiz_stats"
            referencedColumns: ["quiz_id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          id: string
          order_index: number
          points_override: number | null
          question_id: string
          quiz_id: string
          required: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_index: number
          points_override?: number | null
          question_id: string
          quiz_id: string
          required?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number
          points_override?: number | null
          question_id?: string
          quiz_id?: string
          required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quiz_stats"
            referencedColumns: ["quiz_id"]
          },
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_transitions: {
        Row: {
          content: string
          created_at: string | null
          id: string
          position: number
          quiz_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          position: number
          quiz_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          position?: number
          quiz_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_transitions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quiz_stats"
            referencedColumns: ["quiz_id"]
          },
          {
            foreignKeyName: "quiz_transitions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          allow_retakes: boolean | null
          available_from: string | null
          available_to: string | null
          category_id: string | null
          created_at: string
          created_by: string
          description: string | null
          grade_id: string | null
          id: string
          instructions: string | null
          lesson_id: string | null
          max_attempts: number | null
          metadata: Json | null
          passing_score: number | null
          randomize_questions: boolean | null
          scheduled_for: string | null
          settings: Json | null
          show_correct_answers: boolean | null
          status: Database["public"]["Enums"]["quiz_status"]
          tags: string[] | null
          time_limit: number | null
          title: string
          updated_at: string
        }
        Insert: {
          allow_retakes?: boolean | null
          available_from?: string | null
          available_to?: string | null
          category_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          grade_id?: string | null
          id?: string
          instructions?: string | null
          lesson_id?: string | null
          max_attempts?: number | null
          metadata?: Json | null
          passing_score?: number | null
          randomize_questions?: boolean | null
          scheduled_for?: string | null
          settings?: Json | null
          show_correct_answers?: boolean | null
          status?: Database["public"]["Enums"]["quiz_status"]
          tags?: string[] | null
          time_limit?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          allow_retakes?: boolean | null
          available_from?: string | null
          available_to?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          grade_id?: string | null
          id?: string
          instructions?: string | null
          lesson_id?: string | null
          max_attempts?: number | null
          metadata?: Json | null
          passing_score?: number | null
          randomize_questions?: boolean | null
          scheduled_for?: string | null
          settings?: Json | null
          show_correct_answers?: boolean | null
          status?: Database["public"]["Enums"]["quiz_status"]
          tags?: string[] | null
          time_limit?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      quiz_stats: {
        Row: {
          question_count: number | null
          quiz_id: string | null
          total_points: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_quiz_score: {
        Args: {
          attempt_id: string
        }
        Returns: {
          total_points: number
          earned_points: number
          percentage: number
        }[]
      }
      can_take_quiz: {
        Args: {
          p_quiz_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      delete_folder_with_options: {
        Args: {
          p_folder_id: string
          p_delete_contents?: boolean
        }
        Returns: undefined
      }
      get_curriculum_lessons_with_quiz_counts: {
        Args: {
          curriculum_uuid: string
        }
        Returns: {
          lesson_data: Json
          quiz_count: number
        }[]
      }
      get_curriculum_progress: {
        Args: {
          p_curriculum_id: string
          p_user_id: string
        }
        Returns: {
          total_lessons: number
          completed_lessons: number
          progress_percentage: number
        }[]
      }
      get_folder_depth: {
        Args: {
          folder_path: string
        }
        Returns: number
      }
      get_lesson_with_quiz_count: {
        Args: {
          lesson_uuid: string
        }
        Returns: {
          lesson_data: Json
          quiz_count: number
        }[]
      }
      get_next_attempt_number: {
        Args: {
          p_quiz_id: string
          p_user_id: string
        }
        Returns: number
      }
      get_question_statistics: {
        Args: {
          p_question_id: string
        }
        Returns: {
          total_attempts: number
          correct_attempts: number
          average_time_spent: number
          success_rate: number
        }[]
      }
      move_questions_to_folder: {
        Args: {
          p_question_ids: string[]
          p_target_folder_id: string
        }
        Returns: undefined
      }
      reorder_curricula_by_ids: {
        Args: {
          curriculum_ids: string[]
          new_positions: number[]
        }
        Returns: undefined
      }
    }
    Enums: {
      attempt_status: "in_progress" | "submitted" | "graded" | "completed"
      question_type:
        | "multiple_choice"
        | "true_false"
        | "short_answer"
        | "long_answer"
        | "coding"
        | "free_text"
        | "matching"
      quiz_status: "draft" | "published" | "archived"
      user_role: "student" | "teacher" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

