export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      allowed_users: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          email: string;
          notes: string | null;
          role: Database["public"]["Enums"]["UserRole"];
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          email: string;
          notes?: string | null;
          role: Database["public"]["Enums"]["UserRole"];
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          email?: string;
          notes?: string | null;
          role?: Database["public"]["Enums"]["UserRole"];
        };
        Relationships: [];
      };
      concerts: {
        Row: {
          abendkasse: boolean;
          free: boolean;
          id: string;
          image: string | null;
          name: string | null;
          notes: string | null;
          price: number | null;
          ticket_url: string | null;
          timestamp: string;
          type: Database["public"]["Enums"]["ConcertType"];
          venue_id: string | null;
        };
        Insert: {
          abendkasse?: boolean;
          free?: boolean;
          id: string;
          image?: string | null;
          name?: string | null;
          notes?: string | null;
          price?: number | null;
          ticket_url?: string | null;
          timestamp: string;
          type?: Database["public"]["Enums"]["ConcertType"];
          venue_id?: string | null;
        };
        Update: {
          abendkasse?: boolean;
          free?: boolean;
          id?: string;
          image?: string | null;
          name?: string | null;
          notes?: string | null;
          price?: number | null;
          ticket_url?: string | null;
          timestamp?: string;
          type?: Database["public"]["Enums"]["ConcertType"];
          venue_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "concerts_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      images: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          name: string;
          r2_key: string;
          status: Database["public"]["Enums"]["ImageStatus"];
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name: string;
          r2_key: string;
          status?: Database["public"]["Enums"]["ImageStatus"];
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string;
          r2_key?: string;
          status?: Database["public"]["Enums"]["ImageStatus"];
        };
        Relationships: [];
      };
      songs: {
        Row: {
          artist: string;
          id: number;
          is_own: boolean;
          title: string;
        };
        Insert: {
          artist: string;
          id?: number;
          is_own?: boolean;
          title: string;
        };
        Update: {
          artist?: string;
          id?: number;
          is_own?: boolean;
          title?: string;
        };
        Relationships: [];
      };
      venues: {
        Row: {
          address: string;
          city: string;
          country: string;
          id: string;
          name: string;
          postal_code: string;
          state: string;
          url: string;
        };
        Insert: {
          address: string;
          city: string;
          country: string;
          id?: string;
          name: string;
          postal_code: string;
          state: string;
          url: string;
        };
        Update: {
          address?: string;
          city?: string;
          country?: string;
          id?: string;
          name?: string;
          postal_code?: string;
          state?: string;
          url?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      count_concerts_on_date: {
        Args: { date_param: string };
        Returns: number;
      };
      delete_allowed_user: {
        Args: { p_target_email: string };
        Returns: undefined;
      };
      insert_allowed_user: {
        Args: {
          p_email: string;
          p_role?: Database["public"]["Enums"]["UserRole"];
          p_notes?: string;
        };
        Returns: {
          created_at: string | null;
          created_by: string | null;
          email: string;
          notes: string | null;
          role: Database["public"]["Enums"]["UserRole"];
        }[];
      };
      update_allowed_user: {
        Args: {
          p_target_email: string;
          p_new_role?: Database["public"]["Enums"]["UserRole"];
          p_new_notes?: string;
        };
        Returns: {
          created_at: string | null;
          created_by: string | null;
          email: string;
          notes: string | null;
          role: Database["public"]["Enums"]["UserRole"];
        }[];
      };
    };
    Enums: {
      ConcertType: "public" | "closed";
      ImageStatus: "pending" | "completed";
      UserRole: "admin" | "editor" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      ConcertType: ["public", "closed"],
      ImageStatus: ["pending", "completed"],
      UserRole: ["admin", "editor", "user"],
    },
  },
} as const;
