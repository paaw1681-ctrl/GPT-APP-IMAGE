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
      audience_contexts: {
        Row: {
          active: boolean
          id: string
          key: string
          label_pl: string
          sort_order: number
          workspace_id: string | null
        }
        Insert: {
          active?: boolean
          id?: string
          key: string
          label_pl: string
          sort_order?: number
          workspace_id?: string | null
        }
        Update: {
          active?: boolean
          id?: string
          key?: string
          label_pl?: string
          sort_order?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audience_contexts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_profiles: {
        Row: {
          content_voice: string | null
          created_at: string
          created_by: string | null
          forbidden_cliches: Json
          global_visual_rules: Json
          id: string
          language: string
          name: string
          positioning: string | null
          tone_of_voice: string | null
          updated_at: string
          updated_by: string | null
          verified_brand_facts: Json
          workspace_id: string
        }
        Insert: {
          content_voice?: string | null
          created_at?: string
          created_by?: string | null
          forbidden_cliches?: Json
          global_visual_rules?: Json
          id?: string
          language?: string
          name: string
          positioning?: string | null
          tone_of_voice?: string | null
          updated_at?: string
          updated_by?: string | null
          verified_brand_facts?: Json
          workspace_id: string
        }
        Update: {
          content_voice?: string | null
          created_at?: string
          created_by?: string | null
          forbidden_cliches?: Json
          global_visual_rules?: Json
          id?: string
          language?: string
          name?: string
          positioning?: string | null
          tone_of_voice?: string | null
          updated_at?: string
          updated_by?: string | null
          verified_brand_facts?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          created_by: string | null
          hard_limit_enabled: boolean
          id: string
          month: string
          monthly_limit_pln_cents: number
          overridden_at: string | null
          overridden_by: string | null
          threshold_100_notified_at: string | null
          threshold_50_notified_at: string | null
          threshold_80_notified_at: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_by?: string | null
          hard_limit_enabled?: boolean
          id?: string
          month: string
          monthly_limit_pln_cents?: number
          overridden_at?: string | null
          overridden_by?: string | null
          threshold_100_notified_at?: string | null
          threshold_50_notified_at?: string | null
          threshold_80_notified_at?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_by?: string | null
          hard_limit_enabled?: boolean
          id?: string
          month?: string
          monthly_limit_pln_cents?: number
          overridden_at?: string | null
          overridden_by?: string | null
          threshold_100_notified_at?: string | null
          threshold_50_notified_at?: string | null
          threshold_80_notified_at?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      concepts: {
        Row: {
          aspect_ratio: string | null
          cost_estimated_cents: number | null
          created_at: string
          created_by: string | null
          featured_subject: string | null
          id: string
          idea_text: string
          is_selected: boolean
          model: string | null
          photo_type: string
          product_id: string
          prompt_version_id: string | null
          purpose: string | null
          scenario_metadata: Json
          session_id: string
        }
        Insert: {
          aspect_ratio?: string | null
          cost_estimated_cents?: number | null
          created_at?: string
          created_by?: string | null
          featured_subject?: string | null
          id?: string
          idea_text: string
          is_selected?: boolean
          model?: string | null
          photo_type: string
          product_id: string
          prompt_version_id?: string | null
          purpose?: string | null
          scenario_metadata?: Json
          session_id: string
        }
        Update: {
          aspect_ratio?: string | null
          cost_estimated_cents?: number | null
          created_at?: string
          created_by?: string | null
          featured_subject?: string | null
          id?: string
          idea_text?: string
          is_selected?: boolean
          model?: string | null
          photo_type?: string
          product_id?: string
          prompt_version_id?: string | null
          purpose?: string | null
          scenario_metadata?: Json
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "concepts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concepts_prompt_version_id_fkey"
            columns: ["prompt_version_id"]
            isOneToOne: false
            referencedRelation: "prompt_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concepts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      content_assets: {
        Row: {
          asset_id: string
          channel: string
          created_at: string
          created_by: string | null
          id: string
          payload: Json
        }
        Insert: {
          asset_id: string
          channel: string
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
        }
        Update: {
          asset_id?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "content_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "generated_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_ledger: {
        Row: {
          amount_pln_cents: number
          amount_usd_cents: number
          category: string
          created_at: string
          created_by: string | null
          estimated: boolean
          fx_rate: number | null
          id: string
          job_id: string | null
          model: string
          provider: string
          usage: Json
          workspace_id: string
        }
        Insert: {
          amount_pln_cents?: number
          amount_usd_cents?: number
          category: string
          created_at?: string
          created_by?: string | null
          estimated?: boolean
          fx_rate?: number | null
          id?: string
          job_id?: string | null
          model: string
          provider: string
          usage?: Json
          workspace_id: string
        }
        Update: {
          amount_pln_cents?: number
          amount_usd_cents?: number
          category?: string
          created_at?: string
          created_by?: string | null
          estimated?: boolean
          fx_rate?: number | null
          id?: string
          job_id?: string | null
          model?: string
          provider?: string
          usage?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_ledger_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "generation_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_ledger_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      currency_rates: {
        Row: {
          fetched_at: string
          id: string
          rate_date: string
          source: string
          usd_pln: number
        }
        Insert: {
          fetched_at?: string
          id?: string
          rate_date: string
          source?: string
          usd_pln: number
        }
        Update: {
          fetched_at?: string
          id?: string
          rate_date?: string
          source?: string
          usd_pln?: number
        }
        Relationships: []
      }
      feedback: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          note: string | null
          reasons: Json
          sentiment: string
          user_id: string | null
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          note?: string | null
          reasons?: Json
          sentiment: string
          user_id?: string | null
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          note?: string | null
          reasons?: Json
          sentiment?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "generated_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_assets: {
        Row: {
          aspect_ratio: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          format: string
          id: string
          is_favorite: boolean
          is_kept: boolean
          job_id: string
          kind: string
          preview_path: string | null
          product_id: string
          scenario_metadata: Json
          session_id: string | null
          storage_path: string
        }
        Insert: {
          aspect_ratio?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          format?: string
          id?: string
          is_favorite?: boolean
          is_kept?: boolean
          job_id: string
          kind: string
          preview_path?: string | null
          product_id: string
          scenario_metadata?: Json
          session_id?: string | null
          storage_path: string
        }
        Update: {
          aspect_ratio?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          format?: string
          id?: string
          is_favorite?: boolean
          is_kept?: boolean
          job_id?: string
          kind?: string
          preview_path?: string | null
          product_id?: string
          scenario_metadata?: Json
          session_id?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_assets_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "generation_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_assets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_assets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_jobs: {
        Row: {
          completed_at: string | null
          concept_id: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          idempotency_key: string
          kind: string
          model_catalog_id: string | null
          parent_asset_id: string | null
          product_id: string
          prompt_snapshot: Json
          prompt_version_id: string | null
          request_params: Json
          routing_policy_id: string | null
          session_id: string | null
          started_at: string | null
          status: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          concept_id?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          idempotency_key: string
          kind: string
          model_catalog_id?: string | null
          parent_asset_id?: string | null
          product_id: string
          prompt_snapshot?: Json
          prompt_version_id?: string | null
          request_params?: Json
          routing_policy_id?: string | null
          session_id?: string | null
          started_at?: string | null
          status?: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          concept_id?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string
          kind?: string
          model_catalog_id?: string | null
          parent_asset_id?: string | null
          product_id?: string
          prompt_snapshot?: Json
          prompt_version_id?: string | null
          request_params?: Json
          routing_policy_id?: string | null
          session_id?: string | null
          started_at?: string | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_jobs_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_jobs_model_catalog_id_fkey"
            columns: ["model_catalog_id"]
            isOneToOne: false
            referencedRelation: "model_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_jobs_parent_asset_fk"
            columns: ["parent_asset_id"]
            isOneToOne: false
            referencedRelation: "generated_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_jobs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_jobs_prompt_version_id_fkey"
            columns: ["prompt_version_id"]
            isOneToOne: false
            referencedRelation: "prompt_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_jobs_routing_policy_id_fkey"
            columns: ["routing_policy_id"]
            isOneToOne: false
            referencedRelation: "routing_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_jobs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_metadata: {
        Row: {
          asset_id: string | null
          cost_actual_cents: number | null
          cost_estimated_cents: number | null
          created_at: string
          currency: string
          id: string
          job_id: string
          model: string | null
          model_params: Json
          provider_usage: Json
        }
        Insert: {
          asset_id?: string | null
          cost_actual_cents?: number | null
          cost_estimated_cents?: number | null
          created_at?: string
          currency?: string
          id?: string
          job_id: string
          model?: string | null
          model_params?: Json
          provider_usage?: Json
        }
        Update: {
          asset_id?: string | null
          cost_actual_cents?: number | null
          cost_estimated_cents?: number | null
          created_at?: string
          currency?: string
          id?: string
          job_id?: string
          model?: string | null
          model_params?: Json
          provider_usage?: Json
        }
        Relationships: [
          {
            foreignKeyName: "generation_metadata_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "generated_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_metadata_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "generation_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      model_catalog: {
        Row: {
          active: boolean
          cached_input_price: number | null
          created_at: string
          created_by: string | null
          currency: string
          effective_from: string
          id: string
          image_input_price: number | null
          image_output_price: number | null
          input_token_price: number | null
          last_verified_at: string | null
          model_id: string
          output_token_price: number | null
          price_unit: string
          provider: string
          purpose: string
          quality: string | null
          source_url: string | null
        }
        Insert: {
          active?: boolean
          cached_input_price?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string
          effective_from?: string
          id?: string
          image_input_price?: number | null
          image_output_price?: number | null
          input_token_price?: number | null
          last_verified_at?: string | null
          model_id: string
          output_token_price?: number | null
          price_unit?: string
          provider: string
          purpose: string
          quality?: string | null
          source_url?: string | null
        }
        Update: {
          active?: boolean
          cached_input_price?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string
          effective_from?: string
          id?: string
          image_input_price?: number | null
          image_output_price?: number | null
          input_token_price?: number | null
          last_verified_at?: string | null
          model_id?: string
          output_token_price?: number | null
          price_unit?: string
          provider?: string
          purpose?: string
          quality?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      product_families: {
        Row: {
          base_construction: Json
          created_at: string
          created_by: string | null
          id: string
          name: string
          product_type_id: string | null
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          base_construction?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          product_type_id?: string | null
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          base_construction?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          product_type_id?: string | null
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_families_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_families_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      product_profiles: {
        Row: {
          analysis_confidence: string | null
          analyzer_model: string | null
          clasp: Json
          cord: Json
          created_at: string
          created_by: string | null
          critical_features: Json
          element_count: number | null
          element_sequence: Json
          engraving: string | null
          forbidden_transformations: Json
          hardware: Json
          id: string
          letters: string | null
          main_colors: Json
          master_reference_id: string | null
          materials: Json
          notes: string | null
          personalization: Json
          product_family: string | null
          product_id: string
          product_name: string | null
          raw: Json
          reference_quality_notes: Json
          reference_quality_status: string | null
          relative_sizes: Json
          safety_context: string | null
          secondary_colors: Json
          shapes: Json
          silicone_elements: Json
          status: string
          text_elements: Json
          uncertain_fields: Json
          updated_at: string
          updated_by: string | null
          usage: string | null
          variant_name: string | null
          version: number
          wooden_elements: Json
        }
        Insert: {
          analysis_confidence?: string | null
          analyzer_model?: string | null
          clasp?: Json
          cord?: Json
          created_at?: string
          created_by?: string | null
          critical_features?: Json
          element_count?: number | null
          element_sequence?: Json
          engraving?: string | null
          forbidden_transformations?: Json
          hardware?: Json
          id?: string
          letters?: string | null
          main_colors?: Json
          master_reference_id?: string | null
          materials?: Json
          notes?: string | null
          personalization?: Json
          product_family?: string | null
          product_id: string
          product_name?: string | null
          raw?: Json
          reference_quality_notes?: Json
          reference_quality_status?: string | null
          relative_sizes?: Json
          safety_context?: string | null
          secondary_colors?: Json
          shapes?: Json
          silicone_elements?: Json
          status?: string
          text_elements?: Json
          uncertain_fields?: Json
          updated_at?: string
          updated_by?: string | null
          usage?: string | null
          variant_name?: string | null
          version?: number
          wooden_elements?: Json
        }
        Update: {
          analysis_confidence?: string | null
          analyzer_model?: string | null
          clasp?: Json
          cord?: Json
          created_at?: string
          created_by?: string | null
          critical_features?: Json
          element_count?: number | null
          element_sequence?: Json
          engraving?: string | null
          forbidden_transformations?: Json
          hardware?: Json
          id?: string
          letters?: string | null
          main_colors?: Json
          master_reference_id?: string | null
          materials?: Json
          notes?: string | null
          personalization?: Json
          product_family?: string | null
          product_id?: string
          product_name?: string | null
          raw?: Json
          reference_quality_notes?: Json
          reference_quality_status?: string | null
          relative_sizes?: Json
          safety_context?: string | null
          secondary_colors?: Json
          shapes?: Json
          silicone_elements?: Json
          status?: string
          text_elements?: Json
          uncertain_fields?: Json
          updated_at?: string
          updated_by?: string | null
          usage?: string | null
          variant_name?: string | null
          version?: number
          wooden_elements?: Json
        }
        Relationships: [
          {
            foreignKeyName: "product_profiles_master_reference_id_fkey"
            columns: ["master_reference_id"]
            isOneToOne: false
            referencedRelation: "product_references"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_profiles_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_references: {
        Row: {
          created_at: string
          created_by: string | null
          exif_stripped: boolean
          height: number | null
          id: string
          mime_type: string
          product_id: string
          role: string
          sort_order: number
          storage_path_original: string
          storage_path_preview: string
          storage_path_working: string
          width: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          exif_stripped?: boolean
          height?: number | null
          id?: string
          mime_type: string
          product_id: string
          role?: string
          sort_order?: number
          storage_path_original: string
          storage_path_preview: string
          storage_path_working: string
          width?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          exif_stripped?: boolean
          height?: number | null
          id?: string
          mime_type?: string
          product_id?: string
          role?: string
          sort_order?: number
          storage_path_original?: string
          storage_path_preview?: string
          storage_path_working?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_references_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_rule_packs: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          product_type_id: string
          published_at: string | null
          rules: Json
          status: string
          version: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          product_type_id: string
          published_at?: string | null
          rules?: Json
          status?: string
          version?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          product_type_id?: string
          published_at?: string | null
          rules?: Json
          status?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_rule_packs_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_rule_packs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      product_types: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          id: string
          is_default: boolean
          key: string
          label_pl: string
          sort_order: number
          workspace_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          key: string
          label_pl: string
          sort_order?: number
          workspace_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          key?: string
          label_pl?: string
          sort_order?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_types_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          approved_by_user: boolean
          created_at: string
          created_by: string | null
          family_id: string | null
          id: string
          inherited_fields: Json
          inherits_from_product_id: string | null
          overridden_fields: Json
          product_id: string
        }
        Insert: {
          approved_by_user?: boolean
          created_at?: string
          created_by?: string | null
          family_id?: string | null
          id?: string
          inherited_fields?: Json
          inherits_from_product_id?: string | null
          overridden_fields?: Json
          product_id: string
        }
        Update: {
          approved_by_user?: boolean
          created_at?: string
          created_by?: string | null
          family_id?: string | null
          id?: string
          inherited_fields?: Json
          inherits_from_product_id?: string | null
          overridden_fields?: Json
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "product_families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_inherits_from_product_id_fkey"
            columns: ["inherits_from_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          audience_context_id: string | null
          created_at: string
          created_by: string | null
          family_id: string | null
          id: string
          name: string
          product_type_confidence: string | null
          product_type_id: string | null
          product_type_label: string | null
          status: string
          updated_at: string
          updated_by: string | null
          variant_name: string | null
          workspace_id: string
        }
        Insert: {
          audience_context_id?: string | null
          created_at?: string
          created_by?: string | null
          family_id?: string | null
          id?: string
          name: string
          product_type_confidence?: string | null
          product_type_id?: string | null
          product_type_label?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          variant_name?: string | null
          workspace_id: string
        }
        Update: {
          audience_context_id?: string | null
          created_at?: string
          created_by?: string | null
          family_id?: string | null
          id?: string
          name?: string
          product_type_confidence?: string | null
          product_type_id?: string | null
          product_type_label?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          variant_name?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_audience_context_id_fkey"
            columns: ["audience_context_id"]
            isOneToOne: false
            referencedRelation: "audience_contexts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "product_families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_modules: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          module_key: string
          published_at: string | null
          status: string
          title: string
          version: number
          workspace_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          module_key: string
          published_at?: string | null
          status?: string
          title: string
          version?: number
          workspace_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          module_key?: string
          published_at?: string | null
          status?: string
          title?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_modules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          module_versions: Json
          name: string
          published_at: string | null
          status: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          module_versions?: Json
          name: string
          published_at?: string | null
          status?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          module_versions?: Json
          name?: string
          published_at?: string | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_versions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_reviews: {
        Row: {
          asset_id: string
          confidence: string | null
          created_at: string
          id: string
          issues: Json
          job_id: string | null
          model: string | null
          numerical_score: number | null
          product_fidelity: string | null
          raw: Json
          realism: string | null
          second_pass: boolean
          status: string
        }
        Insert: {
          asset_id: string
          confidence?: string | null
          created_at?: string
          id?: string
          issues?: Json
          job_id?: string | null
          model?: string | null
          numerical_score?: number | null
          product_fidelity?: string | null
          raw?: Json
          realism?: string | null
          second_pass?: boolean
          status: string
        }
        Update: {
          asset_id?: string
          confidence?: string | null
          created_at?: string
          id?: string
          issues?: Json
          job_id?: string | null
          model?: string | null
          numerical_score?: number | null
          product_fidelity?: string | null
          raw?: Json
          realism?: string | null
          second_pass?: boolean
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_reviews_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "generated_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "generation_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      routing_policies: {
        Row: {
          created_at: string
          created_by: string | null
          escalation_rule: string | null
          fallback_model_catalog_id: string | null
          id: string
          model_catalog_id: string
          published_at: string | null
          role_key: string
          status: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          escalation_rule?: string | null
          fallback_model_catalog_id?: string | null
          id?: string
          model_catalog_id: string
          published_at?: string | null
          role_key: string
          status?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          escalation_rule?: string | null
          fallback_model_catalog_id?: string | null
          id?: string
          model_catalog_id?: string
          published_at?: string | null
          role_key?: string
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routing_policies_fallback_model_catalog_id_fkey"
            columns: ["fallback_model_catalog_id"]
            isOneToOne: false
            referencedRelation: "model_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routing_policies_model_catalog_id_fkey"
            columns: ["model_catalog_id"]
            isOneToOne: false
            referencedRelation: "model_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routing_policies_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          product_id: string
          status: string
          title: string | null
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          product_id: string
          status?: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          product_id?: string
          status?: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      system_suggestions: {
        Row: {
          body: string
          created_at: string
          evidence: Json
          id: string
          kind: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          title: string
          workspace_id: string
        }
        Insert: {
          body: string
          created_at?: string
          evidence?: Json
          id?: string
          kind?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title: string
          workspace_id: string
        }
        Update: {
          body?: string
          created_at?: string
          evidence?: Json
          id?: string
          kind?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_suggestions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      test_lab_runs: {
        Row: {
          asset_a_id: string | null
          asset_b_id: string | null
          created_at: string
          created_by: string | null
          estimated_cost_cents: number | null
          id: string
          model_a: string | null
          model_b: string | null
          photo_type: string
          product_id: string
          prompt_version_a_id: string | null
          prompt_version_b_id: string | null
          result: string | null
          status: string
          workspace_id: string
        }
        Insert: {
          asset_a_id?: string | null
          asset_b_id?: string | null
          created_at?: string
          created_by?: string | null
          estimated_cost_cents?: number | null
          id?: string
          model_a?: string | null
          model_b?: string | null
          photo_type: string
          product_id: string
          prompt_version_a_id?: string | null
          prompt_version_b_id?: string | null
          result?: string | null
          status?: string
          workspace_id: string
        }
        Update: {
          asset_a_id?: string | null
          asset_b_id?: string | null
          created_at?: string
          created_by?: string | null
          estimated_cost_cents?: number | null
          id?: string
          model_a?: string | null
          model_b?: string | null
          photo_type?: string
          product_id?: string
          prompt_version_a_id?: string | null
          prompt_version_b_id?: string | null
          result?: string | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_lab_runs_asset_a_id_fkey"
            columns: ["asset_a_id"]
            isOneToOne: false
            referencedRelation: "generated_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_lab_runs_asset_b_id_fkey"
            columns: ["asset_b_id"]
            isOneToOne: false
            referencedRelation: "generated_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_lab_runs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_lab_runs_prompt_version_a_id_fkey"
            columns: ["prompt_version_a_id"]
            isOneToOne: false
            referencedRelation: "prompt_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_lab_runs_prompt_version_b_id_fkey"
            columns: ["prompt_version_b_id"]
            isOneToOne: false
            referencedRelation: "prompt_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_lab_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      trend_briefs: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          model: string | null
          status: string
          summary_points: Json
          week_of: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          model?: string | null
          status?: string
          summary_points?: Json
          week_of: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          model?: string | null
          status?: string
          summary_points?: Json
          week_of?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trend_briefs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      trend_sources: {
        Row: {
          confidence: string | null
          created_at: string
          id: string
          note: string | null
          published_at: string | null
          relevance: string | null
          title: string
          trend_brief_id: string
          url: string | null
        }
        Insert: {
          confidence?: string | null
          created_at?: string
          id?: string
          note?: string | null
          published_at?: string | null
          relevance?: string | null
          title: string
          trend_brief_id: string
          url?: string | null
        }
        Update: {
          confidence?: string | null
          created_at?: string
          id?: string
          note?: string | null
          published_at?: string | null
          relevance?: string | null
          title?: string
          trend_brief_id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trend_sources_trend_brief_id_fkey"
            columns: ["trend_brief_id"]
            isOneToOne: false
            referencedRelation: "trend_briefs"
            referencedColumns: ["id"]
          },
        ]
      }
      verified_facts: {
        Row: {
          created_at: string
          created_by: string | null
          fact_key: string
          id: string
          product_id: string | null
          scope: string
          source: string | null
          value_pl: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          fact_key: string
          id?: string
          product_id?: string | null
          scope?: string
          source?: string | null
          value_pl: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          fact_key?: string
          id?: string
          product_id?: string | null
          scope?: string
          source?: string | null
          value_pl?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verified_facts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verified_facts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_workspace_member: { Args: { ws: string }; Returns: boolean }
      workspace_of_product: { Args: { p: string }; Returns: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
