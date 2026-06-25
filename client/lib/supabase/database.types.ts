/**
 * Generated from cloud Supabase (project: onerrwpixumcablgyhzs).
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
          metadata: Json | null
          created_at: string | null
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
      blog_posts: {
        Row: {
          id: string
          slug: string
          title: string
          excerpt: string | null
          body: string | null
          category: string | null
          cover_image_url: string | null
          author_name: string | null
          read_time_minutes: number | null
          published: boolean
          published_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        };
        Insert: {
          id?: string | null
          slug: string | null
          title: string | null
          excerpt?: string | null
          body?: string | null
          category?: string | null
          cover_image_url?: string | null
          author_name?: string | null
          read_time_minutes?: number | null
          published: boolean | null
          published_at?: string | null
          created_at: string | null
          updated_at: string | null
          deleted_at?: string | null
        };
        Update: {
          id?: string | null
          slug?: string | null
          title?: string | null
          excerpt?: string | null
          body?: string | null
          category?: string | null
          cover_image_url?: string | null
          author_name?: string | null
          read_time_minutes?: number | null
          published?: boolean | null
          published_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
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
          metadata: Json | null
          created_at: string | null
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
          booking_end_time: string | null
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
          special_instructions: string | null
          dietary_restrictions: string[]
          allergies: string | null
          parking_instructions: string | null
          gate_code: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          family_confirmed_at: string | null
          meal_request: string | null
          ingredients_available: string | null
          recipe_notes: string | null
          family_platform_fee_cents: number
          metadata: Json
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          deleted_at: string | null
          deleted_by: string | null
        };
        Insert: {
          id?: string | null
          family_id: string | null
          chef_profile_id: string | null
          service_type: Database["public"]["Enums"]["service_type"] | null
          booking_date: string | null
          booking_time?: string | null
          booking_end_time?: string | null
          guests_count: number | null
          price_cents: number | null
          platform_fee_cents: number | null
          cook_payout_cents: number | null
          currency: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          notes?: string | null
          stripe_payment_intent_id?: string | null
          payment_id?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
          completed_at?: string | null
          special_instructions?: string | null
          dietary_restrictions?: string[]
          allergies?: string | null
          parking_instructions?: string | null
          gate_code?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          family_confirmed_at?: string | null
          meal_request?: string | null
          ingredients_available?: string | null
          recipe_notes?: string | null
          family_platform_fee_cents?: number | null
          metadata?: Json
          created_at: string | null
          updated_at: string | null
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        };
        Update: {
          id?: string | null
          family_id?: string | null
          chef_profile_id?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          booking_date?: string | null
          booking_time?: string | null
          booking_end_time?: string | null
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
          special_instructions?: string | null
          dietary_restrictions?: string[]
          allergies?: string | null
          parking_instructions?: string | null
          gate_code?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          family_confirmed_at?: string | null
          meal_request?: string | null
          ingredients_available?: string | null
          recipe_notes?: string | null
          family_platform_fee_cents?: number | null
          metadata?: Json
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
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
          id?: string
          booking_id: string
          street_address: string
          apartment?: string | null
          city: string
          state: string
          zip: string
          country?: string
          latitude?: number | null
          longitude?: number | null
          location_notes?: string | null
          created_at?: string
        };
        Update: {
          id?: string
          booking_id?: string
          street_address?: string
          apartment?: string | null
          city?: string
          state?: string
          zip?: string
          country?: string
          latitude?: number | null
          longitude?: number | null
          location_notes?: string | null
          created_at?: string
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
          id?: string
          message_id: string
          storage_bucket?: string
          storage_path: string
          file_name: string
          mime_type: string
          file_size_bytes: number
          created_at?: string
        };
        Update: {
          id?: string
          message_id?: string
          storage_bucket?: string
          storage_path?: string
          file_name?: string
          mime_type?: string
          file_size_bytes?: number
          created_at?: string
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
          time_slots: Json | null
          recurring: boolean | null
          effective_from?: string | null
          effective_until?: string | null
          timezone: string | null
          created_at: string | null
          updated_at: string | null
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
          storage_bucket: string | null
          storage_path: string | null
          status: Database["public"]["Enums"]["document_status"] | null
          reviewed_by?: string | null
          review_notes?: string | null
          submitted_at: string | null
          reviewed_at?: string | null
          created_at: string | null
          updated_at: string | null
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
          storage_bucket: string | null
          storage_path: string | null
          public_url?: string | null
          alt_text?: string | null
          sort_order: number | null
          is_public: boolean | null
          mime_type?: string | null
          file_size_bytes?: number | null
          created_at: string | null
          updated_at: string | null
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
        };
        Insert: {
          id?: string | null
          user_id: string | null
          display_name: string | null
          headline?: string | null
          bio?: string | null
          cuisines: string[] | null
          years_experience?: number | null
          service_types: Json | null
          location?: string | null
          verification_status: Database["public"]["Enums"]["verification_status"] | null
          premium_status: boolean | null
          profile_visibility: Database["public"]["Enums"]["profile_visibility"] | null
          admin_visibility_override: Database["public"]["Enums"]["admin_visibility_override"] | null
          bookings_count: number | null
          rating: number | null
          reviews_count: number | null
          stripe_account_ref?: string | null
          created_at: string | null
          updated_at: string | null
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
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
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string
          full_name: string
          email: string
          subject: string | null
          message: string
          status: Database["public"]["Enums"]["contact_status"]
          created_at: string
          updated_at: string
          handled_by: string | null
        };
        Insert: {
          id?: string | null
          full_name: string | null
          email: string | null
          subject?: string | null
          message: string | null
          status: Database["public"]["Enums"]["contact_status"] | null
          created_at: string | null
          updated_at: string | null
          handled_by?: string | null
        };
        Update: {
          id?: string | null
          full_name?: string | null
          email?: string | null
          subject?: string | null
          message?: string | null
          status?: Database["public"]["Enums"]["contact_status"] | null
          created_at?: string | null
          updated_at?: string | null
          handled_by?: string | null
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
          created_at: string | null
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
      favorites: {
        Row: {
          family_id: string
          chef_profile_id: string
          created_at: string
        };
        Insert: {
          family_id: string | null
          chef_profile_id: string | null
          created_at: string | null
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
          enabled: boolean | null
          description?: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
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
          created_at: string | null
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
        };
        Insert: {
          id?: string | null
          state: string | null
          city?: string | null
          zip_codes?: string | null
          is_active: boolean | null
          is_waitlist: boolean | null
          min_chefs: number | null
          min_families: number | null
          auto_launch: boolean | null
          chef_count: number | null
          family_count: number | null
          waitlist_count: number | null
          created_at: string | null
          updated_at: string | null
          updated_by?: string | null
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
        };
        Relationships: [];
      };
      geo_city_zip_codes: {
        Row: {
          id: number;
          state_code: string;
          city_name: string;
          city_normalized: string;
          zip_code: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          state_code: string;
          city_name: string;
          city_normalized: string;
          zip_code: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          state_code?: string;
          city_name?: string;
          city_normalized?: string;
          zip_code?: string;
          created_at?: string;
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
          status: Database["public"]["Enums"]["message_status"] | null
          metadata: Json | null
          created_at: string | null
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
          type: Database["public"]["Enums"]["notification_type"] | null
          read: boolean | null
          metadata: Json | null
          created_at: string | null
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
          platform_fee_cents: number | null
          cook_payout_cents: number | null
          stripe_fee_cents: number | null
          currency: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          transfer_id?: string | null
          refunded_cents: number | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
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
          value: Json | null
          description?: string | null
          updated_at: string | null
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
        };
        Insert: {
          id?: string | null
          email: string | null
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          status: Database["public"]["Enums"]["account_status"] | null
          city?: string | null
          state?: string | null
          zip?: string | null
          dietary_preferences: string[] | null
          email_alerts: boolean | null
          sms_alerts: boolean | null
          profile_completed: number | null
          created_at: string | null
          updated_at: string | null
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
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
          verified: boolean | null
          created_at: string | null
          updated_at: string | null
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
          onboarding_status: Database["public"]["Enums"]["stripe_onboarding_status"] | null
          charges_enabled: boolean | null
          payouts_enabled: boolean | null
          capabilities: Json | null
          requirements_due: Json | null
          country: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
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
          currency: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
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
          processed: boolean | null
          processed_at?: string | null
          processing_error?: string | null
          created_at: string | null
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
        };
        Insert: {
          id?: string | null
          chef_profile_id: string | null
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end: boolean | null
          canceled_at?: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
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
          created_at: string | null
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
    };
    Enums: {
      account_status: "active" | "suspended" | "pending";
      admin_visibility_override: "none" | "hidden" | "public";
      booking_status:
        | "pending"
        | "accepted"
        | "awaiting_payment"
        | "confirmed"
        | "en_route"
        | "arrived"
        | "cooking"
        | "awaiting_family_confirmation"
        | "completed"
        | "cancelled";
      contact_status: "new" | "read" | "archived";
      document_status: "pending" | "approved" | "rejected";
      document_type: "servsafe_certificate" | "insurance" | "background_check" | "id_verification";
      interest_role: "family" | "chef" | "both";
      message_status: "sent" | "delivered" | "read";
      notification_type: "info" | "success" | "warning" | "error";
      payment_status: "pending" | "processing" | "succeeded" | "failed" | "refunded" | "partially_refunded";
      profile_visibility: "public" | "hidden";
      service_type: "breakfast" | "dinner" | "mealprep";
      stripe_onboarding_status: "not_started" | "pending" | "complete" | "restricted";
      subscription_status: "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "incomplete";
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
