export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_tasks: {
        Row: {
          action: string
          assessment_id: string | null
          created_at: string
          due_date: string | null
          id: string
          owner: string
          status: string
          updated_at: string
        }
        Insert: {
          action: string
          assessment_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          owner?: string
          status?: string
          updated_at?: string
        }
        Update: {
          action?: string
          assessment_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          owner?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_tasks_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "roi_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_settings: {
        Row: {
          admin_notify_emails: string[]
          admin_notify_on_booking: boolean
          admin_notify_on_gp_complete: boolean
          admin_notify_on_proposal_accepted: boolean
          auto_prepare_proposal_on_gp_complete: boolean
          auto_qualify_enabled: boolean
          auto_send_gameplan_on_st_complete: boolean
          auto_send_invite_on_qualify: boolean
          created_at: string
          id: string
          roi_threshold_percent: number
          updated_at: string
        }
        Insert: {
          admin_notify_emails?: string[]
          admin_notify_on_booking?: boolean
          admin_notify_on_gp_complete?: boolean
          admin_notify_on_proposal_accepted?: boolean
          auto_prepare_proposal_on_gp_complete?: boolean
          auto_qualify_enabled?: boolean
          auto_send_gameplan_on_st_complete?: boolean
          auto_send_invite_on_qualify?: boolean
          created_at?: string
          id?: string
          roi_threshold_percent?: number
          updated_at?: string
        }
        Update: {
          admin_notify_emails?: string[]
          admin_notify_on_booking?: boolean
          admin_notify_on_gp_complete?: boolean
          admin_notify_on_proposal_accepted?: boolean
          auto_prepare_proposal_on_gp_complete?: boolean
          auto_qualify_enabled?: boolean
          auto_send_gameplan_on_st_complete?: boolean
          auto_send_invite_on_qualify?: boolean
          created_at?: string
          id?: string
          roi_threshold_percent?: number
          updated_at?: string
        }
        Relationships: []
      }
      client_artifacts: {
        Row: {
          artifact_type: string
          assessment_id: string
          content: string | null
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          artifact_type?: string
          assessment_id: string
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          artifact_type?: string
          assessment_id?: string
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_artifacts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "roi_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      client_interviews: {
        Row: {
          assessment_id: string
          audio_file_url: string | null
          calendly_event_id: string | null
          call_completed: boolean | null
          content: string | null
          created_at: string
          id: string
          interview_type: string
          interviewed_at: string
          scheduled_at: string | null
          title: string
          transcript: string | null
          zoom_link: string | null
        }
        Insert: {
          assessment_id: string
          audio_file_url?: string | null
          calendly_event_id?: string | null
          call_completed?: boolean | null
          content?: string | null
          created_at?: string
          id?: string
          interview_type?: string
          interviewed_at?: string
          scheduled_at?: string | null
          title?: string
          transcript?: string | null
          zoom_link?: string | null
        }
        Update: {
          assessment_id?: string
          audio_file_url?: string | null
          calendly_event_id?: string | null
          call_completed?: boolean | null
          content?: string | null
          created_at?: string
          id?: string
          interview_type?: string
          interviewed_at?: string
          scheduled_at?: string | null
          title?: string
          transcript?: string | null
          zoom_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_interviews_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "roi_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      deep_dive_submissions: {
        Row: {
          additional_notes: string | null
          assessment_id: string
          budget_comfort: string | null
          competitors: string | null
          created_at: string
          current_tools: string | null
          current_website: string | null
          decision_maker_name: string | null
          decision_maker_role: string | null
          decision_timeline: string | null
          id: string
          must_have_features: string | null
          nice_to_have_features: string | null
          pain_points: string | null
          primary_goals: string[] | null
          required_integrations: string[] | null
          timeline: string | null
        }
        Insert: {
          additional_notes?: string | null
          assessment_id: string
          budget_comfort?: string | null
          competitors?: string | null
          created_at?: string
          current_tools?: string | null
          current_website?: string | null
          decision_maker_name?: string | null
          decision_maker_role?: string | null
          decision_timeline?: string | null
          id?: string
          must_have_features?: string | null
          nice_to_have_features?: string | null
          pain_points?: string | null
          primary_goals?: string[] | null
          required_integrations?: string[] | null
          timeline?: string | null
        }
        Update: {
          additional_notes?: string | null
          assessment_id?: string
          budget_comfort?: string | null
          competitors?: string | null
          created_at?: string
          current_tools?: string | null
          current_website?: string | null
          decision_maker_name?: string | null
          decision_maker_role?: string | null
          decision_timeline?: string | null
          id?: string
          must_have_features?: string | null
          nice_to_have_features?: string | null
          pain_points?: string | null
          primary_goals?: string[] | null
          required_integrations?: string[] | null
          timeline?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deep_dive_submissions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "roi_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string
          description: string | null
          from_email: string
          from_name: string
          html_body: string
          id: string
          name: string
          subject: string
          template_key: string
          trigger_description: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          from_email?: string
          from_name?: string
          html_body: string
          id?: string
          name: string
          subject: string
          template_key: string
          trigger_description?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          from_email?: string
          from_name?: string
          html_body?: string
          id?: string
          name?: string
          subject?: string
          template_key?: string
          trigger_description?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      lead_notes: {
        Row: {
          assessment_id: string
          content: string
          created_at: string
          id: string
          note_type: string
        }
        Insert: {
          assessment_id: string
          content: string
          created_at?: string
          id?: string
          note_type?: string
        }
        Update: {
          assessment_id?: string
          content?: string
          created_at?: string
          id?: string
          note_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "roi_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          accepted: boolean | null
          accepted_at: string | null
          assessment_id: string
          created_at: string
          id: string
          proposal_data: Json
          sent_at: string
        }
        Insert: {
          accepted?: boolean | null
          accepted_at?: string | null
          assessment_id: string
          created_at?: string
          id?: string
          proposal_data?: Json
          sent_at?: string
        }
        Update: {
          accepted?: boolean | null
          accepted_at?: string | null
          assessment_id?: string
          created_at?: string
          id?: string
          proposal_data?: Json
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "roi_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      refinement_questions: {
        Row: {
          answer: string | null
          assessment_id: string
          category: string
          created_at: string
          id: string
          priority: string
          question: string
          sent_to_client: boolean
          sort_order: number
          source_context: string | null
          source_type: string
          status: string
          updated_at: string
        }
        Insert: {
          answer?: string | null
          assessment_id: string
          category?: string
          created_at?: string
          id?: string
          priority?: string
          question: string
          sent_to_client?: boolean
          sort_order?: number
          source_context?: string | null
          source_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          answer?: string | null
          assessment_id?: string
          category?: string
          created_at?: string
          id?: string
          priority?: string
          question?: string
          sent_to_client?: boolean
          sort_order?: number
          source_context?: string | null
          source_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refinement_questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "roi_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      refinement_tokens: {
        Row: {
          assessment_id: string
          created_at: string
          expires_at: string
          id: string
          questions_sent: number
          token: string
          used: boolean
        }
        Insert: {
          assessment_id: string
          created_at?: string
          expires_at?: string
          id?: string
          questions_sent?: number
          token?: string
          used?: boolean
        }
        Update: {
          assessment_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          questions_sent?: number
          token?: string
          used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "refinement_tokens_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "roi_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      roi_assessments: {
        Row: {
          business_name: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          discovery_answers: Json | null
          discovery_checklist: Json | null
          discovery_ready: boolean | null
          follow_up_days: number | null
          follow_up_scheduled_at: string | null
          follow_up_sent: boolean | null
          form_data: Json
          id: string
          industry: string | null
          industry_id: string | null
          invite_sent: boolean | null
          invite_sent_at: string | null
          is_qualified: boolean
          pipeline_stage: Database["public"]["Enums"]["pipeline_stage"]
          proposal_follow_up_days: number | null
          proposal_follow_up_scheduled_at: string | null
          proposal_follow_up_sent: boolean | null
          proposal_sent_at: string | null
          qualified_at: string | null
          report_sent: boolean | null
          roi_results: Json
          scoping_sent: boolean | null
          scoping_sent_at: string | null
          stage_reminder_days: number | null
          stage_reminder_scheduled_at: string | null
          stage_reminder_sent: boolean | null
          tech_stack: Json | null
        }
        Insert: {
          business_name?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          discovery_answers?: Json | null
          discovery_checklist?: Json | null
          discovery_ready?: boolean | null
          follow_up_days?: number | null
          follow_up_scheduled_at?: string | null
          follow_up_sent?: boolean | null
          form_data?: Json
          id?: string
          industry?: string | null
          industry_id?: string | null
          invite_sent?: boolean | null
          invite_sent_at?: string | null
          is_qualified?: boolean
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"]
          proposal_follow_up_days?: number | null
          proposal_follow_up_scheduled_at?: string | null
          proposal_follow_up_sent?: boolean | null
          proposal_sent_at?: string | null
          qualified_at?: string | null
          report_sent?: boolean | null
          roi_results?: Json
          scoping_sent?: boolean | null
          scoping_sent_at?: string | null
          stage_reminder_days?: number | null
          stage_reminder_scheduled_at?: string | null
          stage_reminder_sent?: boolean | null
          tech_stack?: Json | null
        }
        Update: {
          business_name?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          discovery_answers?: Json | null
          discovery_checklist?: Json | null
          discovery_ready?: boolean | null
          follow_up_days?: number | null
          follow_up_scheduled_at?: string | null
          follow_up_sent?: boolean | null
          form_data?: Json
          id?: string
          industry?: string | null
          industry_id?: string | null
          invite_sent?: boolean | null
          invite_sent_at?: string | null
          is_qualified?: boolean
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"]
          proposal_follow_up_days?: number | null
          proposal_follow_up_scheduled_at?: string | null
          proposal_follow_up_sent?: boolean | null
          proposal_sent_at?: string | null
          qualified_at?: string | null
          report_sent?: boolean | null
          roi_results?: Json
          scoping_sent?: boolean | null
          scoping_sent_at?: string | null
          stage_reminder_days?: number | null
          stage_reminder_scheduled_at?: string | null
          stage_reminder_sent?: boolean | null
          tech_stack?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "roi_assessments_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "scoping_industries"
            referencedColumns: ["id"]
          },
        ]
      }
      scoping_categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          industry_id: string
          label: string
          phase: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          industry_id: string
          label: string
          phase?: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          industry_id?: string
          label?: string
          phase?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "scoping_categories_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "scoping_industries"
            referencedColumns: ["id"]
          },
        ]
      }
      scoping_industries: {
        Row: {
          available: boolean
          created_at: string
          description: string
          examples: string[] | null
          id: string
          label: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          available?: boolean
          created_at?: string
          description?: string
          examples?: string[] | null
          id?: string
          label: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          available?: boolean
          created_at?: string
          description?: string
          examples?: string[] | null
          id?: string
          label?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      scoping_questions: {
        Row: {
          category_id: string
          created_at: string
          detail_prompt: string
          id: string
          options: Json
          question: string
          question_type: string
          sort_order: number
        }
        Insert: {
          category_id: string
          created_at?: string
          detail_prompt?: string
          id?: string
          options?: Json
          question: string
          question_type?: string
          sort_order?: number
        }
        Update: {
          category_id?: string
          created_at?: string
          detail_prompt?: string
          id?: string
          options?: Json
          question?: string
          question_type?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "scoping_questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "scoping_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      scoping_responses: {
        Row: {
          assessment_id: string
          completed: boolean | null
          created_at: string
          id: string
          industry: string
          responses: Json
          skipped_categories: string[] | null
          updated_at: string
        }
        Insert: {
          assessment_id: string
          completed?: boolean | null
          created_at?: string
          id?: string
          industry: string
          responses?: Json
          skipped_categories?: string[] | null
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          completed?: boolean | null
          created_at?: string
          id?: string
          industry?: string
          responses?: Json
          skipped_categories?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scoping_responses_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "roi_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      straight_talk_responses: {
        Row: {
          assessment_id: string
          completed: boolean | null
          created_at: string
          id: string
          industry: string
          responses: Json
          updated_at: string
        }
        Insert: {
          assessment_id: string
          completed?: boolean | null
          created_at?: string
          id?: string
          industry: string
          responses?: Json
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          completed?: boolean | null
          created_at?: string
          id?: string
          industry?: string
          responses?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "straight_talk_responses_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "roi_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          assessment_id: string
          created_at: string
          date: string
          hours: number
          id: string
          notes: string | null
          team_member: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          date?: string
          hours?: number
          id?: string
          notes?: string | null
          team_member?: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          date?: string
          hours?: number
          id?: string
          notes?: string | null
          team_member?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "roi_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      training_registrations: {
        Row: {
          business_name: string | null
          created_at: string
          email: string
          id: string
          industry: string | null
          name: string
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          email: string
          id?: string
          industry?: string | null
          name: string
        }
        Update: {
          business_name?: string | null
          created_at?: string
          email?: string
          id?: string
          industry?: string | null
          name?: string
        }
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
      pipeline_stage:
        | "assessment"
        | "qualified"
        | "deep_dive_sent"
        | "deep_dive_complete"
        | "discovery_call"
        | "proposal"
        | "signed"
        | "build_refinement"
        | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      pipeline_stage: [
        "assessment",
        "qualified",
        "deep_dive_sent",
        "deep_dive_complete",
        "discovery_call",
        "proposal",
        "signed",
        "build_refinement",
        "completed",
      ],
    },
  },
} as const
