export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {

  "public": {
          Tables: {
            "album_items": {
                  Row: {
                    "album_id": string,"media_asset_id": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "album_id": string,"media_asset_id": string,"sort_order"?: number
                  }
                  Update: {
                    "album_id"?: string,"media_asset_id"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "album_items_album_id_fkey"
      columns: ["album_id"]
isOneToOne: false
      referencedRelation: "albums"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "album_items_media_asset_id_fkey"
      columns: ["media_asset_id"]
isOneToOne: false
      referencedRelation: "media_assets"
      referencedColumns: ["id"]
    }
                  ]
                },"albums": {
                  Row: {
                    "category": string,"cover_asset_id": string | null,"created_at": string,"description": string | null,"id": string,"is_public": boolean,"slug": string,"title": string,"updated_at": string,"year": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "category"?: string,"cover_asset_id"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"is_public"?: boolean,"slug": string,"title": string,"updated_at"?: string,"year"?: number | null
                  }
                  Update: {
                    "category"?: string,"cover_asset_id"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"is_public"?: boolean,"slug"?: string,"title"?: string,"updated_at"?: string,"year"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "albums_cover_asset_id_fkey"
      columns: ["cover_asset_id"]
isOneToOne: false
      referencedRelation: "media_assets"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_events": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"details": NonNullable<Json>,"entity_id": string,"entity_type": string,"id": string,"ip_address": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"details"?: NonNullable<Json>,"entity_id": string,"entity_type": string,"id"?: string,"ip_address"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"details"?: NonNullable<Json>,"entity_id"?: string,"entity_type"?: string,"id"?: string,"ip_address"?: string | null
                  }
                  Relationships: [

                  ]
                },"contact_messages": {
                  Row: {
                    "attachment_url": string | null,"category": string | null,"created_at": string,"email": string,"id": string,"message": string,"name": string,"phone": string | null,"sender_type": string | null,"status": string,"subject": string | null,"triaged_at": string | null,"triaged_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "attachment_url"?: string | null,"category"?: string | null,"created_at"?: string,"email": string,"id"?: string,"message": string,"name": string,"phone"?: string | null,"sender_type"?: string | null,"status"?: string,"subject"?: string | null,"triaged_at"?: string | null,"triaged_by"?: string | null
                  }
                  Update: {
                    "attachment_url"?: string | null,"category"?: string | null,"created_at"?: string,"email"?: string,"id"?: string,"message"?: string,"name"?: string,"phone"?: string | null,"sender_type"?: string | null,"status"?: string,"subject"?: string | null,"triaged_at"?: string | null,"triaged_by"?: string | null
                  }
                  Relationships: [

                  ]
                },"contact_rate_limits": {
                  Row: {
                    "ip": string,"last_submitted_at": string,"submission_count": number,"window_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ip": string,"last_submitted_at"?: string,"submission_count"?: number,"window_start"?: string
                  }
                  Update: {
                    "ip"?: string,"last_submitted_at"?: string,"submission_count"?: number,"window_start"?: string
                  }
                  Relationships: [

                  ]
                },"events": {
                  Row: {
                    "all_day": boolean,"category": string | null,"created_at": string,"description": string,"ends_at": string,"excerpt": string | null,"featured_image": string | null,"id": string,"slug": string,"starts_at": string,"status": string,"ticket_url": string | null,"timezone": string,"title": string,"updated_at": string,"venue_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "all_day"?: boolean,"category"?: string | null,"created_at"?: string,"description": string,"ends_at": string,"excerpt"?: string | null,"featured_image"?: string | null,"id"?: string,"slug": string,"starts_at": string,"status"?: string,"ticket_url"?: string | null,"timezone"?: string,"title": string,"updated_at"?: string,"venue_id"?: string | null
                  }
                  Update: {
                    "all_day"?: boolean,"category"?: string | null,"created_at"?: string,"description"?: string,"ends_at"?: string,"excerpt"?: string | null,"featured_image"?: string | null,"id"?: string,"slug"?: string,"starts_at"?: string,"status"?: string,"ticket_url"?: string | null,"timezone"?: string,"title"?: string,"updated_at"?: string,"venue_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "events_venue_id_fkey"
      columns: ["venue_id"]
isOneToOne: false
      referencedRelation: "venues"
      referencedColumns: ["id"]
    }
                  ]
                },"legacy_mappings": {
                  Row: {
                    "created_at": string,"entity_type": string,"id": string,"legacy_id": string | null,"legacy_url": string,"target_url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"entity_type": string,"id"?: string,"legacy_id"?: string | null,"legacy_url": string,"target_url": string
                  }
                  Update: {
                    "created_at"?: string,"entity_type"?: string,"id"?: string,"legacy_id"?: string | null,"legacy_url"?: string,"target_url"?: string
                  }
                  Relationships: [

                  ]
                },"media_assets": {
                  Row: {
                    "alt_text": string,"caption": string | null,"created_at": string,"height": number | null,"id": string,"is_public": boolean,"mime_type": string,"size_bytes": number,"storage_path": string,"updated_at": string,"width": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "alt_text"?: string,"caption"?: string | null,"created_at"?: string,"height"?: number | null,"id"?: string,"is_public"?: boolean,"mime_type": string,"size_bytes": number,"storage_path": string,"updated_at"?: string,"width"?: number | null
                  }
                  Update: {
                    "alt_text"?: string,"caption"?: string | null,"created_at"?: string,"height"?: number | null,"id"?: string,"is_public"?: boolean,"mime_type"?: string,"size_bytes"?: number,"storage_path"?: string,"updated_at"?: string,"width"?: number | null
                  }
                  Relationships: [

                  ]
                },"membership_terms": {
                  Row: {
                    "closes_at": string,"created_at": string,"currency": string,"dues_cents": number,"id": string,"opens_at": string,"updated_at": string,"year": number
                  }
                  ComputedFields: never
                  Insert: {
                    "closes_at": string,"created_at"?: string,"currency"?: string,"dues_cents": number,"id"?: string,"opens_at": string,"updated_at"?: string,"year": number
                  }
                  Update: {
                    "closes_at"?: string,"created_at"?: string,"currency"?: string,"dues_cents"?: number,"id"?: string,"opens_at"?: string,"updated_at"?: string,"year"?: number
                  }
                  Relationships: [

                  ]
                },"memberships": {
                  Row: {
                    "approved_at": string | null,"approved_by": string | null,"created_at": string,"id": string,"notes": string | null,"status": string,"term_id": string,"updated_at": string,"user_id": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "approved_at"?: string | null,"approved_by"?: string | null,"created_at"?: string,"id"?: string,"notes"?: string | null,"status"?: string,"term_id": string,"updated_at"?: string,"user_id": string,"version"?: number
                  }
                  Update: {
                    "approved_at"?: string | null,"approved_by"?: string | null,"created_at"?: string,"id"?: string,"notes"?: string | null,"status"?: string,"term_id"?: string,"updated_at"?: string,"user_id"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "memberships_term_id_fkey"
      columns: ["term_id"]
isOneToOne: false
      referencedRelation: "membership_terms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "memberships_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "member_directory"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "memberships_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notices": {
                  Row: {
                    "attachments": NonNullable<Json>,"author_id": string | null,"category": string,"content": string,"created_at": string,"excerpt": string | null,"expires_at": string | null,"id": string,"is_pinned": boolean,"is_published": boolean,"priority": string,"published_at": string,"slug": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attachments"?: NonNullable<Json>,"author_id"?: string | null,"category"?: string,"content": string,"created_at"?: string,"excerpt"?: string | null,"expires_at"?: string | null,"id"?: string,"is_pinned"?: boolean,"is_published"?: boolean,"priority"?: string,"published_at"?: string,"slug": string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "attachments"?: NonNullable<Json>,"author_id"?: string | null,"category"?: string,"content"?: string,"created_at"?: string,"excerpt"?: string | null,"expires_at"?: string | null,"id"?: string,"is_pinned"?: boolean,"is_published"?: boolean,"priority"?: string,"published_at"?: string,"slug"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notices_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "member_directory"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notices_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"pages": {
                  Row: {
                    "content": string,"created_at": string,"id": string,"meta_description": string | null,"published_at": string | null,"slug": string,"status": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "content": string,"created_at"?: string,"id"?: string,"meta_description"?: string | null,"published_at"?: string | null,"slug": string,"status"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "content"?: string,"created_at"?: string,"id"?: string,"meta_description"?: string | null,"published_at"?: string | null,"slug"?: string,"status"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [

                  ]
                },"payments": {
                  Row: {
                    "amount_cents": number,"created_at": string,"currency": string,"id": string,"membership_id": string,"notes": string | null,"payment_method": string,"provider": string,"provider_event_id": string | null,"provider_session_id": string | null,"provider_transaction_id": string | null,"reconciled_at": string | null,"reconciled_by": string | null,"status": string,"term_id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_cents": number,"created_at"?: string,"currency"?: string,"id"?: string,"membership_id": string,"notes"?: string | null,"payment_method": string,"provider"?: string,"provider_event_id"?: string | null,"provider_session_id"?: string | null,"provider_transaction_id"?: string | null,"reconciled_at"?: string | null,"reconciled_by"?: string | null,"status"?: string,"term_id": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "amount_cents"?: number,"created_at"?: string,"currency"?: string,"id"?: string,"membership_id"?: string,"notes"?: string | null,"payment_method"?: string,"provider"?: string,"provider_event_id"?: string | null,"provider_session_id"?: string | null,"provider_transaction_id"?: string | null,"reconciled_at"?: string | null,"reconciled_by"?: string | null,"status"?: string,"term_id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_membership_id_fkey"
      columns: ["membership_id"]
isOneToOne: false
      referencedRelation: "memberships"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_term_id_fkey"
      columns: ["term_id"]
isOneToOne: false
      referencedRelation: "membership_terms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "member_directory"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_interests": {
                  Row: {
                    "created_at": string,"project_code": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"project_code": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"project_code"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_interests_project_code_fkey"
      columns: ["project_code"]
isOneToOne: false
      referencedRelation: "project_interests"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "profile_interests_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "member_directory"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profile_interests_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "address_line1": string | null,"address_line2": string | null,"admin_notes": string | null,"birth_day": number | null,"birth_month": number | null,"city": string | null,"created_at": string,"directory_opt_out": boolean,"first_name": string,"gardening_interests": string | null,"id": string,"interests_experience": string | null,"is_master_gardener": boolean,"last_name": string,"phone": string | null,"postal_code": string | null,"secondary_phone": string | null,"spouse_name": string | null,"state": string | null,"updated_at": string,"username": string,"volunteer_experience": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address_line1"?: string | null,"address_line2"?: string | null,"admin_notes"?: string | null,"birth_day"?: number | null,"birth_month"?: number | null,"city"?: string | null,"created_at"?: string,"directory_opt_out"?: boolean,"first_name": string,"gardening_interests"?: string | null,"id": string,"interests_experience"?: string | null,"is_master_gardener"?: boolean,"last_name": string,"phone"?: string | null,"postal_code"?: string | null,"secondary_phone"?: string | null,"spouse_name"?: string | null,"state"?: string | null,"updated_at"?: string,"username": string,"volunteer_experience"?: string | null
                  }
                  Update: {
                    "address_line1"?: string | null,"address_line2"?: string | null,"admin_notes"?: string | null,"birth_day"?: number | null,"birth_month"?: number | null,"city"?: string | null,"created_at"?: string,"directory_opt_out"?: boolean,"first_name"?: string,"gardening_interests"?: string | null,"id"?: string,"interests_experience"?: string | null,"is_master_gardener"?: boolean,"last_name"?: string,"phone"?: string | null,"postal_code"?: string | null,"secondary_phone"?: string | null,"spouse_name"?: string | null,"state"?: string | null,"updated_at"?: string,"username"?: string,"volunteer_experience"?: string | null
                  }
                  Relationships: [

                  ]
                },"project_interests": {
                  Row: {
                    "code": string,"description": string | null,"label": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"description"?: string | null,"label": string,"sort_order"?: number
                  }
                  Update: {
                    "code"?: string,"description"?: string | null,"label"?: string,"sort_order"?: number
                  }
                  Relationships: [

                  ]
                },"site_settings": {
                  Row: {
                    "description": string | null,"id": string,"key": string,"updated_at": string,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "description"?: string | null,"id"?: string,"key": string,"updated_at"?: string,"value"?: NonNullable<Json>
                  }
                  Update: {
                    "description"?: string | null,"id"?: string,"key"?: string,"updated_at"?: string,"value"?: NonNullable<Json>
                  }
                  Relationships: [

                  ]
                },"user_roles": {
                  Row: {
                    "created_at": string,"granted_by": string | null,"role": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"granted_by"?: string | null,"role": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"granted_by"?: string | null,"role"?: string,"user_id"?: string
                  }
                  Relationships: [

                  ]
                },"venues": {
                  Row: {
                    "address": string | null,"city": string | null,"created_at": string,"id": string,"name": string,"postal_code": string | null,"state": string | null,"updated_at": string,"url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"city"?: string | null,"created_at"?: string,"id"?: string,"name": string,"postal_code"?: string | null,"state"?: string | null,"updated_at"?: string,"url"?: string | null
                  }
                  Update: {
                    "address"?: string | null,"city"?: string | null,"created_at"?: string,"id"?: string,"name"?: string,"postal_code"?: string | null,"state"?: string | null,"updated_at"?: string,"url"?: string | null
                  }
                  Relationships: [

                  ]
                }
          }
          Views: {
            "member_directory": {
                  Row: {
                    "city": string | null,"first_name": string | null,"gardening_interests": string | null,"id": string | null,"interests_experience": string | null,"is_master_gardener": boolean | null,"last_name": string | null,"phone": string | null,"project_interests": Json | null,"secondary_phone": string | null,"state": string | null,"username": string | null,"volunteer_experience": string | null
                  }
                  ComputedFields: never
                  Insert: {
                           "city"?: string | null,"first_name"?: string | null,"gardening_interests"?: string | null,"id"?: string | null,"interests_experience"?: string | null,"is_master_gardener"?: boolean | null,"last_name"?: string | null,"phone"?: string | null,"project_interests"?: never,"secondary_phone"?: string | null,"state"?: string | null,"username"?: string | null,"volunteer_experience"?: string | null
                         }
                        Update: {
                           "city"?: string | null,"first_name"?: string | null,"gardening_interests"?: string | null,"id"?: string | null,"interests_experience"?: string | null,"is_master_gardener"?: boolean | null,"last_name"?: string | null,"phone"?: string | null,"project_interests"?: never,"secondary_phone"?: string | null,"state"?: string | null,"username"?: string | null,"volunteer_experience"?: string | null
                         }
                        Relationships: [

                  ]
                }
          }
          Functions: {
            "admin_update_member_profile":
{ Args: { "p_address_line1"?: string,"p_address_line2"?: string,"p_alt_phone"?: string,"p_city"?: string,"p_directory_opt_out"?: boolean,"p_first_name"?: string,"p_gardening_interests"?: string,"p_is_master_gardener"?: boolean,"p_last_name"?: string,"p_notes"?: string,"p_phone"?: string,"p_postal_code"?: string,"p_spouse_first_name"?: string,"p_state"?: string,"p_work_experience"?: string,"target_user_id": string }; Returns: undefined
                           },
"approve_membership":
{ Args: { "p_expected_version"?: number,"p_membership_id": string,"p_waive_dues"?: boolean,"p_waiver_reason"?: string }; Returns: Json
                           },
"check_contact_rate_limit":
{ Args: { "p_client_ip": string,"p_max_submissions"?: number,"p_window_seconds"?: number }; Returns: boolean
                           },
"create_membership_term":
{ Args: { "p_closes_at": string,"p_currency"?: string,"p_dues_cents": number,"p_opens_at": string,"p_year": number }; Returns: {
              "closes_at": string,"currency": string,"dues_cents": number,"id": string,"opens_at": string,"updated_at": string,"year": number
            }[]
                           },
"get_admin_member_roster":
{ Args: Record<PropertyKey, never>; Returns: {
              "address_line1": string,"address_line2": string,"admin_notes": string,"alt_phone": string,"applied_at": string,"birth_day": number,"birth_month": number,"city": string,"directory_opt_out": boolean,"dues_cents": number,"email": string,"first_name": string,"gardening_interests": string,"id": string,"is_master_gardener": boolean,"last_name": string,"payment_amount_cents": number,"payment_method": string,"payment_status": string,"phone": string,"postal_code": string,"spouse_first_name": string,"state": string,"status": string,"term_year": number,"updated_at": string,"user_id": string,"username": string,"version": number,"work_experience": string
            }[]
                           },
"has_capability":
{ Args: { "capability_name": string,"check_user_id"?: string }; Returns: boolean
                           },
"has_role":
{ Args: { "check_user_id"?: string,"role_name": string }; Returns: boolean
                           },
"is_active_member":
{ Args: { "check_user_id"?: string }; Returns: boolean
                           },
"is_media_object_public":
{ Args: { "object_name": string }; Returns: boolean
                           },
"log_audit_event":
{ Args: { "p_action": string,"p_details"?: Json,"p_entity_id"?: string,"p_entity_type": string }; Returns: string
                           },
"reconcile_payment":
{ Args: { "p_notes"?: string,"p_payment_id": string }; Returns: Json
                           },
"set_user_roles":
{ Args: { "p_new_roles": (string)[],"p_target_user_id": string }; Returns: undefined
                           },
"update_dues_rate":
{ Args: { "p_dues_cents": number,"p_term_year": number }; Returns: {
              "closes_at": string,"currency": string,"dues_cents": number,"id": string,"opens_at": string,"updated_at": string,"year": number
            }[]
                           },
"update_member_profile":
{ Args: { "p_address_line1"?: string,"p_address_line2"?: string,"p_birth_day"?: number,"p_birth_month"?: number,"p_city"?: string,"p_directory_opt_out"?: boolean,"p_first_name": string,"p_gardening_interests"?: string,"p_is_master_gardener"?: boolean,"p_last_name": string,"p_phone"?: string,"p_postal_code"?: string,"p_project_interests"?: (string)[],"p_secondary_phone"?: string,"p_spouse_name"?: string,"p_state"?: string,"p_volunteer_experience"?: string }; Returns: undefined
                           },
"update_membership_term":
{ Args: { "p_closes_at"?: string,"p_dues_cents"?: number,"p_opens_at"?: string,"p_term_id": string }; Returns: {
              "closes_at": string,"currency": string,"dues_cents": number,"id": string,"opens_at": string,"updated_at": string,"year": number
            }[]
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {

          }
        }
} as const
