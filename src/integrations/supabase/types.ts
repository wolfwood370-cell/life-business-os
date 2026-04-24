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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      allowed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          birth_date: string | null
          churn_risk: string | null
          created_at: string
          email: string | null
          first_name: string | null
          gdpr_consent: boolean
          gender: string | null
          gym_expiry_date: string | null
          gym_signup_date: string | null
          id: string
          last_contacted_at: string | null
          last_name: string | null
          lead_score: number | null
          lead_source: string
          monthly_value: number | null
          name: string
          next_renewal_date: string | null
          notes: string | null
          objection_real: string
          objection_stated: string
          phone: string | null
          pipeline_stage: string
          pt_pack_sessions_used: number | null
          root_motivator: string
          stage_updated_at: string
        }
        Insert: {
          birth_date?: string | null
          churn_risk?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          gdpr_consent?: boolean
          gender?: string | null
          gym_expiry_date?: string | null
          gym_signup_date?: string | null
          id?: string
          last_contacted_at?: string | null
          last_name?: string | null
          lead_score?: number | null
          lead_source: string
          monthly_value?: number | null
          name: string
          next_renewal_date?: string | null
          notes?: string | null
          objection_real?: string
          objection_stated?: string
          phone?: string | null
          pipeline_stage: string
          pt_pack_sessions_used?: number | null
          root_motivator?: string
          stage_updated_at?: string
        }
        Update: {
          birth_date?: string | null
          churn_risk?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          gdpr_consent?: boolean
          gender?: string | null
          gym_expiry_date?: string | null
          gym_signup_date?: string | null
          id?: string
          last_contacted_at?: string | null
          last_name?: string | null
          lead_score?: number | null
          lead_source?: string
          monthly_value?: number | null
          name?: string
          next_renewal_date?: string | null
          notes?: string | null
          objection_real?: string
          objection_stated?: string
          phone?: string | null
          pipeline_stage?: string
          pt_pack_sessions_used?: number | null
          root_motivator?: string
          stage_updated_at?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      life_goals: {
        Row: {
          created_at: string
          current_savings: number
          deadline: string
          id: string
          is_active: boolean
          title: string
          total_target_amount: number
        }
        Insert: {
          created_at?: string
          current_savings?: number
          deadline: string
          id?: string
          is_active?: boolean
          title: string
          total_target_amount?: number
        }
        Update: {
          created_at?: string
          current_savings?: number
          deadline?: string
          id?: string
          is_active?: boolean
          title?: string
          total_target_amount?: number
        }
        Relationships: []
      }
      personal_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          end_date: string | null
          id: string
          is_recurring: boolean
          name: string
          start_date: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_recurring?: boolean
          name: string
          start_date?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_recurring?: boolean
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      personal_incomes: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          id: string
          name: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          id?: string
          name: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      roi_metrics: {
        Row: {
          client_id: string
          created_at: string
          date: string
          id: string
          metric: string
          note: string | null
          value: string
        }
        Insert: {
          client_id: string
          created_at?: string
          date?: string
          id?: string
          metric: string
          note?: string | null
          value: string
        }
        Update: {
          client_id?: string
          created_at?: string
          date?: string
          id?: string
          metric?: string
          note?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "roi_metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_coach_config: {
        Row: {
          created_at: string
          free_session_process: string
          id: string
          last_report_date: string | null
          latest_report: Json | null
          pt_pack_process: string
          sales_script: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          free_session_process?: string
          id?: string
          last_report_date?: string | null
          latest_report?: Json | null
          pt_pack_process?: string
          sales_script?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          free_session_process?: string
          id?: string
          last_report_date?: string | null
          latest_report?: Json | null
          pt_pack_process?: string
          sales_script?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string
          created_at: string
          duration_months: number
          id: string
          name: string
          price: number
          sort_order: number
        }
        Insert: {
          category: string
          created_at?: string
          duration_months?: number
          id?: string
          name: string
          price: number
          sort_order?: number
        }
        Update: {
          category?: string
          created_at?: string
          duration_months?: number
          id?: string
          name?: string
          price?: number
          sort_order?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          due_date: string
          id: string
          installments_count: number
          payment_date: string
          payment_method: string
          payment_type: string
          recurring_active: boolean
          recurring_stopped_at: string | null
          service_id: string | null
          status: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          due_date?: string
          id?: string
          installments_count?: number
          payment_date?: string
          payment_method?: string
          payment_type: string
          recurring_active?: boolean
          recurring_stopped_at?: string | null
          service_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          due_date?: string
          id?: string
          installments_count?: number
          payment_date?: string
          payment_method?: string
          payment_type?: string
          recurring_active?: boolean
          recurring_stopped_at?: string | null
          service_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_allowed_user: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
