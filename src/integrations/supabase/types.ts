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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      asset_text: {
        Row: {
          alt: string | null
          asset_id: string
          title: string | null
        }
        Insert: {
          alt?: string | null
          asset_id: string
          title?: string | null
        }
        Update: {
          alt?: string | null
          asset_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_text_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: true
            referencedRelation: "asset"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_text_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: true
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          ip_address: string | null
          last_seen: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          last_seen?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          last_seen?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      asset: {
        Row: {
          alt_text: string | null
          categories: string[] | null
          color_palette_hex: string[] | null
          created_at: string | null
          created_by: string | null
          current_version: number | null
          description: string | null
          dominant_color_hex: string | null
          duration_sec: number | null
          ext: string | null
          file_path: string | null
          filename: string | null
          height: number | null
          id: string | null
          is_archived: boolean | null
          kind:
            | "image"
            | "video"
            | "audio"
            | "document"
            | "vector"
            | "archive"
            | "other"
            | null
          mime_type: string | null
          org_id: string | null
          original_filename: string | null
          phash64: number | null
          sha256_hex: string | null
          size_bytes: number | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          updated_by: string | null
          usage_count_cached: number | null
          visibility: "private" | "internal" | "public" | null
          width: number | null
        }
        Relationships: []
      }
      assets: {
        Row: {
          categories: string[] | null
          color_palette_hex: string[] | null
          created_at: string | null
          created_by: string | null
          current_version: number | null
          dominant_color_hex: string | null
          duration_sec: number | null
          ext: string | null
          file_path: string | null
          height: number | null
          id: string | null
          is_archived: boolean | null
          kind:
            | "image"
            | "video"
            | "audio"
            | "document"
            | "vector"
            | "archive"
            | "other"
            | null
          mime_type: string | null
          org_id: string | null
          original_filename: string | null
          phash64: number | null
          sha256_hex: string | null
          size_bytes: number | null
          updated_at: string | null
          updated_by: string | null
          usage_count_cached: number | null
          visibility: "private" | "internal" | "public" | null
          width: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_asset_with_details: {
        Args: {
          _duration_sec: number
          _ext: string
          _height: number
          _kind:
            | "image"
            | "video"
            | "audio"
            | "document"
            | "vector"
            | "archive"
            | "other"
          _mime_type: string
          _org_id: string
          _original_filename: string
          _size_bytes: number
          _storage_key: string
          _title_text: string
          _user_id: string
          _width: number
        }
        Returns: {
          alt_text: string
          categories: string[]
          category: string
          created_at: string
          description: string
          duration: number
          file_path: string
          file_size: number
          file_type: string
          filename: string
          folder_path: string
          height: number
          id: string
          mime_type: string
          original_filename: string
          tags: string[]
          title: string
          updated_at: string
          user_id: string
          width: number
        }[]
      }
      delete_asset: {
        Args: { asset_id_to_delete: string }
        Returns: string
      }
      get_asset_storage_key: {
        Args: { p_asset_id: string }
        Returns: string
      }
      get_assets_with_usage: {
        Args: Record<PropertyKey, never>
        Returns: {
          alt_text: string
          categories: string[]
          category: string
          created_at: string
          description: string
          duration: number
          file_path: string
          file_size: number
          file_type: string
          filename: string
          folder_path: string
          height: number
          id: string
          mime_type: string
          original_filename: string
          tags: string[]
          title: string
          updated_at: string
          usage_count: number
          usage_locations: string[]
          user_id: string
          width: number
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      has_totp: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      my_sessions: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          id: string
          updated_at: string
          user_agent: string
        }[]
      }
      rename_asset: {
        Args: { asset_id: string; new_ext: string; new_filename: string }
        Returns: undefined
      }
      set_asset_storage_key: {
        Args: { p_asset_id: string; p_new_storage_key: string }
        Returns: undefined
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      unaccent: {
        Args: { "": string }
        Returns: string
      }
      unaccent_init: {
        Args: { "": unknown }
        Returns: unknown
      }
      upsert_asset_text: {
        Args: {
          p_alt?: string
          p_asset_id: string
          p_desc?: string
          p_lang?: string
          p_title?: string
        }
        Returns: undefined
      }
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
