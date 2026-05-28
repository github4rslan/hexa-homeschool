/**
 * Database type definitions.
 * In a production system, regenerate from Supabase CLI:
 *   supabase gen types typescript --project-id <ref> > types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      parents: {
        Row: {
          id: string;
          auth_user_id: string | null;
          email: string;
          full_name: string | null;
          subscription_tier: "diagnostic" | "standard" | "family";
          billing_status:
            | "trialing"
            | "active"
            | "past_due"
            | "canceled"
            | "paused";
          trial_ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          email: string;
          full_name?: string | null;
          subscription_tier?: "diagnostic" | "standard" | "family";
          billing_status?:
            | "trialing"
            | "active"
            | "past_due"
            | "canceled"
            | "paused";
          trial_ends_at?: string | null;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          email?: string;
          full_name?: string | null;
          subscription_tier?: "diagnostic" | "standard" | "family";
          billing_status?:
            | "trialing"
            | "active"
            | "past_due"
            | "canceled"
            | "paused";
          trial_ends_at?: string | null;
        };
        Relationships: [];
      };
      children: {
        Row: {
          id: string;
          parent_id: string;
          full_name: string;
          date_of_birth: string;
          send_indicators: Json | null;
          persona_schema_json: Json | null;
          target_exam_window: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          full_name: string;
          date_of_birth: string;
          send_indicators?: Json | null;
          persona_schema_json?: Json | null;
          target_exam_window?: string | null;
        };
        Update: {
          id?: string;
          parent_id?: string;
          full_name?: string;
          date_of_birth?: string;
          send_indicators?: Json | null;
          persona_schema_json?: Json | null;
          target_exam_window?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "children_parent_id_fkey";
            columns: ["parent_id"];
            referencedRelation: "parents";
            referencedColumns: ["id"];
          },
        ];
      };
      admins: {
        Row: {
          id: string;
          auth_user_id: string | null;
          email: string;
          full_name: string;
          role:
            | "super_admin"
            | "operations"
            | "curriculum"
            | "compliance"
            | "support"
            | "tutor_manager";
          is_active: boolean | null;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          email: string;
          full_name: string;
          role?:
            | "super_admin"
            | "operations"
            | "curriculum"
            | "compliance"
            | "support"
            | "tutor_manager";
          is_active?: boolean | null;
          last_login_at?: string | null;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          email?: string;
          full_name?: string;
          role?:
            | "super_admin"
            | "operations"
            | "curriculum"
            | "compliance"
            | "support"
            | "tutor_manager";
          is_active?: boolean | null;
          last_login_at?: string | null;
        };
        Relationships: [];
      };
      subject_domains: {
        Row: {
          id: string;
          academic_domain: "mathematics" | "english" | "science";
          national_spec_reference: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          academic_domain: "mathematics" | "english" | "science";
          national_spec_reference: string;
        };
        Update: {
          id?: string;
          academic_domain?: "mathematics" | "english" | "science";
          national_spec_reference?: string;
        };
        Relationships: [];
      };
      topics: {
        Row: {
          id: string;
          subject_id: string;
          topic_tag: string;
          formal_description: string;
          pre_requisite_array: string[] | null;
          difficulty_tier: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          topic_tag: string;
          formal_description: string;
          pre_requisite_array?: string[] | null;
          difficulty_tier?: number | null;
        };
        Update: {
          id?: string;
          subject_id?: string;
          topic_tag?: string;
          formal_description?: string;
          pre_requisite_array?: string[] | null;
          difficulty_tier?: number | null;
        };
        Relationships: [];
      };
      academic_lessons: {
        Row: {
          id: string;
          topic_id: string;
          sort_order: number;
          target_duration: number;
          instructional_payload_json: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          sort_order: number;
          target_duration?: number;
          instructional_payload_json?: Json;
        };
        Update: {
          id?: string;
          topic_id?: string;
          sort_order?: number;
          target_duration?: number;
          instructional_payload_json?: Json;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      subscription_tier: "diagnostic" | "standard" | "family";
      billing_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "paused";
      academic_domain: "mathematics" | "english" | "science";
      competence_state: "locked" | "training" | "certified";
      session_status: "in_progress" | "completed" | "abandoned" | "escalated";
    };
    CompositeTypes: Record<string, never>;
  };
}
