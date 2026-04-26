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
      bank_accounts: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          type?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          kind: string
          name: string
          scope: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          name: string
          scope?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          name?: string
          scope?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          actual_price: number | null
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
          service_sold: string | null
          stage_updated_at: string
          training_end_date: string | null
          training_start_date: string | null
        }
        Insert: {
          actual_price?: number | null
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
          service_sold?: string | null
          stage_updated_at?: string
          training_end_date?: string | null
          training_start_date?: string | null
        }
        Update: {
          actual_price?: number | null
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
          service_sold?: string | null
          stage_updated_at?: string
          training_end_date?: string | null
          training_start_date?: string | null
        }
        Relationships: []
      }
      financial_movements: {
        Row: {
          account_id: string
          actual_price: number | null
          amount: number
          category_id: string | null
          classification: string
          client_id: string | null
          created_at: string
          date: string
          description: string
          external_ref: string | null
          id: string
          is_recurring: boolean
          is_reviewed: boolean
          notes: string | null
          recurrence_type: string
          recurrence_value: number | null
          service_sold: string | null
          source: string
          type: string
          updated_at: string
        }
        Insert: {
          account_id: string
          actual_price?: number | null
          amount?: number
          category_id?: string | null
          classification?: string
          client_id?: string | null
          created_at?: string
          date?: string
          description?: string
          external_ref?: string | null
          id?: string
          is_recurring?: boolean
          is_reviewed?: boolean
          notes?: string | null
          recurrence_type?: string
          recurrence_value?: number | null
          service_sold?: string | null
          source?: string
          type: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          actual_price?: number | null
          amount?: number
          category_id?: string | null
          classification?: string
          client_id?: string | null
          created_at?: string
          date?: string
          description?: string
          external_ref?: string | null
          id?: string
          is_recurring?: boolean
          is_reviewed?: boolean
          notes?: string | null
          recurrence_type?: string
          recurrence_value?: number | null
          service_sold?: string | null
          source?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_movements_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_movements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
