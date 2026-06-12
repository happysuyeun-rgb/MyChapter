export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type ProjectType = 'emotion' | 'parenting' | 'yearly' | 'career' | 'custom'
export type RecordFrequency = 'daily' | 'week5' | 'week3' | 'week1'
export type RecordMode = 'question' | 'photo' | 'free' | 'daily'
export type RecordModeInstance = 'question' | 'photo' | 'free'
export type SubscriptionPlan = 'free' | 'pro'
export type NotificationType = 'daily_question' | 'badge' | 'chapter_complete'
export type AiFeature =
  | 'question'
  | 'freewriting_hint'
  | 'chapter'
  | 'caption_expand'
  | 'chapter_regenerate'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          nickname: string | null
          profile_emoji: string
          notification_enabled: boolean
          notification_time: string
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nickname?: string | null
          profile_emoji?: string
          notification_enabled?: boolean
          notification_time?: string
          onboarding_completed?: boolean
        }
        Update: {
          nickname?: string | null
          profile_emoji?: string
          notification_enabled?: boolean
          notification_time?: string
          onboarding_completed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          user_id: string
          type: ProjectType
          title: string
          target_count: number
          frequency: RecordFrequency
          notification_time: string
          record_mode: RecordMode
          cover_template_id: string | null
          is_completed: boolean
          started_at: string
          target_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: ProjectType
          title: string
          target_count: number
          frequency: RecordFrequency
          notification_time?: string
          record_mode?: RecordMode
          cover_template_id?: string | null
          is_completed?: boolean
          started_at?: string
          target_date?: string | null
        }
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
        Relationships: []
      }
      records: {
        Row: {
          id: string
          project_id: string
          user_id: string
          record_number: number
          mode: RecordModeInstance
          question_text: string | null
          title: string | null
          content: string
          photo_url: string | null
          emotion_tags: string[]
          chapter_id: string | null
          is_draft: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          record_number: number
          mode: RecordModeInstance
          question_text?: string | null
          title?: string | null
          content: string
          photo_url?: string | null
          emotion_tags?: string[]
          chapter_id?: string | null
          is_draft?: boolean
        }
        Update: Partial<Database['public']['Tables']['records']['Insert']>
        Relationships: []
      }
      chapters: {
        Row: {
          id: string
          project_id: string
          user_id: string
          chapter_number: number
          title: string
          ai_content: string | null
          user_content: string | null
          record_ids: string[]
          is_complete: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          chapter_number: number
          title: string
          ai_content?: string | null
          user_content?: string | null
          record_ids?: string[]
          is_complete?: boolean
          sort_order: number
        }
        Update: Partial<Database['public']['Tables']['chapters']['Insert']>
        Relationships: []
      }
      daily_questions: {
        Row: {
          id: string
          project_id: string
          user_id: string
          question: string
          question_date: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          question: string
          question_date?: string
        }
        Update: {
          question?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          title: string
          body: string
          link: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: NotificationType
          title: string
          body: string
          link?: string | null
          is_read?: boolean
        }
        Update: {
          is_read?: boolean
        }
        Relationships: []
      }
      record_drafts: {
        Row: {
          id: string
          user_id: string
          project_id: string
          mode: RecordModeInstance
          payload: Json
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          mode: RecordModeInstance
          payload: Json
          updated_at?: string
        }
        Update: {
          payload?: Json
          updated_at?: string
        }
        Relationships: []
      }
      published_books: {
        Row: {
          id: string
          project_id: string
          user_id: string
          pdf_url: string
          cover_template_id: string
          page_count: number | null
          published_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          pdf_url: string
          cover_template_id: string
          page_count?: number | null
        }
        Update: Partial<Database['public']['Tables']['published_books']['Insert']>
        Relationships: []
      }
      device_tokens: {
        Row: {
          id: string
          user_id: string
          fcm_token: string
          platform: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          fcm_token: string
          platform?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['device_tokens']['Insert']>
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: SubscriptionPlan
          started_at: string | null
          expires_at: string | null
          play_purchase_token: string | null
          play_order_id: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan?: SubscriptionPlan
          started_at?: string | null
          expires_at?: string | null
          play_purchase_token?: string | null
          play_order_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type UserProfile = Database['public']['Tables']['users']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type JournalRecord = Database['public']['Tables']['records']['Row']
export type Chapter = Database['public']['Tables']['chapters']['Row']
