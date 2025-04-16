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
      classes: {
        Row: {
          created_at: string
          id: number
          level_id: number
          name: string
          number: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          level_id: number
          name: string
          number: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          level_id?: number
          name?: string
          number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "educational_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          resource_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          resource_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          resource_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      curricular_areas: {
        Row: {
          created_at: string
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      discipline_class: {
        Row: {
          area_id: number
          class_id: number
          code: string | null
          created_at: string
          discipline_id: number
          id: number
          updated_at: string
        }
        Insert: {
          area_id: number
          class_id: number
          code?: string | null
          created_at?: string
          discipline_id: number
          id?: number
          updated_at?: string
        }
        Update: {
          area_id?: number
          class_id?: number
          code?: string | null
          created_at?: string
          discipline_id?: number
          id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discipline_class_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "curricular_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipline_class_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipline_class_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplines: {
        Row: {
          created_at: string
          domain_id: number | null
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain_id?: number | null
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain_id?: number | null
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disciplines_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          created_at: string
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      educational_levels: {
        Row: {
          created_at: string
          id: number
          name: string
          number: number
          parent_id: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          number: number
          parent_id?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          number?: number
          parent_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "educational_levels_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "educational_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      general_competencies: {
        Row: {
          created_at: string
          discipline_id: number
          id: number
          level_id: number
          name: string
          number: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          discipline_id: number
          id?: number
          level_id: number
          name: string
          number: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          discipline_id?: number
          id?: number
          level_id?: number
          name?: string
          number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "general_competencies_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_competencies_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "educational_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          id: number
          role: Database["public"]["Enums"]["group_member_role"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: number
          role?: Database["public"]["Enums"]["group_member_role"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: number
          role?: Database["public"]["Enums"]["group_member_role"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      group_resources: {
        Row: {
          created_at: string
          group_id: string
          id: number
          resource_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: number
          resource_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: number
          resource_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_resources_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_resources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_competencies: {
        Row: {
          created_at: string
          id: number
          resource_id: string
          specific_competency_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          resource_id: string
          specific_competency_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          resource_id?: string
          specific_competency_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_competencies_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_competencies_specific_competency_id_fkey"
            columns: ["specific_competency_id"]
            isOneToOne: false
            referencedRelation: "specific_competencies"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_evaluations: {
        Row: {
          accessibility_comment: string | null
          comment_comment: string | null
          concordance_comment: string | null
          correctness_comment: string | null
          created_at: string
          description_comment: string | null
          duration_comment: string | null
          evaluator_id: string | null
          feedback: string | null
          id: string
          link_comment: string | null
          quality_comment: string | null
          relevance_comment: string | null
          resource_id: string
          specific_competence_comment: string | null
          status: Database["public"]["Enums"]["evaluation_status"] | null
          updated_at: string
          user_id: string
          value_comment: string | null
        }
        Insert: {
          accessibility_comment?: string | null
          comment_comment?: string | null
          concordance_comment?: string | null
          correctness_comment?: string | null
          created_at?: string
          description_comment?: string | null
          duration_comment?: string | null
          evaluator_id?: string | null
          feedback?: string | null
          id?: string
          link_comment?: string | null
          quality_comment?: string | null
          relevance_comment?: string | null
          resource_id: string
          specific_competence_comment?: string | null
          status?: Database["public"]["Enums"]["evaluation_status"] | null
          updated_at?: string
          user_id: string
          value_comment?: string | null
        }
        Update: {
          accessibility_comment?: string | null
          comment_comment?: string | null
          concordance_comment?: string | null
          correctness_comment?: string | null
          created_at?: string
          description_comment?: string | null
          duration_comment?: string | null
          evaluator_id?: string | null
          feedback?: string | null
          id?: string
          link_comment?: string | null
          quality_comment?: string | null
          relevance_comment?: string | null
          resource_id?: string
          specific_competence_comment?: string | null
          status?: Database["public"]["Enums"]["evaluation_status"] | null
          updated_at?: string
          user_id?: string
          value_comment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_evaluations_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_evaluations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_tags: {
        Row: {
          created_at: string
          id: number
          resource_id: string
          tag: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          resource_id: string
          tag: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          resource_id?: string
          tag?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_tags_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          author_id: string | null
          class_id: number | null
          comentarii: string | null
          created_at: string
          description: string | null
          discipline_id: number | null
          durata: string | null
          id: string
          is_public: boolean | null
          link: string | null
          mentor_id: string | null
          specific_competency_id: number | null
          status: Database["public"]["Enums"]["resource_status"] | null
          title: string
          type: string | null
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          author_id?: string | null
          class_id?: number | null
          comentarii?: string | null
          created_at?: string
          description?: string | null
          discipline_id?: number | null
          durata?: string | null
          id?: string
          is_public?: boolean | null
          link?: string | null
          mentor_id?: string | null
          specific_competency_id?: number | null
          status?: Database["public"]["Enums"]["resource_status"] | null
          title: string
          type?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          author_id?: string | null
          class_id?: number | null
          comentarii?: string | null
          created_at?: string
          description?: string | null
          discipline_id?: number | null
          durata?: string | null
          id?: string
          is_public?: boolean | null
          link?: string | null
          mentor_id?: string | null
          specific_competency_id?: number | null
          status?: Database["public"]["Enums"]["resource_status"] | null
          title?: string
          type?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_specific_competency_id_fkey"
            columns: ["specific_competency_id"]
            isOneToOne: false
            referencedRelation: "specific_competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      specific_competencies: {
        Row: {
          class_id: number
          competency_id: number
          created_at: string
          id: number
          internal_code: string | null
          name: string
          number: string | null
          updated_at: string
        }
        Insert: {
          class_id: number
          competency_id: number
          created_at?: string
          id?: number
          internal_code?: string | null
          name: string
          number?: string | null
          updated_at?: string
        }
        Update: {
          class_id?: number
          competency_id?: number
          created_at?: string
          id?: number
          internal_code?: string | null
          name?: string
          number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "specific_competencies_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specific_competencies_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "general_competencies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string
          id: number
          resource_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          resource_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          resource_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          education_level_id: number | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          status: Database["public"]["Enums"]["user_status"] | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          education_level_id?: number | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          education_level_id?: number | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_education_level_id_fkey"
            columns: ["education_level_id"]
            isOneToOne: false
            referencedRelation: "educational_levels"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      custom_access_token_hook: {
        Args: { event: Json }
        Returns: Json
      }
      is_admin: {
        Args: { uid: string }
        Returns: boolean
      }
      is_evaluator: {
        Args: { uid: string }
        Returns: boolean
      }
      is_formator: {
        Args: { uid: string }
        Returns: boolean
      }
      is_moderator: {
        Args: { uid: string }
        Returns: boolean
      }
      is_student: {
        Args: { uid: string }
        Returns: boolean
      }
    }
    Enums: {
      evaluation_status: "CONFORMABLE" | "UNCONFORMABLE" | "IN_PROGRESS"
      group_member_role: "OWNER" | "ADMIN" | "MEMBER"
      resource_status:
        | "DRAFT"
        | "SUBMITTED"
        | "IN_REVIEW"
        | "CONFORMABLE"
        | "UNCONFORMABLE"
      user_role:
        | "ADMINISTRATOR"
        | "MODERATOR"
        | "FORMATOR"
        | "EVALUATOR"
        | "STUDENT"
      user_status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      evaluation_status: ["CONFORMABLE", "UNCONFORMABLE", "IN_PROGRESS"],
      group_member_role: ["OWNER", "ADMIN", "MEMBER"],
      resource_status: [
        "DRAFT",
        "SUBMITTED",
        "IN_REVIEW",
        "CONFORMABLE",
        "UNCONFORMABLE",
      ],
      user_role: [
        "ADMINISTRATOR",
        "MODERATOR",
        "FORMATOR",
        "EVALUATOR",
        "STUDENT",
      ],
      user_status: ["ACTIVE", "INACTIVE", "SUSPENDED"],
    },
  },
} as const
