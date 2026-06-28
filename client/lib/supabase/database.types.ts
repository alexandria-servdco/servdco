/**
 * Generated from cloud Supabase project.
 * Regenerate: SUPABASE_DB_URL=... node supabase/scripts/generate-types.mjs
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string
          actor_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          metadata: Json
          created_at: string
        };
        Insert: {
          id?: string | null
          actor_id?: string | null
          action: string | null
          entity_type: string | null
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          created_at?: string | null
        };
        Update: {
          id?: string | null
          actor_id?: string | null
          action?: string | null
          entity_type?: string | null
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          created_at?: string | null
        };
        Relationships: [];
      };
      booking_addresses: {
        Row: {
          id: string
          booking_id: string
          street_address: string
          apartment: string | null
          city: string
          state: string
          zip: string
          country: string
          latitude: number | null
          longitude: number | null
          location_notes: string | null
          created_at: string
        };
        Insert: {
          id?: string | null
          booking_id: string | null
          street_address: string | null
          apartment?: string | null
          city: string | null
          state: string | null
          zip: string | null
          country?: string | null
          latitude?: number | null
          longitude?: number | null
          location_notes?: string | null
          created_at?: string | null
        };
        Update: {
          id?: string | null
          booking_id?: string | null
          street_address?: string | null
          apartment?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          country?: string | null
          latitude?: number | null
          longitude?: number | null
          location_notes?: string | null
          created_at?: string | null
        };
        Relationships: [];
      };
      booking_status_history: {
        Row: {
          id: string
          booking_id: string
          from_status: Database["public"]["Enums"]["booking_status"] | null
          to_status: Database["public"]["Enums"]["booking_status"]
          changed_by: string | null
          reason: string | null
          metadata: Json
          created_at: string
        };
        Insert: {
          id?: string | null
          booking_id: string | null
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          to_status: Database["public"]["Enums"]["booking_status"] | null
          changed_by?: string | null
          reason?: string | null
          metadata?: Json | null
          created_at?: string | null
        };
        Update: {
          id?: string | null
          booking_id?: string | null
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          to_status?: Database["public"]["Enums"]["booking_status"] | null
          changed_by?: string | null
          reason?: string | null
          metadata?: Json | null
          created_at?: string | null
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string
          family_id: string
          chef_profile_id: string
          service_type: Database["public"]["Enums"]["service_type"]
          booking_date: string
          booking_time: string | null
          guests_count: number
          price_cents: number
          platform_fee_cents: number
          cook_payout_cents: number
          currency: string
          status: Database["public"]["Enums"]["booking_status"]
          notes: string | null
          stripe_payment_intent_id: string | null
          payment_id: string | null
          cancelled_by: string | null
          cancellation_reason: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          booking_end_time: string | null
          special_instructions: string | null
          dietary_restrictions: string[]
          allergies: string | null
          parking_instructions: string | null
          gate_code: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          family_confirmed_at: string | null
          metadata: Json
          meal_request: string | null
          ingredients_available: string | null
          recipe_notes: string | null
          family_platform_fee_cents: number
        };
        Insert: {
          id?: string | null
          family_id: string | null
          chef_profile_id: string | null
          service_type: Database["public"]["Enums"]["service_type"] | null
          booking_date: string | null
          booking_time?: string | null
          guests_count?: number | null
          price_cents: number | null
          platform_fee_cents?: number | null
          cook_payout_cents?: number | null
          currency?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          notes?: string | null
          stripe_payment_intent_id?: string | null
          payment_id?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          booking_end_time?: string | null
          special_instructions?: string | null
          dietary_restrictions?: string[] | null
          allergies?: string | null
          parking_instructions?: string | null
          gate_code?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          family_confirmed_at?: string | null
          metadata?: Json | null
          meal_request?: string | null
          ingredients_available?: string | null
          recipe_notes?: string | null
          family_platform_fee_cents?: number | null
        };
        Update: {
          id?: string | null
          family_id?: string | null
          chef_profile_id?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          booking_date?: string | null
          booking_time?: string | null
          guests_count?: number | null
          price_cents?: number | null
          platform_fee_cents?: number | null
          cook_payout_cents?: number | null
          currency?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          notes?: string | null
          stripe_payment_intent_id?: string | null
          payment_id?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          booking_end_time?: string | null
          special_instructions?: string | null
          dietary_restrictions?: string[] | null
          allergies?: string | null
          parking_instructions?: string | null
          gate_code?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          family_confirmed_at?: string | null
          metadata?: Json | null
          meal_request?: string | null
          ingredients_available?: string | null
          recipe_notes?: string | null
          family_platform_fee_cents?: number | null
        };
        Relationships: [];
      };
      career_applications: {
        Row: {
          id: string
          job_id: string | null
          name: string
          email: string
          phone: string | null
          linkedin: string | null
          portfolio: string | null
          resume_storage_path: string | null
          resume_bucket: string
          cover_letter: string | null
          status: Database["public"]["Enums"]["career_application_status"]
          notes: string | null
          created_at: string
          updated_at: string
        };
        Insert: {
          id?: string | null
          job_id?: string | null
          name: string | null
          email: string | null
          phone?: string | null
          linkedin?: string | null
          portfolio?: string | null
          resume_storage_path?: string | null
          resume_bucket?: string | null
          cover_letter?: string | null
          status?: Database["public"]["Enums"]["career_application_status"] | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        };
        Update: {
          id?: string | null
          job_id?: string | null
          name?: string | null
          email?: string | null
          phone?: string | null
          linkedin?: string | null
          portfolio?: string | null
          resume_storage_path?: string | null
          resume_bucket?: string | null
          cover_letter?: string | null
          status?: Database["public"]["Enums"]["career_application_status"] | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        };
        Relationships: [];
      };
      career_jobs: {
        Row: {
          id: string
          title: string
          department: string
          location: string
          employment_type: string
          salary_range: string | null
          description: string
          requirements: string | null
          benefits: string | null
          status: Database["public"]["Enums"]["career_job_status"]
          published_at: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          deleted_at: string | null
          deleted_by: string | null
        };
        Insert: {
          id?: string | null
          title: string | null
          department?: string | null
          location?: string | null
          employment_type?: string | null
          salary_range?: string | null
          description: string | null
          requirements?: string | null
          benefits?: string | null
          status?: Database["public"]["Enums"]["career_job_status"] | null
          published_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        };
        Update: {
          id?: string | null
          title?: string | null
          department?: string | null
          location?: string | null
          employment_type?: string | null
          salary_range?: string | null
          description?: string | null
          requirements?: string | null
          benefits?: string | null
          status?: Database["public"]["Enums"]["career_job_status"] | null
          published_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        };
        Relationships: [];
      };
      chef_availability: {
        Row: {
          id: string
          chef_profile_id: string
          day_of_week: number
          time_slots: Json
          recurring: boolean
          effective_from: string | null
          effective_until: string | null
          timezone: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        };
        Insert: {
          id?: string | null
          chef_profile_id: string | null
          day_of_week: number | null
          time_slots?: Json | null
          recurring?: boolean | null
          effective_from?: string | null
          effective_until?: string | null
          timezone?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        };
        Update: {
          id?: string | null
          chef_profile_id?: string | null
          day_of_week?: number | null
          time_slots?: Json | null
          recurring?: boolean | null
          effective_from?: string | null
          effective_until?: string | null
          timezone?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        };
        Relationships: [];
      };
      chef_documents: {
        Row: {
          id: string
          chef_profile_id: string
          document_type: Database["public"]["Enums"]["document_type"]
          storage_bucket: string
          storage_path: string
          status: Database["public"]["Enums"]["document_status"]
          reviewed_by: string | null
          review_notes: string | null
          submitted_at: string
          reviewed_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        };
        Insert: {
          id?: string | null
          chef_profile_id: string | null
          document_type: Database["public"]["Enums"]["document_type"] | null
          storage_bucket?: string | null
          storage_path: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          reviewed_by?: string | null
          review_notes?: string | null
          submitted_at?: string | null
          reviewed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        };
        Update: {
          id?: string | null
          chef_profile_id?: string | null
          document_type?: Database["public"]["Enums"]["document_type"] | null
          storage_bucket?: string | null
          storage_path?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          reviewed_by?: string | null
          review_notes?: string | null
          submitted_at?: string | null
          reviewed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        };
        Relationships: [];
      };
      chef_portfolio_images: {
        Row: {
          id: string
          chef_profile_id: string
          storage_bucket: string
          storage_path: string
          public_url: string | null
          alt_text: string | null
          sort_order: number
          is_public: boolean
          mime_type: string | null
          file_size_bytes: number | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        };
        Insert: {
          id?: string | null
          chef_profile_id: string | null
          storage_bucket?: string | null
          storage_path: string | null
          public_url?: string | null
          alt_text?: string | null
          sort_order?: number | null
          is_public?: boolean | null
          mime_type?: string | null
          file_size_bytes?: number | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        };
        Update: {
          id?: string | null
          chef_profile_id?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          public_url?: string | null
          alt_text?: string | null
          sort_order?: number | null
          is_public?: boolean | null
          mime_type?: string | null
          file_size_bytes?: number | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        };
        Relationships: [];
      };
      chef_profile_views: {
        Row: {
          id: string
          chef_profile_id: string
          viewer_profile_id: string | null
          source: string
          created_at: string
        };
        Insert: {
          id?: string | null
          chef_profile_id: string | null
          viewer_profile_id?: string | null
          source?: string | null
          created_at?: string | null
        };
        Update: {
          id?: string | null
          chef_profile_id?: string | null
          viewer_profile_id?: string | null
          source?: string | null
          created_at?: string | null
        };
        Relationships: [];
      };
      chef_profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string
          headline: string | null
          bio: string | null
          cuisines: string[]
          years_experience: number | null
          service_types: Json
          location: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          premium_status: boolean
          profile_visibility: Database["public"]["Enums"]["profile_visibility"]
          admin_visibility_override: Database["public"]["Enums"]["admin_visibility_override"]
          bookings_count: number
          rating: number
          reviews_count: number
          stripe_account_ref: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          verification_rejection_reason: string | null
          verification_rejected_at: string | null
          suspension_reason: string | null
          service_radius_miles: number | null
        };
        Insert: {
          id?: string | null
          user_id: string | null
          display_name: string | null
          headline?: string | null
          bio?: string | null
          cuisines?: string[] | null
          years_experience?: number | null
          service_types?: Json | null
          location?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"] | null
          premium_status?: boolean | null
          profile_visibility?: Database["public"]["Enums"]["profile_visibility"] | null
          admin_visibility_override?: Database["public"]["Enums"]["admin_visibility_override"] | null
          bookings_count?: number | null
          rating?: number | null
          reviews_count?: number | null
          stripe_account_ref?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          verification_rejection_reason?: string | null
          verification_rejected_at?: string | null
          suspension_reason?: string | null
          service_radius_miles?: number | null
        };
        Update: {
          id?: string | null
          user_id?: string | null
          display_name?: string | null
          headline?: string | null
          bio?: string | null
          cuisines?: string[] | null
          years_experience?: number | null
          service_types?: Json | null
          location?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"] | null
          premium_status?: boolean | null
          profile_visibility?: Database["public"]["Enums"]["profile_visibility"] | null
          admin_visibility_override?: Database["public"]["Enums"]["admin_visibility_override"] | null
          bookings_count?: number | null
          rating?: number | null
          reviews_count?: number | null
          stripe_account_ref?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          verification_rejection_reason?: string | null
          verification_rejected_at?: string | null
          suspension_reason?: string | null
          service_radius_miles?: number | null
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string
          full_name: string
          email: string
          message: string
          status: Database["public"]["Enums"]["contact_status"]
          created_at: string
          updated_at: string
          handled_by: string | null
          subject: string | null
        };
        Insert: {
          id?: string | null
          full_name: string | null
          email: string | null
          message: string | null
          status?: Database["public"]["Enums"]["contact_status"] | null
          created_at?: string | null
          updated_at?: string | null
          handled_by?: string | null
          subject?: string | null
        };
        Update: {
          id?: string | null
          full_name?: string | null
          email?: string | null
          message?: string | null
          status?: Database["public"]["Enums"]["contact_status"] | null
          created_at?: string | null
          updated_at?: string | null
          handled_by?: string | null
          subject?: string | null
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string
          booking_id: string | null
          family_id: string
          chef_profile_id: string
          last_message_at: string | null
          created_at: string
          archived_at: string | null
        };
        Insert: {
          id?: string | null
          booking_id?: string | null
          family_id: string | null
          chef_profile_id: string | null
          last_message_at?: string | null
          created_at?: string | null
          archived_at?: string | null
        };
        Update: {
          id?: string | null
          booking_id?: string | null
          family_id?: string | null
          chef_profile_id?: string | null
          last_message_at?: string | null
          created_at?: string | null
          archived_at?: string | null
        };
        Relationships: [];
      };
      cook_payouts: {
        Row: {
          id: string
          transfer_id: string | null
          chef_profile_id: string
          stripe_payout_id: string
          amount_cents: number
          currency: string
          status: string
          arrival_date: string | null
          metadata: Json
          created_at: string
        };
        Insert: {
          id?: string | null
          transfer_id?: string | null
          chef_profile_id: string | null
          stripe_payout_id: string | null
          amount_cents: number | null
          currency?: string | null
          status?: string | null
          arrival_date?: string | null
          metadata?: Json | null
          created_at?: string | null
        };
        Update: {
          id?: string | null
          transfer_id?: string | null
          chef_profile_id?: string | null
          stripe_payout_id?: string | null
          amount_cents?: number | null
          currency?: string | null
          status?: string | null
          arrival_date?: string | null
          metadata?: Json | null
          created_at?: string | null
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          family_id: string
          chef_profile_id: string
          created_at: string
        };
        Insert: {
          family_id: string | null
          chef_profile_id: string | null
          created_at?: string | null
        };
        Update: {
          family_id?: string | null
          chef_profile_id?: string | null
          created_at?: string | null
        };
        Relationships: [];
      };
      feature_flags: {
        Row: {
          key: string
          enabled: boolean
          description: string | null
          metadata: Json
          created_at: string
          updated_at: string
          updated_by: string | null
        };
        Insert: {
          key: string | null
          enabled?: boolean | null
          description?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
        };
        Update: {
          key?: string | null
          enabled?: boolean | null
          description?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
        };
        Relationships: [];
      };
      geo_city_zip_codes: {
        Row: {
          id: number
          state_code: string
          city_name: string
          city_normalized: string
          zip_code: string
          created_at: string
        };
        Insert: {
          id?: number | null
          state_code: string | null
          city_name: string | null
          city_normalized: string | null
          zip_code: string | null
          created_at?: string | null
        };
        Update: {
          id?: number | null
          state_code?: string | null
          city_name?: string | null
          city_normalized?: string | null
          zip_code?: string | null
          created_at?: string | null
        };
        Relationships: [];
      };
      geo_reverse_cache: {
        Row: {
          lat_rounded: number
          lng_rounded: number
          zip_code: string
          city_name: string
          state_code: string
          country: string
          provider: string
          created_at: string
        };
        Insert: {
          lat_rounded: number | null
          lng_rounded: number | null
          zip_code: string | null
          city_name: string | null
          state_code: string | null
          country?: string | null
          provider?: string | null
          created_at?: string | null
        };
        Update: {
          lat_rounded?: number | null
          lng_rounded?: number | null
          zip_code?: string | null
          city_name?: string | null
          state_code?: string | null
          country?: string | null
          provider?: string | null
          created_at?: string | null
        };
        Relationships: [];
      };
      interest_requests: {
        Row: {
          id: string
          full_name: string
          email: string
          city: string
          state: string
          role: Database["public"]["Enums"]["interest_role"]
          created_at: string
        };
        Insert: {
          id?: string | null
          full_name: string | null
          email: string | null
          city: string | null
          state: string | null
          role: Database["public"]["Enums"]["interest_role"] | null
          created_at?: string | null
        };
        Update: {
          id?: string | null
          full_name?: string | null
          email?: string | null
          city?: string | null
          state?: string | null
          role?: Database["public"]["Enums"]["interest_role"] | null
          created_at?: string | null
        };
        Relationships: [];
      };
      launch_regions: {
        Row: {
          id: string
          state: string
          city: string | null
          zip_codes: string | null
          is_active: boolean
          is_waitlist: boolean
          min_chefs: number
          min_families: number
          auto_launch: boolean
          chef_count: number
          family_count: number
          waitlist_count: number
          created_at: string
          updated_at: string
          updated_by: string | null
          status: Database["public"]["Enums"]["launch_region_status"] | null
          allow_new_family_signup: boolean
          allow_new_cook_signup: boolean
          allow_bookings: boolean
          allow_payments: boolean
          allow_messages: boolean
          allow_reviews: boolean
          allow_waitlist: boolean
          allow_interest_requests: boolean
          maintenance_mode: boolean
          maintenance_message: string | null
          launch_date: string | null
          beta_limit_chefs: number | null
          beta_limit_families: number | null
          max_active_bookings: number | null
          allow_recurring_bookings: boolean
          feature_flags: Json
          pause_reason: string | null
          pause_until: string | null
          pause_banner_message: string | null
        };
        Insert: {
          id?: string | null
          state: string | null
          city?: string | null
          zip_codes?: string | null
          is_active?: boolean | null
          is_waitlist?: boolean | null
          min_chefs?: number | null
          min_families?: number | null
          auto_launch?: boolean | null
          chef_count?: number | null
          family_count?: number | null
          waitlist_count?: number | null
          created_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
          status?: Database["public"]["Enums"]["launch_region_status"] | null
          allow_new_family_signup?: boolean | null
          allow_new_cook_signup?: boolean | null
          allow_bookings?: boolean | null
          allow_payments?: boolean | null
          allow_messages?: boolean | null
          allow_reviews?: boolean | null
          allow_waitlist?: boolean | null
          allow_interest_requests?: boolean | null
          maintenance_mode?: boolean | null
          maintenance_message?: string | null
          launch_date?: string | null
          beta_limit_chefs?: number | null
          beta_limit_families?: number | null
          max_active_bookings?: number | null
          allow_recurring_bookings?: boolean | null
          feature_flags?: Json | null
          pause_reason?: string | null
          pause_until?: string | null
          pause_banner_message?: string | null
        };
        Update: {
          id?: string | null
          state?: string | null
          city?: string | null
          zip_codes?: string | null
          is_active?: boolean | null
          is_waitlist?: boolean | null
          min_chefs?: number | null
          min_families?: number | null
          auto_launch?: boolean | null
          chef_count?: number | null
          family_count?: number | null
          waitlist_count?: number | null
          created_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
          status?: Database["public"]["Enums"]["launch_region_status"] | null
          allow_new_family_signup?: boolean | null
          allow_new_cook_signup?: boolean | null
          allow_bookings?: boolean | null
          allow_payments?: boolean | null
          allow_messages?: boolean | null
          allow_reviews?: boolean | null
          allow_waitlist?: boolean | null
          allow_interest_requests?: boolean | null
          maintenance_mode?: boolean | null
          maintenance_message?: string | null
          launch_date?: string | null
          beta_limit_chefs?: number | null
          beta_limit_families?: number | null
          max_active_bookings?: number | null
          allow_recurring_bookings?: boolean | null
          feature_flags?: Json | null
          pause_reason?: string | null
          pause_until?: string | null
          pause_banner_message?: string | null
        };
        Relationships: [];
      };
      message_attachments: {
        Row: {
          id: string
          message_id: string
          storage_bucket: string
          storage_path: string
          file_name: string
          mime_type: string
          file_size_bytes: number
          created_at: string
        };
        Insert: {
          id?: string | null
          message_id: string | null
          storage_bucket?: string | null
          storage_path: string | null
          file_name: string | null
          mime_type: string | null
          file_size_bytes: number | null
          created_at?: string | null
        };
        Update: {
          id?: string | null
          message_id?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          file_name?: string | null
          mime_type?: string | null
          file_size_bytes?: number | null
          created_at?: string | null
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          body: string
          status: Database["public"]["Enums"]["message_status"]
          metadata: Json
          created_at: string
          read_at: string | null
          deleted_at: string | null
        };
        Insert: {
          id?: string | null
          conversation_id: string | null
          sender_id: string | null
          body: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          metadata?: Json | null
          created_at?: string | null
          read_at?: string | null
          deleted_at?: string | null
        };
        Update: {
          id?: string | null
          conversation_id?: string | null
          sender_id?: string | null
          body?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          metadata?: Json | null
          created_at?: string | null
          read_at?: string | null
          deleted_at?: string | null
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: Database["public"]["Enums"]["notification_type"]
          read: boolean
          metadata: Json
          created_at: string
          read_at: string | null
        };
        Insert: {
          id?: string | null
          user_id: string | null
          title: string | null
          message: string | null
          type?: Database["public"]["Enums"]["notification_type"] | null
          read?: boolean | null
          metadata?: Json | null
          created_at?: string | null
          read_at?: string | null
        };
        Update: {
          id?: string | null
          user_id?: string | null
          title?: string | null
          message?: string | null
          type?: Database["public"]["Enums"]["notification_type"] | null
          read?: boolean | null
          metadata?: Json | null
          created_at?: string | null
          read_at?: string | null
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string
          booking_id: string
          family_id: string
          chef_profile_id: string
          stripe_payment_intent_id: string | null
          stripe_charge_id: string | null
          stripe_checkout_session_id: string | null
          amount_cents: number
          platform_fee_cents: number
          cook_payout_cents: number
          stripe_fee_cents: number
          currency: string
          status: Database["public"]["Enums"]["payment_status"]
          transfer_id: string | null
          refunded_cents: number
          metadata: Json
          created_at: string
          updated_at: string
        };
        Insert: {
          id?: string | null
          booking_id: string | null
          family_id: string | null
          chef_profile_id: string | null
          stripe_payment_intent_id?: string | null
          stripe_charge_id?: string | null
          stripe_checkout_session_id?: string | null
          amount_cents: number | null
          platform_fee_cents?: number | null
          cook_payout_cents?: number | null
          stripe_fee_cents?: number | null
          currency?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          transfer_id?: string | null
          refunded_cents?: number | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        };
        Update: {
          id?: string | null
          booking_id?: string | null
          family_id?: string | null
          chef_profile_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_charge_id?: string | null
          stripe_checkout_session_id?: string | null
          amount_cents?: number | null
          platform_fee_cents?: number | null
          cook_payout_cents?: number | null
          stripe_fee_cents?: number | null
          currency?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          transfer_id?: string | null
          refunded_cents?: number | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        };
        Relationships: [];
      };
      platform_settings: {
        Row: {
          key: string
          value: Json
          description: string | null
          updated_at: string
          updated_by: string | null
        };
        Insert: {
          key: string | null
          value?: Json | null
          description?: string | null
          updated_at?: string | null
          updated_by?: string | null
        };
        Update: {
          key?: string | null
          value?: Json | null
          description?: string | null
          updated_at?: string | null
          updated_by?: string | null
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["account_status"]
          city: string | null
          state: string | null
          zip: string | null
          dietary_preferences: string[]
          email_alerts: boolean
          sms_alerts: boolean
          profile_completed: number
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          notification_preferences: Json
          accepted_terms_version: string | null
          accepted_terms_at: string | null
          accepted_privacy_version: string | null
          accepted_privacy_at: string | null
          marketing_opt_in: boolean
          cookie_preferences: Json
          account_restore_requested_at: string | null
          country: string
          latitude: number | null
          longitude: number | null
          location_source: string | null
          last_location_update: string | null
        };
        Insert: {
          id?: string | null
          email: string | null
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["account_status"] | null
          city?: string | null
          state?: string | null
          zip?: string | null
          dietary_preferences?: string[] | null
          email_alerts?: boolean | null
          sms_alerts?: boolean | null
          profile_completed?: number | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          notification_preferences?: Json | null
          accepted_terms_version?: string | null
          accepted_terms_at?: string | null
          accepted_privacy_version?: string | null
          accepted_privacy_at?: string | null
          marketing_opt_in?: boolean | null
          cookie_preferences?: Json | null
          account_restore_requested_at?: string | null
          country?: string | null
          latitude?: number | null
          longitude?: number | null
          location_source?: string | null
          last_location_update?: string | null
        };
        Update: {
          id?: string | null
          email?: string | null
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["account_status"] | null
          city?: string | null
          state?: string | null
          zip?: string | null
          dietary_preferences?: string[] | null
          email_alerts?: boolean | null
          sms_alerts?: boolean | null
          profile_completed?: number | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          notification_preferences?: Json | null
          accepted_terms_version?: string | null
          accepted_terms_at?: string | null
          accepted_privacy_version?: string | null
          accepted_privacy_at?: string | null
          marketing_opt_in?: boolean | null
          cookie_preferences?: Json | null
          account_restore_requested_at?: string | null
          country?: string | null
          latitude?: number | null
          longitude?: number | null
          location_source?: string | null
          last_location_update?: string | null
        };
        Relationships: [];
      };
      profiles_marketplace_public: {
        Row: {
          id: string | null
          full_name: string | null
          avatar_url: string | null
        };
        Insert: {
          id?: string | null
          full_name?: string | null
          avatar_url?: string | null
        };
        Update: {
          id?: string | null
          full_name?: string | null
          avatar_url?: string | null
        };
        Relationships: [];
      };
      region_announcement_dismissals: {
        Row: {
          announcement_id: string
          profile_id: string
          dismissed_at: string
        };
        Insert: {
          announcement_id: string | null
          profile_id: string | null
          dismissed_at?: string | null
        };
        Update: {
          announcement_id?: string | null
          profile_id?: string | null
          dismissed_at?: string | null
        };
        Relationships: [];
      };
      region_announcements: {
        Row: {
          id: string
          region_id: string
          title: string
          body: string
          priority: number
          scheduled_at: string | null
          expires_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        };
        Insert: {
          id?: string | null
          region_id: string | null
          title: string | null
          body: string | null
          priority?: number | null
          scheduled_at?: string | null
          expires_at?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        };
        Update: {
          id?: string | null
          region_id?: string | null
          title?: string | null
          body?: string | null
          priority?: number | null
          scheduled_at?: string | null
          expires_at?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string
          booking_id: string
          chef_profile_id: string
          family_id: string
          rating: number
          review_text: string | null
          verified: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
          deleted_by: string | null
        };
        Insert: {
          id?: string | null
          booking_id: string | null
          chef_profile_id: string | null
          family_id: string | null
          rating: number | null
          review_text?: string | null
          verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        };
        Update: {
          id?: string | null
          booking_id?: string | null
          chef_profile_id?: string | null
          family_id?: string | null
          rating?: number | null
          review_text?: string | null
          verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        };
        Relationships: [];
      };
      security_events: {
        Row: {
          id: string
          event_type: string
          route: string | null
          ip_address: string | null
          user_id: string | null
          metadata: Json
          created_at: string
        };
        Insert: {
          id?: string | null
          event_type: string | null
          route?: string | null
          ip_address?: string | null
          user_id?: string | null
          metadata?: Json | null
          created_at?: string | null
        };
        Update: {
          id?: string | null
          event_type?: string | null
          route?: string | null
          ip_address?: string | null
          user_id?: string | null
          metadata?: Json | null
          created_at?: string | null
        };
        Relationships: [];
      };
      stripe_accounts: {
        Row: {
          id: string
          chef_profile_id: string
          stripe_account_id: string
          onboarding_status: Database["public"]["Enums"]["stripe_onboarding_status"]
          charges_enabled: boolean
          payouts_enabled: boolean
          capabilities: Json
          requirements_due: Json
          country: string
          metadata: Json
          created_at: string
          updated_at: string
        };
        Insert: {
          id?: string | null
          chef_profile_id: string | null
          stripe_account_id: string | null
          onboarding_status?: Database["public"]["Enums"]["stripe_onboarding_status"] | null
          charges_enabled?: boolean | null
          payouts_enabled?: boolean | null
          capabilities?: Json | null
          requirements_due?: Json | null
          country?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        };
        Update: {
          id?: string | null
          chef_profile_id?: string | null
          stripe_account_id?: string | null
          onboarding_status?: Database["public"]["Enums"]["stripe_onboarding_status"] | null
          charges_enabled?: boolean | null
          payouts_enabled?: boolean | null
          capabilities?: Json | null
          requirements_due?: Json | null
          country?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        };
        Relationships: [];
      };
      stripe_customers: {
        Row: {
          id: string
          profile_id: string
          stripe_customer_id: string
          default_payment_method_id: string | null
          currency: string
          metadata: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        };
        Insert: {
          id?: string | null
          profile_id: string | null
          stripe_customer_id: string | null
          default_payment_method_id?: string | null
          currency?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        };
        Update: {
          id?: string | null
          profile_id?: string | null
          stripe_customer_id?: string | null
          default_payment_method_id?: string | null
          currency?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        };
        Relationships: [];
      };
      stripe_events: {
        Row: {
          id: string
          stripe_event_id: string
          event_type: string
          api_version: string | null
          payload: Json
          processed: boolean
          processed_at: string | null
          processing_error: string | null
          created_at: string
        };
        Insert: {
          id?: string | null
          stripe_event_id: string | null
          event_type: string | null
          api_version?: string | null
          payload: Json | null
          processed?: boolean | null
          processed_at?: string | null
          processing_error?: string | null
          created_at?: string | null
        };
        Update: {
          id?: string | null
          stripe_event_id?: string | null
          event_type?: string | null
          api_version?: string | null
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          processing_error?: string | null
          created_at?: string | null
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string
          chef_profile_id: string
          stripe_subscription_id: string
          stripe_customer_id: string
          stripe_price_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          metadata: Json
          created_at: string
          updated_at: string
          stripe_product_id: string | null
        };
        Insert: {
          id?: string | null
          chef_profile_id: string | null
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          stripe_product_id?: string | null
        };
        Update: {
          id?: string | null
          chef_profile_id?: string | null
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
          stripe_product_id?: string | null
        };
        Relationships: [];
      };
      tip_events: {
        Row: {
          id: string
          tip_id: string
          event_type: string
          actor_id: string | null
          payload: Json
          created_at: string
        };
        Insert: {
          id?: string | null
          tip_id: string | null
          event_type: string | null
          actor_id?: string | null
          payload?: Json | null
          created_at?: string | null
        };
        Update: {
          id?: string | null
          tip_id?: string | null
          event_type?: string | null
          actor_id?: string | null
          payload?: Json | null
          created_at?: string | null
        };
        Relationships: [];
      };
      tips: {
        Row: {
          id: string
          booking_id: string
          family_id: string
          chef_profile_id: string
          amount_cents: number
          currency: string
          status: Database["public"]["Enums"]["tip_status"]
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_charge_id: string | null
          stripe_transfer_id: string | null
          failure_reason: string | null
          processed_at: string | null
          metadata: Json
          created_at: string
          updated_at: string
        };
        Insert: {
          id?: string | null
          booking_id: string | null
          family_id: string | null
          chef_profile_id: string | null
          amount_cents: number | null
          currency?: string | null
          status?: Database["public"]["Enums"]["tip_status"] | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_charge_id?: string | null
          stripe_transfer_id?: string | null
          failure_reason?: string | null
          processed_at?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        };
        Update: {
          id?: string | null
          booking_id?: string | null
          family_id?: string | null
          chef_profile_id?: string | null
          amount_cents?: number | null
          currency?: string | null
          status?: Database["public"]["Enums"]["tip_status"] | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_charge_id?: string | null
          stripe_transfer_id?: string | null
          failure_reason?: string | null
          processed_at?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        };
        Relationships: [];
      };
      transfers: {
        Row: {
          id: string
          payment_id: string
          booking_id: string
          chef_profile_id: string
          gross_amount_cents: number
          platform_fee_cents: number
          net_amount_cents: number
          stripe_transfer_id: string | null
          status: Database["public"]["Enums"]["transfer_status"]
          scheduled_at: string | null
          transferred_at: string | null
          payout_date: string | null
          failure_reason: string | null
          metadata: Json
          created_at: string
          updated_at: string
        };
        Insert: {
          id?: string | null
          payment_id: string | null
          booking_id: string | null
          chef_profile_id: string | null
          gross_amount_cents: number | null
          platform_fee_cents: number | null
          net_amount_cents: number | null
          stripe_transfer_id?: string | null
          status?: Database["public"]["Enums"]["transfer_status"] | null
          scheduled_at?: string | null
          transferred_at?: string | null
          payout_date?: string | null
          failure_reason?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        };
        Update: {
          id?: string | null
          payment_id?: string | null
          booking_id?: string | null
          chef_profile_id?: string | null
          gross_amount_cents?: number | null
          platform_fee_cents?: number | null
          net_amount_cents?: number | null
          stripe_transfer_id?: string | null
          status?: Database["public"]["Enums"]["transfer_status"] | null
          scheduled_at?: string | null
          transferred_at?: string | null
          payout_date?: string | null
          failure_reason?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        };
        Relationships: [];
      };
      user_region_access: {
        Row: {
          id: string
          profile_id: string
          state: string
          city: string | null
          zip: string | null
          region_id: string | null
          launch_status: Database["public"]["Enums"]["launch_region_status"]
          permissions: Json
          reason: string | null
          waitlisted_at: string | null
          activated_at: string | null
          source: string
          created_at: string
          updated_at: string
        };
        Insert: {
          id?: string | null
          profile_id: string | null
          state: string | null
          city?: string | null
          zip?: string | null
          region_id?: string | null
          launch_status?: Database["public"]["Enums"]["launch_region_status"] | null
          permissions?: Json | null
          reason?: string | null
          waitlisted_at?: string | null
          activated_at?: string | null
          source?: string | null
          created_at?: string | null
          updated_at?: string | null
        };
        Update: {
          id?: string | null
          profile_id?: string | null
          state?: string | null
          city?: string | null
          zip?: string | null
          region_id?: string | null
          launch_status?: Database["public"]["Enums"]["launch_region_status"] | null
          permissions?: Json | null
          reason?: string | null
          waitlisted_at?: string | null
          activated_at?: string | null
          source?: string | null
          created_at?: string | null
          updated_at?: string | null
        };
        Relationships: [];
      };
      waitlist_signups: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: Database["public"]["Enums"]["waitlist_role"]
          state: string
          city: string | null
          zip: string | null
          region_id: string | null
          profile_id: string | null
          created_at: string
        };
        Insert: {
          id?: string | null
          email: string | null
          full_name?: string | null
          role: Database["public"]["Enums"]["waitlist_role"] | null
          state: string | null
          city?: string | null
          zip?: string | null
          region_id?: string | null
          profile_id?: string | null
          created_at?: string | null
        };
        Update: {
          id?: string | null
          email?: string | null
          full_name?: string | null
          role?: Database["public"]["Enums"]["waitlist_role"] | null
          state?: string | null
          city?: string | null
          zip?: string | null
          region_id?: string | null
          profile_id?: string | null
          created_at?: string | null
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_auth_uid: { Args: Record<string, never>; Returns: string };
      get_user_role: { Args: Record<string, never>; Returns: Database["public"]["Enums"]["user_role"] };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_family: { Args: Record<string, never>; Returns: boolean };
      is_chef: { Args: Record<string, never>; Returns: boolean };
      owns_chef_profile: { Args: { p_chef_profile_id: string }; Returns: boolean };
      is_public_chef_profile: { Args: { p_chef_profile_id: string }; Returns: boolean };
      search_geo_cities: {
        Args: { p_state_code: string; p_query?: string; p_limit?: number };
        Returns: { city_name: string; zip_count: number }[];
      };
      geo_zips_for_cities: {
        Args: { p_state_code: string; p_cities: string[] };
        Returns: string[];
      };
      geo_primary_location_for_zip: {
        Args: { p_zip: string };
        Returns: { city: string; state: string; state_code: string }[];
      };
      user_allows_notification: {
        Args: { p_user_id: string; p_category: string };
        Returns: boolean;
      };
    };
    Enums: {
      account_status: "active" | "suspended" | "pending";
      admin_visibility_override: "none" | "hidden" | "public";
      booking_status: "pending" | "confirmed" | "completed" | "cancelled" | "accepted" | "awaiting_payment" | "en_route" | "arrived" | "cooking" | "awaiting_family_confirmation";
      career_application_status: "applied" | "under_review" | "interview" | "offer" | "rejected" | "hired";
      career_job_status: "draft" | "published" | "archived";
      contact_status: "new" | "read" | "archived";
      document_status: "pending" | "approved" | "rejected";
      document_type: "servsafe_certificate" | "insurance" | "background_check" | "id_verification";
      interest_role: "family" | "chef" | "both";
      launch_region_status: "active" | "waitlist" | "paused" | "maintenance" | "internal_beta" | "coming_soon";
      message_status: "sent" | "delivered" | "read";
      notification_type: "info" | "success" | "warning" | "error";
      payment_status: "pending" | "processing" | "succeeded" | "failed" | "refunded" | "partially_refunded";
      profile_visibility: "public" | "hidden";
      service_type: "breakfast" | "dinner" | "mealprep";
      stripe_onboarding_status: "not_started" | "pending" | "complete" | "restricted";
      subscription_status: "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "incomplete";
      tip_status: "pending" | "processing" | "succeeded" | "failed" | "refunded";
      transfer_status: "pending" | "scheduled" | "processing" | "paid" | "failed" | "cancelled";
      user_role: "family" | "chef" | "admin";
      verification_status: "pending" | "approved" | "rejected" | "suspended";
      waitlist_role: "family" | "chef";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
