export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          created_at: string
          date: string
          duration: number
          id: string
          learner_id: string
          learner_name: string
          mentor_id: string
          mentor_name: string
          price: number
          status: string
          topic: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          duration: number
          id?: string
          learner_id: string
          learner_name: string
          mentor_id: string
          mentor_name: string
          price: number
          status?: string
          topic: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          duration?: number
          id?: string
          learner_id?: string
          learner_name?: string
          mentor_id?: string
          mentor_name?: string
          price?: number
          status?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          }
        ]
      }
      mentors: {
        Row: {
          availability: Json
          avatar: string | null
          bio: string | null
          created_at: string
          experience: string
          hourly_rate: number
          id: string
          is_online: boolean
          languages: string[]
          name: string
          rating: number
          specialties: string[]
          title: string
          total_sessions: number
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          availability?: Json
          avatar?: string | null
          bio?: string | null
          created_at?: string
          experience: string
          hourly_rate: number
          id?: string
          is_online?: boolean
          languages?: string[]
          name: string
          rating?: number
          specialties?: string[]
          title: string
          total_sessions?: number
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          availability?: Json
          avatar?: string | null
          bio?: string | null
          created_at?: string
          experience?: string
          hourly_rate?: number
          id?: string
          is_online?: boolean
          languages?: string[]
          name?: string
          rating?: number
          specialties?: string[]
          title?: string
          total_sessions?: number
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "mentors_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      sessions: {
        Row: {
          created_at: string
          date: string
          duration: number
          feedback: string | null
          id: string
          learner_id: string
          learner_name: string
          mentor_id: string
          mentor_name: string
          notes: string | null
          price: number
          rating: number | null
          status: string
          topic: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          duration: number
          feedback?: string | null
          id?: string
          learner_id: string
          learner_name: string
          mentor_id: string
          mentor_name: string
          notes?: string | null
          price?: number
          rating?: number | null
          status: string
          topic: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          duration?: number
          feedback?: string | null
          id?: string
          learner_id?: string
          learner_name?: string
          mentor_id?: string
          mentor_name?: string
          notes?: string | null
          price?: number | null
          rating?: number | null
          status?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          }
        ]
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