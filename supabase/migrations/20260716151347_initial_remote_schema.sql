


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."brands" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "industry" "text",
    "website_url" "text",
    "logo_url" "text",
    "primary_color" "text",
    "secondary_color" "text",
    "default_language" "text" DEFAULT 'pt-PT'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_id" "uuid",
    CONSTRAINT "brands_default_language_length_check" CHECK ((("char_length"("default_language") >= 2) AND ("char_length"("default_language") <= 35))),
    CONSTRAINT "brands_description_length_check" CHECK ((("description" IS NULL) OR ("char_length"("description") <= 2000))),
    CONSTRAINT "brands_industry_length_check" CHECK ((("industry" IS NULL) OR ("char_length"("industry") <= 100))),
    CONSTRAINT "brands_logo_url_length_check" CHECK ((("logo_url" IS NULL) OR ("char_length"("logo_url") <= 2048))),
    CONSTRAINT "brands_name_length_check" CHECK ((("char_length"(TRIM(BOTH FROM "name")) >= 2) AND ("char_length"(TRIM(BOTH FROM "name")) <= 100))),
    CONSTRAINT "brands_primary_color_check" CHECK ((("primary_color" IS NULL) OR ("primary_color" ~ '^#[0-9A-Fa-f]{6}$'::"text"))),
    CONSTRAINT "brands_secondary_color_check" CHECK ((("secondary_color" IS NULL) OR ("secondary_color" ~ '^#[0-9A-Fa-f]{6}$'::"text"))),
    CONSTRAINT "brands_slug_format_check" CHECK (((("char_length"("slug") >= 2) AND ("char_length"("slug") <= 120)) AND ("slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::"text"))),
    CONSTRAINT "brands_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'archived'::"text"]))),
    CONSTRAINT "brands_website_url_length_check" CHECK ((("website_url" IS NULL) OR ("char_length"("website_url") <= 2048)))
);


ALTER TABLE "public"."brands" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."archive_brand"("target_brand_id" "uuid") RETURNS "public"."brands"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    selected_brand public.brands%rowtype;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select b.*
    into selected_brand
    from public.brands b
    where b.id = target_brand_id;

    if selected_brand.id is null then
        raise exception 'Marca não encontrada.';
    end if;

    if not public.has_workspace_role(
        selected_brand.workspace_id,
        array['owner', 'admin']
    ) then
        raise exception
            'Não possui permissão para arquivar esta marca.';
    end if;

    if selected_brand.status = 'archived' then
        return selected_brand;
    end if;

    update public.brands
    set status = 'archived'
    where id = target_brand_id
    returning *
    into selected_brand;

    return selected_brand;
end;
$$;


ALTER FUNCTION "public"."archive_brand"("target_brand_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."calendar_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "plan_item_id" "uuid",
    "created_by" "uuid",
    "assigned_to" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "event_type" "text" DEFAULT 'content'::"text" NOT NULL,
    "platform" "text",
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone,
    "timezone" "text" DEFAULT 'Europe/Lisbon'::"text" NOT NULL,
    "all_day" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'planned'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status_before_archive" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "archived_at" timestamp with time zone,
    CONSTRAINT "calendar_events_archive_consistency_check" CHECK (((("status" = 'archived'::"text") AND ("status_before_archive" IS NOT NULL) AND ("archived_at" IS NOT NULL)) OR (("status" <> 'archived'::"text") AND ("status_before_archive" IS NULL) AND ("archived_at" IS NULL)))),
    CONSTRAINT "calendar_events_description_length_check" CHECK ((("description" IS NULL) OR ("char_length"("description") <= 10000))),
    CONSTRAINT "calendar_events_metadata_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "calendar_events_platform_check" CHECK ((("platform" IS NULL) OR ("platform" = ANY (ARRAY['instagram'::"text", 'facebook'::"text", 'linkedin'::"text", 'tiktok'::"text", 'youtube'::"text", 'pinterest'::"text", 'threads'::"text", 'x'::"text", 'blog'::"text", 'email'::"text"])))),
    CONSTRAINT "calendar_events_previous_status_check" CHECK ((("status_before_archive" IS NULL) OR ("status_before_archive" = ANY (ARRAY['planned'::"text", 'confirmed'::"text", 'completed'::"text", 'cancelled'::"text"])))),
    CONSTRAINT "calendar_events_status_check" CHECK (("status" = ANY (ARRAY['planned'::"text", 'confirmed'::"text", 'completed'::"text", 'cancelled'::"text", 'archived'::"text"]))),
    CONSTRAINT "calendar_events_time_order_check" CHECK ((("ends_at" IS NULL) OR ("ends_at" >= "starts_at"))),
    CONSTRAINT "calendar_events_timezone_length_check" CHECK ((("char_length"(TRIM(BOTH FROM "timezone")) >= 1) AND ("char_length"(TRIM(BOTH FROM "timezone")) <= 64))),
    CONSTRAINT "calendar_events_title_length_check" CHECK ((("char_length"(TRIM(BOTH FROM "title")) >= 2) AND ("char_length"(TRIM(BOTH FROM "title")) <= 160))),
    CONSTRAINT "calendar_events_type_check" CHECK (("event_type" = ANY (ARRAY['content'::"text", 'deadline'::"text", 'event'::"text", 'reminder'::"text"])))
);


ALTER TABLE "public"."calendar_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."calendar_events" IS 'Eventos do calendário editorial da StudioV. Não representa a fila de publicação automática.';



CREATE OR REPLACE FUNCTION "public"."archive_calendar_event"("event_id_value" "uuid") RETURNS "public"."calendar_events"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_event public.calendar_events;
    archived_event public.calendar_events;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into current_event
    from public.calendar_events ce
    where ce.id = event_id_value;

    if not found then
        raise exception 'Evento não encontrado.';
    end if;

    if not public.has_workspace_role(
        current_event.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para arquivar este evento.';
    end if;

    if current_event.status = 'archived' then
        raise exception 'O evento já está arquivado.';
    end if;

    update public.calendar_events
    set
        status_before_archive = current_event.status,
        status = 'archived',
        archived_at = now()
    where id = event_id_value
    returning *
    into archived_event;

    return archived_event;
end;
$$;


ALTER FUNCTION "public"."archive_calendar_event"("event_id_value" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "created_by" "uuid",
    "assigned_to" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "objective" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "start_date" "date",
    "end_date" "date",
    "budget" numeric(14,2),
    "currency" "text" DEFAULT 'EUR'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status_before_archive" "text",
    "archived_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "campaigns_archive_consistency_check" CHECK (((("status" = 'archived'::"text") AND ("status_before_archive" IS NOT NULL) AND ("archived_at" IS NOT NULL)) OR (("status" <> 'archived'::"text") AND ("status_before_archive" IS NULL) AND ("archived_at" IS NULL)))),
    CONSTRAINT "campaigns_budget_check" CHECK ((("budget" IS NULL) OR ("budget" >= (0)::numeric))),
    CONSTRAINT "campaigns_currency_check" CHECK (("currency" ~ '^[A-Z]{3}$'::"text")),
    CONSTRAINT "campaigns_date_range_check" CHECK ((("start_date" IS NULL) OR ("end_date" IS NULL) OR ("end_date" >= "start_date"))),
    CONSTRAINT "campaigns_metadata_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "campaigns_name_length_check" CHECK ((("char_length"(TRIM(BOTH FROM "name")) >= 3) AND ("char_length"(TRIM(BOTH FROM "name")) <= 160))),
    CONSTRAINT "campaigns_previous_status_check" CHECK ((("status_before_archive" IS NULL) OR ("status_before_archive" = ANY (ARRAY['draft'::"text", 'active'::"text", 'paused'::"text", 'completed'::"text", 'cancelled'::"text"])))),
    CONSTRAINT "campaigns_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'paused'::"text", 'completed'::"text", 'cancelled'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."campaigns" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."archive_campaign"("campaign_id_value" "uuid") RETURNS "public"."campaigns"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
    campaign_row public.campaigns%rowtype;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into campaign_row
    from public.campaigns
    where id = campaign_id_value
    for update;

    if not found then
        raise exception 'Campanha não encontrada.';
    end if;

    if campaign_row.status = 'archived' then
        raise exception
            'A campanha já está arquivada.';
    end if;

    if not public.has_campaign_workspace_role(
        campaign_row.workspace_id,
        array['owner', 'admin']
    ) then
        raise exception
            'Apenas owner ou admin pode arquivar campanhas.';
    end if;

    update public.campaigns
    set
        status_before_archive = status,
        status = 'archived',
        archived_at = now()
    where id = campaign_id_value
    returning *
    into campaign_row;

    return campaign_row;
end;
$$;


ALTER FUNCTION "public"."archive_campaign"("campaign_id_value" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "name" "text" NOT NULL,
    "company_name" "text",
    "email" "text",
    "phone" "text",
    "website_url" "text",
    "notes" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "clients_company_name_length_check" CHECK ((("company_name" IS NULL) OR ("char_length"("company_name") <= 160))),
    CONSTRAINT "clients_email_check" CHECK ((("email" IS NULL) OR ((("char_length"("email") >= 3) AND ("char_length"("email") <= 254)) AND ("email" ~ '^[^[:space:]@]+@[^[:space:]@]+$'::"text")))),
    CONSTRAINT "clients_name_length_check" CHECK ((("char_length"("name") >= 2) AND ("char_length"("name") <= 120))),
    CONSTRAINT "clients_notes_length_check" CHECK ((("notes" IS NULL) OR ("char_length"("notes") <= 10000))),
    CONSTRAINT "clients_phone_length_check" CHECK ((("phone" IS NULL) OR ("char_length"("phone") <= 50))),
    CONSTRAINT "clients_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'archived'::"text"]))),
    CONSTRAINT "clients_website_url_length_check" CHECK ((("website_url" IS NULL) OR ("char_length"("website_url") <= 2048)))
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."archive_client"("target_client_id" "uuid") RETURNS "public"."clients"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    selected_client public.clients%rowtype;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select c.*
    into selected_client
    from public.clients c
    where c.id = target_client_id;

    if selected_client.id is null then
        raise exception 'Cliente não encontrado.';
    end if;

    if not public.has_workspace_role(
        selected_client.workspace_id,
        array['owner', 'admin']
    ) then
        raise exception
            'Não possui permissão para arquivar este cliente.';
    end if;

    if selected_client.status = 'archived' then
        return selected_client;
    end if;

    update public.clients
    set status = 'archived'
    where id = target_client_id
    returning *
    into selected_client;

    return selected_client;
end;
$$;


ALTER FUNCTION "public"."archive_client"("target_client_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "plan_item_id" "uuid",
    "created_by" "uuid",
    "assigned_to" "uuid",
    "title" "text" NOT NULL,
    "brief" "text",
    "main_text" "text",
    "content_type" "text" DEFAULT 'post'::"text" NOT NULL,
    "source" "text" DEFAULT 'manual'::"text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status_before_archive" "text",
    "archived_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "target_platforms" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    CONSTRAINT "contents_archive_state_check" CHECK (((("status" = 'archived'::"text") AND ("status_before_archive" = ANY (ARRAY['draft'::"text", 'in_review'::"text", 'approved'::"text", 'scheduled'::"text", 'published'::"text", 'cancelled'::"text"])) AND ("archived_at" IS NOT NULL)) OR (("status" <> 'archived'::"text") AND ("status_before_archive" IS NULL) AND ("archived_at" IS NULL)))),
    CONSTRAINT "contents_brief_length_check" CHECK ((("brief" IS NULL) OR ("char_length"("brief") <= 20000))),
    CONSTRAINT "contents_main_text_length_check" CHECK ((("main_text" IS NULL) OR ("char_length"("main_text") <= 100000))),
    CONSTRAINT "contents_metadata_object_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "contents_planner_source_check" CHECK (((("plan_item_id" IS NULL) AND ("source" <> 'planner'::"text")) OR (("plan_item_id" IS NOT NULL) AND ("source" = 'planner'::"text")))),
    CONSTRAINT "contents_source_check" CHECK (("source" = ANY (ARRAY['manual'::"text", 'planner'::"text", 'ai'::"text", 'imported'::"text", 'reused'::"text"]))),
    CONSTRAINT "contents_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'in_review'::"text", 'approved'::"text", 'scheduled'::"text", 'published'::"text", 'cancelled'::"text", 'archived'::"text"]))),
    CONSTRAINT "contents_target_platforms_check" CHECK (("target_platforms" <@ ARRAY['instagram'::"text", 'facebook'::"text", 'linkedin'::"text", 'tiktok'::"text", 'youtube'::"text", 'pinterest'::"text", 'threads'::"text", 'x'::"text", 'blog'::"text", 'email'::"text"])),
    CONSTRAINT "contents_title_length_check" CHECK ((("char_length"(TRIM(BOTH FROM "title")) >= 2) AND ("char_length"(TRIM(BOTH FROM "title")) <= 180))),
    CONSTRAINT "contents_type_check" CHECK (("content_type" = ANY (ARRAY['post'::"text", 'reel'::"text", 'story'::"text", 'carousel'::"text", 'video'::"text", 'article'::"text", 'email'::"text", 'short'::"text"])))
);


ALTER TABLE "public"."contents" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."archive_content"("content_id_value" "uuid") RETURNS "public"."contents"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
    current_user_id uuid;
    current_user_role text;
    content_workspace_id uuid;
    current_status text;
    archived_content public.contents;
begin
    current_user_id := auth.uid();

    if current_user_id is null then
        raise exception
            'Utilizador não autenticado.';
    end if;

    select
        workspace_id,
        status
    into
        content_workspace_id,
        current_status
    from public.contents
    where id = content_id_value;

    if not found then
        raise exception
            'Conteúdo não encontrado.';
    end if;

    select role
    into current_user_role
    from public.workspace_members
    where workspace_id =
            content_workspace_id
      and user_id =
            current_user_id
      and status = 'active'
    limit 1;

    if
        current_user_role is null
        or current_user_role not in (
            'owner',
            'admin',
            'editor'
        )
    then
        raise exception
            'Não possui permissão para arquivar conteúdos.';
    end if;

    if current_status = 'archived' then
        raise exception
            'O conteúdo já está arquivado.';
    end if;

    update public.contents
    set
        status_before_archive =
            current_status,

        status =
            'archived',

        archived_at =
            now(),

        updated_at =
            now()

    where id = content_id_value

    returning *
    into archived_content;

    return archived_content;
end;
$$;


ALTER FUNCTION "public"."archive_content"("content_id_value" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_plan_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "assigned_to" "uuid",
    "title" "text" NOT NULL,
    "brief" "text",
    "content_type" "text" DEFAULT 'post'::"text" NOT NULL,
    "target_platforms" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "source" "text" DEFAULT 'manual'::"text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "status" "text" DEFAULT 'idea'::"text" NOT NULL,
    "due_date" "date",
    "position" bigint DEFAULT 1024 NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status_before_archive" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "archived_at" timestamp with time zone,
    CONSTRAINT "content_plan_items_archive_consistency_check" CHECK (((("status" = 'archived'::"text") AND ("status_before_archive" IS NOT NULL) AND ("archived_at" IS NOT NULL)) OR (("status" <> 'archived'::"text") AND ("status_before_archive" IS NULL) AND ("archived_at" IS NULL)))),
    CONSTRAINT "content_plan_items_brief_length_check" CHECK ((("brief" IS NULL) OR ("char_length"("brief") <= 10000))),
    CONSTRAINT "content_plan_items_content_type_check" CHECK (("content_type" = ANY (ARRAY['post'::"text", 'carousel'::"text", 'story'::"text", 'reel'::"text", 'short'::"text", 'video'::"text", 'article'::"text", 'email'::"text", 'other'::"text"]))),
    CONSTRAINT "content_plan_items_metadata_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "content_plan_items_platforms_check" CHECK ((("target_platforms" <@ ARRAY['instagram'::"text", 'facebook'::"text", 'linkedin'::"text", 'tiktok'::"text", 'youtube'::"text", 'pinterest'::"text", 'threads'::"text", 'x'::"text", 'blog'::"text", 'email'::"text"]) AND ("cardinality"("target_platforms") <= 10))),
    CONSTRAINT "content_plan_items_position_check" CHECK (("position" >= 0)),
    CONSTRAINT "content_plan_items_previous_status_check" CHECK ((("status_before_archive" IS NULL) OR ("status_before_archive" = ANY (ARRAY['idea'::"text", 'planned'::"text", 'in_progress'::"text", 'review'::"text", 'approved'::"text", 'converted'::"text"])))),
    CONSTRAINT "content_plan_items_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "content_plan_items_source_check" CHECK (("source" = ANY (ARRAY['manual'::"text", 'ai'::"text", 'client'::"text", 'meeting'::"text", 'research'::"text", 'reused_content'::"text"]))),
    CONSTRAINT "content_plan_items_status_check" CHECK (("status" = ANY (ARRAY['idea'::"text", 'planned'::"text", 'in_progress'::"text", 'review'::"text", 'approved'::"text", 'converted'::"text", 'archived'::"text"]))),
    CONSTRAINT "content_plan_items_title_length_check" CHECK ((("char_length"(TRIM(BOTH FROM "title")) >= 2) AND ("char_length"(TRIM(BOTH FROM "title")) <= 160)))
);


ALTER TABLE "public"."content_plan_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."content_plan_items" IS 'Ideias, briefings e conteúdos em produção organizados no Content Planner.';



CREATE OR REPLACE FUNCTION "public"."archive_content_plan_item"("item_id_value" "uuid") RETURNS "public"."content_plan_items"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_item public.content_plan_items;
    archived_item public.content_plan_items;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into current_item
    from public.content_plan_items cpi
    where cpi.id = item_id_value;

    if not found then
        raise exception 'Item do Planner não encontrado.';
    end if;

    if not public.has_workspace_role(
        current_item.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para arquivar este item.';
    end if;

    if current_item.status = 'archived' then
        raise exception 'O item já está arquivado.';
    end if;

    update public.content_plan_items
    set
        status_before_archive = current_item.status,
        status = 'archived',
        archived_at = now()
    where id = item_id_value
    returning *
    into archived_item;

    return archived_item;
end;
$$;


ALTER FUNCTION "public"."archive_content_plan_item"("item_id_value" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "content_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "platform" "text" NOT NULL,
    "title" "text",
    "body" "text",
    "hashtags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "call_to_action" "text",
    "media_notes" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status_before_archive" "text",
    "archived_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "content_versions_archive_state_check" CHECK (((("status" = 'archived'::"text") AND ("status_before_archive" = ANY (ARRAY['draft'::"text", 'ready'::"text", 'approved'::"text"])) AND ("archived_at" IS NOT NULL)) OR (("status" <> 'archived'::"text") AND ("status_before_archive" IS NULL) AND ("archived_at" IS NULL)))),
    CONSTRAINT "content_versions_body_length_check" CHECK ((("body" IS NULL) OR ("char_length"("body") <= 100000))),
    CONSTRAINT "content_versions_cta_length_check" CHECK ((("call_to_action" IS NULL) OR ("char_length"("call_to_action") <= 2000))),
    CONSTRAINT "content_versions_hashtags_limit_check" CHECK (("cardinality"("hashtags") <= 50)),
    CONSTRAINT "content_versions_hashtags_null_check" CHECK (("array_position"("hashtags", NULL::"text") IS NULL)),
    CONSTRAINT "content_versions_media_notes_length_check" CHECK ((("media_notes" IS NULL) OR ("char_length"("media_notes") <= 10000))),
    CONSTRAINT "content_versions_metadata_object_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "content_versions_platform_check" CHECK (("platform" = ANY (ARRAY['instagram'::"text", 'facebook'::"text", 'linkedin'::"text", 'tiktok'::"text", 'youtube'::"text", 'pinterest'::"text", 'threads'::"text", 'x'::"text"]))),
    CONSTRAINT "content_versions_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'ready'::"text", 'approved'::"text", 'archived'::"text"]))),
    CONSTRAINT "content_versions_title_length_check" CHECK ((("title" IS NULL) OR ("char_length"("title") <= 300)))
);


ALTER TABLE "public"."content_versions" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."archive_content_version"("content_version_id_value" "uuid") RETURNS "public"."content_versions"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_version public.content_versions;
    updated_version public.content_versions;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into current_version
    from public.content_versions
    where id = content_version_id_value
    for update;

    if not found then
        raise exception
            'Versão do conteúdo não encontrada.';
    end if;

    perform public.require_content_editor(
        current_version.workspace_id
    );

    if current_version.status = 'archived' then
        raise exception
            'A versão já está arquivada.';
    end if;

    update public.content_versions
    set
        status_before_archive = current_version.status,
        status = 'archived',
        archived_at = now()
    where id = content_version_id_value
    returning *
    into updated_version;

    return updated_version;
end;
$$;


ALTER FUNCTION "public"."archive_content_version"("content_version_id_value" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."media_assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "brand_id" "uuid",
    "folder_id" "uuid",
    "uploaded_by" "uuid",
    "bucket_id" "text" DEFAULT 'media-library'::"text" NOT NULL,
    "object_path" "text" NOT NULL,
    "storage_object_id" "uuid",
    "original_name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "file_extension" "text" NOT NULL,
    "mime_type" "text" NOT NULL,
    "media_type" "text" NOT NULL,
    "file_size" bigint NOT NULL,
    "width" integer,
    "height" integer,
    "duration_ms" bigint,
    "checksum_sha256" "text",
    "alt_text" "text",
    "caption" "text",
    "source" "text" DEFAULT 'upload'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending_upload'::"text" NOT NULL,
    "status_before_archive" "text",
    "failure_code" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "ready_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "archived_at" timestamp with time zone,
    CONSTRAINT "media_assets_alt_text_check" CHECK ((("alt_text" IS NULL) OR ("char_length"("alt_text") <= 1000))),
    CONSTRAINT "media_assets_archive_state_check" CHECK (((("status" = 'archived'::"text") AND ("archived_at" IS NOT NULL) AND ("status_before_archive" IS NOT NULL)) OR (("status" <> 'archived'::"text") AND ("archived_at" IS NULL) AND ("status_before_archive" IS NULL)))),
    CONSTRAINT "media_assets_bucket_check" CHECK (("bucket_id" = 'media-library'::"text")),
    CONSTRAINT "media_assets_caption_check" CHECK ((("caption" IS NULL) OR ("char_length"("caption") <= 5000))),
    CONSTRAINT "media_assets_checksum_check" CHECK ((("checksum_sha256" IS NULL) OR ("checksum_sha256" ~ '^[0-9a-f]{64}$'::"text"))),
    CONSTRAINT "media_assets_display_name_check" CHECK ((("char_length"(TRIM(BOTH FROM "display_name")) >= 1) AND ("char_length"(TRIM(BOTH FROM "display_name")) <= 255))),
    CONSTRAINT "media_assets_duration_check" CHECK ((("duration_ms" IS NULL) OR ("duration_ms" >= 0))),
    CONSTRAINT "media_assets_extension_check" CHECK (("file_extension" ~ '^[a-z0-9]{1,10}$'::"text")),
    CONSTRAINT "media_assets_height_check" CHECK ((("height" IS NULL) OR ("height" > 0))),
    CONSTRAINT "media_assets_media_type_check" CHECK (("media_type" = ANY (ARRAY['image'::"text", 'video'::"text", 'audio'::"text", 'document'::"text"]))),
    CONSTRAINT "media_assets_metadata_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "media_assets_mime_check" CHECK (("mime_type" = ANY (ARRAY['image/jpeg'::"text", 'image/png'::"text", 'image/webp'::"text", 'image/gif'::"text", 'video/mp4'::"text", 'video/webm'::"text", 'video/quicktime'::"text", 'audio/mpeg'::"text", 'audio/wav'::"text", 'audio/x-wav'::"text", 'audio/mp4'::"text", 'audio/x-m4a'::"text", 'application/pdf'::"text"]))),
    CONSTRAINT "media_assets_mime_type_consistency_check" CHECK (((("media_type" = 'image'::"text") AND ("mime_type" ~~ 'image/%'::"text")) OR (("media_type" = 'video'::"text") AND ("mime_type" ~~ 'video/%'::"text")) OR (("media_type" = 'audio'::"text") AND ("mime_type" ~~ 'audio/%'::"text")) OR (("media_type" = 'document'::"text") AND ("mime_type" = 'application/pdf'::"text")))),
    CONSTRAINT "media_assets_original_name_check" CHECK ((("char_length"(TRIM(BOTH FROM "original_name")) >= 1) AND ("char_length"(TRIM(BOTH FROM "original_name")) <= 255))),
    CONSTRAINT "media_assets_previous_status_check" CHECK ((("status_before_archive" IS NULL) OR ("status_before_archive" = ANY (ARRAY['pending_upload'::"text", 'processing'::"text", 'ready'::"text", 'failed'::"text"])))),
    CONSTRAINT "media_assets_size_check" CHECK ((("file_size" >= 1) AND ("file_size" <= 262144000))),
    CONSTRAINT "media_assets_source_check" CHECK (("source" = ANY (ARRAY['upload'::"text", 'ai_generated'::"text", 'imported'::"text", 'system'::"text"]))),
    CONSTRAINT "media_assets_status_check" CHECK (("status" = ANY (ARRAY['pending_upload'::"text", 'processing'::"text", 'ready'::"text", 'failed'::"text", 'archived'::"text"]))),
    CONSTRAINT "media_assets_width_check" CHECK ((("width" IS NULL) OR ("width" > 0)))
);


ALTER TABLE "public"."media_assets" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."archive_media_asset"("target_asset_id" "uuid") RETURNS "public"."media_assets"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    asset_record public.media_assets;
begin
    select *
    into asset_record
    from public.media_assets
    where id = target_asset_id
    for update;

    if asset_record.id is null then
        raise exception 'Ficheiro não encontrado.';
    end if;

    if not public.has_workspace_role(
        asset_record.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para arquivar o ficheiro.';
    end if;

    if asset_record.status = 'archived' then
        return asset_record;
    end if;

    update public.media_assets
    set
        status_before_archive = status,
        status = 'archived',
        archived_at = now()
    where id = target_asset_id
    returning *
    into asset_record;

    return asset_record;
end;
$$;


ALTER FUNCTION "public"."archive_media_asset"("target_asset_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."media_folders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "brand_id" "uuid",
    "parent_id" "uuid",
    "created_by" "uuid",
    "name" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "archived_at" timestamp with time zone,
    CONSTRAINT "media_folders_archive_state_check" CHECK (((("status" = 'active'::"text") AND ("archived_at" IS NULL)) OR (("status" = 'archived'::"text") AND ("archived_at" IS NOT NULL)))),
    CONSTRAINT "media_folders_name_length_check" CHECK ((("char_length"(TRIM(BOTH FROM "name")) >= 1) AND ("char_length"(TRIM(BOTH FROM "name")) <= 100))),
    CONSTRAINT "media_folders_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."media_folders" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."archive_media_folder"("target_folder_id" "uuid") RETURNS "public"."media_folders"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    folder_record public.media_folders;
begin
    select *
    into folder_record
    from public.media_folders
    where id = target_folder_id
    for update;

    if folder_record.id is null then
        raise exception 'Pasta não encontrada.';
    end if;

    if not public.has_workspace_role(
        folder_record.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para arquivar a pasta.';
    end if;

    if folder_record.status = 'archived' then
        return folder_record;
    end if;

    update public.media_folders
    set
        status = 'archived',
        archived_at = now()
    where id = target_folder_id
    returning *
    into folder_record;

    return folder_record;
end;
$$;


ALTER FUNCTION "public"."archive_media_folder"("target_folder_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_brand_to_client"("target_brand_id" "uuid", "target_client_id" "uuid") RETURNS "public"."brands"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    selected_brand public.brands%rowtype;
    selected_client public.clients%rowtype;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select b.*
    into selected_brand
    from public.brands b
    where b.id = target_brand_id;

    if selected_brand.id is null then
        raise exception 'Marca não encontrada.';
    end if;

    select c.*
    into selected_client
    from public.clients c
    where c.id = target_client_id;

    if selected_client.id is null then
        raise exception 'Cliente não encontrado.';
    end if;

    if selected_brand.workspace_id
       <> selected_client.workspace_id then
        raise exception
            'A marca e o cliente pertencem a workspaces diferentes.';
    end if;

    if selected_brand.status <> 'active' then
        raise exception
            'A marca precisa estar ativa.';
    end if;

    if selected_client.status <> 'active' then
        raise exception
            'O cliente precisa estar ativo.';
    end if;

    if not public.has_workspace_role(
        selected_brand.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'Não possui permissão para associar esta marca.';
    end if;

    update public.brands
    set client_id = target_client_id
    where id = target_brand_id
    returning *
    into selected_brand;

    return selected_brand;
end;
$$;


ALTER FUNCTION "public"."assign_brand_to_client"("target_brand_id" "uuid", "target_client_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_calendar_event"("event_id_value" "uuid", "assigned_to_value" "uuid") RETURNS "public"."calendar_events"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_event public.calendar_events;
    assigned_event public.calendar_events;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into current_event
    from public.calendar_events ce
    where ce.id = event_id_value;

    if not found then
        raise exception 'Evento não encontrado.';
    end if;

    if not public.has_workspace_role(
        current_event.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para atribuir este evento.';
    end if;

    if current_event.status = 'archived' then
        raise exception
            'Eventos arquivados não podem ser atribuídos.';
    end if;

    if (
        assigned_to_value is not null
        and not exists (
            select 1
            from public.workspace_members wm
            where wm.workspace_id = current_event.workspace_id
              and wm.user_id = assigned_to_value
              and wm.status = 'active'
        )
    ) then
        raise exception
            'O responsável deve ser membro ativo do workspace.';
    end if;

    update public.calendar_events
    set assigned_to = assigned_to_value
    where id = event_id_value
    returning *
    into assigned_event;

    return assigned_event;
end;
$$;


ALTER FUNCTION "public"."assign_calendar_event"("event_id_value" "uuid", "assigned_to_value" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_campaign"("campaign_id_value" "uuid", "assigned_to_value" "uuid") RETURNS "public"."campaigns"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
    campaign_row public.campaigns%rowtype;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into campaign_row
    from public.campaigns
    where id = campaign_id_value
    for update;

    if not found then
        raise exception 'Campanha não encontrada.';
    end if;

    if campaign_row.status = 'archived' then
        raise exception
            'A campanha está arquivada.';
    end if;

    if not public.has_campaign_workspace_role(
        campaign_row.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para atribuir campanhas.';
    end if;

    update public.campaigns
    set assigned_to = assigned_to_value
    where id = campaign_id_value
    returning *
    into campaign_row;

    return campaign_row;
end;
$$;


ALTER FUNCTION "public"."assign_campaign"("campaign_id_value" "uuid", "assigned_to_value" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_content"("content_id_value" "uuid", "assigned_to_value" "uuid") RETURNS "public"."contents"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_content public.contents;
    updated_content public.contents;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into current_content
    from public.contents
    where id = content_id_value
    for update;

    if not found then
        raise exception 'Conteúdo não encontrado.';
    end if;

    perform public.require_content_editor(
        current_content.workspace_id
    );

    if current_content.status = 'archived' then
        raise exception
            'Não é possível atribuir um conteúdo arquivado.';
    end if;

    update public.contents
    set assigned_to = assigned_to_value
    where id = content_id_value
    returning *
    into updated_content;

    return updated_content;
end;
$$;


ALTER FUNCTION "public"."assign_content"("content_id_value" "uuid", "assigned_to_value" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_content_plan_item"("item_id_value" "uuid", "assigned_to_value" "uuid") RETURNS "public"."content_plan_items"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_item public.content_plan_items;
    assigned_item public.content_plan_items;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into current_item
    from public.content_plan_items cpi
    where cpi.id = item_id_value;

    if not found then
        raise exception 'Item do Planner não encontrado.';
    end if;

    if not public.has_workspace_role(
        current_item.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para atribuir este item.';
    end if;

    if current_item.status in ('archived', 'converted') then
        raise exception
            'Itens arquivados ou convertidos não podem ser atribuídos.';
    end if;

    if (
        assigned_to_value is not null
        and not exists (
            select 1
            from public.workspace_members wm
            where wm.workspace_id = current_item.workspace_id
              and wm.user_id = assigned_to_value
              and wm.status = 'active'
        )
    ) then
        raise exception
            'O responsável deve ser membro ativo do workspace.';
    end if;

    update public.content_plan_items
    set assigned_to = assigned_to_value
    where id = item_id_value
    returning *
    into assigned_item;

    return assigned_item;
end;
$$;


ALTER FUNCTION "public"."assign_content_plan_item"("item_id_value" "uuid", "assigned_to_value" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaign_contents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "content_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "position" bigint DEFAULT 1024 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "campaign_contents_position_check" CHECK (("position" >= 0))
);


ALTER TABLE "public"."campaign_contents" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."attach_content_to_campaign"("campaign_id_value" "uuid", "content_id_value" "uuid", "position_value" bigint DEFAULT 1024) RETURNS "public"."campaign_contents"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
    campaign_row public.campaigns%rowtype;
    relation_row public.campaign_contents%rowtype;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into campaign_row
    from public.campaigns
    where id = campaign_id_value;

    if not found then
        raise exception 'Campanha não encontrada.';
    end if;

    if not public.has_campaign_workspace_role(
        campaign_row.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para gerir a campanha.';
    end if;

    if position_value is null or position_value < 0 then
        raise exception 'A posição não pode ser negativa.';
    end if;

    if exists (
        select 1
        from public.campaign_contents cc
        where cc.campaign_id = campaign_id_value
          and cc.content_id = content_id_value
    ) then
        raise exception
            'O conteúdo já está associado a esta campanha.';
    end if;

    insert into public.campaign_contents (
        workspace_id,
        campaign_id,
        content_id,
        created_by,
        position
    )
    values (
        campaign_row.workspace_id,
        campaign_id_value,
        content_id_value,
        auth.uid(),
        position_value
    )
    returning *
    into relation_row;

    return relation_row;
end;
$$;


ALTER FUNCTION "public"."attach_content_to_campaign"("campaign_id_value" "uuid", "content_id_value" "uuid", "position_value" bigint) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_version_assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "content_version_id" "uuid" NOT NULL,
    "media_asset_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "usage_type" "text" DEFAULT 'primary'::"text" NOT NULL,
    "position" bigint DEFAULT 1024 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "content_version_assets_position_check" CHECK (("position" >= 0)),
    CONSTRAINT "content_version_assets_usage_check" CHECK (("usage_type" = ANY (ARRAY['primary'::"text", 'gallery'::"text", 'thumbnail'::"text", 'background'::"text", 'attachment'::"text"])))
);


ALTER TABLE "public"."content_version_assets" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."attach_content_version_asset"("content_version_id_value" "uuid", "media_asset_id_value" "uuid", "usage_type_value" "text" DEFAULT 'primary'::"text", "position_value" bigint DEFAULT NULL::bigint) RETURNS "public"."content_version_assets"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    version_row public.content_versions;
    parent_status text;
    new_link public.content_version_assets;
    final_position bigint;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into version_row
    from public.content_versions
    where id = content_version_id_value;

    if not found then
        raise exception
            'Versão do conteúdo não encontrada.';
    end if;

    perform public.require_content_editor(
        version_row.workspace_id
    );

    select status
    into parent_status
    from public.contents
    where id = version_row.content_id;

    if version_row.status = 'archived'
       or parent_status = 'archived' then
        raise exception
            'Não é possível associar mídia a conteúdo arquivado.';
    end if;

    if exists (
        select 1
        from public.content_version_assets cva
        where cva.content_version_id =
              content_version_id_value
          and cva.media_asset_id =
              media_asset_id_value
    ) then
        raise exception
            'Esta mídia já está associada à versão.';
    end if;

    if position_value is null then
        select coalesce(max(position) + 1024, 1024)
        into final_position
        from public.content_version_assets
        where content_version_id =
              content_version_id_value;
    else
        final_position := position_value;
    end if;

    insert into public.content_version_assets (
        workspace_id,
        content_version_id,
        media_asset_id,
        created_by,
        usage_type,
        position
    )
    values (
        version_row.workspace_id,
        version_row.id,
        media_asset_id_value,
        auth.uid(),
        lower(trim(usage_type_value)),
        final_position
    )
    returning *
    into new_link;

    return new_link;
end;
$$;


ALTER FUNCTION "public"."attach_content_version_asset"("content_version_id_value" "uuid", "media_asset_id_value" "uuid", "usage_type_value" "text", "position_value" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_read_campaign_workspace"("workspace_id_value" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
    select
        auth.uid() is not null
        and exists (
            select 1
            from public.workspace_members wm
            where wm.workspace_id = workspace_id_value
              and wm.user_id = auth.uid()
              and wm.status = 'active'
        );
$$;


ALTER FUNCTION "public"."can_read_campaign_workspace"("workspace_id_value" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_read_media_object"("target_object_path" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    select exists (
        select 1
        from public.media_assets asset

        join public.workspace_members member
          on member.workspace_id = asset.workspace_id

        where asset.object_path = target_object_path
          and member.user_id = auth.uid()
          and member.status = 'active'
    );
$$;


ALTER FUNCTION "public"."can_read_media_object"("target_object_path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_upload_media_object"("target_object_path" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    select exists (
        select 1
        from public.media_assets asset

        join public.workspace_members member
          on member.workspace_id = asset.workspace_id

        where asset.object_path = target_object_path
          and asset.status = 'pending_upload'
          and asset.uploaded_by = auth.uid()

          and member.user_id = auth.uid()
          and member.status = 'active'
          and member.role in (
              'owner',
              'admin',
              'editor'
          )
    );
$$;


ALTER FUNCTION "public"."can_upload_media_object"("target_object_path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_audit_logs"("workspace_id_value" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    select
        auth.uid() is not null
        and (
            exists (
                select 1
                from public.workspaces w
                where w.id = workspace_id_value
                  and w.owner_id = auth.uid()
            )
            or
            exists (
                select 1
                from public.workspace_members wm
                where wm.workspace_id = workspace_id_value
                  and wm.user_id = auth.uid()
                  and wm.status = 'active'
                  and wm.role in ('owner', 'admin')
            )
        );
$$;


ALTER FUNCTION "public"."can_view_audit_logs"("workspace_id_value" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_billing"("workspace_id_value" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    select
        auth.uid() is not null
        and exists (
            select 1
            from public.workspaces w
            where w.id = workspace_id_value
              and w.owner_id = auth.uid()
        );
$$;


ALTER FUNCTION "public"."can_view_billing"("workspace_id_value" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."change_calendar_event_status"("event_id_value" "uuid", "status_value" "text") RETURNS "public"."calendar_events"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_event public.calendar_events;
    changed_event public.calendar_events;
    normalized_status text;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into current_event
    from public.calendar_events ce
    where ce.id = event_id_value;

    if not found then
        raise exception 'Evento não encontrado.';
    end if;

    if not public.has_workspace_role(
        current_event.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para alterar este evento.';
    end if;

    if current_event.status = 'archived' then
        raise exception
            'Eventos arquivados não podem ter o estado alterado.';
    end if;

    normalized_status :=
        lower(trim(status_value));

    if normalized_status not in (
        'planned',
        'confirmed',
        'completed',
        'cancelled'
    ) then
        raise exception 'Estado de evento inválido.';
    end if;

    if current_event.status = normalized_status then
        raise exception
            'O evento já está neste estado.';
    end if;

    update public.calendar_events
    set status = normalized_status
    where id = event_id_value
    returning *
    into changed_event;

    return changed_event;
end;
$$;


ALTER FUNCTION "public"."change_calendar_event_status"("event_id_value" "uuid", "status_value" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."change_campaign_status"("campaign_id_value" "uuid", "status_value" "text") RETURNS "public"."campaigns"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
    campaign_row public.campaigns%rowtype;
    normalized_status text;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    normalized_status := lower(trim(status_value));

    if normalized_status not in (
        'draft',
        'active',
        'paused',
        'completed',
        'cancelled'
    ) then
        raise exception 'Estado de campanha inválido.';
    end if;

    select *
    into campaign_row
    from public.campaigns
    where id = campaign_id_value
    for update;

    if not found then
        raise exception 'Campanha não encontrada.';
    end if;

    if campaign_row.status = 'archived' then
        raise exception
            'A campanha está arquivada.';
    end if;

    if campaign_row.status = normalized_status then
        raise exception
            'A campanha já está neste estado.';
    end if;

    if not public.has_campaign_workspace_role(
        campaign_row.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para alterar a campanha.';
    end if;

    update public.campaigns
    set status = normalized_status
    where id = campaign_id_value
    returning *
    into campaign_row;

    return campaign_row;
end;
$$;


ALTER FUNCTION "public"."change_campaign_status"("campaign_id_value" "uuid", "status_value" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."change_content_status"("content_id_value" "uuid", "status_value" "text") RETURNS "public"."contents"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_content public.contents;
    updated_content public.contents;
    normalized_status text;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    normalized_status := lower(trim(status_value));

    if normalized_status not in (
        'draft',
        'in_review',
        'approved',
        'scheduled',
        'published',
        'cancelled'
    ) then
        raise exception 'Estado de conteúdo inválido.';
    end if;

    select *
    into current_content
    from public.contents
    where id = content_id_value
    for update;

    if not found then
        raise exception 'Conteúdo não encontrado.';
    end if;

    perform public.require_content_editor(
        current_content.workspace_id
    );

    if current_content.status = 'archived' then
        raise exception
            'O conteúdo está arquivado.';
    end if;

    if current_content.status = normalized_status then
        raise exception
            'O conteúdo já está neste estado.';
    end if;

    update public.contents
    set status = normalized_status
    where id = content_id_value
    returning *
    into updated_content;

    return updated_content;
end;
$$;


ALTER FUNCTION "public"."change_content_status"("content_id_value" "uuid", "status_value" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."change_content_version_status"("content_version_id_value" "uuid", "status_value" "text") RETURNS "public"."content_versions"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_version public.content_versions;
    parent_status text;
    updated_version public.content_versions;
    normalized_status text;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    normalized_status := lower(trim(status_value));

    if normalized_status not in (
        'draft',
        'ready',
        'approved'
    ) then
        raise exception
            'Estado da versão inválido.';
    end if;

    select *
    into current_version
    from public.content_versions
    where id = content_version_id_value
    for update;

    if not found then
        raise exception
            'Versão do conteúdo não encontrada.';
    end if;

    perform public.require_content_editor(
        current_version.workspace_id
    );

    select status
    into parent_status
    from public.contents
    where id = current_version.content_id;

    if parent_status = 'archived' then
        raise exception
            'O conteúdo principal está arquivado.';
    end if;

    if current_version.status = 'archived' then
        raise exception
            'A versão está arquivada.';
    end if;

    if current_version.status = normalized_status then
        raise exception
            'A versão já está neste estado.';
    end if;

    update public.content_versions
    set status = normalized_status
    where id = content_version_id_value
    returning *
    into updated_version;

    return updated_version;
end;
$$;


ALTER FUNCTION "public"."change_content_version_status"("content_version_id_value" "uuid", "status_value" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_media_upload"("target_asset_id" "uuid") RETURNS "public"."media_assets"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
declare
    current_user_id uuid;

    asset_record public.media_assets;

    storage_id uuid;
    storage_metadata jsonb;

    actual_file_size bigint;
begin
    current_user_id := auth.uid();

    if current_user_id is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into asset_record
    from public.media_assets
    where id = target_asset_id
    for update;

    if asset_record.id is null then
        raise exception 'Ficheiro não encontrado.';
    end if;

    if not public.has_workspace_role(
        asset_record.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para concluir o upload.';
    end if;

    if asset_record.status = 'archived' then
        raise exception
            'Um ficheiro arquivado não pode concluir upload.';
    end if;

    if asset_record.status = 'ready' then
        return asset_record;
    end if;

    select
        storage_object.id,
        storage_object.metadata
    into
        storage_id,
        storage_metadata
    from storage.objects storage_object
    where storage_object.bucket_id =
        asset_record.bucket_id
      and storage_object.name =
        asset_record.object_path
    limit 1;

    if storage_id is null then
        raise exception
            'O objeto ainda não existe no Supabase Storage.';
    end if;

    actual_file_size := case
        when coalesce(
            storage_metadata ->> 'size',
            ''
        ) ~ '^[0-9]+$'
        then (storage_metadata ->> 'size')::bigint
        else asset_record.file_size
    end;

    if actual_file_size not between 1 and 262144000 then
        raise exception
            'O tamanho real do ficheiro é inválido.';
    end if;

    update public.media_assets
    set
        storage_object_id = storage_id,
        file_size = actual_file_size,
        status = 'ready',
        ready_at = now(),
        failure_code = null
    where id = target_asset_id
    returning *
    into asset_record;

    return asset_record;
end;
$_$;


ALTER FUNCTION "public"."complete_media_upload"("target_asset_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."social_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "connected_by" "uuid",
    "platform" "text" NOT NULL,
    "external_account_id" "text" NOT NULL,
    "account_name" "text" NOT NULL,
    "username" "text",
    "account_type" "text",
    "profile_url" "text",
    "avatar_url" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "public_metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "connected_at" timestamp with time zone,
    "last_synced_at" timestamp with time zone,
    "last_error_code" "text",
    "last_error_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "social_accounts_external_id_length_check" CHECK ((("char_length"(TRIM(BOTH FROM "external_account_id")) >= 1) AND ("char_length"(TRIM(BOTH FROM "external_account_id")) <= 255))),
    CONSTRAINT "social_accounts_metadata_object_check" CHECK (("jsonb_typeof"("public_metadata") = 'object'::"text")),
    CONSTRAINT "social_accounts_name_length_check" CHECK ((("char_length"(TRIM(BOTH FROM "account_name")) >= 1) AND ("char_length"(TRIM(BOTH FROM "account_name")) <= 150))),
    CONSTRAINT "social_accounts_platform_check" CHECK (("platform" = ANY (ARRAY['instagram'::"text", 'facebook'::"text", 'linkedin'::"text", 'tiktok'::"text", 'pinterest'::"text", 'youtube'::"text"]))),
    CONSTRAINT "social_accounts_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'expired'::"text", 'revoked'::"text", 'error'::"text", 'disconnected'::"text"]))),
    CONSTRAINT "social_accounts_type_length_check" CHECK ((("account_type" IS NULL) OR (("char_length"(TRIM(BOTH FROM "account_type")) >= 1) AND ("char_length"(TRIM(BOTH FROM "account_type")) <= 80)))),
    CONSTRAINT "social_accounts_username_length_check" CHECK ((("username" IS NULL) OR (("char_length"(TRIM(BOTH FROM "username")) >= 1) AND ("char_length"(TRIM(BOTH FROM "username")) <= 150))))
);


ALTER TABLE "public"."social_accounts" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."connect_social_account"("target_workspace_id" "uuid", "target_brand_id" "uuid", "actor_user_id" "uuid", "platform_value" "text", "external_account_id_value" "text", "account_name_value" "text", "access_token_value" "text", "refresh_token_value" "text" DEFAULT NULL::"text", "username_value" "text" DEFAULT NULL::"text", "account_type_value" "text" DEFAULT NULL::"text", "profile_url_value" "text" DEFAULT NULL::"text", "avatar_url_value" "text" DEFAULT NULL::"text", "token_type_value" "text" DEFAULT 'Bearer'::"text", "scopes_value" "text"[] DEFAULT ARRAY[]::"text"[], "expires_at_value" timestamp with time zone DEFAULT NULL::timestamp with time zone, "public_metadata_value" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."social_accounts"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    account_record public.social_accounts;
    credentials_record private.social_account_credentials%rowtype;

    normalized_platform text;
    normalized_external_id text;
    access_secret_id uuid;
    refresh_secret_id uuid;
begin
    normalized_platform :=
        lower(trim(platform_value));

    normalized_external_id :=
        trim(external_account_id_value);

    if nullif(trim(access_token_value), '') is null then
        raise exception 'O access token é obrigatório.';
    end if;

    if public_metadata_value is null
       or jsonb_typeof(public_metadata_value) <> 'object' then
        raise exception
            'Os metadados públicos devem ser um objeto JSON.';
    end if;

    if public_metadata_value ?| array[
        'access_token',
        'refresh_token',
        'client_secret',
        'authorization_code'
    ] then
        raise exception
            'Credenciais secretas não podem ser guardadas nos metadados públicos.';
    end if;

    if expires_at_value is not null
       and expires_at_value <= now() then
        raise exception
            'A data de expiração do token deve estar no futuro.';
    end if;

    if not exists (
        select 1
        from public.workspace_members wm
        where wm.workspace_id = target_workspace_id
          and wm.user_id = actor_user_id
          and wm.status = 'active'
          and wm.role in ('owner', 'admin')
    ) then
        raise exception
            'O utilizador não possui permissão para conectar contas.';
    end if;

    if not exists (
        select 1
        from public.brands b
        where b.id = target_brand_id
          and b.workspace_id = target_workspace_id
          and b.status = 'active'
    ) then
        raise exception
            'Marca ativa não encontrada neste workspace.';
    end if;

    insert into public.social_accounts (
        workspace_id,
        brand_id,
        connected_by,
        platform,
        external_account_id,
        account_name,
        username,
        account_type,
        profile_url,
        avatar_url,
        status,
        public_metadata
    )
    values (
        target_workspace_id,
        target_brand_id,
        actor_user_id,
        normalized_platform,
        normalized_external_id,
        trim(account_name_value),
        nullif(trim(username_value), ''),
        nullif(trim(account_type_value), ''),
        nullif(trim(profile_url_value), ''),
        nullif(trim(avatar_url_value), ''),
        'pending',
        public_metadata_value
    )
    on conflict (
        workspace_id,
        platform,
        external_account_id
    )
    do update set
        brand_id = excluded.brand_id,
        connected_by = excluded.connected_by,
        account_name = excluded.account_name,
        username = excluded.username,
        account_type = excluded.account_type,
        profile_url = excluded.profile_url,
        avatar_url = excluded.avatar_url,
        status = 'pending',
        public_metadata = excluded.public_metadata,
        last_error_code = null,
        last_error_at = null
    returning *
    into account_record;

    select *
    into credentials_record
    from private.social_account_credentials
    where social_account_id = account_record.id
    for update;

    if credentials_record.access_token_secret_id is null
       or not exists (
           select 1
           from vault.secrets vs
           where vs.id =
               credentials_record.access_token_secret_id
       ) then

        access_secret_id := vault.create_secret(
            access_token_value,
            'social-account-' || account_record.id || '-access',
            'Access token da conta social ' || account_record.id
        );
    else
        access_secret_id :=
            credentials_record.access_token_secret_id;

        perform vault.update_secret(
            access_secret_id,
            access_token_value
        );
    end if;

    refresh_secret_id :=
        credentials_record.refresh_token_secret_id;

    if refresh_secret_id is not null
       and not exists (
           select 1
           from vault.secrets vs
           where vs.id = refresh_secret_id
       ) then
        refresh_secret_id := null;
    end if;

    if nullif(trim(refresh_token_value), '') is not null then
        if refresh_secret_id is null then
            refresh_secret_id := vault.create_secret(
                refresh_token_value,
                'social-account-' || account_record.id || '-refresh',
                'Refresh token da conta social ' || account_record.id
            );
        else
            perform vault.update_secret(
                refresh_secret_id,
                refresh_token_value
            );
        end if;
    end if;

    insert into private.social_account_credentials (
        social_account_id,
        access_token_secret_id,
        refresh_token_secret_id,
        token_type,
        scopes,
        expires_at,
        refreshed_at
    )
    values (
        account_record.id,
        access_secret_id,
        refresh_secret_id,
        nullif(trim(token_type_value), ''),
        coalesce(scopes_value, array[]::text[]),
        expires_at_value,
        now()
    )
    on conflict (social_account_id)
    do update set
        access_token_secret_id =
            excluded.access_token_secret_id,

        refresh_token_secret_id =
            excluded.refresh_token_secret_id,

        token_type =
            excluded.token_type,

        scopes =
            excluded.scopes,

        expires_at =
            excluded.expires_at,

        refreshed_at =
            excluded.refreshed_at;

    update public.social_accounts
    set
        status = 'active',
        connected_at = now(),
        last_error_code = null,
        last_error_at = null
    where id = account_record.id
    returning *
    into account_record;

    return account_record;
end;
$$;


ALTER FUNCTION "public"."connect_social_account"("target_workspace_id" "uuid", "target_brand_id" "uuid", "actor_user_id" "uuid", "platform_value" "text", "external_account_id_value" "text", "account_name_value" "text", "access_token_value" "text", "refresh_token_value" "text", "username_value" "text", "account_type_value" "text", "profile_url_value" "text", "avatar_url_value" "text", "token_type_value" "text", "scopes_value" "text"[], "expires_at_value" timestamp with time zone, "public_metadata_value" "jsonb") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "actor_user_id" "uuid",
    "action" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid",
    "description" "text",
    "source" "text" DEFAULT 'backend'::"text" NOT NULL,
    "severity" "text" DEFAULT 'info'::"text" NOT NULL,
    "old_data" "jsonb",
    "new_data" "jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "request_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "audit_logs_action_check" CHECK (((("char_length"(TRIM(BOTH FROM "action")) >= 3) AND ("char_length"(TRIM(BOTH FROM "action")) <= 120)) AND (TRIM(BOTH FROM "action") ~ '^[a-z0-9]+(\.[a-z0-9_]+)+$'::"text"))),
    CONSTRAINT "audit_logs_description_check" CHECK ((("description" IS NULL) OR (("char_length"(TRIM(BOTH FROM "description")) >= 1) AND ("char_length"(TRIM(BOTH FROM "description")) <= 1000)))),
    CONSTRAINT "audit_logs_entity_pair_check" CHECK (((("entity_type" IS NULL) AND ("entity_id" IS NULL)) OR (("entity_type" IS NOT NULL) AND ("entity_id" IS NOT NULL)))),
    CONSTRAINT "audit_logs_entity_type_check" CHECK ((("entity_type" IS NULL) OR ((("char_length"(TRIM(BOTH FROM "entity_type")) >= 2) AND ("char_length"(TRIM(BOTH FROM "entity_type")) <= 80)) AND (TRIM(BOTH FROM "entity_type") ~ '^[a-z][a-z0-9_]*$'::"text")))),
    CONSTRAINT "audit_logs_metadata_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "audit_logs_new_data_check" CHECK ((("new_data" IS NULL) OR ("jsonb_typeof"("new_data") = 'object'::"text"))),
    CONSTRAINT "audit_logs_old_data_check" CHECK ((("old_data" IS NULL) OR ("jsonb_typeof"("old_data") = 'object'::"text"))),
    CONSTRAINT "audit_logs_severity_check" CHECK (("severity" = ANY (ARRAY['info'::"text", 'warning'::"text", 'critical'::"text"]))),
    CONSTRAINT "audit_logs_source_check" CHECK (("source" = ANY (ARRAY['backend'::"text", 'database'::"text", 'system'::"text", 'webhook'::"text", 'manual'::"text"]))),
    CONSTRAINT "audit_logs_user_agent_check" CHECK ((("user_agent" IS NULL) OR (("char_length"(TRIM(BOTH FROM "user_agent")) >= 1) AND ("char_length"(TRIM(BOTH FROM "user_agent")) <= 1000))))
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_audit_log"("workspace_id_value" "uuid", "action_value" "text", "actor_user_id_value" "uuid" DEFAULT NULL::"uuid", "entity_type_value" "text" DEFAULT NULL::"text", "entity_id_value" "uuid" DEFAULT NULL::"uuid", "description_value" "text" DEFAULT NULL::"text", "source_value" "text" DEFAULT 'backend'::"text", "severity_value" "text" DEFAULT 'info'::"text", "old_data_value" "jsonb" DEFAULT NULL::"jsonb", "new_data_value" "jsonb" DEFAULT NULL::"jsonb", "metadata_value" "jsonb" DEFAULT '{}'::"jsonb", "ip_address_value" "inet" DEFAULT NULL::"inet", "user_agent_value" "text" DEFAULT NULL::"text", "request_id_value" "uuid" DEFAULT NULL::"uuid") RETURNS "public"."audit_logs"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    result_row public.audit_logs%rowtype;
begin
    if workspace_id_value is null then
        raise exception 'O workspace é obrigatório.';
    end if;

    if char_length(trim(coalesce(action_value, ''))) = 0 then
        raise exception 'A ação é obrigatória.';
    end if;

    if old_data_value is not null
       and jsonb_typeof(old_data_value) <> 'object' then
        raise exception
            'old_data deve ser um objeto JSON.';
    end if;

    if new_data_value is not null
       and jsonb_typeof(new_data_value) <> 'object' then
        raise exception
            'new_data deve ser um objeto JSON.';
    end if;

    if metadata_value is null
       or jsonb_typeof(metadata_value) <> 'object' then
        raise exception
            'metadata deve ser um objeto JSON.';
    end if;

    insert into public.audit_logs (
        workspace_id,
        actor_user_id,
        action,
        entity_type,
        entity_id,
        description,
        source,
        severity,
        old_data,
        new_data,
        metadata,
        ip_address,
        user_agent,
        request_id
    )
    values (
        workspace_id_value,
        actor_user_id_value,
        action_value,
        entity_type_value,
        entity_id_value,
        description_value,
        source_value,
        severity_value,
        old_data_value,
        new_data_value,
        metadata_value,
        ip_address_value,
        user_agent_value,
        request_id_value
    )
    returning *
    into result_row;

    return result_row;
end;
$$;


ALTER FUNCTION "public"."create_audit_log"("workspace_id_value" "uuid", "action_value" "text", "actor_user_id_value" "uuid", "entity_type_value" "text", "entity_id_value" "uuid", "description_value" "text", "source_value" "text", "severity_value" "text", "old_data_value" "jsonb", "new_data_value" "jsonb", "metadata_value" "jsonb", "ip_address_value" "inet", "user_agent_value" "text", "request_id_value" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_brand"("target_workspace_id" "uuid", "brand_name" "text", "brand_description" "text" DEFAULT NULL::"text", "brand_industry" "text" DEFAULT NULL::"text", "brand_website_url" "text" DEFAULT NULL::"text", "brand_primary_color" "text" DEFAULT NULL::"text", "brand_secondary_color" "text" DEFAULT NULL::"text") RETURNS "public"."brands"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    new_brand public.brands%rowtype;

    workspace_language text;

    base_slug text;
    final_slug text;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    if target_workspace_id is null then
        raise exception 'Workspace não informado.';
    end if;

    if brand_name is null
       or char_length(trim(brand_name)) < 2
       or char_length(trim(brand_name)) > 100 then
        raise exception
            'O nome da marca deve possuir entre 2 e 100 caracteres.';
    end if;

    if not public.has_workspace_role(
        target_workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'Não possui permissão para criar marcas neste workspace.';
    end if;

    select w.language
    into workspace_language
    from public.workspaces w
    where w.id = target_workspace_id
      and w.status = 'active';

    if workspace_language is null then
        raise exception
            'Workspace não encontrado ou inativo.';
    end if;

    base_slug := public.slugify(trim(brand_name));

    if base_slug = '' then
        base_slug := 'brand';
    end if;

    final_slug := base_slug;

    if exists (
        select 1
        from public.brands b
        where b.workspace_id = target_workspace_id
          and b.slug = final_slug
    ) then
        final_slug :=
            base_slug || '-' ||
            substring(
                replace(gen_random_uuid()::text, '-', '')
                from 1 for 8
            );
    end if;

    insert into public.brands (
        workspace_id,
        created_by,
        name,
        slug,
        description,
        industry,
        website_url,
        primary_color,
        secondary_color,
        default_language,
        status
    )
    values (
        target_workspace_id,
        auth.uid(),
        trim(brand_name),
        final_slug,
        nullif(trim(brand_description), ''),
        nullif(trim(brand_industry), ''),
        nullif(trim(brand_website_url), ''),

        case
            when brand_primary_color is null
              or trim(brand_primary_color) = ''
            then null
            else upper(trim(brand_primary_color))
        end,

        case
            when brand_secondary_color is null
              or trim(brand_secondary_color) = ''
            then null
            else upper(trim(brand_secondary_color))
        end,

        workspace_language,
        'active'
    )
    returning *
    into new_brand;

    return new_brand;
end;
$$;


ALTER FUNCTION "public"."create_brand"("target_workspace_id" "uuid", "brand_name" "text", "brand_description" "text", "brand_industry" "text", "brand_website_url" "text", "brand_primary_color" "text", "brand_secondary_color" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_brand"("target_workspace_id" "uuid", "brand_name" "text", "brand_description" "text", "brand_industry" "text", "brand_website_url" "text", "brand_primary_color" "text", "brand_secondary_color" "text", "brand_logo_url" "text", "brand_default_language" "text") RETURNS "public"."brands"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
declare
    new_brand public.brands%rowtype;
    normalized_logo_url text;
    normalized_language text;
begin
    normalized_logo_url :=
        nullif(trim(brand_logo_url), '');

    normalized_language :=
        nullif(trim(brand_default_language), '');

    /*
     * Aceita códigos como:
     * pt-PT, pt-BR, en-US, en-GB, es-ES, fr-FR.
     */
    if normalized_language is not null
       and normalized_language !~
           '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$'
    then
        raise exception
            'Código de idioma inválido.';
    end if;

    if normalized_logo_url is not null
       and normalized_logo_url !~*
           '^https?://'
    then
        raise exception
            'A URL do logótipo deve começar com http:// ou https://.';
    end if;

    /*
     * Reutiliza a função original com 7 parâmetros.
     * Assim preservamos autenticação, permissões,
     * validações e geração do slug.
     */
    select *
    into new_brand
    from public.create_brand(
        target_workspace_id,
        brand_name,
        brand_description,
        brand_industry,
        brand_website_url,
        brand_primary_color,
        brand_secondary_color
    );

    update public.brands
    set
        logo_url = normalized_logo_url,

        default_language = coalesce(
            normalized_language,
            default_language
        ),

        updated_at = now()
    where id = new_brand.id
    returning *
    into new_brand;

    return new_brand;
end;
$_$;


ALTER FUNCTION "public"."create_brand"("target_workspace_id" "uuid", "brand_name" "text", "brand_description" "text", "brand_industry" "text", "brand_website_url" "text", "brand_primary_color" "text", "brand_secondary_color" "text", "brand_logo_url" "text", "brand_default_language" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_calendar_event"("workspace_id_value" "uuid", "brand_id_value" "uuid", "title_value" "text", "event_type_value" "text", "starts_at_value" timestamp with time zone, "timezone_value" "text", "ends_at_value" timestamp with time zone DEFAULT NULL::timestamp with time zone, "all_day_value" boolean DEFAULT false, "plan_item_id_value" "uuid" DEFAULT NULL::"uuid", "assigned_to_value" "uuid" DEFAULT NULL::"uuid", "platform_value" "text" DEFAULT NULL::"text", "description_value" "text" DEFAULT NULL::"text", "metadata_value" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."calendar_events"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    new_event public.calendar_events;
    normalized_event_type text;
    normalized_platform text;
    normalized_timezone text;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    if not exists (
        select 1
        from public.workspaces w
        where w.id = workspace_id_value
          and w.status = 'active'
    ) then
        raise exception 'Workspace ativo não encontrado.';
    end if;

    if not public.has_workspace_role(
        workspace_id_value,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para criar eventos.';
    end if;

    if not exists (
        select 1
        from public.brands b
        where b.id = brand_id_value
          and b.workspace_id = workspace_id_value
          and b.status = 'active'
    ) then
        raise exception
            'Marca ativa não encontrada neste workspace.';
    end if;

    if char_length(trim(title_value)) not between 2 and 160 then
        raise exception
            'O título deve possuir entre 2 e 160 caracteres.';
    end if;

    if (
        description_value is not null
        and char_length(description_value) > 10000
    ) then
        raise exception
            'A descrição deve possuir no máximo 10000 caracteres.';
    end if;

    normalized_event_type :=
        lower(trim(event_type_value));

    normalized_platform :=
        nullif(lower(trim(platform_value)), '');

    normalized_timezone :=
        trim(timezone_value);

    if normalized_event_type not in (
        'content',
        'deadline',
        'event',
        'reminder'
    ) then
        raise exception 'Tipo de evento inválido.';
    end if;

    if (
        normalized_platform is not null
        and normalized_platform not in (
            'instagram',
            'facebook',
            'linkedin',
            'tiktok',
            'youtube',
            'pinterest',
            'threads',
            'x',
            'blog',
            'email'
        )
    ) then
        raise exception 'Plataforma inválida.';
    end if;

    if starts_at_value is null then
        raise exception
            'A data de início é obrigatória.';
    end if;

    if (
        ends_at_value is not null
        and ends_at_value < starts_at_value
    ) then
        raise exception
            'A data final não pode ser anterior à data inicial.';
    end if;

    if not exists (
        select 1
        from pg_catalog.pg_timezone_names tz
        where tz.name = normalized_timezone
    ) then
        raise exception 'Timezone inválido.';
    end if;

    if (
        plan_item_id_value is not null
        and not exists (
            select 1
            from public.content_plan_items cpi
            where cpi.id = plan_item_id_value
              and cpi.workspace_id = workspace_id_value
              and cpi.brand_id = brand_id_value
              and cpi.status <> 'archived'
        )
    ) then
        raise exception
            'O item do Planner não pertence ao workspace e à marca informados ou está arquivado.';
    end if;

    if (
        assigned_to_value is not null
        and not exists (
            select 1
            from public.workspace_members wm
            where wm.workspace_id = workspace_id_value
              and wm.user_id = assigned_to_value
              and wm.status = 'active'
        )
    ) then
        raise exception
            'O responsável deve ser membro ativo do workspace.';
    end if;

    if jsonb_typeof(
        coalesce(metadata_value, '{}'::jsonb)
    ) <> 'object' then
        raise exception
            'Os metadados devem ser um objeto JSON.';
    end if;

    insert into public.calendar_events (
        workspace_id,
        brand_id,
        plan_item_id,
        created_by,
        assigned_to,
        title,
        description,
        event_type,
        platform,
        starts_at,
        ends_at,
        timezone,
        all_day,
        status,
        metadata
    )
    values (
        workspace_id_value,
        brand_id_value,
        plan_item_id_value,
        auth.uid(),
        assigned_to_value,
        trim(title_value),
        nullif(trim(description_value), ''),
        normalized_event_type,
        normalized_platform,
        starts_at_value,
        ends_at_value,
        normalized_timezone,
        coalesce(all_day_value, false),
        'planned',
        coalesce(metadata_value, '{}'::jsonb)
    )
    returning *
    into new_event;

    return new_event;
end;
$$;


ALTER FUNCTION "public"."create_calendar_event"("workspace_id_value" "uuid", "brand_id_value" "uuid", "title_value" "text", "event_type_value" "text", "starts_at_value" timestamp with time zone, "timezone_value" "text", "ends_at_value" timestamp with time zone, "all_day_value" boolean, "plan_item_id_value" "uuid", "assigned_to_value" "uuid", "platform_value" "text", "description_value" "text", "metadata_value" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_campaign"("workspace_id_value" "uuid", "brand_id_value" "uuid", "name_value" "text", "description_value" "text" DEFAULT NULL::"text", "objective_value" "text" DEFAULT NULL::"text", "client_id_value" "uuid" DEFAULT NULL::"uuid", "assigned_to_value" "uuid" DEFAULT NULL::"uuid", "start_date_value" "date" DEFAULT NULL::"date", "end_date_value" "date" DEFAULT NULL::"date", "budget_value" numeric DEFAULT NULL::numeric, "currency_value" "text" DEFAULT 'EUR'::"text", "metadata_value" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."campaigns"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
    campaign_row public.campaigns%rowtype;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    if not public.has_campaign_workspace_role(
        workspace_id_value,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para criar campanhas.';
    end if;

    if name_value is null
       or char_length(trim(name_value)) < 3
       or char_length(trim(name_value)) > 120
    then
        raise exception
            'O nome da campanha deve possuir entre 3 e 120 caracteres.';
    end if;

    insert into public.campaigns (
        workspace_id,
        brand_id,
        client_id,
        created_by,
        assigned_to,
        name,
        description,
        objective,
        status,
        start_date,
        end_date,
        budget,
        currency,
        metadata
    )
    values (
        workspace_id_value,
        brand_id_value,
        client_id_value,
        auth.uid(),
        assigned_to_value,
        trim(name_value),
        nullif(trim(description_value), ''),
        nullif(trim(objective_value), ''),
        'draft',
        start_date_value,
        end_date_value,
        budget_value,
        upper(
            coalesce(
                nullif(trim(currency_value), ''),
                'EUR'
            )
        ),
        coalesce(metadata_value, '{}'::jsonb)
    )
    returning *
    into campaign_row;

    return campaign_row;
end;
$$;


ALTER FUNCTION "public"."create_campaign"("workspace_id_value" "uuid", "brand_id_value" "uuid", "name_value" "text", "description_value" "text", "objective_value" "text", "client_id_value" "uuid", "assigned_to_value" "uuid", "start_date_value" "date", "end_date_value" "date", "budget_value" numeric, "currency_value" "text", "metadata_value" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_client"("target_workspace_id" "uuid", "client_name" "text", "client_company_name" "text" DEFAULT NULL::"text", "client_email" "text" DEFAULT NULL::"text", "client_phone" "text" DEFAULT NULL::"text", "client_website_url" "text" DEFAULT NULL::"text", "client_notes" "text" DEFAULT NULL::"text") RETURNS "public"."clients"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    new_client public.clients%rowtype;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    if target_workspace_id is null then
        raise exception 'Workspace não informado.';
    end if;

    if client_name is null
       or char_length(trim(client_name)) < 2
       or char_length(trim(client_name)) > 120 then
        raise exception
            'O nome do cliente deve possuir entre 2 e 120 caracteres.';
    end if;

    if not public.has_workspace_role(
        target_workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'Não possui permissão para criar clientes neste workspace.';
    end if;

    if not exists (
        select 1
        from public.workspaces w
        where w.id = target_workspace_id
          and w.status = 'active'
    ) then
        raise exception
            'Workspace não encontrado ou inativo.';
    end if;

    insert into public.clients (
        workspace_id,
        created_by,
        name,
        company_name,
        email,
        phone,
        website_url,
        notes,
        status
    )
    values (
        target_workspace_id,
        auth.uid(),
        client_name,
        client_company_name,
        client_email,
        client_phone,
        client_website_url,
        client_notes,
        'active'
    )
    returning *
    into new_client;

    return new_client;
end;
$$;


ALTER FUNCTION "public"."create_client"("target_workspace_id" "uuid", "client_name" "text", "client_company_name" "text", "client_email" "text", "client_phone" "text", "client_website_url" "text", "client_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_content"("workspace_id_value" "uuid", "brand_id_value" "uuid", "title_value" "text", "content_type_value" "text" DEFAULT 'post'::"text", "source_value" "text" DEFAULT 'manual'::"text", "plan_item_id_value" "uuid" DEFAULT NULL::"uuid", "brief_value" "text" DEFAULT NULL::"text", "main_text_value" "text" DEFAULT NULL::"text", "assigned_to_value" "uuid" DEFAULT NULL::"uuid", "metadata_value" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."contents"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    new_content public.contents;
begin
    perform public.require_content_editor(workspace_id_value);

    if metadata_value is null
       or jsonb_typeof(metadata_value) <> 'object' then
        raise exception
            'Os metadados devem ser um objeto JSON.';
    end if;

    if plan_item_id_value is not null
       and source_value <> 'planner' then
        raise exception
            'Conteúdos ligados ao Planner devem usar a origem planner.';
    end if;

    if plan_item_id_value is null
       and source_value = 'planner' then
        raise exception
            'A origem planner exige um item do Planner.';
    end if;

    insert into public.contents (
        workspace_id,
        brand_id,
        plan_item_id,
        created_by,
        assigned_to,
        title,
        brief,
        main_text,
        content_type,
        source,
        status,
        metadata
    )
    values (
        workspace_id_value,
        brand_id_value,
        plan_item_id_value,
        auth.uid(),
        assigned_to_value,
        trim(title_value),
        nullif(trim(brief_value), ''),
        nullif(trim(main_text_value), ''),
        lower(trim(content_type_value)),
        lower(trim(source_value)),
        'draft',
        metadata_value
    )
    returning *
    into new_content;

    return new_content;
end;
$$;


ALTER FUNCTION "public"."create_content"("workspace_id_value" "uuid", "brand_id_value" "uuid", "title_value" "text", "content_type_value" "text", "source_value" "text", "plan_item_id_value" "uuid", "brief_value" "text", "main_text_value" "text", "assigned_to_value" "uuid", "metadata_value" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_content_from_plan_item"("plan_item_id_value" "uuid", "title_value" "text" DEFAULT NULL::"text", "main_text_value" "text" DEFAULT NULL::"text", "metadata_value" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."contents"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    plan_row public.content_plan_items;
    new_content public.contents;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into plan_row
    from public.content_plan_items
    where id = plan_item_id_value
    for update;

    if not found then
        raise exception
            'Item do Content Planner não encontrado.';
    end if;

    perform public.require_content_editor(plan_row.workspace_id);

    if plan_row.status = 'archived' then
        raise exception
            'Não é possível converter um item arquivado.';
    end if;

    if exists (
        select 1
        from public.contents c
        where c.plan_item_id = plan_item_id_value
    ) then
        raise exception
            'Este item do Planner já foi convertido em conteúdo.';
    end if;

    if metadata_value is null
       or jsonb_typeof(metadata_value) <> 'object' then
        raise exception
            'Os metadados devem ser um objeto JSON.';
    end if;

    insert into public.contents (
        workspace_id,
        brand_id,
        plan_item_id,
        created_by,
        assigned_to,
        title,
        brief,
        main_text,
        content_type,
        source,
        status,
        metadata
    )
    values (
        plan_row.workspace_id,
        plan_row.brand_id,
        plan_row.id,
        auth.uid(),
        plan_row.assigned_to,
        coalesce(
            nullif(trim(title_value), ''),
            plan_row.title
        ),
        plan_row.brief,
        nullif(trim(main_text_value), ''),
        plan_row.content_type,
        'planner',
        'draft',
        coalesce(plan_row.metadata, '{}'::jsonb)
        || jsonb_build_object(
            'converted_from_plan_item',
            true
        )
        || metadata_value
    )
    returning *
    into new_content;

    perform public.move_content_plan_item(
        plan_row.id,
        'converted',
        plan_row.position
    );

    return new_content;
end;
$$;


ALTER FUNCTION "public"."create_content_from_plan_item"("plan_item_id_value" "uuid", "title_value" "text", "main_text_value" "text", "metadata_value" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_content_plan_item"("workspace_id_value" "uuid", "brand_id_value" "uuid", "title_value" "text", "brief_value" "text" DEFAULT NULL::"text", "content_type_value" "text" DEFAULT 'post'::"text", "target_platforms_value" "text"[] DEFAULT '{}'::"text"[], "source_value" "text" DEFAULT 'manual'::"text", "priority_value" "text" DEFAULT 'medium'::"text", "due_date_value" "date" DEFAULT NULL::"date", "assigned_to_value" "uuid" DEFAULT NULL::"uuid") RETURNS "public"."content_plan_items"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    new_item public.content_plan_items;
    normalized_platforms text[];
    next_position bigint;
    normalized_content_type text;
    normalized_source text;
    normalized_priority text;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    if not exists (
        select 1
        from public.workspaces w
        where w.id = workspace_id_value
          and w.status = 'active'
    ) then
        raise exception 'Workspace ativo não encontrado.';
    end if;

    if not public.has_workspace_role(
        workspace_id_value,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para criar itens.';
    end if;

    if not exists (
        select 1
        from public.brands b
        where b.id = brand_id_value
          and b.workspace_id = workspace_id_value
          and b.status = 'active'
    ) then
        raise exception
            'Marca ativa não encontrada neste workspace.';
    end if;

    if char_length(trim(title_value)) not between 2 and 160 then
        raise exception
            'O título deve possuir entre 2 e 160 caracteres.';
    end if;

    if (
        brief_value is not null
        and char_length(brief_value) > 10000
    ) then
        raise exception
            'O briefing deve possuir no máximo 10000 caracteres.';
    end if;

    normalized_content_type :=
        lower(trim(content_type_value));

    normalized_source :=
        lower(trim(source_value));

    normalized_priority :=
        lower(trim(priority_value));

    if normalized_content_type not in (
        'post',
        'carousel',
        'story',
        'reel',
        'short',
        'video',
        'article',
        'email',
        'other'
    ) then
        raise exception 'Tipo de conteúdo inválido.';
    end if;

    if normalized_source not in (
        'manual',
        'ai',
        'client',
        'meeting',
        'research',
        'reused_content'
    ) then
        raise exception 'Origem do item inválida.';
    end if;

    if normalized_priority not in (
        'low',
        'medium',
        'high',
        'urgent'
    ) then
        raise exception 'Prioridade inválida.';
    end if;

    select coalesce(
        array_agg(
            distinct lower(trim(platform_value))
        ) filter (
            where trim(platform_value) <> ''
        ),
        '{}'::text[]
    )
    into normalized_platforms
    from unnest(
        coalesce(
            target_platforms_value,
            '{}'::text[]
        )
    ) as platforms(platform_value);

    if not (
        normalized_platforms <@ array[
            'instagram',
            'facebook',
            'linkedin',
            'tiktok',
            'youtube',
            'pinterest',
            'threads',
            'x',
            'blog',
            'email'
        ]::text[]
    ) then
        raise exception
            'Uma ou mais plataformas são inválidas.';
    end if;

    if cardinality(normalized_platforms) > 10 then
        raise exception
            'Um item pode possuir no máximo 10 plataformas.';
    end if;

    if (
        assigned_to_value is not null
        and not exists (
            select 1
            from public.workspace_members wm
            where wm.workspace_id = workspace_id_value
              and wm.user_id = assigned_to_value
              and wm.status = 'active'
        )
    ) then
        raise exception
            'O responsável deve ser membro ativo do workspace.';
    end if;

    select
        coalesce(max(cpi.position), 0) + 1024
    into next_position
    from public.content_plan_items cpi
    where cpi.workspace_id = workspace_id_value
      and cpi.brand_id = brand_id_value
      and cpi.status = 'idea';

    insert into public.content_plan_items (
        workspace_id,
        brand_id,
        created_by,
        assigned_to,
        title,
        brief,
        content_type,
        target_platforms,
        source,
        priority,
        status,
        due_date,
        position
    )
    values (
        workspace_id_value,
        brand_id_value,
        auth.uid(),
        assigned_to_value,
        trim(title_value),
        nullif(trim(brief_value), ''),
        normalized_content_type,
        normalized_platforms,
        normalized_source,
        normalized_priority,
        'idea',
        due_date_value,
        next_position
    )
    returning *
    into new_item;

    return new_item;
end;
$$;


ALTER FUNCTION "public"."create_content_plan_item"("workspace_id_value" "uuid", "brand_id_value" "uuid", "title_value" "text", "brief_value" "text", "content_type_value" "text", "target_platforms_value" "text"[], "source_value" "text", "priority_value" "text", "due_date_value" "date", "assigned_to_value" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_content_version"("content_id_value" "uuid", "platform_value" "text", "title_value" "text" DEFAULT NULL::"text", "body_value" "text" DEFAULT NULL::"text", "hashtags_value" "text"[] DEFAULT '{}'::"text"[], "call_to_action_value" "text" DEFAULT NULL::"text", "media_notes_value" "text" DEFAULT NULL::"text", "metadata_value" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."content_versions"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    content_row public.contents;
    new_version public.content_versions;
    normalized_platform text;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into content_row
    from public.contents
    where id = content_id_value;

    if not found then
        raise exception 'Conteúdo não encontrado.';
    end if;

    perform public.require_content_editor(
        content_row.workspace_id
    );

    if content_row.status = 'archived' then
        raise exception
            'Não é possível criar versão de conteúdo arquivado.';
    end if;

    normalized_platform := lower(trim(platform_value));

    if normalized_platform not in (
        'instagram',
        'facebook',
        'linkedin',
        'tiktok',
        'youtube',
        'pinterest',
        'threads',
        'x'
    ) then
        raise exception 'Plataforma inválida.';
    end if;

    if exists (
        select 1
        from public.content_versions cv
        where cv.content_id = content_id_value
          and cv.platform = normalized_platform
          and cv.status <> 'archived'
    ) then
        raise exception
            'Já existe uma versão ativa para esta plataforma.';
    end if;

    if metadata_value is null
       or jsonb_typeof(metadata_value) <> 'object' then
        raise exception
            'Os metadados devem ser um objeto JSON.';
    end if;

    insert into public.content_versions (
        workspace_id,
        brand_id,
        content_id,
        created_by,
        platform,
        title,
        body,
        hashtags,
        call_to_action,
        media_notes,
        status,
        metadata
    )
    values (
        content_row.workspace_id,
        content_row.brand_id,
        content_row.id,
        auth.uid(),
        normalized_platform,
        nullif(trim(title_value), ''),
        nullif(trim(body_value), ''),
        coalesce(hashtags_value, '{}'::text[]),
        nullif(trim(call_to_action_value), ''),
        nullif(trim(media_notes_value), ''),
        'draft',
        metadata_value
    )
    returning *
    into new_version;

    return new_version;
end;
$$;


ALTER FUNCTION "public"."create_content_version"("content_id_value" "uuid", "platform_value" "text", "title_value" "text", "body_value" "text", "hashtags_value" "text"[], "call_to_action_value" "text", "media_notes_value" "text", "metadata_value" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_workspace_subscription"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    free_plan_id uuid;
begin
    select bp.id
      into free_plan_id
    from public.billing_plans bp
    where bp.code = 'free'
      and bp.is_active = true
    limit 1;

    if free_plan_id is null then
        raise exception
            'O plano free não foi encontrado.';
    end if;

    insert into public.workspace_subscriptions (
        workspace_id,
        plan_id,
        provider,
        billing_interval,
        status,
        is_current,
        current_period_start,
        metadata
    )
    values (
        new.id,
        free_plan_id,
        'manual',
        'none',
        'active',
        true,
        now(),
        jsonb_build_object(
            'source',
            'workspace_creation'
        )
    );

    return new;
end;
$$;


ALTER FUNCTION "public"."create_default_workspace_subscription"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_manual_content"("workspace_id_value" "uuid", "brand_id_value" "uuid", "assigned_to_value" "uuid", "title_value" "text", "brief_value" "text", "main_text_value" "text", "content_type_value" "text", "target_platforms_value" "text"[], "metadata_value" "jsonb") RETURNS "public"."contents"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
    current_user_id uuid;
    current_user_role text;
    created_content public.contents;
begin
    current_user_id = auth.uid();

    if current_user_id is null then
        raise exception
            'Utilizador não autenticado.';
    end if;


    -- Verificar acesso ao workspace

    select role
    into current_user_role
    from public.workspace_members
    where workspace_id = workspace_id_value
      and user_id = current_user_id
      and status = 'active'
    limit 1;

    if
        current_user_role is null
        or current_user_role not in (
            'owner',
            'admin',
            'editor'
        )
    then
        raise exception
            'Não possui permissão para criar conteúdos.';
    end if;


    -- Verificar marca

    if not exists (
        select 1
        from public.brands
        where id = brand_id_value
          and workspace_id = workspace_id_value
          and status = 'active'
    ) then
        raise exception
            'A marca selecionada não está disponível.';
    end if;


    -- Validar responsável

    if
        assigned_to_value is not null
        and not exists (
            select 1
            from public.workspace_members
            where workspace_id =
                workspace_id_value
              and user_id =
                assigned_to_value
              and status = 'active'
        )
    then
        raise exception
            'O responsável selecionado não pertence ao workspace.';
    end if;


    -- Validar título

    if
        char_length(
            trim(
                coalesce(
                    title_value,
                    ''
                )
            )
        ) < 2
        or char_length(
            trim(
                coalesce(
                    title_value,
                    ''
                )
            )
        ) > 160
    then
        raise exception
            'O título deve ter entre 2 e 160 caracteres.';
    end if;


    -- Validar brief

    if
        char_length(
            coalesce(
                brief_value,
                ''
            )
        ) > 10000
    then
        raise exception
            'O brief ultrapassa o limite permitido.';
    end if;


    -- Validar tipo

    if content_type_value not in (
        'post',
        'carousel',
        'story',
        'reel',
        'short',
        'video',
        'article',
        'email',
        'other'
    ) then
        raise exception
            'Tipo de conteúdo inválido.';
    end if;


    -- Validar plataformas

    if exists (
        select 1
        from unnest(
            coalesce(
                target_platforms_value,
                '{}'::text[]
            )
        ) as platform
        where platform not in (
            'instagram',
            'facebook',
            'linkedin',
            'tiktok',
            'youtube',
            'pinterest',
            'threads',
            'x',
            'blog',
            'email'
        )
    ) then
        raise exception
            'Uma ou mais plataformas são inválidas.';
    end if;


    -- Criar conteúdo

    insert into public.contents (
        workspace_id,
        brand_id,
        plan_item_id,
        created_by,
        assigned_to,
        title,
        brief,
        main_text,
        content_type,
        target_platforms,
        source,
        status,
        metadata
    )
    values (
        workspace_id_value,
        brand_id_value,
        null,
        current_user_id,
        assigned_to_value,
        trim(title_value),
        nullif(
            trim(
                coalesce(
                    brief_value,
                    ''
                )
            ),
            ''
        ),
        nullif(
            trim(
                coalesce(
                    main_text_value,
                    ''
                )
            ),
            ''
        ),
        content_type_value,
        coalesce(
            target_platforms_value,
            '{}'::text[]
        ),
        'manual',
        'draft',
        coalesce(
            metadata_value,
            '{}'::jsonb
        )
    )
    returning *
    into created_content;

    return created_content;
end;
$$;


ALTER FUNCTION "public"."create_manual_content"("workspace_id_value" "uuid", "brand_id_value" "uuid", "assigned_to_value" "uuid", "title_value" "text", "brief_value" "text", "main_text_value" "text", "content_type_value" "text", "target_platforms_value" "text"[], "metadata_value" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_media_folder"("target_workspace_id" "uuid", "folder_name" "text", "target_brand_id" "uuid" DEFAULT NULL::"uuid", "target_parent_id" "uuid" DEFAULT NULL::"uuid") RETURNS "public"."media_folders"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_user_id uuid;
    new_folder public.media_folders;
begin
    current_user_id := auth.uid();

    if current_user_id is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    if not public.has_workspace_role(
        target_workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para criar pastas.';
    end if;

    if char_length(trim(folder_name))
       not between 1 and 100 then
        raise exception
            'O nome da pasta deve ter entre 1 e 100 caracteres.';
    end if;

    if target_brand_id is not null
       and not exists (
           select 1
           from public.brands b
           where b.id = target_brand_id
             and b.workspace_id = target_workspace_id
             and b.status = 'active'
       ) then
        raise exception
            'Marca ativa não encontrada neste workspace.';
    end if;

    if target_parent_id is not null
       and not exists (
           select 1
           from public.media_folders folder
           where folder.id = target_parent_id
             and folder.workspace_id =
                 target_workspace_id
             and folder.brand_id
                 is not distinct from target_brand_id
             and folder.status = 'active'
       ) then
        raise exception
            'Pasta-pai ativa não encontrada no mesmo contexto.';
    end if;

    insert into public.media_folders (
        workspace_id,
        brand_id,
        parent_id,
        created_by,
        name
    )
    values (
        target_workspace_id,
        target_brand_id,
        target_parent_id,
        current_user_id,
        trim(folder_name)
    )
    returning *
    into new_folder;

    return new_folder;
end;
$$;


ALTER FUNCTION "public"."create_media_folder"("target_workspace_id" "uuid", "folder_name" "text", "target_brand_id" "uuid", "target_parent_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "actor_user_id" "uuid",
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid",
    "action_url" "text",
    "is_read" boolean DEFAULT false NOT NULL,
    "read_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "notifications_action_url_check" CHECK ((("action_url" IS NULL) OR ((("char_length"(TRIM(BOTH FROM "action_url")) >= 1) AND ("char_length"(TRIM(BOTH FROM "action_url")) <= 500)) AND ("left"(TRIM(BOTH FROM "action_url"), 1) = '/'::"text")))),
    CONSTRAINT "notifications_entity_pair_check" CHECK (((("entity_type" IS NULL) AND ("entity_id" IS NULL)) OR (("entity_type" IS NOT NULL) AND ("entity_id" IS NOT NULL)))),
    CONSTRAINT "notifications_entity_type_length_check" CHECK ((("entity_type" IS NULL) OR (("char_length"(TRIM(BOTH FROM "entity_type")) >= 2) AND ("char_length"(TRIM(BOTH FROM "entity_type")) <= 80)))),
    CONSTRAINT "notifications_message_length_check" CHECK ((("char_length"(TRIM(BOTH FROM "message")) >= 1) AND ("char_length"(TRIM(BOTH FROM "message")) <= 2000))),
    CONSTRAINT "notifications_metadata_object_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "notifications_read_state_check" CHECK (((("is_read" = false) AND ("read_at" IS NULL)) OR (("is_read" = true) AND ("read_at" IS NOT NULL)))),
    CONSTRAINT "notifications_title_length_check" CHECK ((("char_length"(TRIM(BOTH FROM "title")) >= 1) AND ("char_length"(TRIM(BOTH FROM "title")) <= 160))),
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['workspace_invitation'::"text", 'member_added'::"text", 'content_assigned'::"text", 'content_approved'::"text", 'content_rejected'::"text", 'publication_succeeded'::"text", 'publication_failed'::"text", 'campaign_updated'::"text", 'billing'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification"("workspace_id_value" "uuid", "user_id_value" "uuid", "type_value" "text", "title_value" "text", "message_value" "text", "actor_user_id_value" "uuid" DEFAULT NULL::"uuid", "entity_type_value" "text" DEFAULT NULL::"text", "entity_id_value" "uuid" DEFAULT NULL::"uuid", "action_url_value" "text" DEFAULT NULL::"text", "metadata_value" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."notifications"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    result_row public.notifications%rowtype;
begin
    if workspace_id_value is null then
        raise exception 'O workspace é obrigatório.';
    end if;

    if user_id_value is null then
        raise exception 'O destinatário é obrigatório.';
    end if;

    if char_length(trim(coalesce(type_value, ''))) = 0 then
        raise exception 'O tipo da notificação é obrigatório.';
    end if;

    if char_length(trim(coalesce(title_value, ''))) = 0 then
        raise exception 'O título da notificação é obrigatório.';
    end if;

    if char_length(trim(coalesce(message_value, ''))) = 0 then
        raise exception 'A mensagem da notificação é obrigatória.';
    end if;

    if coalesce(jsonb_typeof(metadata_value), 'null') <> 'object' then
        raise exception 'Metadata deve ser um objeto JSON.';
    end if;

    insert into public.notifications (
        workspace_id,
        user_id,
        actor_user_id,
        type,
        title,
        message,
        entity_type,
        entity_id,
        action_url,
        metadata
    )
    values (
        workspace_id_value,
        user_id_value,
        actor_user_id_value,
        type_value,
        title_value,
        message_value,
        entity_type_value,
        entity_id_value,
        action_url_value,
        metadata_value
    )
    returning *
    into result_row;

    return result_row;
end;
$$;


ALTER FUNCTION "public"."create_notification"("workspace_id_value" "uuid", "user_id_value" "uuid", "type_value" "text", "title_value" "text", "message_value" "text", "actor_user_id_value" "uuid", "entity_type_value" "text", "entity_id_value" "uuid", "action_url_value" "text", "metadata_value" "jsonb") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspaces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "logo_url" "text",
    "language" "text" DEFAULT 'pt-PT'::"text" NOT NULL,
    "timezone" "text" DEFAULT 'Europe/Lisbon'::"text" NOT NULL,
    "plan" "text" DEFAULT 'free'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "workspaces_name_length_check" CHECK ((("char_length"(TRIM(BOTH FROM "name")) >= 2) AND ("char_length"(TRIM(BOTH FROM "name")) <= 100))),
    CONSTRAINT "workspaces_plan_check" CHECK (("plan" = ANY (ARRAY['free'::"text", 'pro'::"text", 'business'::"text"]))),
    CONSTRAINT "workspaces_slug_format_check" CHECK ((("slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::"text") AND (("char_length"("slug") >= 2) AND ("char_length"("slug") <= 120)))),
    CONSTRAINT "workspaces_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'suspended'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."workspaces" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_workspace"("workspace_name" "text", "workspace_description" "text" DEFAULT NULL::"text") RETURNS "public"."workspaces"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    new_workspace public.workspaces;
    base_slug text;
    final_slug text;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    if char_length(trim(workspace_name)) < 2 then
        raise exception 'O nome do workspace deve ter pelo menos 2 caracteres.';
    end if;

    base_slug := public.slugify(trim(workspace_name));

    if base_slug = '' then
        base_slug := 'workspace';
    end if;

    final_slug :=
        base_slug || '-' ||
        substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8);

    insert into public.workspaces (
        owner_id,
        name,
        slug,
        description,
        language,
        timezone,
        plan,
        status
    )
    select
        auth.uid(),
        trim(workspace_name),
        final_slug,
        nullif(trim(workspace_description), ''),
        p.language,
        p.timezone,
        'free',
        'active'
    from public.profiles p
    where p.id = auth.uid()
    returning * into new_workspace;

    if new_workspace.id is null then
        raise exception 'Perfil do utilizador não encontrado.';
    end if;

    insert into public.workspace_members (
        workspace_id,
        user_id,
        role,
        status,
        joined_at
    )
    values (
        new_workspace.id,
        auth.uid(),
        'owner',
        'active',
        now()
    );

    return new_workspace;
end;
$$;


ALTER FUNCTION "public"."create_workspace"("workspace_name" "text", "workspace_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_content"("content_id_value" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
    current_user_id uuid;
    current_user_role text;
    content_workspace_id uuid;
    deleted_content_id uuid;
begin
    current_user_id := auth.uid();

    if current_user_id is null then
        raise exception
            'Utilizador não autenticado.';
    end if;

    select workspace_id
    into content_workspace_id
    from public.contents
    where id = content_id_value;

    if not found then
        raise exception
            'Conteúdo não encontrado.';
    end if;

    select role
    into current_user_role
    from public.workspace_members
    where workspace_id =
            content_workspace_id
      and user_id =
            current_user_id
      and status = 'active'
    limit 1;

    if
        current_user_role is null
        or current_user_role not in (
            'owner',
            'admin'
        )
    then
        raise exception
            'Somente proprietários e administradores podem excluir conteúdos.';
    end if;

    delete from public.contents
    where id = content_id_value
    returning id
    into deleted_content_id;

    return deleted_content_id;
end;
$$;


ALTER FUNCTION "public"."delete_content"("content_id_value" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_own_notification"("notification_id_value" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_user_id uuid;
    was_deleted boolean;
begin
    current_user_id := auth.uid();

    if current_user_id is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    delete from public.notifications
     where id = notification_id_value
       and user_id = current_user_id
    returning true
    into was_deleted;

    return coalesce(was_deleted, false);
end;
$$;


ALTER FUNCTION "public"."delete_own_notification"("notification_id_value" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."disconnect_social_account"("target_social_account_id" "uuid", "actor_user_id" "uuid") RETURNS "public"."social_accounts"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    account_record public.social_accounts;
    credentials_record private.social_account_credentials%rowtype;
begin
    select *
    into account_record
    from public.social_accounts
    where id = target_social_account_id
    for update;

    if account_record.id is null then
        raise exception 'Conta social não encontrada.';
    end if;

    if not exists (
        select 1
        from public.workspace_members wm
        where wm.workspace_id = account_record.workspace_id
          and wm.user_id = actor_user_id
          and wm.status = 'active'
          and wm.role in ('owner', 'admin')
    ) then
        raise exception
            'O utilizador não possui permissão para desconectar contas.';
    end if;

    select *
    into credentials_record
    from private.social_account_credentials
    where social_account_id = target_social_account_id
    for update;

    if found then
        delete from vault.secrets
        where id in (
            credentials_record.access_token_secret_id,
            credentials_record.refresh_token_secret_id
        );

        delete from private.social_account_credentials
        where social_account_id =
            target_social_account_id;
    end if;

    update public.social_accounts
    set
        status = 'disconnected',
        last_error_code = null,
        last_error_at = null
    where id = target_social_account_id
    returning *
    into account_record;

    return account_record;
end;
$$;


ALTER FUNCTION "public"."disconnect_social_account"("target_social_account_id" "uuid", "actor_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."duplicate_content"("content_id_value" "uuid") RETURNS "public"."contents"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
    current_user_id uuid;
    current_user_role text;
    original_content public.contents;
    duplicated_content public.contents;
begin
    current_user_id := auth.uid();

    if current_user_id is null then
        raise exception
            'Utilizador não autenticado.';
    end if;

    select *
    into original_content
    from public.contents
    where id = content_id_value;

    if not found then
        raise exception
            'Conteúdo não encontrado.';
    end if;

    select role
    into current_user_role
    from public.workspace_members
    where workspace_id =
            original_content.workspace_id
      and user_id =
            current_user_id
      and status = 'active'
    limit 1;

    if
        current_user_role is null
        or current_user_role not in (
            'owner',
            'admin',
            'editor'
        )
    then
        raise exception
            'Não possui permissão para duplicar conteúdos.';
    end if;

    if original_content.status = 'archived' then
        raise exception
            'Conteúdos arquivados não podem ser duplicados.';
    end if;

    insert into public.contents (
        workspace_id,
        brand_id,
        plan_item_id,
        created_by,
        assigned_to,
        title,
        brief,
        main_text,
        content_type,
        target_platforms,
        source,
        status,
        metadata,
        status_before_archive,
        archived_at
    )
    values (
        original_content.workspace_id,
        original_content.brand_id,
        null,
        current_user_id,
        original_content.assigned_to,
        left(
            'Cópia de: ' ||
            original_content.title,
            160
        ),
        original_content.brief,
        original_content.main_text,
        original_content.content_type,
        coalesce(
            original_content.target_platforms,
            '{}'::text[]
        ),
        'manual',
        'draft',
        coalesce(
            original_content.metadata,
            '{}'::jsonb
        ),
        null,
        null
    )
    returning *
    into duplicated_content;

    return duplicated_content;
end;
$$;


ALTER FUNCTION "public"."duplicate_content"("content_id_value" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_sync_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "social_account_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "sync_type" "text" DEFAULT 'incremental'::"text" NOT NULL,
    "status" "text" DEFAULT 'running'::"text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "finished_at" timestamp with time zone,
    "records_processed" bigint DEFAULT 0 NOT NULL,
    "error_code" "text",
    "error_message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "analytics_sync_runs_finished_at_check" CHECK ((("finished_at" IS NULL) OR ("finished_at" >= "started_at"))),
    CONSTRAINT "analytics_sync_runs_metadata_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "analytics_sync_runs_provider_check" CHECK ((("char_length"(TRIM(BOTH FROM "provider")) >= 2) AND ("char_length"(TRIM(BOTH FROM "provider")) <= 80))),
    CONSTRAINT "analytics_sync_runs_records_processed_check" CHECK (("records_processed" >= 0)),
    CONSTRAINT "analytics_sync_runs_state_check" CHECK (((("status" = 'running'::"text") AND ("finished_at" IS NULL)) OR (("status" = ANY (ARRAY['succeeded'::"text", 'failed'::"text", 'partial'::"text"])) AND ("finished_at" IS NOT NULL)))),
    CONSTRAINT "analytics_sync_runs_status_check" CHECK (("status" = ANY (ARRAY['running'::"text", 'succeeded'::"text", 'failed'::"text", 'partial'::"text"]))),
    CONSTRAINT "analytics_sync_runs_sync_type_check" CHECK (("sync_type" = ANY (ARRAY['full'::"text", 'incremental'::"text"])))
);


ALTER TABLE "public"."analytics_sync_runs" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."finish_analytics_sync"("sync_run_id_value" "uuid", "status_value" "text", "records_processed_value" bigint DEFAULT 0, "error_code_value" "text" DEFAULT NULL::"text", "error_message_value" "text" DEFAULT NULL::"text", "metadata_value" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."analytics_sync_runs"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    sync_row public.analytics_sync_runs%rowtype;
    normalized_status text;
    result_row public.analytics_sync_runs%rowtype;
begin
    select *
      into sync_row
    from public.analytics_sync_runs sr
    where sr.id = sync_run_id_value
    for update;

    if sync_row.id is null then
        raise exception 'Sincronização não encontrada.';
    end if;

    if sync_row.status <> 'running' then
        raise exception 'A sincronização já foi finalizada.';
    end if;

    normalized_status := lower(trim(status_value));

    if normalized_status not in ('succeeded', 'failed', 'partial') then
        raise exception 'Estado final da sincronização inválido.';
    end if;

    if records_processed_value < 0 then
        raise exception 'O total de registos processados não pode ser negativo.';
    end if;

    if coalesce(jsonb_typeof(metadata_value), 'null') <> 'object' then
        raise exception 'Metadata deve ser um objeto JSON.';
    end if;

    update public.analytics_sync_runs
       set status = normalized_status,
           finished_at = now(),
           records_processed = records_processed_value,
           error_code = nullif(trim(error_code_value), ''),
           error_message = nullif(trim(error_message_value), ''),
           metadata = sync_row.metadata || metadata_value
     where id = sync_row.id
    returning * into result_row;

    return result_row;
end;
$$;


ALTER FUNCTION "public"."finish_analytics_sync"("sync_run_id_value" "uuid", "status_value" "text", "records_processed_value" bigint, "error_code_value" "text", "error_message_value" "text", "metadata_value" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_brand_analytics_summary"("brand_id_value" "uuid", "start_date_value" "date", "end_date_value" "date") RETURNS TABLE("brand_id" "uuid", "start_date" "date", "end_date" "date", "account_impressions" bigint, "account_reach" bigint, "profile_views" bigint, "website_clicks" bigint, "content_impressions" bigint, "content_reach" bigint, "content_engagements" bigint, "content_clicks" bigint, "followers_start" bigint, "followers_end" bigint, "follower_growth" bigint, "average_engagement_rate" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    target_workspace_id uuid;
    caller_role text;
begin
    if start_date_value is null or end_date_value is null then
        raise exception 'As datas inicial e final são obrigatórias.';
    end if;

    if end_date_value < start_date_value then
        raise exception 'A data final não pode ser anterior à data inicial.';
    end if;

    select b.workspace_id
      into target_workspace_id
    from public.brands b
    where b.id = brand_id_value;

    if target_workspace_id is null then
        raise exception 'Marca não encontrada.';
    end if;

    caller_role := coalesce(
        current_setting('request.jwt.claim.role', true),
        ''
    );

    if caller_role <> 'service_role'
       and session_user not in ('postgres', 'supabase_admin') then
        if auth.uid() is null then
            raise exception 'Utilizador não autenticado.';
        end if;

        if not exists (
            select 1
            from public.workspace_members wm
            where wm.workspace_id = target_workspace_id
              and wm.user_id = auth.uid()
              and wm.status = 'active'
        ) then
            raise exception 'O utilizador não possui acesso a esta marca.';
        end if;
    end if;

    return query
    with account_totals as (
        select
            coalesce(sum(am.impressions), 0)::bigint as impressions,
            coalesce(sum(am.reach), 0)::bigint as reach,
            coalesce(sum(am.profile_views), 0)::bigint as profile_views,
            coalesce(sum(am.website_clicks), 0)::bigint as website_clicks
        from public.account_metrics am
        where am.brand_id = brand_id_value
          and am.metric_date between start_date_value and end_date_value
    ),
    content_totals as (
        select
            coalesce(sum(cm.impressions), 0)::bigint as impressions,
            coalesce(sum(cm.reach), 0)::bigint as reach,
            coalesce(sum(cm.engagements), 0)::bigint as engagements,
            coalesce(sum(cm.clicks), 0)::bigint as clicks
        from public.content_metrics cm
        where cm.brand_id = brand_id_value
          and cm.metric_date between start_date_value and end_date_value
    ),
    follower_bounds as (
        select
            coalesce((
                select am.followers
                from public.account_metrics am
                where am.brand_id = brand_id_value
                  and am.metric_date between start_date_value and end_date_value
                order by am.metric_date asc, am.created_at asc
                limit 1
            ), 0)::bigint as first_value,
            coalesce((
                select am.followers
                from public.account_metrics am
                where am.brand_id = brand_id_value
                  and am.metric_date between start_date_value and end_date_value
                order by am.metric_date desc, am.created_at desc
                limit 1
            ), 0)::bigint as last_value
    )
    select
        brand_id_value,
        start_date_value,
        end_date_value,
        at.impressions,
        at.reach,
        at.profile_views,
        at.website_clicks,
        ct.impressions,
        ct.reach,
        ct.engagements,
        ct.clicks,
        fb.first_value,
        fb.last_value,
        (fb.last_value - fb.first_value)::bigint,
        case
            when ct.reach = 0 then 0::numeric
            else round((ct.engagements::numeric * 100) / ct.reach, 4)
        end
    from account_totals at
    cross join content_totals ct
    cross join follower_bounds fb;
end;
$$;


ALTER FUNCTION "public"."get_brand_analytics_summary"("brand_id_value" "uuid", "start_date_value" "date", "end_date_value" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_notifications_count"("workspace_id_value" "uuid" DEFAULT NULL::"uuid") RETURNS bigint
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $$
    select count(*)::bigint
    from public.notifications n
    where n.user_id = auth.uid()
      and n.is_read = false
      and (
          workspace_id_value is null
          or n.workspace_id = workspace_id_value
      );
$$;


ALTER FUNCTION "public"."get_unread_notifications_count"("workspace_id_value" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_workspace_billing_summary"("workspace_id_value" "uuid") RETURNS TABLE("workspace_id" "uuid", "subscription_id" "uuid", "plan_code" "text", "plan_name" "text", "subscription_status" "text", "billing_interval" "text", "current_period_start" timestamp with time zone, "current_period_end" timestamp with time zone, "cancel_at_period_end" boolean, "monthly_price_cents" bigint, "yearly_price_cents" bigint, "plan_limits" "jsonb", "plan_features" "jsonb", "usage_month" "date", "ai_text_generations" bigint, "ai_image_generations" bigint, "published_posts" bigint, "storage_bytes" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    caller_role text;
begin
    caller_role := coalesce(
        auth.jwt()->>'role',
        ''
    );

    if caller_role <> 'service_role'
       and session_user not in (
           'postgres',
           'supabase_admin'
       ) then

        if not public.can_view_billing(
            workspace_id_value
        ) then
            raise exception
                'O utilizador não possui acesso à faturação deste workspace.';
        end if;
    end if;

    return query
    select
        ws.workspace_id,
        ws.id,
        bp.code,
        bp.name,
        ws.status,
        ws.billing_interval,
        ws.current_period_start,
        ws.current_period_end,
        ws.cancel_at_period_end,
        bp.monthly_price_cents,
        bp.yearly_price_cents,
        bp.limits,
        bp.features,
        wu.usage_month,
        coalesce(
            wu.ai_text_generations,
            0
        ),
        coalesce(
            wu.ai_image_generations,
            0
        ),
        coalesce(
            wu.published_posts,
            0
        ),
        coalesce(
            wu.storage_bytes,
            0
        )
    from public.workspace_subscriptions ws
    join public.billing_plans bp
      on bp.id = ws.plan_id
    left join public.workspace_usage_monthly wu
      on wu.workspace_id = ws.workspace_id
     and wu.usage_month =
         date_trunc('month', current_date)::date
    where ws.workspace_id = workspace_id_value
      and ws.is_current = true;
end;
$$;


ALTER FUNCTION "public"."get_workspace_billing_summary"("workspace_id_value" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    insert into public.profiles (
        id,
        full_name,
        avatar_url,
        country,
        language,
        timezone,
        account_status,
        onboarding_completed,
        created_at,
        updated_at
    )
    values (
        new.id,
        nullif(new.raw_user_meta_data ->> 'full_name', ''),
        nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
        null,
        coalesce(
            nullif(new.raw_user_meta_data ->> 'language', ''),
            'pt-PT'
        ),
        coalesce(
            nullif(new.raw_user_meta_data ->> 'timezone', ''),
            'Europe/Lisbon'
        ),
        'active',
        false,
        now(),
        now()
    );

    return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_campaign_workspace_role"("workspace_id_value" "uuid", "roles_value" "text"[]) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
    select
        auth.uid() is not null
        and exists (
            select 1
            from public.workspace_members wm
            where wm.workspace_id = workspace_id_value
              and wm.user_id = auth.uid()
              and wm.status = 'active'
              and wm.role::text = any(roles_value)
        );
$$;


ALTER FUNCTION "public"."has_campaign_workspace_role"("workspace_id_value" "uuid", "roles_value" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_workspace_role"("target_workspace_id" "uuid", "allowed_roles" "text"[]) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    select exists (
        select 1
        from public.workspace_members wm
        where wm.workspace_id = target_workspace_id
          and wm.user_id = auth.uid()
          and wm.status = 'active'
          and wm.role = any(allowed_roles)
    );
$$;


ALTER FUNCTION "public"."has_workspace_role"("target_workspace_id" "uuid", "allowed_roles" "text"[]) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_usage_monthly" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "usage_month" "date" NOT NULL,
    "ai_text_generations" bigint DEFAULT 0 NOT NULL,
    "ai_image_generations" bigint DEFAULT 0 NOT NULL,
    "published_posts" bigint DEFAULT 0 NOT NULL,
    "storage_bytes" bigint DEFAULT 0 NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "workspace_usage_metadata_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "workspace_usage_month_first_day_check" CHECK ((EXTRACT(day FROM "usage_month") = (1)::numeric)),
    CONSTRAINT "workspace_usage_monthly_ai_image_generations_check" CHECK (("ai_image_generations" >= 0)),
    CONSTRAINT "workspace_usage_monthly_ai_text_generations_check" CHECK (("ai_text_generations" >= 0)),
    CONSTRAINT "workspace_usage_monthly_published_posts_check" CHECK (("published_posts" >= 0)),
    CONSTRAINT "workspace_usage_monthly_storage_bytes_check" CHECK (("storage_bytes" >= 0))
);


ALTER TABLE "public"."workspace_usage_monthly" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_workspace_usage"("workspace_id_value" "uuid", "usage_month_value" "date" DEFAULT ("date_trunc"('month'::"text", (CURRENT_DATE)::timestamp with time zone))::"date", "ai_text_generations_delta" bigint DEFAULT 0, "ai_image_generations_delta" bigint DEFAULT 0, "published_posts_delta" bigint DEFAULT 0, "storage_bytes_delta" bigint DEFAULT 0, "metadata_value" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."workspace_usage_monthly"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    result_row public.workspace_usage_monthly%rowtype;
begin
    if workspace_id_value is null then
        raise exception 'O workspace é obrigatório.';
    end if;

    if usage_month_value is null
       or extract(day from usage_month_value) <> 1 then
        raise exception
            'usage_month deve representar o primeiro dia do mês.';
    end if;

    if ai_text_generations_delta < 0
       or ai_image_generations_delta < 0
       or published_posts_delta < 0 then
        raise exception
            'Os incrementos de utilização não podem ser negativos.';
    end if;

    if metadata_value is null
       or jsonb_typeof(metadata_value) <> 'object' then
        raise exception 'metadata deve ser um objeto JSON.';
    end if;

    insert into public.workspace_usage_monthly (
        workspace_id,
        usage_month,
        ai_text_generations,
        ai_image_generations,
        published_posts,
        storage_bytes,
        metadata
    )
    values (
        workspace_id_value,
        usage_month_value,
        ai_text_generations_delta,
        ai_image_generations_delta,
        published_posts_delta,
        storage_bytes_delta,
        metadata_value
    )
    on conflict (
        workspace_id,
        usage_month
    )
    do update set
        ai_text_generations =
            public.workspace_usage_monthly.ai_text_generations
            + excluded.ai_text_generations,

        ai_image_generations =
            public.workspace_usage_monthly.ai_image_generations
            + excluded.ai_image_generations,

        published_posts =
            public.workspace_usage_monthly.published_posts
            + excluded.published_posts,

        storage_bytes =
            public.workspace_usage_monthly.storage_bytes
            + excluded.storage_bytes,

        metadata =
            public.workspace_usage_monthly.metadata
            || excluded.metadata
    returning *
    into result_row;

    return result_row;
end;
$$;


ALTER FUNCTION "public"."increment_workspace_usage"("workspace_id_value" "uuid", "usage_month_value" "date", "ai_text_generations_delta" bigint, "ai_image_generations_delta" bigint, "published_posts_delta" bigint, "storage_bytes_delta" bigint, "metadata_value" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_workspace_member"("target_workspace_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    select exists (
        select 1
        from public.workspace_members wm
        where wm.workspace_id = target_workspace_id
          and wm.user_id = auth.uid()
          and wm.status = 'active'
    );
$$;


ALTER FUNCTION "public"."is_workspace_member"("target_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_all_notifications_as_read"("workspace_id_value" "uuid" DEFAULT NULL::"uuid") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_user_id uuid;
    affected_rows bigint;
begin
    current_user_id := auth.uid();

    if current_user_id is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    update public.notifications
       set is_read = true
     where user_id = current_user_id
       and is_read = false
       and (
           workspace_id_value is null
           or workspace_id = workspace_id_value
       );

    get diagnostics affected_rows = row_count;

    return affected_rows;
end;
$$;


ALTER FUNCTION "public"."mark_all_notifications_as_read"("workspace_id_value" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_notification_as_read"("notification_id_value" "uuid") RETURNS "public"."notifications"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_user_id uuid;
    result_row public.notifications%rowtype;
begin
    current_user_id := auth.uid();

    if current_user_id is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    update public.notifications
       set is_read = true
     where id = notification_id_value
       and user_id = current_user_id
    returning *
    into result_row;

    if result_row.id is null then
        raise exception
            'Notificação não encontrada ou sem permissão de acesso.';
    end if;

    return result_row;
end;
$$;


ALTER FUNCTION "public"."mark_notification_as_read"("notification_id_value" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."move_campaign_content"("campaign_content_id_value" "uuid", "position_value" bigint) RETURNS "public"."campaign_contents"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
    relation_row public.campaign_contents%rowtype;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    if position_value is null or position_value < 0 then
        raise exception 'A posição não pode ser negativa.';
    end if;

    select *
    into relation_row
    from public.campaign_contents
    where id = campaign_content_id_value
    for update;

    if not found then
        raise exception
            'Associação entre campanha e conteúdo não encontrada.';
    end if;

    if not public.has_campaign_workspace_role(
        relation_row.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para organizar a campanha.';
    end if;

    update public.campaign_contents
    set position = position_value
    where id = campaign_content_id_value
    returning *
    into relation_row;

    return relation_row;
end;
$$;


ALTER FUNCTION "public"."move_campaign_content"("campaign_content_id_value" "uuid", "position_value" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."move_content_plan_item"("item_id_value" "uuid", "target_status_value" "text", "target_position_value" bigint DEFAULT NULL::bigint) RETURNS "public"."content_plan_items"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_item public.content_plan_items;
    moved_item public.content_plan_items;
    normalized_status text;
    final_position bigint;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into current_item
    from public.content_plan_items cpi
    where cpi.id = item_id_value;

    if not found then
        raise exception 'Item do Planner não encontrado.';
    end if;

    if not public.has_workspace_role(
        current_item.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para mover este item.';
    end if;

    if current_item.status in ('archived', 'converted') then
        raise exception
            'Itens arquivados ou convertidos não podem ser movidos.';
    end if;

    normalized_status :=
        lower(trim(target_status_value));

    if normalized_status not in (
        'idea',
        'planned',
        'in_progress',
        'review',
        'approved'
    , 'converted') then
        raise exception
            'Estado de destino inválido.';
    end if;

    if target_position_value is null then
        select
            coalesce(max(cpi.position), 0) + 1024
        into final_position
        from public.content_plan_items cpi
        where cpi.workspace_id = current_item.workspace_id
          and cpi.brand_id = current_item.brand_id
          and cpi.status = normalized_status
          and cpi.id <> current_item.id;
    else
        if target_position_value < 0 then
            raise exception
                'A posição não pode ser negativa.';
        end if;

        final_position := target_position_value;
    end if;

    update public.content_plan_items
    set
        status = normalized_status,
        position = final_position
    where id = item_id_value
    returning *
    into moved_item;

    return moved_item;
end;
$$;


ALTER FUNCTION "public"."move_content_plan_item"("item_id_value" "uuid", "target_status_value" "text", "target_position_value" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."move_content_version_asset"("content_version_asset_id_value" "uuid", "position_value" bigint) RETURNS "public"."content_version_assets"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_link public.content_version_assets;
    updated_link public.content_version_assets;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    if position_value < 0 then
        raise exception
            'A posição não pode ser negativa.';
    end if;

    select *
    into current_link
    from public.content_version_assets
    where id = content_version_asset_id_value
    for update;

    if not found then
        raise exception
            'Associação de mídia não encontrada.';
    end if;

    perform public.require_content_editor(
        current_link.workspace_id
    );

    update public.content_version_assets
    set position = position_value
    where id = content_version_asset_id_value
    returning *
    into updated_link;

    return updated_link;
end;
$$;


ALTER FUNCTION "public"."move_content_version_asset"("content_version_asset_id_value" "uuid", "position_value" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_client_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
    new.name := trim(new.name);

    new.company_name :=
        nullif(trim(new.company_name), '');

    new.email :=
        lower(nullif(trim(new.email), ''));

    new.phone :=
        nullif(trim(new.phone), '');

    new.website_url :=
        nullif(trim(new.website_url), '');

    new.notes :=
        nullif(trim(new.notes), '');

    return new;
end;
$$;


ALTER FUNCTION "public"."normalize_client_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prepare_media_upload"("target_workspace_id" "uuid", "original_file_name" "text", "mime_type_value" "text", "file_size_value" bigint, "target_brand_id" "uuid" DEFAULT NULL::"uuid", "target_folder_id" "uuid" DEFAULT NULL::"uuid", "display_name_value" "text" DEFAULT NULL::"text", "source_value" "text" DEFAULT 'upload'::"text") RETURNS "public"."media_assets"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_user_id uuid;

    normalized_mime text;
    normalized_source text;

    detected_media_type text;
    detected_extension text;

    new_asset_id uuid;
    new_object_path text;
    scope_path text;

    new_asset public.media_assets;
begin
    current_user_id := auth.uid();

    if current_user_id is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    if not public.has_workspace_role(
        target_workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para enviar ficheiros.';
    end if;

    if char_length(trim(original_file_name))
       not between 1 and 255 then
        raise exception
            'O nome original deve ter entre 1 e 255 caracteres.';
    end if;

    if file_size_value not between 1 and 262144000 then
        raise exception
            'O ficheiro deve ter no máximo 250 MiB.';
    end if;

    normalized_mime :=
        lower(split_part(trim(mime_type_value), ';', 1));

    normalized_source :=
        lower(trim(source_value));

    detected_media_type :=
        private.media_type_from_mime(normalized_mime);

    detected_extension :=
        private.media_extension_from_mime(normalized_mime);

    if detected_media_type is null
       or detected_extension is null then
        raise exception
            'Formato de ficheiro não suportado.';
    end if;

    if normalized_source not in (
        'upload',
        'ai_generated',
        'imported',
        'system'
    ) then
        raise exception
            'Origem do ficheiro inválida.';
    end if;

    if target_brand_id is not null
       and not exists (
           select 1
           from public.brands b
           where b.id = target_brand_id
             and b.workspace_id = target_workspace_id
             and b.status = 'active'
       ) then
        raise exception
            'Marca ativa não encontrada neste workspace.';
    end if;

    if target_folder_id is not null
       and not exists (
           select 1
           from public.media_folders folder
           where folder.id = target_folder_id
             and folder.workspace_id =
                 target_workspace_id
             and folder.brand_id
                 is not distinct from target_brand_id
             and folder.status = 'active'
       ) then
        raise exception
            'Pasta ativa não encontrada no mesmo contexto.';
    end if;

    new_asset_id := gen_random_uuid();

    scope_path :=
        coalesce(target_brand_id::text, 'shared');

    new_object_path :=
        target_workspace_id::text
        || '/'
        || scope_path
        || '/'
        || new_asset_id::text
        || '/'
        || new_asset_id::text
        || '.'
        || detected_extension;

    insert into public.media_assets (
        id,
        workspace_id,
        brand_id,
        folder_id,
        uploaded_by,

        bucket_id,
        object_path,

        original_name,
        display_name,
        file_extension,

        mime_type,
        media_type,
        file_size,

        source,
        status
    )
    values (
        new_asset_id,
        target_workspace_id,
        target_brand_id,
        target_folder_id,
        current_user_id,

        'media-library',
        new_object_path,

        trim(original_file_name),

        coalesce(
            nullif(trim(display_name_value), ''),
            trim(original_file_name)
        ),

        detected_extension,

        normalized_mime,
        detected_media_type,
        file_size_value,

        normalized_source,
        'pending_upload'
    )
    returning *
    into new_asset;

    return new_asset;
end;
$$;


ALTER FUNCTION "public"."prepare_media_upload"("target_workspace_id" "uuid", "original_file_name" "text", "mime_type_value" "text", "file_size_value" bigint, "target_brand_id" "uuid", "target_folder_id" "uuid", "display_name_value" "text", "source_value" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_brand_from_client"("target_brand_id" "uuid") RETURNS "public"."brands"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    selected_brand public.brands%rowtype;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select b.*
    into selected_brand
    from public.brands b
    where b.id = target_brand_id;

    if selected_brand.id is null then
        raise exception 'Marca não encontrada.';
    end if;

    if not public.has_workspace_role(
        selected_brand.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'Não possui permissão para alterar esta marca.';
    end if;

    if selected_brand.client_id is null then
        return selected_brand;
    end if;

    update public.brands
    set client_id = null
    where id = target_brand_id
    returning *
    into selected_brand;

    return selected_brand;
end;
$$;


ALTER FUNCTION "public"."remove_brand_from_client"("target_brand_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_content_from_campaign"("campaign_content_id_value" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
    relation_row public.campaign_contents%rowtype;
    removed_id uuid;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into relation_row
    from public.campaign_contents
    where id = campaign_content_id_value
    for update;

    if not found then
        raise exception
            'Associação entre campanha e conteúdo não encontrada.';
    end if;

    if not public.has_campaign_workspace_role(
        relation_row.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para remover o conteúdo.';
    end if;

    delete from public.campaign_contents
    where id = campaign_content_id_value
    returning id
    into removed_id;

    return removed_id;
end;
$$;


ALTER FUNCTION "public"."remove_content_from_campaign"("campaign_content_id_value" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_content_version_asset"("content_version_asset_id_value" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_link public.content_version_assets;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into current_link
    from public.content_version_assets
    where id = content_version_asset_id_value
    for update;

    if not found then
        raise exception
            'Associação de mídia não encontrada.';
    end if;

    perform public.require_content_editor(
        current_link.workspace_id
    );

    delete from public.content_version_assets
    where id = content_version_asset_id_value;

    return content_version_asset_id_value;
end;
$$;


ALTER FUNCTION "public"."remove_content_version_asset"("content_version_asset_id_value" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."require_content_editor"("target_workspace_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    if not public.has_workspace_role(
        target_workspace_id,
        array['owner', 'admin', 'editor']::text[]
    ) then
        raise exception
            'O utilizador não possui permissão para gerir conteúdos.';
    end if;
end;
$$;


ALTER FUNCTION "public"."require_content_editor"("target_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reschedule_calendar_event"("event_id_value" "uuid", "starts_at_value" timestamp with time zone, "ends_at_value" timestamp with time zone, "timezone_value" "text", "all_day_value" boolean) RETURNS "public"."calendar_events"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_event public.calendar_events;
    rescheduled_event public.calendar_events;
    normalized_timezone text;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into current_event
    from public.calendar_events ce
    where ce.id = event_id_value;

    if not found then
        raise exception 'Evento não encontrado.';
    end if;

    if not public.has_workspace_role(
        current_event.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para reagendar este evento.';
    end if;

    if current_event.status in (
        'archived',
        'completed',
        'cancelled'
    ) then
        raise exception
            'Eventos arquivados, concluídos ou cancelados não podem ser reagendados.';
    end if;

    if starts_at_value is null then
        raise exception
            'A data de início é obrigatória.';
    end if;

    if (
        ends_at_value is not null
        and ends_at_value < starts_at_value
    ) then
        raise exception
            'A data final não pode ser anterior à data inicial.';
    end if;

    normalized_timezone := trim(timezone_value);

    if not exists (
        select 1
        from pg_catalog.pg_timezone_names tz
        where tz.name = normalized_timezone
    ) then
        raise exception 'Timezone inválido.';
    end if;

    update public.calendar_events
    set
        starts_at = starts_at_value,
        ends_at = ends_at_value,
        timezone = normalized_timezone,
        all_day = coalesce(all_day_value, false)
    where id = event_id_value
    returning *
    into rescheduled_event;

    return rescheduled_event;
end;
$$;


ALTER FUNCTION "public"."reschedule_calendar_event"("event_id_value" "uuid", "starts_at_value" timestamp with time zone, "ends_at_value" timestamp with time zone, "timezone_value" "text", "all_day_value" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."restore_brand"("target_brand_id" "uuid") RETURNS "public"."brands"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    selected_brand public.brands%rowtype;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select b.*
    into selected_brand
    from public.brands b
    where b.id = target_brand_id;

    if selected_brand.id is null then
        raise exception 'Marca não encontrada.';
    end if;

    if not public.has_workspace_role(
        selected_brand.workspace_id,
        array['owner', 'admin']
    ) then
        raise exception
            'Não possui permissão para restaurar esta marca.';
    end if;

    if selected_brand.status = 'active' then
        return selected_brand;
    end if;

    update public.brands
    set status = 'active'
    where id = target_brand_id
    returning *
    into selected_brand;

    return selected_brand;
end;
$$;


ALTER FUNCTION "public"."restore_brand"("target_brand_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."restore_calendar_event"("event_id_value" "uuid") RETURNS "public"."calendar_events"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_event public.calendar_events;
    restored_event public.calendar_events;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into current_event
    from public.calendar_events ce
    where ce.id = event_id_value;

    if not found then
        raise exception 'Evento não encontrado.';
    end if;

    if not public.has_workspace_role(
        current_event.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para restaurar este evento.';
    end if;

    if (
        current_event.status <> 'archived'
        or current_event.status_before_archive is null
    ) then
        raise exception 'O evento não está arquivado.';
    end if;

    if not exists (
        select 1
        from public.brands b
        where b.id = current_event.brand_id
          and b.workspace_id = current_event.workspace_id
          and b.status = 'active'
    ) then
        raise exception
            'A marca precisa estar ativa para restaurar o evento.';
    end if;

    if (
        current_event.plan_item_id is not null
        and not exists (
            select 1
            from public.content_plan_items cpi
            where cpi.id = current_event.plan_item_id
              and cpi.workspace_id = current_event.workspace_id
              and cpi.brand_id = current_event.brand_id
              and cpi.status <> 'archived'
        )
    ) then
        raise exception
            'O item do Planner precisa estar disponível para restaurar o evento.';
    end if;

    update public.calendar_events
    set
        status = current_event.status_before_archive,
        status_before_archive = null,
        archived_at = null
    where id = event_id_value
    returning *
    into restored_event;

    return restored_event;
end;
$$;


ALTER FUNCTION "public"."restore_calendar_event"("event_id_value" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."restore_campaign"("campaign_id_value" "uuid") RETURNS "public"."campaigns"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
    campaign_row public.campaigns%rowtype;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into campaign_row
    from public.campaigns
    where id = campaign_id_value
    for update;

    if not found then
        raise exception 'Campanha não encontrada.';
    end if;

    if campaign_row.status <> 'archived' then
        raise exception
            'A campanha não está arquivada.';
    end if;

    if not public.has_campaign_workspace_role(
        campaign_row.workspace_id,
        array['owner', 'admin']
    ) then
        raise exception
            'Apenas owner ou admin pode restaurar campanhas.';
    end if;

    update public.campaigns
    set
        status = coalesce(status_before_archive, 'draft'),
        status_before_archive = null,
        archived_at = null
    where id = campaign_id_value
    returning *
    into campaign_row;

    return campaign_row;
end;
$$;


ALTER FUNCTION "public"."restore_campaign"("campaign_id_value" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."restore_client"("target_client_id" "uuid") RETURNS "public"."clients"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    selected_client public.clients%rowtype;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select c.*
    into selected_client
    from public.clients c
    where c.id = target_client_id;

    if selected_client.id is null then
        raise exception 'Cliente não encontrado.';
    end if;

    if not public.has_workspace_role(
        selected_client.workspace_id,
        array['owner', 'admin']
    ) then
        raise exception
            'Não possui permissão para restaurar este cliente.';
    end if;

    if selected_client.status = 'active' then
        return selected_client;
    end if;

    update public.clients
    set status = 'active'
    where id = target_client_id
    returning *
    into selected_client;

    return selected_client;
end;
$$;


ALTER FUNCTION "public"."restore_client"("target_client_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."restore_content"("content_id_value" "uuid") RETURNS "public"."contents"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
    current_user_id uuid;
    current_user_role text;
    content_workspace_id uuid;
    content_status text;
    previous_status text;
    restored_content public.contents;
begin
    current_user_id := auth.uid();

    if current_user_id is null then
        raise exception
            'Utilizador não autenticado.';
    end if;

    select
        workspace_id,
        status,
        status_before_archive
    into
        content_workspace_id,
        content_status,
        previous_status
    from public.contents
    where id = content_id_value;

    if not found then
        raise exception
            'Conteúdo não encontrado.';
    end if;

    select role
    into current_user_role
    from public.workspace_members
    where workspace_id =
            content_workspace_id
      and user_id =
            current_user_id
      and status = 'active'
    limit 1;

    if
        current_user_role is null
        or current_user_role not in (
            'owner',
            'admin',
            'editor'
        )
    then
        raise exception
            'Não possui permissão para restaurar conteúdos.';
    end if;

    if content_status <> 'archived' then
        raise exception
            'O conteúdo não está arquivado.';
    end if;

    update public.contents
    set
        status =
            case
                when previous_status in (
                    'draft',
                    'in_progress',
                    'review',
                    'approved',
                    'scheduled',
                    'published'
                )
                then previous_status

                else 'draft'
            end,

        status_before_archive =
            null,

        archived_at =
            null,

        updated_at =
            now()

    where id = content_id_value

    returning *
    into restored_content;

    return restored_content;
end;
$$;


ALTER FUNCTION "public"."restore_content"("content_id_value" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."restore_content_plan_item"("item_id_value" "uuid") RETURNS "public"."content_plan_items"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_item public.content_plan_items;
    restored_item public.content_plan_items;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into current_item
    from public.content_plan_items cpi
    where cpi.id = item_id_value;

    if not found then
        raise exception 'Item do Planner não encontrado.';
    end if;

    if not public.has_workspace_role(
        current_item.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para restaurar este item.';
    end if;

    if (
        current_item.status <> 'archived'
        or current_item.status_before_archive is null
    ) then
        raise exception 'O item não está arquivado.';
    end if;

    if not exists (
        select 1
        from public.brands b
        where b.id = current_item.brand_id
          and b.workspace_id = current_item.workspace_id
          and b.status = 'active'
    ) then
        raise exception
            'A marca precisa estar ativa para restaurar o item.';
    end if;

    update public.content_plan_items
    set
        status = current_item.status_before_archive,
        status_before_archive = null,
        archived_at = null
    where id = item_id_value
    returning *
    into restored_item;

    return restored_item;
end;
$$;


ALTER FUNCTION "public"."restore_content_plan_item"("item_id_value" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."restore_content_version"("content_version_id_value" "uuid") RETURNS "public"."content_versions"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_version public.content_versions;
    parent_status text;
    updated_version public.content_versions;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into current_version
    from public.content_versions
    where id = content_version_id_value
    for update;

    if not found then
        raise exception
            'Versão do conteúdo não encontrada.';
    end if;

    perform public.require_content_editor(
        current_version.workspace_id
    );

    select status
    into parent_status
    from public.contents
    where id = current_version.content_id;

    if parent_status = 'archived' then
        raise exception
            'Restaure primeiro o conteúdo principal.';
    end if;

    if current_version.status <> 'archived' then
        raise exception
            'A versão não está arquivada.';
    end if;

    if exists (
        select 1
        from public.content_versions cv
        where cv.content_id = current_version.content_id
          and cv.platform = current_version.platform
          and cv.status <> 'archived'
          and cv.id <> current_version.id
    ) then
        raise exception
            'Já existe uma versão ativa para esta plataforma.';
    end if;

    update public.content_versions
    set
        status = current_version.status_before_archive,
        status_before_archive = null,
        archived_at = null
    where id = content_version_id_value
    returning *
    into updated_version;

    return updated_version;
end;
$$;


ALTER FUNCTION "public"."restore_content_version"("content_version_id_value" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."restore_media_asset"("target_asset_id" "uuid") RETURNS "public"."media_assets"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    asset_record public.media_assets;
    restored_status text;
begin
    select *
    into asset_record
    from public.media_assets
    where id = target_asset_id
    for update;

    if asset_record.id is null then
        raise exception 'Ficheiro não encontrado.';
    end if;

    if not public.has_workspace_role(
        asset_record.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para restaurar o ficheiro.';
    end if;

    if asset_record.status <> 'archived' then
        return asset_record;
    end if;

    restored_status :=
        coalesce(
            asset_record.status_before_archive,
            case
                when asset_record.storage_object_id is null
                    then 'pending_upload'
                else 'ready'
            end
        );

    update public.media_assets
    set
        status = restored_status,
        status_before_archive = null,
        archived_at = null
    where id = target_asset_id
    returning *
    into asset_record;

    return asset_record;
end;
$$;


ALTER FUNCTION "public"."restore_media_asset"("target_asset_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."restore_media_folder"("target_folder_id" "uuid") RETURNS "public"."media_folders"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    folder_record public.media_folders;
begin
    select *
    into folder_record
    from public.media_folders
    where id = target_folder_id
    for update;

    if folder_record.id is null then
        raise exception 'Pasta não encontrada.';
    end if;

    if not public.has_workspace_role(
        folder_record.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para restaurar a pasta.';
    end if;

    if folder_record.status = 'active' then
        return folder_record;
    end if;

    update public.media_folders
    set
        status = 'active',
        archived_at = null
    where id = target_folder_id
    returning *
    into folder_record;

    return folder_record;
end;
$$;


ALTER FUNCTION "public"."restore_media_folder"("target_folder_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_analytics_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
    new.updated_at := now();
    return new;
end;
$$;


ALTER FUNCTION "public"."set_analytics_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_billing_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
    new.updated_at := now();
    return new;
end;
$$;


ALTER FUNCTION "public"."set_billing_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_notifications_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
    new.updated_at := now();
    return new;
end;
$$;


ALTER FUNCTION "public"."set_notifications_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_social_account_health"("target_social_account_id" "uuid", "status_value" "text", "error_code_value" "text" DEFAULT NULL::"text", "synced_at_value" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS "public"."social_accounts"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    account_record public.social_accounts;
    normalized_status text;
begin
    normalized_status :=
        lower(trim(status_value));

    if normalized_status not in (
        'active',
        'expired',
        'revoked',
        'error'
    ) then
        raise exception
            'Estado de sincronização inválido.';
    end if;

    update public.social_accounts
    set
        status = normalized_status,

        last_synced_at = case
            when normalized_status = 'active'
                then coalesce(synced_at_value, now())
            else last_synced_at
        end,

        last_error_code = case
            when normalized_status = 'active'
                then null
            else nullif(trim(error_code_value), '')
        end,

        last_error_at = case
            when normalized_status = 'active'
                then null
            else now()
        end

    where id = target_social_account_id
    returning *
    into account_record;

    if account_record.id is null then
        raise exception 'Conta social não encontrada.';
    end if;

    return account_record;
end;
$$;


ALTER FUNCTION "public"."set_social_account_health"("target_social_account_id" "uuid", "status_value" "text", "error_code_value" "text", "synced_at_value" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
    new.updated_at = now();
    return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "provider" "text" DEFAULT 'manual'::"text" NOT NULL,
    "provider_customer_id" "text",
    "provider_subscription_id" "text",
    "billing_interval" "text" DEFAULT 'none'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "is_current" boolean DEFAULT true NOT NULL,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "trial_end" timestamp with time zone,
    "cancel_at_period_end" boolean DEFAULT false NOT NULL,
    "canceled_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "workspace_subscriptions_interval_check" CHECK (("billing_interval" = ANY (ARRAY['none'::"text", 'monthly'::"text", 'yearly'::"text"]))),
    CONSTRAINT "workspace_subscriptions_metadata_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "workspace_subscriptions_period_check" CHECK ((("current_period_start" IS NULL) OR ("current_period_end" IS NULL) OR ("current_period_end" > "current_period_start"))),
    CONSTRAINT "workspace_subscriptions_provider_check" CHECK (("provider" = ANY (ARRAY['manual'::"text", 'stripe'::"text"]))),
    CONSTRAINT "workspace_subscriptions_status_check" CHECK (("status" = ANY (ARRAY['trialing'::"text", 'active'::"text", 'past_due'::"text", 'canceled'::"text", 'unpaid'::"text", 'incomplete'::"text", 'paused'::"text"]))),
    CONSTRAINT "workspace_subscriptions_trial_check" CHECK ((("trial_end" IS NULL) OR ("current_period_start" IS NULL) OR ("trial_end" >= "current_period_start")))
);


ALTER TABLE "public"."workspace_subscriptions" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_workspace_subscription"("workspace_id_value" "uuid", "plan_code_value" "text", "status_value" "text" DEFAULT 'active'::"text", "provider_value" "text" DEFAULT 'manual'::"text", "billing_interval_value" "text" DEFAULT 'none'::"text", "current_period_start_value" timestamp with time zone DEFAULT "now"(), "current_period_end_value" timestamp with time zone DEFAULT NULL::timestamp with time zone, "trial_end_value" timestamp with time zone DEFAULT NULL::timestamp with time zone, "cancel_at_period_end_value" boolean DEFAULT false, "provider_customer_id_value" "text" DEFAULT NULL::"text", "provider_subscription_id_value" "text" DEFAULT NULL::"text", "metadata_value" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."workspace_subscriptions"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    target_plan_id uuid;
    result_row public.workspace_subscriptions%rowtype;
begin
    if not exists (
        select 1
        from public.workspaces w
        where w.id = workspace_id_value
        for update
    ) then
        raise exception 'Workspace não encontrado.';
    end if;

    select bp.id
      into target_plan_id
    from public.billing_plans bp
    where bp.code = lower(trim(plan_code_value))
      and bp.is_active = true;

    if target_plan_id is null then
        raise exception 'Plano ativo não encontrado.';
    end if;

    if metadata_value is null
       or jsonb_typeof(metadata_value) <> 'object' then
        raise exception 'metadata deve ser um objeto JSON.';
    end if;

    update public.workspace_subscriptions
       set is_current = false
     where workspace_id = workspace_id_value
       and is_current = true;

    insert into public.workspace_subscriptions (
        workspace_id,
        plan_id,
        provider,
        provider_customer_id,
        provider_subscription_id,
        billing_interval,
        status,
        is_current,
        current_period_start,
        current_period_end,
        trial_end,
        cancel_at_period_end,
        metadata
    )
    values (
        workspace_id_value,
        target_plan_id,
        provider_value,
        provider_customer_id_value,
        provider_subscription_id_value,
        billing_interval_value,
        status_value,
        true,
        current_period_start_value,
        current_period_end_value,
        trial_end_value,
        cancel_at_period_end_value,
        metadata_value
    )
    returning *
    into result_row;

    return result_row;
end;
$$;


ALTER FUNCTION "public"."set_workspace_subscription"("workspace_id_value" "uuid", "plan_code_value" "text", "status_value" "text", "provider_value" "text", "billing_interval_value" "text", "current_period_start_value" timestamp with time zone, "current_period_end_value" timestamp with time zone, "trial_end_value" timestamp with time zone, "cancel_at_period_end_value" boolean, "provider_customer_id_value" "text", "provider_subscription_id_value" "text", "metadata_value" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."slugify"("value" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE STRICT
    SET "search_path" TO ''
    AS $$
    select trim(
        both '-'
        from regexp_replace(
            lower(
                translate(
                    value,
                    'áàãâäéèêëíìîïóòõôöúùûüç',
                    'aaaaaeeeeiiiiooooouuuuc'
                )
            ),
            '[^a-z0-9]+',
            '-',
            'g'
        )
    );
$$;


ALTER FUNCTION "public"."slugify"("value" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."start_analytics_sync"("social_account_id_value" "uuid", "provider_value" "text", "sync_type_value" "text" DEFAULT 'incremental'::"text", "metadata_value" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."analytics_sync_runs"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    account_row public.social_accounts%rowtype;
    normalized_sync_type text;
    result_row public.analytics_sync_runs%rowtype;
begin
    select *
      into account_row
    from public.social_accounts sa
    where sa.id = social_account_id_value;

    if account_row.id is null then
        raise exception 'Conta social não encontrada.';
    end if;

    if char_length(trim(coalesce(provider_value, ''))) < 2 then
        raise exception 'Provider inválido.';
    end if;

    normalized_sync_type := lower(trim(sync_type_value));

    if normalized_sync_type not in ('full', 'incremental') then
        raise exception 'Tipo de sincronização inválido.';
    end if;

    if coalesce(jsonb_typeof(metadata_value), 'null') <> 'object' then
        raise exception 'Metadata deve ser um objeto JSON.';
    end if;

    insert into public.analytics_sync_runs (
        workspace_id,
        brand_id,
        social_account_id,
        provider,
        sync_type,
        status,
        metadata
    )
    values (
        account_row.workspace_id,
        account_row.brand_id,
        account_row.id,
        lower(trim(provider_value)),
        normalized_sync_type,
        'running',
        metadata_value
    )
    returning * into result_row;

    return result_row;
end;
$$;


ALTER FUNCTION "public"."start_analytics_sync"("social_account_id_value" "uuid", "provider_value" "text", "sync_type_value" "text", "metadata_value" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_content_platforms_from_plan_item"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
    planner_platforms text[];
begin
    if
        new.plan_item_id is not null
        and coalesce(
            cardinality(new.target_platforms),
            0
        ) = 0
    then
        select target_platforms
        into planner_platforms
        from public.content_plan_items
        where id = new.plan_item_id;

        if found then
            new.target_platforms =
                coalesce(
                    planner_platforms,
                    '{}'::text[]
                );
        end if;
    end if;

    new.target_platforms =
        coalesce(
            new.target_platforms,
            '{}'::text[]
        );

    return new;
end;
$$;


ALTER FUNCTION "public"."sync_content_platforms_from_plan_item"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_notification_read_state"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
    if new.is_read = true then
        if new.read_at is null then
            new.read_at := now();
        end if;
    else
        new.read_at := null;
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."sync_notification_read_state"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_brand"("target_brand_id" "uuid", "brand_name" "text", "brand_description" "text", "brand_industry" "text", "brand_website_url" "text", "brand_primary_color" "text", "brand_secondary_color" "text", "brand_logo_url" "text", "brand_default_language" "text") RETURNS "public"."brands"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
declare
    selected_brand public.brands%rowtype;
    updated_brand public.brands%rowtype;

    normalized_name text;
    normalized_description text;
    normalized_industry text;
    normalized_website_url text;
    normalized_primary_color text;
    normalized_secondary_color text;
    normalized_logo_url text;
    normalized_language text;
begin
    if auth.uid() is null then
        raise exception
            'Utilizador não autenticado.';
    end if;

    if target_brand_id is null then
        raise exception
            'Marca não informada.';
    end if;

    select b.*
    into selected_brand
    from public.brands b
    where b.id = target_brand_id;

    if selected_brand.id is null then
        raise exception
            'Marca não encontrada.';
    end if;

    if not public.has_workspace_role(
        selected_brand.workspace_id,
        array['owner', 'admin']
    ) then
        raise exception
            'Sem permissão para editar esta marca.';
    end if;

    normalized_name :=
        trim(brand_name);

    normalized_description :=
        nullif(trim(brand_description), '');

    normalized_industry :=
        nullif(trim(brand_industry), '');

    normalized_website_url :=
        nullif(trim(brand_website_url), '');

    normalized_primary_color :=
        nullif(trim(brand_primary_color), '');

    normalized_secondary_color :=
        nullif(trim(brand_secondary_color), '');

    normalized_logo_url :=
        nullif(trim(brand_logo_url), '');

    normalized_language :=
        nullif(trim(brand_default_language), '');

    if normalized_name is null
       or char_length(normalized_name) < 2
       or char_length(normalized_name) > 100
    then
        raise exception
            'O nome da marca deve ter entre 2 e 100 caracteres.';
    end if;

    if normalized_description is not null
       and char_length(normalized_description) > 1000
    then
        raise exception
            'A descrição deve ter no máximo 1000 caracteres.';
    end if;

    if normalized_website_url is not null
       and normalized_website_url !~* '^https?://'
    then
        raise exception
            'O website deve começar com http:// ou https://.';
    end if;

    if normalized_logo_url is not null
       and normalized_logo_url !~* '^https?://'
    then
        raise exception
            'A URL do logótipo deve começar com http:// ou https://.';
    end if;

    if normalized_primary_color is not null
       and normalized_primary_color !~ '^#[0-9A-Fa-f]{6}$'
    then
        raise exception
            'A cor principal é inválida.';
    end if;

    if normalized_secondary_color is not null
       and normalized_secondary_color !~ '^#[0-9A-Fa-f]{6}$'
    then
        raise exception
            'A cor secundária é inválida.';
    end if;

    if normalized_language is not null
       and normalized_language !~
           '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$'
    then
        raise exception
            'O código de idioma é inválido.';
    end if;

    update public.brands
    set
        name = normalized_name,
        description = normalized_description,
        industry = normalized_industry,
        website_url = normalized_website_url,

        primary_color = coalesce(
            normalized_primary_color,
            selected_brand.primary_color,
            '#6D28D9'
        ),

        secondary_color = coalesce(
            normalized_secondary_color,
            selected_brand.secondary_color,
            '#A78BFA'
        ),

        logo_url = normalized_logo_url,

        default_language = coalesce(
            normalized_language,
            selected_brand.default_language,
            'pt-PT'
        ),

        updated_at = now()
    where id = target_brand_id
    returning *
    into updated_brand;

    return updated_brand;
end;
$_$;


ALTER FUNCTION "public"."update_brand"("target_brand_id" "uuid", "brand_name" "text", "brand_description" "text", "brand_industry" "text", "brand_website_url" "text", "brand_primary_color" "text", "brand_secondary_color" "text", "brand_logo_url" "text", "brand_default_language" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_calendar_event"("event_id_value" "uuid", "title_value" "text", "description_value" "text", "event_type_value" "text", "platform_value" "text", "plan_item_id_value" "uuid", "metadata_value" "jsonb") RETURNS "public"."calendar_events"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_event public.calendar_events;
    updated_event public.calendar_events;
    normalized_event_type text;
    normalized_platform text;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into current_event
    from public.calendar_events ce
    where ce.id = event_id_value;

    if not found then
        raise exception 'Evento não encontrado.';
    end if;

    if not public.has_workspace_role(
        current_event.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para editar este evento.';
    end if;

    if current_event.status = 'archived' then
        raise exception
            'Eventos arquivados não podem ser editados.';
    end if;

    if not exists (
        select 1
        from public.brands b
        where b.id = current_event.brand_id
          and b.workspace_id = current_event.workspace_id
          and b.status = 'active'
    ) then
        raise exception
            'A marca deste evento não está ativa.';
    end if;

    if char_length(trim(title_value)) not between 2 and 160 then
        raise exception
            'O título deve possuir entre 2 e 160 caracteres.';
    end if;

    if (
        description_value is not null
        and char_length(description_value) > 10000
    ) then
        raise exception
            'A descrição deve possuir no máximo 10000 caracteres.';
    end if;

    normalized_event_type :=
        lower(trim(event_type_value));

    normalized_platform :=
        nullif(lower(trim(platform_value)), '');

    if normalized_event_type not in (
        'content',
        'deadline',
        'event',
        'reminder'
    ) then
        raise exception 'Tipo de evento inválido.';
    end if;

    if (
        normalized_platform is not null
        and normalized_platform not in (
            'instagram',
            'facebook',
            'linkedin',
            'tiktok',
            'youtube',
            'pinterest',
            'threads',
            'x',
            'blog',
            'email'
        )
    ) then
        raise exception 'Plataforma inválida.';
    end if;

    if (
        plan_item_id_value is not null
        and not exists (
            select 1
            from public.content_plan_items cpi
            where cpi.id = plan_item_id_value
              and cpi.workspace_id = current_event.workspace_id
              and cpi.brand_id = current_event.brand_id
              and cpi.status <> 'archived'
        )
    ) then
        raise exception
            'O item do Planner não pertence ao workspace e à marca informados ou está arquivado.';
    end if;

    if jsonb_typeof(
        coalesce(metadata_value, '{}'::jsonb)
    ) <> 'object' then
        raise exception
            'Os metadados devem ser um objeto JSON.';
    end if;

    update public.calendar_events
    set
        title = trim(title_value),
        description = nullif(trim(description_value), ''),
        event_type = normalized_event_type,
        platform = normalized_platform,
        plan_item_id = plan_item_id_value,
        metadata = coalesce(
            metadata_value,
            '{}'::jsonb
        )
    where id = event_id_value
    returning *
    into updated_event;

    return updated_event;
end;
$$;


ALTER FUNCTION "public"."update_calendar_event"("event_id_value" "uuid", "title_value" "text", "description_value" "text", "event_type_value" "text", "platform_value" "text", "plan_item_id_value" "uuid", "metadata_value" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_campaign"("campaign_id_value" "uuid", "name_value" "text", "description_value" "text", "objective_value" "text", "client_id_value" "uuid", "assigned_to_value" "uuid", "start_date_value" "date", "end_date_value" "date", "budget_value" numeric, "currency_value" "text", "metadata_value" "jsonb") RETURNS "public"."campaigns"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
    campaign_row public.campaigns%rowtype;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into campaign_row
    from public.campaigns
    where id = campaign_id_value
    for update;

    if not found then
        raise exception 'Campanha não encontrada.';
    end if;

    if campaign_row.status = 'archived' then
        raise exception
            'A campanha está arquivada e não pode ser alterada.';
    end if;

    if not public.has_campaign_workspace_role(
        campaign_row.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para editar campanhas.';
    end if;

    if name_value is null
       or char_length(trim(name_value)) < 3
       or char_length(trim(name_value)) > 120
    then
        raise exception
            'O nome da campanha deve possuir entre 3 e 120 caracteres.';
    end if;

    update public.campaigns
    set
        name = trim(name_value),
        description = nullif(trim(description_value), ''),
        objective = nullif(trim(objective_value), ''),
        client_id = client_id_value,
        assigned_to = assigned_to_value,
        start_date = start_date_value,
        end_date = end_date_value,
        budget = budget_value,
        currency = upper(
            coalesce(
                nullif(trim(currency_value), ''),
                'EUR'
            )
        ),
        metadata = coalesce(metadata_value, '{}'::jsonb)
    where id = campaign_id_value
    returning *
    into campaign_row;

    return campaign_row;
end;
$$;


ALTER FUNCTION "public"."update_campaign"("campaign_id_value" "uuid", "name_value" "text", "description_value" "text", "objective_value" "text", "client_id_value" "uuid", "assigned_to_value" "uuid", "start_date_value" "date", "end_date_value" "date", "budget_value" numeric, "currency_value" "text", "metadata_value" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_client"("target_client_id" "uuid", "client_name" "text", "client_company_name" "text", "client_email" "text", "client_phone" "text", "client_website_url" "text", "client_notes" "text") RETURNS "public"."clients"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
declare
    selected_client public.clients%rowtype;
    updated_client public.clients%rowtype;

    normalized_name text;
    normalized_company_name text;
    normalized_email text;
    normalized_phone text;
    normalized_website_url text;
    normalized_notes text;
begin
    if auth.uid() is null then
        raise exception
            'Utilizador não autenticado.';
    end if;

    if target_client_id is null then
        raise exception
            'Cliente não informado.';
    end if;

    select c.*
    into selected_client
    from public.clients c
    where c.id = target_client_id;

    if selected_client.id is null then
        raise exception
            'Cliente não encontrado.';
    end if;

    if not public.has_workspace_role(
        selected_client.workspace_id,
        array['owner', 'admin']
    ) then
        raise exception
            'Sem permissão para editar este cliente.';
    end if;

    normalized_name :=
        trim(client_name);

    normalized_company_name :=
        nullif(trim(client_company_name), '');

    normalized_email :=
        nullif(lower(trim(client_email)), '');

    normalized_phone :=
        nullif(trim(client_phone), '');

    normalized_website_url :=
        nullif(trim(client_website_url), '');

    normalized_notes :=
        nullif(trim(client_notes), '');

    if normalized_name is null
       or char_length(normalized_name) < 2
       or char_length(normalized_name) > 120
    then
        raise exception
            'O nome do cliente deve ter entre 2 e 120 caracteres.';
    end if;

    if normalized_company_name is not null
       and char_length(normalized_company_name) > 160
    then
        raise exception
            'O nome da empresa deve ter no máximo 160 caracteres.';
    end if;

    if normalized_email is not null
       and normalized_email !~
           '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$'
    then
        raise exception
            'O email informado é inválido.';
    end if;

    if normalized_website_url is not null
       and normalized_website_url !~* '^https?://'
    then
        raise exception
            'O website deve começar com http:// ou https://.';
    end if;

    if normalized_notes is not null
       and char_length(normalized_notes) > 2000
    then
        raise exception
            'As observações devem ter no máximo 2000 caracteres.';
    end if;

    update public.clients
    set
        name = normalized_name,
        company_name = normalized_company_name,
        email = normalized_email,
        phone = normalized_phone,
        website_url = normalized_website_url,
        notes = normalized_notes,
        updated_at = now()
    where id = target_client_id
    returning *
    into updated_client;

    return updated_client;
end;
$_$;


ALTER FUNCTION "public"."update_client"("target_client_id" "uuid", "client_name" "text", "client_company_name" "text", "client_email" "text", "client_phone" "text", "client_website_url" "text", "client_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_content"("content_id_value" "uuid", "title_value" "text", "brief_value" "text", "main_text_value" "text", "content_type_value" "text", "target_platforms_value" "text"[], "metadata_value" "jsonb") RETURNS "public"."contents"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
    current_user_id uuid;
    current_user_role text;
    content_workspace_id uuid;
    updated_content public.contents;
begin
    current_user_id = auth.uid();

    if current_user_id is null then
        raise exception
            'Utilizador não autenticado.';
    end if;

    select workspace_id
    into content_workspace_id
    from public.contents
    where id = content_id_value;

    if content_workspace_id is null then
        raise exception
            'Conteúdo não encontrado.';
    end if;

    select role
    into current_user_role
    from public.workspace_members
    where workspace_id = content_workspace_id
      and user_id = current_user_id
      and status = 'active'
    limit 1;

    if
        current_user_role is null
        or current_user_role not in (
            'owner',
            'admin',
            'editor'
        )
    then
        raise exception
            'Não possui permissão para editar conteúdos.';
    end if;

    if exists (
        select 1
        from public.contents
        where id = content_id_value
          and status = 'archived'
    ) then
        raise exception
            'Conteúdos arquivados não podem ser editados.';
    end if;

    if
        char_length(
            trim(
                coalesce(
                    title_value,
                    ''
                )
            )
        ) < 2
        or char_length(
            trim(
                coalesce(
                    title_value,
                    ''
                )
            )
        ) > 160
    then
        raise exception
            'O título deve ter entre 2 e 160 caracteres.';
    end if;

    if
        char_length(
            coalesce(
                brief_value,
                ''
            )
        ) > 10000
    then
        raise exception
            'O brief ultrapassa o limite permitido.';
    end if;

    if content_type_value not in (
        'post',
        'carousel',
        'story',
        'reel',
        'short',
        'video',
        'article',
        'email',
        'other'
    ) then
        raise exception
            'Tipo de conteúdo inválido.';
    end if;

    if exists (
        select 1
        from unnest(
            coalesce(
                target_platforms_value,
                '{}'::text[]
            )
        ) as platform
        where platform not in (
            'instagram',
            'facebook',
            'linkedin',
            'tiktok',
            'youtube',
            'pinterest',
            'threads',
            'x',
            'blog',
            'email'
        )
    ) then
        raise exception
            'Uma ou mais plataformas são inválidas.';
    end if;

    update public.contents
    set
        title = trim(title_value),

        brief = nullif(
            trim(
                coalesce(
                    brief_value,
                    ''
                )
            ),
            ''
        ),

        main_text = nullif(
            trim(
                coalesce(
                    main_text_value,
                    ''
                )
            ),
            ''
        ),

        content_type = content_type_value,

        target_platforms = coalesce(
            target_platforms_value,
            '{}'::text[]
        ),

        metadata = coalesce(
            metadata_value,
            '{}'::jsonb
        ),

        updated_at = now()

    where id = content_id_value

    returning *
    into updated_content;

    return updated_content;
end;
$$;


ALTER FUNCTION "public"."update_content"("content_id_value" "uuid", "title_value" "text", "brief_value" "text", "main_text_value" "text", "content_type_value" "text", "target_platforms_value" "text"[], "metadata_value" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_content"("content_id_value" "uuid", "title_value" "text", "brief_value" "text", "main_text_value" "text", "content_type_value" "text", "assigned_to_value" "uuid", "metadata_value" "jsonb") RETURNS "public"."contents"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_content public.contents;
    updated_content public.contents;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into current_content
    from public.contents
    where id = content_id_value
    for update;

    if not found then
        raise exception 'Conteúdo não encontrado.';
    end if;

    perform public.require_content_editor(
        current_content.workspace_id
    );

    if current_content.status = 'archived' then
        raise exception
            'Não é possível editar um conteúdo arquivado.';
    end if;

    if metadata_value is null
       or jsonb_typeof(metadata_value) <> 'object' then
        raise exception
            'Os metadados devem ser um objeto JSON.';
    end if;

    update public.contents
    set
        title = trim(title_value),
        brief = nullif(trim(brief_value), ''),
        main_text = nullif(trim(main_text_value), ''),
        content_type = lower(trim(content_type_value)),
        assigned_to = assigned_to_value,
        metadata = metadata_value
    where id = content_id_value
    returning *
    into updated_content;

    return updated_content;
end;
$$;


ALTER FUNCTION "public"."update_content"("content_id_value" "uuid", "title_value" "text", "brief_value" "text", "main_text_value" "text", "content_type_value" "text", "assigned_to_value" "uuid", "metadata_value" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_content_plan_item"("item_id_value" "uuid", "title_value" "text", "brief_value" "text", "content_type_value" "text", "target_platforms_value" "text"[], "priority_value" "text", "due_date_value" "date", "metadata_value" "jsonb") RETURNS "public"."content_plan_items"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_item public.content_plan_items;
    updated_item public.content_plan_items;
    normalized_platforms text[];
    normalized_content_type text;
    normalized_priority text;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into current_item
    from public.content_plan_items cpi
    where cpi.id = item_id_value;

    if not found then
        raise exception 'Item do Planner não encontrado.';
    end if;

    if not public.has_workspace_role(
        current_item.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para editar este item.';
    end if;

    if current_item.status in ('archived', 'converted') then
        raise exception
            'Itens arquivados ou convertidos não podem ser editados.';
    end if;

    if not exists (
        select 1
        from public.brands b
        where b.id = current_item.brand_id
          and b.workspace_id = current_item.workspace_id
          and b.status = 'active'
    ) then
        raise exception
            'A marca deste item não está ativa.';
    end if;

    if char_length(trim(title_value)) not between 2 and 160 then
        raise exception
            'O título deve possuir entre 2 e 160 caracteres.';
    end if;

    if (
        brief_value is not null
        and char_length(brief_value) > 10000
    ) then
        raise exception
            'O briefing deve possuir no máximo 10000 caracteres.';
    end if;

    normalized_content_type :=
        lower(trim(content_type_value));

    normalized_priority :=
        lower(trim(priority_value));

    if normalized_content_type not in (
        'post',
        'carousel',
        'story',
        'reel',
        'short',
        'video',
        'article',
        'email',
        'other'
    ) then
        raise exception 'Tipo de conteúdo inválido.';
    end if;

    if normalized_priority not in (
        'low',
        'medium',
        'high',
        'urgent'
    ) then
        raise exception 'Prioridade inválida.';
    end if;

    select coalesce(
        array_agg(
            distinct lower(trim(platform_value))
        ) filter (
            where trim(platform_value) <> ''
        ),
        '{}'::text[]
    )
    into normalized_platforms
    from unnest(
        coalesce(
            target_platforms_value,
            '{}'::text[]
        )
    ) as platforms(platform_value);

    if not (
        normalized_platforms <@ array[
            'instagram',
            'facebook',
            'linkedin',
            'tiktok',
            'youtube',
            'pinterest',
            'threads',
            'x',
            'blog',
            'email'
        ]::text[]
    ) then
        raise exception
            'Uma ou mais plataformas são inválidas.';
    end if;

    if cardinality(normalized_platforms) > 10 then
        raise exception
            'Um item pode possuir no máximo 10 plataformas.';
    end if;

    if jsonb_typeof(
        coalesce(metadata_value, '{}'::jsonb)
    ) <> 'object' then
        raise exception
            'Os metadados devem ser um objeto JSON.';
    end if;

    update public.content_plan_items
    set
        title = trim(title_value),
        brief = nullif(trim(brief_value), ''),
        content_type = normalized_content_type,
        target_platforms = normalized_platforms,
        priority = normalized_priority,
        due_date = due_date_value,
        metadata = coalesce(
            metadata_value,
            '{}'::jsonb
        )
    where id = item_id_value
    returning *
    into updated_item;

    return updated_item;
end;
$$;


ALTER FUNCTION "public"."update_content_plan_item"("item_id_value" "uuid", "title_value" "text", "brief_value" "text", "content_type_value" "text", "target_platforms_value" "text"[], "priority_value" "text", "due_date_value" "date", "metadata_value" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_content_version"("content_version_id_value" "uuid", "platform_value" "text", "title_value" "text", "body_value" "text", "hashtags_value" "text"[], "call_to_action_value" "text", "media_notes_value" "text", "metadata_value" "jsonb") RETURNS "public"."content_versions"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    current_version public.content_versions;
    parent_status text;
    updated_version public.content_versions;
    normalized_platform text;
begin
    if auth.uid() is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    select *
    into current_version
    from public.content_versions
    where id = content_version_id_value
    for update;

    if not found then
        raise exception
            'Versão do conteúdo não encontrada.';
    end if;

    perform public.require_content_editor(
        current_version.workspace_id
    );

    select status
    into parent_status
    from public.contents
    where id = current_version.content_id;

    if parent_status = 'archived' then
        raise exception
            'O conteúdo principal está arquivado.';
    end if;

    if current_version.status = 'archived' then
        raise exception
            'A versão do conteúdo está arquivada.';
    end if;

    normalized_platform := lower(trim(platform_value));

    if normalized_platform not in (
        'instagram',
        'facebook',
        'linkedin',
        'tiktok',
        'youtube',
        'pinterest',
        'threads',
        'x'
    ) then
        raise exception 'Plataforma inválida.';
    end if;

    if exists (
        select 1
        from public.content_versions cv
        where cv.content_id = current_version.content_id
          and cv.platform = normalized_platform
          and cv.status <> 'archived'
          and cv.id <> current_version.id
    ) then
        raise exception
            'Já existe outra versão ativa para esta plataforma.';
    end if;

    if metadata_value is null
       or jsonb_typeof(metadata_value) <> 'object' then
        raise exception
            'Os metadados devem ser um objeto JSON.';
    end if;

    update public.content_versions
    set
        platform = normalized_platform,
        title = nullif(trim(title_value), ''),
        body = nullif(trim(body_value), ''),
        hashtags = coalesce(
            hashtags_value,
            '{}'::text[]
        ),
        call_to_action =
            nullif(trim(call_to_action_value), ''),
        media_notes =
            nullif(trim(media_notes_value), ''),
        metadata = metadata_value
    where id = content_version_id_value
    returning *
    into updated_version;

    return updated_version;
end;
$$;


ALTER FUNCTION "public"."update_content_version"("content_version_id_value" "uuid", "platform_value" "text", "title_value" "text", "body_value" "text", "hashtags_value" "text"[], "call_to_action_value" "text", "media_notes_value" "text", "metadata_value" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_media_asset_metadata"("target_asset_id" "uuid", "target_folder_id" "uuid", "display_name_value" "text", "alt_text_value" "text", "caption_value" "text") RETURNS "public"."media_assets"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    asset_record public.media_assets;
begin
    select *
    into asset_record
    from public.media_assets
    where id = target_asset_id
    for update;

    if asset_record.id is null then
        raise exception 'Ficheiro não encontrado.';
    end if;

    if not public.has_workspace_role(
        asset_record.workspace_id,
        array['owner', 'admin', 'editor']
    ) then
        raise exception
            'O utilizador não possui permissão para editar o ficheiro.';
    end if;

    if asset_record.status = 'archived' then
        raise exception
            'Restaure o ficheiro antes de editá-lo.';
    end if;

    if char_length(trim(display_name_value))
       not between 1 and 255 then
        raise exception
            'O nome deve ter entre 1 e 255 caracteres.';
    end if;

    if target_folder_id is not null
       and not exists (
           select 1
           from public.media_folders folder
           where folder.id = target_folder_id
             and folder.workspace_id =
                 asset_record.workspace_id
             and folder.brand_id
                 is not distinct from asset_record.brand_id
             and folder.status = 'active'
       ) then
        raise exception
            'Pasta ativa não encontrada no mesmo contexto.';
    end if;

    update public.media_assets
    set
        folder_id = target_folder_id,
        display_name = trim(display_name_value),
        alt_text = nullif(trim(alt_text_value), ''),
        caption = nullif(trim(caption_value), '')
    where id = target_asset_id
    returning *
    into asset_record;

    return asset_record;
end;
$$;


ALTER FUNCTION "public"."update_media_asset_metadata"("target_asset_id" "uuid", "target_folder_id" "uuid", "display_name_value" "text", "alt_text_value" "text", "caption_value" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."account_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "social_account_id" "uuid" NOT NULL,
    "metric_date" "date" NOT NULL,
    "followers" bigint DEFAULT 0 NOT NULL,
    "following" bigint DEFAULT 0 NOT NULL,
    "posts_count" bigint DEFAULT 0 NOT NULL,
    "impressions" bigint DEFAULT 0 NOT NULL,
    "reach" bigint DEFAULT 0 NOT NULL,
    "profile_views" bigint DEFAULT 0 NOT NULL,
    "website_clicks" bigint DEFAULT 0 NOT NULL,
    "engagements" bigint DEFAULT 0 NOT NULL,
    "engagement_rate" numeric(12,4) GENERATED ALWAYS AS (
CASE
    WHEN ("reach" = 0) THEN (0)::numeric
    ELSE "round"(((("engagements")::numeric * (100)::numeric) / ("reach")::numeric), 4)
END) STORED,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "account_metrics_engagements_check" CHECK (("engagements" >= 0)),
    CONSTRAINT "account_metrics_followers_check" CHECK (("followers" >= 0)),
    CONSTRAINT "account_metrics_following_check" CHECK (("following" >= 0)),
    CONSTRAINT "account_metrics_impressions_check" CHECK (("impressions" >= 0)),
    CONSTRAINT "account_metrics_metadata_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "account_metrics_posts_count_check" CHECK (("posts_count" >= 0)),
    CONSTRAINT "account_metrics_profile_views_check" CHECK (("profile_views" >= 0)),
    CONSTRAINT "account_metrics_reach_check" CHECK (("reach" >= 0)),
    CONSTRAINT "account_metrics_website_clicks_check" CHECK (("website_clicks" >= 0))
);


ALTER TABLE "public"."account_metrics" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_account_metrics"("social_account_id_value" "uuid", "metric_date_value" "date", "followers_value" bigint DEFAULT 0, "following_value" bigint DEFAULT 0, "posts_count_value" bigint DEFAULT 0, "impressions_value" bigint DEFAULT 0, "reach_value" bigint DEFAULT 0, "profile_views_value" bigint DEFAULT 0, "website_clicks_value" bigint DEFAULT 0, "engagements_value" bigint DEFAULT 0, "metadata_value" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."account_metrics"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    account_row public.social_accounts%rowtype;
    result_row public.account_metrics%rowtype;
begin
    select *
      into account_row
    from public.social_accounts sa
    where sa.id = social_account_id_value;

    if account_row.id is null then
        raise exception 'Conta social não encontrada.';
    end if;

    if metric_date_value is null then
        raise exception 'A data das métricas é obrigatória.';
    end if;

    if least(
        followers_value,
        following_value,
        posts_count_value,
        impressions_value,
        reach_value,
        profile_views_value,
        website_clicks_value,
        engagements_value
    ) < 0 then
        raise exception 'As métricas não podem ser negativas.';
    end if;

    if coalesce(jsonb_typeof(metadata_value), 'null') <> 'object' then
        raise exception 'Metadata deve ser um objeto JSON.';
    end if;

    insert into public.account_metrics (
        workspace_id,
        brand_id,
        social_account_id,
        metric_date,
        followers,
        following,
        posts_count,
        impressions,
        reach,
        profile_views,
        website_clicks,
        engagements,
        metadata
    )
    values (
        account_row.workspace_id,
        account_row.brand_id,
        account_row.id,
        metric_date_value,
        followers_value,
        following_value,
        posts_count_value,
        impressions_value,
        reach_value,
        profile_views_value,
        website_clicks_value,
        engagements_value,
        metadata_value
    )
    on conflict (social_account_id, metric_date)
    do update set
        followers = excluded.followers,
        following = excluded.following,
        posts_count = excluded.posts_count,
        impressions = excluded.impressions,
        reach = excluded.reach,
        profile_views = excluded.profile_views,
        website_clicks = excluded.website_clicks,
        engagements = excluded.engagements,
        metadata = excluded.metadata
    returning * into result_row;

    return result_row;
end;
$$;


ALTER FUNCTION "public"."upsert_account_metrics"("social_account_id_value" "uuid", "metric_date_value" "date", "followers_value" bigint, "following_value" bigint, "posts_count_value" bigint, "impressions_value" bigint, "reach_value" bigint, "profile_views_value" bigint, "website_clicks_value" bigint, "engagements_value" bigint, "metadata_value" "jsonb") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."billing_invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "subscription_id" "uuid",
    "provider" "text" DEFAULT 'manual'::"text" NOT NULL,
    "provider_invoice_id" "text",
    "invoice_number" "text",
    "currency" "text" DEFAULT 'EUR'::"text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "subtotal_cents" bigint DEFAULT 0 NOT NULL,
    "tax_cents" bigint DEFAULT 0 NOT NULL,
    "total_cents" bigint DEFAULT 0 NOT NULL,
    "amount_paid_cents" bigint DEFAULT 0 NOT NULL,
    "amount_due_cents" bigint DEFAULT 0 NOT NULL,
    "issued_at" timestamp with time zone,
    "due_at" timestamp with time zone,
    "paid_at" timestamp with time zone,
    "hosted_invoice_url" "text",
    "invoice_pdf_url" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "billing_invoices_amount_due_cents_check" CHECK (("amount_due_cents" >= 0)),
    CONSTRAINT "billing_invoices_amount_paid_cents_check" CHECK (("amount_paid_cents" >= 0)),
    CONSTRAINT "billing_invoices_amounts_check" CHECK ((("amount_paid_cents" <= "total_cents") AND ("amount_due_cents" <= "total_cents") AND (("amount_paid_cents" + "amount_due_cents") <= "total_cents"))),
    CONSTRAINT "billing_invoices_currency_check" CHECK (("currency" ~ '^[A-Z]{3}$'::"text")),
    CONSTRAINT "billing_invoices_dates_check" CHECK ((("issued_at" IS NULL) OR ("due_at" IS NULL) OR ("due_at" >= "issued_at"))),
    CONSTRAINT "billing_invoices_hosted_url_check" CHECK ((("hosted_invoice_url" IS NULL) OR ("hosted_invoice_url" ~ '^https://'::"text"))),
    CONSTRAINT "billing_invoices_metadata_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "billing_invoices_paid_state_check" CHECK ((("status" <> 'paid'::"text") OR ("paid_at" IS NOT NULL))),
    CONSTRAINT "billing_invoices_pdf_url_check" CHECK ((("invoice_pdf_url" IS NULL) OR ("invoice_pdf_url" ~ '^https://'::"text"))),
    CONSTRAINT "billing_invoices_provider_check" CHECK (("provider" = ANY (ARRAY['manual'::"text", 'stripe'::"text"]))),
    CONSTRAINT "billing_invoices_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'open'::"text", 'paid'::"text", 'void'::"text", 'uncollectible'::"text"]))),
    CONSTRAINT "billing_invoices_subtotal_cents_check" CHECK (("subtotal_cents" >= 0)),
    CONSTRAINT "billing_invoices_tax_cents_check" CHECK (("tax_cents" >= 0)),
    CONSTRAINT "billing_invoices_total_cents_check" CHECK (("total_cents" >= 0))
);


ALTER TABLE "public"."billing_invoices" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_billing_invoice"("workspace_id_value" "uuid", "provider_value" "text", "status_value" "text", "currency_value" "text", "subtotal_cents_value" bigint, "tax_cents_value" bigint, "total_cents_value" bigint, "amount_paid_cents_value" bigint, "amount_due_cents_value" bigint, "subscription_id_value" "uuid" DEFAULT NULL::"uuid", "provider_invoice_id_value" "text" DEFAULT NULL::"text", "invoice_number_value" "text" DEFAULT NULL::"text", "issued_at_value" timestamp with time zone DEFAULT NULL::timestamp with time zone, "due_at_value" timestamp with time zone DEFAULT NULL::timestamp with time zone, "paid_at_value" timestamp with time zone DEFAULT NULL::timestamp with time zone, "hosted_invoice_url_value" "text" DEFAULT NULL::"text", "invoice_pdf_url_value" "text" DEFAULT NULL::"text", "metadata_value" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."billing_invoices"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    result_row public.billing_invoices%rowtype;
begin
    if workspace_id_value is null then
        raise exception 'O workspace é obrigatório.';
    end if;

    if provider_invoice_id_value is null then
        insert into public.billing_invoices (
            workspace_id,
            subscription_id,
            provider,
            provider_invoice_id,
            invoice_number,
            currency,
            status,
            subtotal_cents,
            tax_cents,
            total_cents,
            amount_paid_cents,
            amount_due_cents,
            issued_at,
            due_at,
            paid_at,
            hosted_invoice_url,
            invoice_pdf_url,
            metadata
        )
        values (
            workspace_id_value,
            subscription_id_value,
            provider_value,
            null,
            invoice_number_value,
            currency_value,
            status_value,
            subtotal_cents_value,
            tax_cents_value,
            total_cents_value,
            amount_paid_cents_value,
            amount_due_cents_value,
            issued_at_value,
            due_at_value,
            paid_at_value,
            hosted_invoice_url_value,
            invoice_pdf_url_value,
            metadata_value
        )
        returning *
        into result_row;
    else
        insert into public.billing_invoices (
            workspace_id,
            subscription_id,
            provider,
            provider_invoice_id,
            invoice_number,
            currency,
            status,
            subtotal_cents,
            tax_cents,
            total_cents,
            amount_paid_cents,
            amount_due_cents,
            issued_at,
            due_at,
            paid_at,
            hosted_invoice_url,
            invoice_pdf_url,
            metadata
        )
        values (
            workspace_id_value,
            subscription_id_value,
            provider_value,
            provider_invoice_id_value,
            invoice_number_value,
            currency_value,
            status_value,
            subtotal_cents_value,
            tax_cents_value,
            total_cents_value,
            amount_paid_cents_value,
            amount_due_cents_value,
            issued_at_value,
            due_at_value,
            paid_at_value,
            hosted_invoice_url_value,
            invoice_pdf_url_value,
            metadata_value
        )
        on conflict (
            provider,
            provider_invoice_id
        )
        where provider_invoice_id is not null
        do update set
            workspace_id = excluded.workspace_id,
            subscription_id = excluded.subscription_id,
            invoice_number = excluded.invoice_number,
            currency = excluded.currency,
            status = excluded.status,
            subtotal_cents = excluded.subtotal_cents,
            tax_cents = excluded.tax_cents,
            total_cents = excluded.total_cents,
            amount_paid_cents = excluded.amount_paid_cents,
            amount_due_cents = excluded.amount_due_cents,
            issued_at = excluded.issued_at,
            due_at = excluded.due_at,
            paid_at = excluded.paid_at,
            hosted_invoice_url = excluded.hosted_invoice_url,
            invoice_pdf_url = excluded.invoice_pdf_url,
            metadata = excluded.metadata
        returning *
        into result_row;
    end if;

    return result_row;
end;
$$;


ALTER FUNCTION "public"."upsert_billing_invoice"("workspace_id_value" "uuid", "provider_value" "text", "status_value" "text", "currency_value" "text", "subtotal_cents_value" bigint, "tax_cents_value" bigint, "total_cents_value" bigint, "amount_paid_cents_value" bigint, "amount_due_cents_value" bigint, "subscription_id_value" "uuid", "provider_invoice_id_value" "text", "invoice_number_value" "text", "issued_at_value" timestamp with time zone, "due_at_value" timestamp with time zone, "paid_at_value" timestamp with time zone, "hosted_invoice_url_value" "text", "invoice_pdf_url_value" "text", "metadata_value" "jsonb") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "brand_id" "uuid" NOT NULL,
    "content_id" "uuid" NOT NULL,
    "content_version_id" "uuid" NOT NULL,
    "social_account_id" "uuid" NOT NULL,
    "metric_date" "date" NOT NULL,
    "impressions" bigint DEFAULT 0 NOT NULL,
    "reach" bigint DEFAULT 0 NOT NULL,
    "views" bigint DEFAULT 0 NOT NULL,
    "likes" bigint DEFAULT 0 NOT NULL,
    "comments" bigint DEFAULT 0 NOT NULL,
    "shares" bigint DEFAULT 0 NOT NULL,
    "saves" bigint DEFAULT 0 NOT NULL,
    "clicks" bigint DEFAULT 0 NOT NULL,
    "watch_time_seconds" numeric(16,2) DEFAULT 0 NOT NULL,
    "engagements" bigint GENERATED ALWAYS AS (((("likes" + "comments") + "shares") + "saves")) STORED,
    "engagement_rate" numeric(12,4) GENERATED ALWAYS AS (
CASE
    WHEN ("reach" = 0) THEN (0)::numeric
    ELSE "round"((((((("likes" + "comments") + "shares") + "saves"))::numeric * (100)::numeric) / ("reach")::numeric), 4)
END) STORED,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "content_metrics_clicks_check" CHECK (("clicks" >= 0)),
    CONSTRAINT "content_metrics_comments_check" CHECK (("comments" >= 0)),
    CONSTRAINT "content_metrics_impressions_check" CHECK (("impressions" >= 0)),
    CONSTRAINT "content_metrics_likes_check" CHECK (("likes" >= 0)),
    CONSTRAINT "content_metrics_metadata_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "content_metrics_reach_check" CHECK (("reach" >= 0)),
    CONSTRAINT "content_metrics_saves_check" CHECK (("saves" >= 0)),
    CONSTRAINT "content_metrics_shares_check" CHECK (("shares" >= 0)),
    CONSTRAINT "content_metrics_views_check" CHECK (("views" >= 0)),
    CONSTRAINT "content_metrics_watch_time_seconds_check" CHECK (("watch_time_seconds" >= (0)::numeric))
);


ALTER TABLE "public"."content_metrics" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_content_metrics"("content_version_id_value" "uuid", "social_account_id_value" "uuid", "metric_date_value" "date", "impressions_value" bigint DEFAULT 0, "reach_value" bigint DEFAULT 0, "views_value" bigint DEFAULT 0, "likes_value" bigint DEFAULT 0, "comments_value" bigint DEFAULT 0, "shares_value" bigint DEFAULT 0, "saves_value" bigint DEFAULT 0, "clicks_value" bigint DEFAULT 0, "watch_time_seconds_value" numeric DEFAULT 0, "metadata_value" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."content_metrics"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    version_workspace_id uuid;
    version_brand_id uuid;
    version_content_id uuid;
    account_row public.social_accounts%rowtype;
    result_row public.content_metrics%rowtype;
begin
    select c.workspace_id, c.brand_id, c.id
      into version_workspace_id, version_brand_id, version_content_id
    from public.content_versions cv
    join public.contents c
      on c.id = cv.content_id
    where cv.id = content_version_id_value;

    if version_content_id is null then
        raise exception 'Versão de conteúdo não encontrada.';
    end if;

    select *
      into account_row
    from public.social_accounts sa
    where sa.id = social_account_id_value;

    if account_row.id is null then
        raise exception 'Conta social não encontrada.';
    end if;

    if account_row.workspace_id <> version_workspace_id
       or account_row.brand_id <> version_brand_id then
        raise exception 'A conta social e a versão do conteúdo não pertencem ao mesmo escopo.';
    end if;

    if metric_date_value is null then
        raise exception 'A data das métricas é obrigatória.';
    end if;

    if least(
        impressions_value,
        reach_value,
        views_value,
        likes_value,
        comments_value,
        shares_value,
        saves_value,
        clicks_value
    ) < 0 or watch_time_seconds_value < 0 then
        raise exception 'As métricas não podem ser negativas.';
    end if;

    if coalesce(jsonb_typeof(metadata_value), 'null') <> 'object' then
        raise exception 'Metadata deve ser um objeto JSON.';
    end if;

    insert into public.content_metrics (
        workspace_id,
        brand_id,
        content_id,
        content_version_id,
        social_account_id,
        metric_date,
        impressions,
        reach,
        views,
        likes,
        comments,
        shares,
        saves,
        clicks,
        watch_time_seconds,
        metadata
    )
    values (
        version_workspace_id,
        version_brand_id,
        version_content_id,
        content_version_id_value,
        account_row.id,
        metric_date_value,
        impressions_value,
        reach_value,
        views_value,
        likes_value,
        comments_value,
        shares_value,
        saves_value,
        clicks_value,
        watch_time_seconds_value,
        metadata_value
    )
    on conflict (content_version_id, social_account_id, metric_date)
    do update set
        impressions = excluded.impressions,
        reach = excluded.reach,
        views = excluded.views,
        likes = excluded.likes,
        comments = excluded.comments,
        shares = excluded.shares,
        saves = excluded.saves,
        clicks = excluded.clicks,
        watch_time_seconds = excluded.watch_time_seconds,
        metadata = excluded.metadata
    returning * into result_row;

    return result_row;
end;
$$;


ALTER FUNCTION "public"."upsert_content_metrics"("content_version_id_value" "uuid", "social_account_id_value" "uuid", "metric_date_value" "date", "impressions_value" bigint, "reach_value" bigint, "views_value" bigint, "likes_value" bigint, "comments_value" bigint, "shares_value" bigint, "saves_value" bigint, "clicks_value" bigint, "watch_time_seconds_value" numeric, "metadata_value" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_analytics_scope"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    account_workspace_id uuid;
    account_brand_id uuid;
    version_workspace_id uuid;
    version_brand_id uuid;
    version_content_id uuid;
begin
    if not exists (
        select 1
        from public.brands b
        where b.id = new.brand_id
          and b.workspace_id = new.workspace_id
    ) then
        raise exception 'A marca não pertence ao workspace informado.';
    end if;

    select sa.workspace_id, sa.brand_id
      into account_workspace_id, account_brand_id
    from public.social_accounts sa
    where sa.id = new.social_account_id;

    if account_workspace_id is null then
        raise exception 'Conta social não encontrada.';
    end if;

    if account_workspace_id <> new.workspace_id
       or account_brand_id <> new.brand_id then
        raise exception 'A conta social não pertence à marca e ao workspace informados.';
    end if;

    if tg_table_name = 'content_metrics' then
        select c.workspace_id, c.brand_id, c.id
          into version_workspace_id, version_brand_id, version_content_id
        from public.content_versions cv
        join public.contents c
          on c.id = cv.content_id
        where cv.id = new.content_version_id;

        if version_content_id is null then
            raise exception 'Versão de conteúdo não encontrada.';
        end if;

        if version_workspace_id <> new.workspace_id
           or version_brand_id <> new.brand_id then
            raise exception 'A versão do conteúdo não pertence à marca e ao workspace informados.';
        end if;

        new.content_id := version_content_id;
    end if;

    if tg_table_name = 'analytics_sync_runs' then
        new.provider := lower(trim(new.provider));
        new.sync_type := lower(trim(new.sync_type));
        new.status := lower(trim(new.status));
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."validate_analytics_scope"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_audit_log_scope"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    -- Normalização.
    new.action := lower(trim(new.action));

    new.entity_type :=
        nullif(lower(trim(new.entity_type)), '');

    new.description :=
        nullif(trim(new.description), '');

    new.source :=
        lower(trim(new.source));

    new.severity :=
        lower(trim(new.severity));

    new.user_agent :=
        nullif(trim(new.user_agent), '');

    -- O workspace precisa existir.
    if not exists (
        select 1
        from public.workspaces w
        where w.id = new.workspace_id
    ) then
        raise exception 'Workspace não encontrado.';
    end if;

    -- Quando houver ator, ele precisa ser owner
    -- ou membro ativo do workspace.
    if new.actor_user_id is not null then
        if not exists (
            select 1
            from public.workspaces w
            where w.id = new.workspace_id
              and w.owner_id = new.actor_user_id
        )
        and not exists (
            select 1
            from public.workspace_members wm
            where wm.workspace_id = new.workspace_id
              and wm.user_id = new.actor_user_id
              and wm.status = 'active'
        ) then
            raise exception
                'O utilizador responsável pela ação não pertence ao workspace.';
        end if;
    end if;

    -- entity_type e entity_id devem existir juntos.
    if (
        new.entity_type is null
        and new.entity_id is not null
    )
    or (
        new.entity_type is not null
        and new.entity_id is null
    ) then
        raise exception
            'entity_type e entity_id devem ser informados juntos.';
    end if;

    if new.old_data is not null
       and jsonb_typeof(new.old_data) <> 'object' then
        raise exception
            'old_data deve ser um objeto JSON.';
    end if;

    if new.new_data is not null
       and jsonb_typeof(new.new_data) <> 'object' then
        raise exception
            'new_data deve ser um objeto JSON.';
    end if;

    if new.metadata is null
       or jsonb_typeof(new.metadata) <> 'object' then
        raise exception
            'metadata deve ser um objeto JSON.';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."validate_audit_log_scope"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_billing_invoice"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    subscription_workspace_id uuid;
begin
    new.provider := lower(trim(new.provider));
    new.status := lower(trim(new.status));
    new.currency := upper(trim(new.currency));

    new.provider_invoice_id :=
        nullif(trim(new.provider_invoice_id), '');

    new.invoice_number :=
        nullif(trim(new.invoice_number), '');

    new.hosted_invoice_url :=
        nullif(trim(new.hosted_invoice_url), '');

    new.invoice_pdf_url :=
        nullif(trim(new.invoice_pdf_url), '');

    if not exists (
        select 1
        from public.workspaces w
        where w.id = new.workspace_id
    ) then
        raise exception 'Workspace não encontrado.';
    end if;

    if new.subscription_id is not null then
        select ws.workspace_id
          into subscription_workspace_id
        from public.workspace_subscriptions ws
        where ws.id = new.subscription_id;

        if subscription_workspace_id is null then
            raise exception 'Assinatura não encontrada.';
        end if;

        if subscription_workspace_id <> new.workspace_id then
            raise exception
                'A assinatura não pertence ao workspace da fatura.';
        end if;
    end if;

    if new.provider = 'stripe'
       and new.provider_invoice_id is null then
        raise exception
            'Faturas Stripe exigem provider_invoice_id.';
    end if;

    if new.status = 'paid'
       and new.paid_at is null then
        new.paid_at := now();
    end if;

    if new.status <> 'paid' then
        new.paid_at := null;
    end if;

    if new.metadata is null
       or jsonb_typeof(new.metadata) <> 'object' then
        raise exception 'metadata deve ser um objeto JSON.';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."validate_billing_invoice"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_billing_plan"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    new.code := lower(trim(new.code));
    new.name := trim(new.name);
    new.description := nullif(trim(new.description), '');
    new.currency := upper(trim(new.currency));

    if new.limits is null
       or jsonb_typeof(new.limits) <> 'object' then
        raise exception 'limits deve ser um objeto JSON.';
    end if;

    if new.features is null
       or jsonb_typeof(new.features) <> 'object' then
        raise exception 'features deve ser um objeto JSON.';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."validate_billing_plan"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_brand_client_workspace"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
    if new.client_id is not null
       and not exists (
            select 1
            from public.clients c
            where c.id = new.client_id
              and c.workspace_id = new.workspace_id
       ) then
        raise exception
            'A marca e o cliente devem pertencer ao mesmo workspace.';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."validate_brand_client_workspace"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_calendar_event_scope"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    validate_plan_item boolean := false;
    validate_assigned_to boolean := false;
begin
    if not exists (
        select 1
        from public.brands b
        where b.id = new.brand_id
          and b.workspace_id = new.workspace_id
    ) then
        raise exception
            'A marca não pertence ao workspace informado.';
    end if;

    if not exists (
        select 1
        from pg_catalog.pg_timezone_names tz
        where tz.name = new.timezone
    ) then
        raise exception
            'Timezone inválido.';
    end if;

    if tg_op = 'INSERT' then
        validate_plan_item := true;
        validate_assigned_to := true;
    elsif tg_op = 'UPDATE' then
        validate_plan_item :=
            new.plan_item_id is distinct from old.plan_item_id
            or new.workspace_id is distinct from old.workspace_id
            or new.brand_id is distinct from old.brand_id;

        validate_assigned_to :=
            new.assigned_to is distinct from old.assigned_to
            or new.workspace_id is distinct from old.workspace_id;
    end if;

    if (
        new.plan_item_id is not null
        and validate_plan_item
        and not exists (
            select 1
            from public.content_plan_items cpi
            where cpi.id = new.plan_item_id
              and cpi.workspace_id = new.workspace_id
              and cpi.brand_id = new.brand_id
              and cpi.status <> 'archived'
        )
    ) then
        raise exception
            'O item do Planner não pertence ao workspace e à marca informados ou está arquivado.';
    end if;

    if (
        new.assigned_to is not null
        and validate_assigned_to
        and not exists (
            select 1
            from public.workspace_members wm
            where wm.workspace_id = new.workspace_id
              and wm.user_id = new.assigned_to
              and wm.status = 'active'
        )
    ) then
        raise exception
            'O responsável deve ser membro ativo do workspace.';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."validate_calendar_event_scope"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_campaign_content_scope"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
    campaign_workspace_id uuid;
    campaign_brand_id uuid;
    campaign_status text;

    content_workspace_id uuid;
    content_brand_id uuid;
    content_status text;
begin
    select
        c.workspace_id,
        c.brand_id,
        c.status
    into
        campaign_workspace_id,
        campaign_brand_id,
        campaign_status
    from public.campaigns c
    where c.id = new.campaign_id;

    if not found then
        raise exception 'Campanha não encontrada.';
    end if;

    select
        c.workspace_id,
        c.brand_id,
        c.status
    into
        content_workspace_id,
        content_brand_id,
        content_status
    from public.contents c
    where c.id = new.content_id;

    if not found then
        raise exception 'Conteúdo não encontrado.';
    end if;

    if new.workspace_id <> campaign_workspace_id
       or new.workspace_id <> content_workspace_id
    then
        raise exception
            'A campanha e o conteúdo devem pertencer ao mesmo workspace.';
    end if;

    if campaign_brand_id <> content_brand_id then
        raise exception
            'A campanha e o conteúdo devem pertencer à mesma marca.';
    end if;

    if campaign_status = 'archived' then
        raise exception
            'Não é possível adicionar conteúdos a uma campanha arquivada.';
    end if;

    if content_status = 'archived' then
        raise exception
            'Não é possível adicionar um conteúdo arquivado.';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."validate_campaign_content_scope"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_campaign_scope"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
    if not exists (
        select 1
        from public.brands b
        where b.id = new.brand_id
          and b.workspace_id = new.workspace_id
    ) then
        raise exception
            'A marca deve pertencer ao mesmo workspace da campanha.';
    end if;

    if new.client_id is not null
       and not exists (
            select 1
            from public.clients c
            where c.id = new.client_id
              and c.workspace_id = new.workspace_id
       )
    then
        raise exception
            'O cliente deve pertencer ao mesmo workspace da campanha.';
    end if;

    if new.assigned_to is not null
       and not exists (
            select 1
            from public.workspace_members wm
            where wm.workspace_id = new.workspace_id
              and wm.user_id = new.assigned_to
              and wm.status = 'active'
       )
    then
        raise exception
            'O responsável deve ser membro ativo do workspace.';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."validate_campaign_scope"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_content_plan_item_scope"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    if not exists (
        select 1
        from public.brands b
        where b.id = new.brand_id
          and b.workspace_id = new.workspace_id
    ) then
        raise exception
            'A marca não pertence ao workspace informado.';
    end if;

    if (
        new.assigned_to is not null
        and (
            tg_op = 'INSERT'
            or new.assigned_to is distinct from old.assigned_to
        )
        and not exists (
            select 1
            from public.workspace_members wm
            where wm.workspace_id = new.workspace_id
              and wm.user_id = new.assigned_to
              and wm.status = 'active'
        )
    ) then
        raise exception
            'O responsável deve ser membro ativo do workspace.';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."validate_content_plan_item_scope"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_content_scope"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    if not exists (
        select 1
        from public.brands b
        where b.id = new.brand_id
          and b.workspace_id = new.workspace_id
    ) then
        raise exception
            'A marca não pertence ao workspace informado.';
    end if;

    if new.plan_item_id is not null then
        if not exists (
            select 1
            from public.content_plan_items cpi
            where cpi.id = new.plan_item_id
              and cpi.workspace_id = new.workspace_id
              and cpi.brand_id = new.brand_id
              and cpi.status <> 'archived'
        ) then
            raise exception
                'O item do Planner é inválido ou está arquivado.';
        end if;
    end if;

    if new.assigned_to is not null then
        if not exists (
            select 1
            from public.workspace_members wm
            where wm.workspace_id = new.workspace_id
              and wm.user_id = new.assigned_to
              and wm.status = 'active'
        ) then
            raise exception
                'O responsável deve ser membro ativo do workspace.';
        end if;
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."validate_content_scope"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_content_version_asset_scope"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    target_brand_id uuid;
    version_status_value text;
    content_status_value text;
begin
    select
        cv.brand_id,
        cv.status,
        c.status
    into
        target_brand_id,
        version_status_value,
        content_status_value
    from public.content_versions cv
    join public.contents c
      on c.id = cv.content_id
    where cv.id = new.content_version_id
      and cv.workspace_id = new.workspace_id;

    if not found then
        raise exception
            'A versão do conteúdo é inválida.';
    end if;

    if version_status_value = 'archived'
       or content_status_value = 'archived' then
        raise exception
            'Não é possível associar mídia a conteúdo arquivado.';
    end if;

    if not exists (
        select 1
        from public.media_assets ma
        where ma.id = new.media_asset_id
          and ma.workspace_id = new.workspace_id
          and (
              ma.brand_id is null
              or ma.brand_id = target_brand_id
          )
          and ma.status <> 'archived'
    ) then
        raise exception
            'A mídia é inválida, está arquivada ou pertence a outra marca.';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."validate_content_version_asset_scope"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_content_version_scope"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    if not exists (
        select 1
        from public.contents c
        where c.id = new.content_id
          and c.workspace_id = new.workspace_id
          and c.brand_id = new.brand_id
    ) then
        raise exception
            'O conteúdo não pertence ao workspace e à marca informados.';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."validate_content_version_scope"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_notification_scope"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    -- Depois de criada, a notificação é imutável.
    -- Apenas is_read, read_at e updated_at podem ser alterados.
    if tg_op = 'UPDATE' then
        if new.workspace_id is distinct from old.workspace_id
           or new.user_id is distinct from old.user_id
           or new.actor_user_id is distinct from old.actor_user_id
           or new.type is distinct from old.type
           or new.title is distinct from old.title
           or new.message is distinct from old.message
           or new.entity_type is distinct from old.entity_type
           or new.entity_id is distinct from old.entity_id
           or new.action_url is distinct from old.action_url
           or new.metadata is distinct from old.metadata
           or new.created_at is distinct from old.created_at then
            raise exception
                'Somente o estado de leitura da notificação pode ser alterado.';
        end if;

        return new;
    end if;

    -- Normalização dos textos
    new.type := lower(trim(new.type));
    new.title := trim(new.title);
    new.message := trim(new.message);
    new.entity_type := nullif(lower(trim(new.entity_type)), '');
    new.action_url := nullif(trim(new.action_url), '');

    -- Workspace precisa existir
    if not exists (
        select 1
        from public.workspaces w
        where w.id = new.workspace_id
    ) then
        raise exception 'Workspace não encontrado.';
    end if;

    -- O destinatário precisa pertencer ao workspace.
    -- Também permitimos o estado invited para convites internos.
    if not exists (
        select 1
        from public.workspace_members wm
        where wm.workspace_id = new.workspace_id
          and wm.user_id = new.user_id
          and wm.status in ('active', 'invited')
    )
    and not exists (
        select 1
        from public.workspaces w
        where w.id = new.workspace_id
          and w.owner_id = new.user_id
    ) then
        raise exception
            'O destinatário não pertence ao workspace informado.';
    end if;

    -- Quando houver ator, ele precisa ser membro ativo ou owner.
    if new.actor_user_id is not null then
        if not exists (
            select 1
            from public.workspace_members wm
            where wm.workspace_id = new.workspace_id
              and wm.user_id = new.actor_user_id
              and wm.status = 'active'
        )
        and not exists (
            select 1
            from public.workspaces w
            where w.id = new.workspace_id
              and w.owner_id = new.actor_user_id
        ) then
            raise exception
                'O utilizador que originou a ação não pertence ao workspace.';
        end if;
    end if;

    if new.metadata is null
       or jsonb_typeof(new.metadata) <> 'object' then
        raise exception 'Metadata deve ser um objeto JSON.';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."validate_notification_scope"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_workspace_subscription"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    new.provider := lower(trim(new.provider));
    new.status := lower(trim(new.status));
    new.billing_interval := lower(trim(new.billing_interval));

    new.provider_customer_id :=
        nullif(trim(new.provider_customer_id), '');

    new.provider_subscription_id :=
        nullif(trim(new.provider_subscription_id), '');

    if not exists (
        select 1
        from public.workspaces w
        where w.id = new.workspace_id
    ) then
        raise exception 'Workspace não encontrado.';
    end if;

    if not exists (
        select 1
        from public.billing_plans bp
        where bp.id = new.plan_id
    ) then
        raise exception 'Plano não encontrado.';
    end if;

    if new.provider = 'stripe'
       and (
           new.provider_customer_id is null
           or new.provider_subscription_id is null
       ) then
        raise exception
            'Assinaturas Stripe exigem customer_id e subscription_id.';
    end if;

    if new.cancel_at_period_end = true
       and new.current_period_end is null then
        raise exception
            'current_period_end é obrigatório quando o cancelamento está agendado.';
    end if;

    if new.status = 'canceled'
       and new.canceled_at is null then
        new.canceled_at := now();
    end if;

    if new.metadata is null
       or jsonb_typeof(new.metadata) <> 'object' then
        raise exception 'metadata deve ser um objeto JSON.';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."validate_workspace_subscription"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_workspace_usage_monthly"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    if not exists (
        select 1
        from public.workspaces w
        where w.id = new.workspace_id
    ) then
        raise exception 'Workspace não encontrado.';
    end if;

    if extract(day from new.usage_month) <> 1 then
        raise exception
            'usage_month deve representar o primeiro dia do mês.';
    end if;

    if new.usage_month >
       date_trunc('month', current_date)::date then
        raise exception
            'Não é permitido registar utilização num mês futuro.';
    end if;

    if new.metadata is null
       or jsonb_typeof(new.metadata) <> 'object' then
        raise exception 'metadata deve ser um objeto JSON.';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."validate_workspace_usage_monthly"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."billing_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "currency" "text" DEFAULT 'EUR'::"text" NOT NULL,
    "monthly_price_cents" bigint DEFAULT 0 NOT NULL,
    "yearly_price_cents" bigint DEFAULT 0 NOT NULL,
    "limits" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "features" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_public" boolean DEFAULT true NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "billing_plans_code_check" CHECK (((("char_length"(TRIM(BOTH FROM "code")) >= 2) AND ("char_length"(TRIM(BOTH FROM "code")) <= 50)) AND (TRIM(BOTH FROM "code") ~ '^[a-z][a-z0-9_]*$'::"text"))),
    CONSTRAINT "billing_plans_currency_check" CHECK (("currency" ~ '^[A-Z]{3}$'::"text")),
    CONSTRAINT "billing_plans_description_check" CHECK ((("description" IS NULL) OR (("char_length"(TRIM(BOTH FROM "description")) >= 1) AND ("char_length"(TRIM(BOTH FROM "description")) <= 1000)))),
    CONSTRAINT "billing_plans_features_check" CHECK (("jsonb_typeof"("features") = 'object'::"text")),
    CONSTRAINT "billing_plans_limits_check" CHECK (("jsonb_typeof"("limits") = 'object'::"text")),
    CONSTRAINT "billing_plans_monthly_price_cents_check" CHECK (("monthly_price_cents" >= 0)),
    CONSTRAINT "billing_plans_name_check" CHECK ((("char_length"(TRIM(BOTH FROM "name")) >= 2) AND ("char_length"(TRIM(BOTH FROM "name")) <= 100))),
    CONSTRAINT "billing_plans_sort_order_check" CHECK (("sort_order" >= 0)),
    CONSTRAINT "billing_plans_yearly_price_cents_check" CHECK (("yearly_price_cents" >= 0))
);


ALTER TABLE "public"."billing_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "avatar_url" "text",
    "full_name" "text",
    "country" "text",
    "language" "text" DEFAULT 'pt-PT'::"text" NOT NULL,
    "timezone" "text" DEFAULT 'Europe/Lisbon'::"text" NOT NULL,
    "account_status" "text" DEFAULT 'active'::"text" NOT NULL,
    "onboarding_completed" boolean DEFAULT false NOT NULL,
    "last_seen_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_account_status_check" CHECK (("account_status" = ANY (ARRAY['active'::"text", 'suspended'::"text", 'deleted'::"text"]))),
    CONSTRAINT "profiles_country_check" CHECK ((("country" IS NULL) OR ("char_length"("country") = 2)))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'viewer'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "invited_at" timestamp with time zone,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "workspace_members_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'editor'::"text", 'viewer'::"text"]))),
    CONSTRAINT "workspace_members_status_check" CHECK (("status" = ANY (ARRAY['invited'::"text", 'active'::"text", 'suspended'::"text"])))
);


ALTER TABLE "public"."workspace_members" OWNER TO "postgres";


ALTER TABLE ONLY "public"."account_metrics"
    ADD CONSTRAINT "account_metrics_account_date_unique" UNIQUE ("social_account_id", "metric_date");



ALTER TABLE ONLY "public"."account_metrics"
    ADD CONSTRAINT "account_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_sync_runs"
    ADD CONSTRAINT "analytics_sync_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."billing_invoices"
    ADD CONSTRAINT "billing_invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."billing_plans"
    ADD CONSTRAINT "billing_plans_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."billing_plans"
    ADD CONSTRAINT "billing_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_workspace_slug_unique" UNIQUE ("workspace_id", "slug");



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaign_contents"
    ADD CONSTRAINT "campaign_contents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaign_contents"
    ADD CONSTRAINT "campaign_contents_unique_content" UNIQUE ("campaign_id", "content_id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_id_workspace_key" UNIQUE ("id", "workspace_id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_metrics"
    ADD CONSTRAINT "content_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_metrics"
    ADD CONSTRAINT "content_metrics_version_account_date_unique" UNIQUE ("content_version_id", "social_account_id", "metric_date");



ALTER TABLE ONLY "public"."content_plan_items"
    ADD CONSTRAINT "content_plan_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_version_assets"
    ADD CONSTRAINT "content_version_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_version_assets"
    ADD CONSTRAINT "content_version_assets_unique_asset" UNIQUE ("content_version_id", "media_asset_id");



ALTER TABLE ONLY "public"."content_versions"
    ADD CONSTRAINT "content_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contents"
    ADD CONSTRAINT "contents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media_assets"
    ADD CONSTRAINT "media_assets_object_path_key" UNIQUE ("object_path");



ALTER TABLE ONLY "public"."media_assets"
    ADD CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media_assets"
    ADD CONSTRAINT "media_assets_storage_object_id_key" UNIQUE ("storage_object_id");



ALTER TABLE ONLY "public"."media_folders"
    ADD CONSTRAINT "media_folders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."social_accounts"
    ADD CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."social_accounts"
    ADD CONSTRAINT "social_accounts_unique_external_account" UNIQUE ("workspace_id", "platform", "external_account_id");



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_unique_user" UNIQUE ("workspace_id", "user_id");



ALTER TABLE ONLY "public"."workspace_subscriptions"
    ADD CONSTRAINT "workspace_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_usage_monthly"
    ADD CONSTRAINT "workspace_usage_monthly_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_usage_monthly"
    ADD CONSTRAINT "workspace_usage_monthly_unique" UNIQUE ("workspace_id", "usage_month");



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_slug_key" UNIQUE ("slug");



CREATE INDEX "account_metrics_account_date_idx" ON "public"."account_metrics" USING "btree" ("social_account_id", "metric_date" DESC);



CREATE INDEX "account_metrics_brand_date_idx" ON "public"."account_metrics" USING "btree" ("brand_id", "metric_date" DESC);



CREATE INDEX "account_metrics_workspace_date_idx" ON "public"."account_metrics" USING "btree" ("workspace_id", "metric_date" DESC);



CREATE INDEX "analytics_sync_runs_account_started_idx" ON "public"."analytics_sync_runs" USING "btree" ("social_account_id", "started_at" DESC);



CREATE INDEX "analytics_sync_runs_workspace_status_idx" ON "public"."analytics_sync_runs" USING "btree" ("workspace_id", "status", "started_at" DESC);



CREATE INDEX "audit_logs_actor_created_idx" ON "public"."audit_logs" USING "btree" ("actor_user_id", "created_at" DESC) WHERE ("actor_user_id" IS NOT NULL);



CREATE INDEX "audit_logs_entity_created_idx" ON "public"."audit_logs" USING "btree" ("workspace_id", "entity_type", "entity_id", "created_at" DESC) WHERE ("entity_id" IS NOT NULL);



CREATE INDEX "audit_logs_request_id_idx" ON "public"."audit_logs" USING "btree" ("request_id") WHERE ("request_id" IS NOT NULL);



CREATE INDEX "audit_logs_workspace_action_idx" ON "public"."audit_logs" USING "btree" ("workspace_id", "action", "created_at" DESC);



CREATE INDEX "audit_logs_workspace_created_idx" ON "public"."audit_logs" USING "btree" ("workspace_id", "created_at" DESC);



CREATE UNIQUE INDEX "billing_invoices_provider_invoice_unique_idx" ON "public"."billing_invoices" USING "btree" ("provider", "provider_invoice_id") WHERE ("provider_invoice_id" IS NOT NULL);



CREATE INDEX "billing_invoices_subscription_created_idx" ON "public"."billing_invoices" USING "btree" ("subscription_id", "created_at" DESC) WHERE ("subscription_id" IS NOT NULL);



CREATE INDEX "billing_invoices_workspace_created_idx" ON "public"."billing_invoices" USING "btree" ("workspace_id", "created_at" DESC);



CREATE INDEX "billing_invoices_workspace_status_idx" ON "public"."billing_invoices" USING "btree" ("workspace_id", "status", "issued_at" DESC);



CREATE INDEX "billing_plans_active_sort_idx" ON "public"."billing_plans" USING "btree" ("is_active", "is_public", "sort_order");



CREATE INDEX "brands_created_by_idx" ON "public"."brands" USING "btree" ("created_by");



CREATE INDEX "brands_workspace_client_idx" ON "public"."brands" USING "btree" ("workspace_id", "client_id") WHERE ("client_id" IS NOT NULL);



CREATE INDEX "brands_workspace_status_name_idx" ON "public"."brands" USING "btree" ("workspace_id", "status", "name");



CREATE INDEX "calendar_events_assigned_to_idx" ON "public"."calendar_events" USING "btree" ("assigned_to") WHERE ("assigned_to" IS NOT NULL);



CREATE INDEX "calendar_events_brand_id_idx" ON "public"."calendar_events" USING "btree" ("brand_id");



CREATE INDEX "calendar_events_brand_period_idx" ON "public"."calendar_events" USING "btree" ("brand_id", "starts_at") WHERE ("status" <> 'archived'::"text");



CREATE INDEX "calendar_events_created_by_idx" ON "public"."calendar_events" USING "btree" ("created_by");



CREATE INDEX "calendar_events_plan_item_id_idx" ON "public"."calendar_events" USING "btree" ("plan_item_id") WHERE ("plan_item_id" IS NOT NULL);



CREATE INDEX "calendar_events_platform_idx" ON "public"."calendar_events" USING "btree" ("workspace_id", "platform", "starts_at") WHERE (("platform" IS NOT NULL) AND ("status" <> 'archived'::"text"));



CREATE INDEX "calendar_events_status_idx" ON "public"."calendar_events" USING "btree" ("workspace_id", "status");



CREATE INDEX "calendar_events_workspace_id_idx" ON "public"."calendar_events" USING "btree" ("workspace_id");



CREATE INDEX "calendar_events_workspace_period_idx" ON "public"."calendar_events" USING "btree" ("workspace_id", "starts_at", "ends_at") WHERE ("status" <> 'archived'::"text");



CREATE INDEX "campaign_contents_campaign_position_idx" ON "public"."campaign_contents" USING "btree" ("campaign_id", "position");



CREATE INDEX "campaign_contents_content_idx" ON "public"."campaign_contents" USING "btree" ("content_id");



CREATE INDEX "campaign_contents_workspace_idx" ON "public"."campaign_contents" USING "btree" ("workspace_id");



CREATE INDEX "campaigns_assigned_to_idx" ON "public"."campaigns" USING "btree" ("assigned_to") WHERE ("assigned_to" IS NOT NULL);



CREATE INDEX "campaigns_client_idx" ON "public"."campaigns" USING "btree" ("client_id") WHERE ("client_id" IS NOT NULL);



CREATE INDEX "campaigns_dates_idx" ON "public"."campaigns" USING "btree" ("start_date", "end_date");



CREATE INDEX "campaigns_workspace_brand_status_idx" ON "public"."campaigns" USING "btree" ("workspace_id", "brand_id", "status");



CREATE INDEX "campaigns_workspace_status_idx" ON "public"."campaigns" USING "btree" ("workspace_id", "status");



CREATE INDEX "clients_created_by_idx" ON "public"."clients" USING "btree" ("created_by");



CREATE INDEX "clients_workspace_email_idx" ON "public"."clients" USING "btree" ("workspace_id", "email") WHERE ("email" IS NOT NULL);



CREATE INDEX "clients_workspace_status_name_idx" ON "public"."clients" USING "btree" ("workspace_id", "status", "name");



CREATE INDEX "content_metrics_account_date_idx" ON "public"."content_metrics" USING "btree" ("social_account_id", "metric_date" DESC);



CREATE INDEX "content_metrics_brand_date_idx" ON "public"."content_metrics" USING "btree" ("brand_id", "metric_date" DESC);



CREATE INDEX "content_metrics_content_date_idx" ON "public"."content_metrics" USING "btree" ("content_id", "metric_date" DESC);



CREATE INDEX "content_metrics_version_date_idx" ON "public"."content_metrics" USING "btree" ("content_version_id", "metric_date" DESC);



CREATE INDEX "content_metrics_workspace_date_idx" ON "public"."content_metrics" USING "btree" ("workspace_id", "metric_date" DESC);



CREATE INDEX "content_plan_items_assigned_to_idx" ON "public"."content_plan_items" USING "btree" ("assigned_to") WHERE ("assigned_to" IS NOT NULL);



CREATE INDEX "content_plan_items_brand_id_idx" ON "public"."content_plan_items" USING "btree" ("brand_id");



CREATE INDEX "content_plan_items_created_by_idx" ON "public"."content_plan_items" USING "btree" ("created_by");



CREATE INDEX "content_plan_items_due_date_idx" ON "public"."content_plan_items" USING "btree" ("workspace_id", "due_date") WHERE (("due_date" IS NOT NULL) AND ("status" <> ALL (ARRAY['archived'::"text", 'converted'::"text"])));



CREATE INDEX "content_plan_items_kanban_idx" ON "public"."content_plan_items" USING "btree" ("workspace_id", "brand_id", "status", "position") WHERE ("status" <> 'archived'::"text");



CREATE INDEX "content_plan_items_platforms_idx" ON "public"."content_plan_items" USING "gin" ("target_platforms");



CREATE INDEX "content_plan_items_workspace_id_idx" ON "public"."content_plan_items" USING "btree" ("workspace_id");



CREATE INDEX "idx_content_version_assets_media" ON "public"."content_version_assets" USING "btree" ("media_asset_id");



CREATE INDEX "idx_content_version_assets_position" ON "public"."content_version_assets" USING "btree" ("content_version_id", "position");



CREATE INDEX "idx_content_version_assets_version" ON "public"."content_version_assets" USING "btree" ("content_version_id");



CREATE INDEX "idx_content_version_assets_workspace" ON "public"."content_version_assets" USING "btree" ("workspace_id");



CREATE INDEX "idx_content_versions_brand" ON "public"."content_versions" USING "btree" ("brand_id");



CREATE INDEX "idx_content_versions_content" ON "public"."content_versions" USING "btree" ("content_id");



CREATE INDEX "idx_content_versions_platform" ON "public"."content_versions" USING "btree" ("workspace_id", "platform");



CREATE INDEX "idx_content_versions_status" ON "public"."content_versions" USING "btree" ("content_id", "status");



CREATE INDEX "idx_content_versions_workspace" ON "public"."content_versions" USING "btree" ("workspace_id");



CREATE INDEX "idx_contents_assigned_to" ON "public"."contents" USING "btree" ("assigned_to");



CREATE INDEX "idx_contents_brand" ON "public"."contents" USING "btree" ("brand_id");



CREATE INDEX "idx_contents_created_at" ON "public"."contents" USING "btree" ("workspace_id", "created_at" DESC);



CREATE INDEX "idx_contents_created_by" ON "public"."contents" USING "btree" ("created_by");



CREATE INDEX "idx_contents_status" ON "public"."contents" USING "btree" ("workspace_id", "status");



CREATE INDEX "idx_contents_type" ON "public"."contents" USING "btree" ("workspace_id", "content_type");



CREATE INDEX "idx_contents_workspace" ON "public"."contents" USING "btree" ("workspace_id");



CREATE INDEX "media_assets_brand_idx" ON "public"."media_assets" USING "btree" ("brand_id");



CREATE INDEX "media_assets_brand_status_idx" ON "public"."media_assets" USING "btree" ("brand_id", "status");



CREATE INDEX "media_assets_checksum_idx" ON "public"."media_assets" USING "btree" ("checksum_sha256") WHERE ("checksum_sha256" IS NOT NULL);



CREATE INDEX "media_assets_folder_idx" ON "public"."media_assets" USING "btree" ("folder_id");



CREATE INDEX "media_assets_media_type_idx" ON "public"."media_assets" USING "btree" ("media_type");



CREATE INDEX "media_assets_uploaded_by_idx" ON "public"."media_assets" USING "btree" ("uploaded_by");



CREATE INDEX "media_assets_workspace_idx" ON "public"."media_assets" USING "btree" ("workspace_id");



CREATE INDEX "media_assets_workspace_status_idx" ON "public"."media_assets" USING "btree" ("workspace_id", "status");



CREATE UNIQUE INDEX "media_folders_active_name_unique_idx" ON "public"."media_folders" USING "btree" ("workspace_id", COALESCE("brand_id", '00000000-0000-0000-0000-000000000000'::"uuid"), COALESCE("parent_id", '00000000-0000-0000-0000-000000000000'::"uuid"), "lower"(TRIM(BOTH FROM "name"))) WHERE ("status" = 'active'::"text");



CREATE INDEX "media_folders_brand_idx" ON "public"."media_folders" USING "btree" ("brand_id");



CREATE INDEX "media_folders_parent_idx" ON "public"."media_folders" USING "btree" ("parent_id");



CREATE INDEX "media_folders_status_idx" ON "public"."media_folders" USING "btree" ("workspace_id", "status");



CREATE INDEX "media_folders_workspace_idx" ON "public"."media_folders" USING "btree" ("workspace_id");



CREATE INDEX "notifications_entity_idx" ON "public"."notifications" USING "btree" ("entity_type", "entity_id") WHERE ("entity_id" IS NOT NULL);



CREATE INDEX "notifications_user_created_idx" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "notifications_user_unread_idx" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC) WHERE ("is_read" = false);



CREATE INDEX "notifications_workspace_created_idx" ON "public"."notifications" USING "btree" ("workspace_id", "created_at" DESC);



CREATE INDEX "social_accounts_brand_idx" ON "public"."social_accounts" USING "btree" ("brand_id");



CREATE INDEX "social_accounts_brand_status_idx" ON "public"."social_accounts" USING "btree" ("brand_id", "status");



CREATE INDEX "social_accounts_connected_by_idx" ON "public"."social_accounts" USING "btree" ("connected_by");



CREATE INDEX "social_accounts_platform_idx" ON "public"."social_accounts" USING "btree" ("platform");



CREATE INDEX "social_accounts_workspace_idx" ON "public"."social_accounts" USING "btree" ("workspace_id");



CREATE INDEX "social_accounts_workspace_status_idx" ON "public"."social_accounts" USING "btree" ("workspace_id", "status");



CREATE UNIQUE INDEX "uq_active_content_version_platform" ON "public"."content_versions" USING "btree" ("content_id", "platform") WHERE ("status" <> 'archived'::"text");



CREATE UNIQUE INDEX "uq_content_version_primary_asset" ON "public"."content_version_assets" USING "btree" ("content_version_id") WHERE ("usage_type" = 'primary'::"text");



CREATE UNIQUE INDEX "uq_contents_plan_item" ON "public"."contents" USING "btree" ("plan_item_id") WHERE ("plan_item_id" IS NOT NULL);



CREATE INDEX "workspace_members_active_lookup_idx" ON "public"."workspace_members" USING "btree" ("workspace_id", "user_id") WHERE ("status" = 'active'::"text");



CREATE INDEX "workspace_members_user_id_idx" ON "public"."workspace_members" USING "btree" ("user_id");



CREATE INDEX "workspace_members_workspace_id_idx" ON "public"."workspace_members" USING "btree" ("workspace_id");



CREATE UNIQUE INDEX "workspace_subscriptions_one_current_idx" ON "public"."workspace_subscriptions" USING "btree" ("workspace_id") WHERE ("is_current" = true);



CREATE UNIQUE INDEX "workspace_subscriptions_provider_subscription_unique_idx" ON "public"."workspace_subscriptions" USING "btree" ("provider", "provider_subscription_id") WHERE ("provider_subscription_id" IS NOT NULL);



CREATE INDEX "workspace_subscriptions_workspace_created_idx" ON "public"."workspace_subscriptions" USING "btree" ("workspace_id", "created_at" DESC);



CREATE INDEX "workspace_usage_monthly_workspace_month_idx" ON "public"."workspace_usage_monthly" USING "btree" ("workspace_id", "usage_month" DESC);



CREATE INDEX "workspaces_owner_id_idx" ON "public"."workspaces" USING "btree" ("owner_id");



CREATE OR REPLACE TRIGGER "billing_invoices_10_validate" BEFORE INSERT OR UPDATE ON "public"."billing_invoices" FOR EACH ROW EXECUTE FUNCTION "public"."validate_billing_invoice"();



CREATE OR REPLACE TRIGGER "billing_invoices_90_updated_at" BEFORE UPDATE ON "public"."billing_invoices" FOR EACH ROW EXECUTE FUNCTION "public"."set_billing_updated_at"();



CREATE OR REPLACE TRIGGER "billing_plans_10_validate" BEFORE INSERT OR UPDATE ON "public"."billing_plans" FOR EACH ROW EXECUTE FUNCTION "public"."validate_billing_plan"();



CREATE OR REPLACE TRIGGER "billing_plans_90_updated_at" BEFORE UPDATE ON "public"."billing_plans" FOR EACH ROW EXECUTE FUNCTION "public"."set_billing_updated_at"();



CREATE OR REPLACE TRIGGER "cleanup_social_account_secrets" BEFORE DELETE ON "public"."social_accounts" FOR EACH ROW EXECUTE FUNCTION "private"."cleanup_social_account_secrets"();



CREATE OR REPLACE TRIGGER "create_default_workspace_subscription_trigger" AFTER INSERT ON "public"."workspaces" FOR EACH ROW EXECUTE FUNCTION "public"."create_default_workspace_subscription"();



CREATE OR REPLACE TRIGGER "normalize_clients_fields" BEFORE INSERT OR UPDATE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."normalize_client_fields"();



CREATE OR REPLACE TRIGGER "set_account_metrics_updated_at" BEFORE UPDATE ON "public"."account_metrics" FOR EACH ROW EXECUTE FUNCTION "public"."set_analytics_updated_at"();



CREATE OR REPLACE TRIGGER "set_analytics_sync_runs_updated_at" BEFORE UPDATE ON "public"."analytics_sync_runs" FOR EACH ROW EXECUTE FUNCTION "public"."set_analytics_updated_at"();



CREATE OR REPLACE TRIGGER "set_brands_updated_at" BEFORE UPDATE ON "public"."brands" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_calendar_events_updated_at" BEFORE UPDATE ON "public"."calendar_events" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_campaigns_updated_at" BEFORE UPDATE ON "public"."campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_clients_updated_at" BEFORE UPDATE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_content_metrics_updated_at" BEFORE UPDATE ON "public"."content_metrics" FOR EACH ROW EXECUTE FUNCTION "public"."set_analytics_updated_at"();



CREATE OR REPLACE TRIGGER "set_content_plan_items_updated_at" BEFORE UPDATE ON "public"."content_plan_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_content_versions_updated_at" BEFORE UPDATE ON "public"."content_versions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_contents_updated_at" BEFORE UPDATE ON "public"."contents" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_media_assets_updated_at" BEFORE UPDATE ON "public"."media_assets" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_media_folders_updated_at" BEFORE UPDATE ON "public"."media_folders" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_notifications_updated_at_trigger" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."set_notifications_updated_at"();



CREATE OR REPLACE TRIGGER "set_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_social_accounts_updated_at" BEFORE UPDATE ON "public"."social_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_workspace_members_updated_at" BEFORE UPDATE ON "public"."workspace_members" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_workspaces_updated_at" BEFORE UPDATE ON "public"."workspaces" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "sync_notification_read_state_trigger" BEFORE INSERT OR UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."sync_notification_read_state"();



CREATE OR REPLACE TRIGGER "trg_sync_content_platforms_from_plan_item" BEFORE INSERT OR UPDATE OF "plan_item_id", "target_platforms" ON "public"."contents" FOR EACH ROW EXECUTE FUNCTION "public"."sync_content_platforms_from_plan_item"();



CREATE OR REPLACE TRIGGER "validate_account_metrics_scope" BEFORE INSERT OR UPDATE ON "public"."account_metrics" FOR EACH ROW EXECUTE FUNCTION "public"."validate_analytics_scope"();



CREATE OR REPLACE TRIGGER "validate_analytics_sync_runs_scope" BEFORE INSERT OR UPDATE ON "public"."analytics_sync_runs" FOR EACH ROW EXECUTE FUNCTION "public"."validate_analytics_scope"();



CREATE OR REPLACE TRIGGER "validate_audit_log_scope_trigger" BEFORE INSERT ON "public"."audit_logs" FOR EACH ROW EXECUTE FUNCTION "public"."validate_audit_log_scope"();



CREATE OR REPLACE TRIGGER "validate_brand_client_workspace_insert" BEFORE INSERT ON "public"."brands" FOR EACH ROW EXECUTE FUNCTION "public"."validate_brand_client_workspace"();



CREATE OR REPLACE TRIGGER "validate_brand_client_workspace_update" BEFORE UPDATE OF "workspace_id", "client_id" ON "public"."brands" FOR EACH ROW EXECUTE FUNCTION "public"."validate_brand_client_workspace"();



CREATE OR REPLACE TRIGGER "validate_calendar_event_scope_trigger" BEFORE INSERT OR UPDATE ON "public"."calendar_events" FOR EACH ROW EXECUTE FUNCTION "public"."validate_calendar_event_scope"();



CREATE OR REPLACE TRIGGER "validate_campaign_content_scope_trigger" BEFORE INSERT OR UPDATE OF "workspace_id", "campaign_id", "content_id" ON "public"."campaign_contents" FOR EACH ROW EXECUTE FUNCTION "public"."validate_campaign_content_scope"();



CREATE OR REPLACE TRIGGER "validate_campaign_scope_trigger" BEFORE INSERT OR UPDATE OF "workspace_id", "brand_id", "client_id", "assigned_to" ON "public"."campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."validate_campaign_scope"();



CREATE OR REPLACE TRIGGER "validate_content_metrics_scope" BEFORE INSERT OR UPDATE ON "public"."content_metrics" FOR EACH ROW EXECUTE FUNCTION "public"."validate_analytics_scope"();



CREATE OR REPLACE TRIGGER "validate_content_plan_item_scope_trigger" BEFORE INSERT OR UPDATE ON "public"."content_plan_items" FOR EACH ROW EXECUTE FUNCTION "public"."validate_content_plan_item_scope"();



CREATE OR REPLACE TRIGGER "validate_content_version_assets_scope" BEFORE INSERT OR UPDATE ON "public"."content_version_assets" FOR EACH ROW EXECUTE FUNCTION "public"."validate_content_version_asset_scope"();



CREATE OR REPLACE TRIGGER "validate_content_versions_scope" BEFORE INSERT OR UPDATE ON "public"."content_versions" FOR EACH ROW EXECUTE FUNCTION "public"."validate_content_version_scope"();



CREATE OR REPLACE TRIGGER "validate_contents_scope" BEFORE INSERT OR UPDATE ON "public"."contents" FOR EACH ROW EXECUTE FUNCTION "public"."validate_content_scope"();



CREATE OR REPLACE TRIGGER "validate_media_asset_scope" BEFORE INSERT OR UPDATE OF "workspace_id", "brand_id", "folder_id", "object_path" ON "public"."media_assets" FOR EACH ROW EXECUTE FUNCTION "private"."validate_media_asset_scope"();



CREATE OR REPLACE TRIGGER "validate_media_folder_scope" BEFORE INSERT OR UPDATE OF "workspace_id", "brand_id", "parent_id" ON "public"."media_folders" FOR EACH ROW EXECUTE FUNCTION "private"."validate_media_folder_scope"();



CREATE OR REPLACE TRIGGER "validate_notification_scope_trigger" BEFORE INSERT OR UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."validate_notification_scope"();



CREATE OR REPLACE TRIGGER "validate_social_account_scope" BEFORE INSERT OR UPDATE OF "workspace_id", "brand_id" ON "public"."social_accounts" FOR EACH ROW EXECUTE FUNCTION "private"."validate_social_account_scope"();



CREATE OR REPLACE TRIGGER "workspace_subscriptions_10_validate" BEFORE INSERT OR UPDATE ON "public"."workspace_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."validate_workspace_subscription"();



CREATE OR REPLACE TRIGGER "workspace_subscriptions_90_updated_at" BEFORE UPDATE ON "public"."workspace_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."set_billing_updated_at"();



CREATE OR REPLACE TRIGGER "workspace_usage_monthly_10_validate" BEFORE INSERT OR UPDATE ON "public"."workspace_usage_monthly" FOR EACH ROW EXECUTE FUNCTION "public"."validate_workspace_usage_monthly"();



CREATE OR REPLACE TRIGGER "workspace_usage_monthly_90_updated_at" BEFORE UPDATE ON "public"."workspace_usage_monthly" FOR EACH ROW EXECUTE FUNCTION "public"."set_billing_updated_at"();



ALTER TABLE ONLY "public"."account_metrics"
    ADD CONSTRAINT "account_metrics_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."account_metrics"
    ADD CONSTRAINT "account_metrics_social_account_id_fkey" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."account_metrics"
    ADD CONSTRAINT "account_metrics_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytics_sync_runs"
    ADD CONSTRAINT "analytics_sync_runs_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytics_sync_runs"
    ADD CONSTRAINT "analytics_sync_runs_social_account_id_fkey" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytics_sync_runs"
    ADD CONSTRAINT "analytics_sync_runs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."billing_invoices"
    ADD CONSTRAINT "billing_invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."workspace_subscriptions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."billing_invoices"
    ADD CONSTRAINT "billing_invoices_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_plan_item_id_fkey" FOREIGN KEY ("plan_item_id") REFERENCES "public"."content_plan_items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_contents"
    ADD CONSTRAINT "campaign_contents_campaign_scope_fkey" FOREIGN KEY ("campaign_id", "workspace_id") REFERENCES "public"."campaigns"("id", "workspace_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_contents"
    ADD CONSTRAINT "campaign_contents_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_contents"
    ADD CONSTRAINT "campaign_contents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."campaign_contents"
    ADD CONSTRAINT "campaign_contents_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_metrics"
    ADD CONSTRAINT "content_metrics_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_metrics"
    ADD CONSTRAINT "content_metrics_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_metrics"
    ADD CONSTRAINT "content_metrics_content_version_id_fkey" FOREIGN KEY ("content_version_id") REFERENCES "public"."content_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_metrics"
    ADD CONSTRAINT "content_metrics_social_account_id_fkey" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_metrics"
    ADD CONSTRAINT "content_metrics_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_plan_items"
    ADD CONSTRAINT "content_plan_items_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."content_plan_items"
    ADD CONSTRAINT "content_plan_items_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_plan_items"
    ADD CONSTRAINT "content_plan_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."content_plan_items"
    ADD CONSTRAINT "content_plan_items_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_version_assets"
    ADD CONSTRAINT "content_version_assets_content_version_id_fkey" FOREIGN KEY ("content_version_id") REFERENCES "public"."content_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_version_assets"
    ADD CONSTRAINT "content_version_assets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."content_version_assets"
    ADD CONSTRAINT "content_version_assets_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."content_version_assets"
    ADD CONSTRAINT "content_version_assets_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_versions"
    ADD CONSTRAINT "content_versions_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."content_versions"
    ADD CONSTRAINT "content_versions_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_versions"
    ADD CONSTRAINT "content_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."content_versions"
    ADD CONSTRAINT "content_versions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contents"
    ADD CONSTRAINT "contents_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contents"
    ADD CONSTRAINT "contents_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."contents"
    ADD CONSTRAINT "contents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contents"
    ADD CONSTRAINT "contents_plan_item_id_fkey" FOREIGN KEY ("plan_item_id") REFERENCES "public"."content_plan_items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contents"
    ADD CONSTRAINT "contents_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."media_assets"
    ADD CONSTRAINT "media_assets_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."media_assets"
    ADD CONSTRAINT "media_assets_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."media_folders"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."media_assets"
    ADD CONSTRAINT "media_assets_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."media_assets"
    ADD CONSTRAINT "media_assets_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."media_folders"
    ADD CONSTRAINT "media_folders_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."media_folders"
    ADD CONSTRAINT "media_folders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."media_folders"
    ADD CONSTRAINT "media_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."media_folders"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."media_folders"
    ADD CONSTRAINT "media_folders_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."social_accounts"
    ADD CONSTRAINT "social_accounts_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."social_accounts"
    ADD CONSTRAINT "social_accounts_connected_by_fkey" FOREIGN KEY ("connected_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."social_accounts"
    ADD CONSTRAINT "social_accounts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_subscriptions"
    ADD CONSTRAINT "workspace_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."billing_plans"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."workspace_subscriptions"
    ADD CONSTRAINT "workspace_subscriptions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_usage_monthly"
    ADD CONSTRAINT "workspace_usage_monthly_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



CREATE POLICY "Members can view brands" ON "public"."brands" FOR SELECT TO "authenticated" USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Members can view calendar events" ON "public"."calendar_events" FOR SELECT TO "authenticated" USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Members can view clients" ON "public"."clients" FOR SELECT TO "authenticated" USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Members can view content plan items" ON "public"."content_plan_items" FOR SELECT TO "authenticated" USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Members can view content version assets" ON "public"."content_version_assets" FOR SELECT TO "authenticated" USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Members can view content versions" ON "public"."content_versions" FOR SELECT TO "authenticated" USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Members can view contents" ON "public"."contents" FOR SELECT TO "authenticated" USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Members can view media assets" ON "public"."media_assets" FOR SELECT TO "authenticated" USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Members can view media folders" ON "public"."media_folders" FOR SELECT TO "authenticated" USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Members can view social accounts" ON "public"."social_accounts" FOR SELECT TO "authenticated" USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Members can view workspace members" ON "public"."workspace_members" FOR SELECT TO "authenticated" USING ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "Members can view workspaces" ON "public"."workspaces" FOR SELECT TO "authenticated" USING ("public"."is_workspace_member"("id"));



CREATE POLICY "Owners admins editors can update brands" ON "public"."brands" FOR UPDATE TO "authenticated" USING ("public"."has_workspace_role"("workspace_id", ARRAY['owner'::"text", 'admin'::"text", 'editor'::"text"])) WITH CHECK ("public"."has_workspace_role"("workspace_id", ARRAY['owner'::"text", 'admin'::"text", 'editor'::"text"]));



CREATE POLICY "Owners admins editors can update clients" ON "public"."clients" FOR UPDATE TO "authenticated" USING ("public"."has_workspace_role"("workspace_id", ARRAY['owner'::"text", 'admin'::"text", 'editor'::"text"])) WITH CHECK ("public"."has_workspace_role"("workspace_id", ARRAY['owner'::"text", 'admin'::"text", 'editor'::"text"]));



CREATE POLICY "Owners and admins can update workspaces" ON "public"."workspaces" FOR UPDATE TO "authenticated" USING ("public"."has_workspace_role"("id", ARRAY['owner'::"text", 'admin'::"text"])) WITH CHECK ("public"."has_workspace_role"("id", ARRAY['owner'::"text", 'admin'::"text"]));



CREATE POLICY "Owners can delete workspaces" ON "public"."workspaces" FOR DELETE TO "authenticated" USING ("public"."has_workspace_role"("id", ARRAY['owner'::"text"]));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



ALTER TABLE "public"."account_metrics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "account_metrics_select_members" ON "public"."account_metrics" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "account_metrics"."workspace_id") AND ("wm"."user_id" = "auth"."uid"()) AND ("wm"."status" = 'active'::"text")))));



ALTER TABLE "public"."analytics_sync_runs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "analytics_sync_runs_select_members" ON "public"."analytics_sync_runs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "analytics_sync_runs"."workspace_id") AND ("wm"."user_id" = "auth"."uid"()) AND ("wm"."status" = 'active'::"text")))));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_logs_select_owner_admin" ON "public"."audit_logs" FOR SELECT TO "authenticated" USING ("public"."can_view_audit_logs"("workspace_id"));



ALTER TABLE "public"."billing_invoices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "billing_invoices_select_owner" ON "public"."billing_invoices" FOR SELECT TO "authenticated" USING ("public"."can_view_billing"("workspace_id"));



ALTER TABLE "public"."billing_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "billing_plans_select_public" ON "public"."billing_plans" FOR SELECT TO "authenticated" USING ((("is_active" = true) AND ("is_public" = true)));



ALTER TABLE "public"."brands" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."calendar_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaign_contents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "campaign_contents_select_members" ON "public"."campaign_contents" FOR SELECT TO "authenticated" USING ("public"."can_read_campaign_workspace"("workspace_id"));



ALTER TABLE "public"."campaigns" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "campaigns_select_members" ON "public"."campaigns" FOR SELECT TO "authenticated" USING ("public"."can_read_campaign_workspace"("workspace_id"));



ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_metrics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "content_metrics_select_members" ON "public"."content_metrics" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_members" "wm"
  WHERE (("wm"."workspace_id" = "content_metrics"."workspace_id") AND ("wm"."user_id" = "auth"."uid"()) AND ("wm"."status" = 'active'::"text")))));



ALTER TABLE "public"."content_plan_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_version_assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."media_assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."media_folders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_delete_own" ON "public"."notifications" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "notifications_select_own" ON "public"."notifications" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "notifications_update_own" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."social_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspace_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspace_subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workspace_subscriptions_select_owner" ON "public"."workspace_subscriptions" FOR SELECT TO "authenticated" USING ("public"."can_view_billing"("workspace_id"));



ALTER TABLE "public"."workspace_usage_monthly" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workspace_usage_monthly_select_owner" ON "public"."workspace_usage_monthly" FOR SELECT TO "authenticated" USING ("public"."can_view_billing"("workspace_id"));



ALTER TABLE "public"."workspaces" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."brands" TO "service_role";
GRANT SELECT ON TABLE "public"."brands" TO "authenticated";



GRANT UPDATE("name") ON TABLE "public"."brands" TO "authenticated";



GRANT UPDATE("description") ON TABLE "public"."brands" TO "authenticated";



GRANT UPDATE("industry") ON TABLE "public"."brands" TO "authenticated";



GRANT UPDATE("website_url") ON TABLE "public"."brands" TO "authenticated";



GRANT UPDATE("logo_url") ON TABLE "public"."brands" TO "authenticated";



GRANT UPDATE("primary_color") ON TABLE "public"."brands" TO "authenticated";



GRANT UPDATE("secondary_color") ON TABLE "public"."brands" TO "authenticated";



GRANT UPDATE("default_language") ON TABLE "public"."brands" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."archive_brand"("target_brand_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."archive_brand"("target_brand_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."archive_brand"("target_brand_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."archive_brand"("target_brand_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."calendar_events" TO "service_role";
GRANT SELECT ON TABLE "public"."calendar_events" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."archive_calendar_event"("event_id_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."archive_calendar_event"("event_id_value" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."archive_calendar_event"("event_id_value" "uuid") TO "authenticated";



GRANT ALL ON TABLE "public"."campaigns" TO "service_role";
GRANT SELECT ON TABLE "public"."campaigns" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."archive_campaign"("campaign_id_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."archive_campaign"("campaign_id_value" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."archive_campaign"("campaign_id_value" "uuid") TO "authenticated";



GRANT ALL ON TABLE "public"."clients" TO "service_role";
GRANT SELECT ON TABLE "public"."clients" TO "authenticated";



GRANT UPDATE("name") ON TABLE "public"."clients" TO "authenticated";



GRANT UPDATE("company_name") ON TABLE "public"."clients" TO "authenticated";



GRANT UPDATE("email") ON TABLE "public"."clients" TO "authenticated";



GRANT UPDATE("phone") ON TABLE "public"."clients" TO "authenticated";



GRANT UPDATE("website_url") ON TABLE "public"."clients" TO "authenticated";



GRANT UPDATE("notes") ON TABLE "public"."clients" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."archive_client"("target_client_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."archive_client"("target_client_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."archive_client"("target_client_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."archive_client"("target_client_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."contents" TO "service_role";
GRANT SELECT ON TABLE "public"."contents" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."archive_content"("content_id_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."archive_content"("content_id_value" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."archive_content"("content_id_value" "uuid") TO "authenticated";



GRANT ALL ON TABLE "public"."content_plan_items" TO "service_role";
GRANT SELECT ON TABLE "public"."content_plan_items" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."archive_content_plan_item"("item_id_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."archive_content_plan_item"("item_id_value" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."archive_content_plan_item"("item_id_value" "uuid") TO "authenticated";



GRANT ALL ON TABLE "public"."content_versions" TO "service_role";
GRANT SELECT ON TABLE "public"."content_versions" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."archive_content_version"("content_version_id_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."archive_content_version"("content_version_id_value" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."archive_content_version"("content_version_id_value" "uuid") TO "authenticated";



GRANT ALL ON TABLE "public"."media_assets" TO "service_role";
GRANT SELECT ON TABLE "public"."media_assets" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."archive_media_asset"("target_asset_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."archive_media_asset"("target_asset_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."archive_media_asset"("target_asset_id" "uuid") TO "authenticated";



GRANT ALL ON TABLE "public"."media_folders" TO "service_role";
GRANT SELECT ON TABLE "public"."media_folders" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."archive_media_folder"("target_folder_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."archive_media_folder"("target_folder_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."archive_media_folder"("target_folder_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."assign_brand_to_client"("target_brand_id" "uuid", "target_client_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."assign_brand_to_client"("target_brand_id" "uuid", "target_client_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."assign_brand_to_client"("target_brand_id" "uuid", "target_client_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_brand_to_client"("target_brand_id" "uuid", "target_client_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."assign_calendar_event"("event_id_value" "uuid", "assigned_to_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."assign_calendar_event"("event_id_value" "uuid", "assigned_to_value" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."assign_calendar_event"("event_id_value" "uuid", "assigned_to_value" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."assign_campaign"("campaign_id_value" "uuid", "assigned_to_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."assign_campaign"("campaign_id_value" "uuid", "assigned_to_value" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."assign_campaign"("campaign_id_value" "uuid", "assigned_to_value" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."assign_content"("content_id_value" "uuid", "assigned_to_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."assign_content"("content_id_value" "uuid", "assigned_to_value" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."assign_content"("content_id_value" "uuid", "assigned_to_value" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."assign_content_plan_item"("item_id_value" "uuid", "assigned_to_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."assign_content_plan_item"("item_id_value" "uuid", "assigned_to_value" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."assign_content_plan_item"("item_id_value" "uuid", "assigned_to_value" "uuid") TO "authenticated";



GRANT ALL ON TABLE "public"."campaign_contents" TO "service_role";
GRANT SELECT ON TABLE "public"."campaign_contents" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."attach_content_to_campaign"("campaign_id_value" "uuid", "content_id_value" "uuid", "position_value" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."attach_content_to_campaign"("campaign_id_value" "uuid", "content_id_value" "uuid", "position_value" bigint) TO "service_role";
GRANT ALL ON FUNCTION "public"."attach_content_to_campaign"("campaign_id_value" "uuid", "content_id_value" "uuid", "position_value" bigint) TO "authenticated";



GRANT ALL ON TABLE "public"."content_version_assets" TO "service_role";
GRANT SELECT ON TABLE "public"."content_version_assets" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."attach_content_version_asset"("content_version_id_value" "uuid", "media_asset_id_value" "uuid", "usage_type_value" "text", "position_value" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."attach_content_version_asset"("content_version_id_value" "uuid", "media_asset_id_value" "uuid", "usage_type_value" "text", "position_value" bigint) TO "service_role";
GRANT ALL ON FUNCTION "public"."attach_content_version_asset"("content_version_id_value" "uuid", "media_asset_id_value" "uuid", "usage_type_value" "text", "position_value" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."can_read_campaign_workspace"("workspace_id_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_read_campaign_workspace"("workspace_id_value" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."can_read_campaign_workspace"("workspace_id_value" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."can_read_media_object"("target_object_path" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_read_media_object"("target_object_path" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."can_read_media_object"("target_object_path" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."can_upload_media_object"("target_object_path" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_upload_media_object"("target_object_path" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."can_upload_media_object"("target_object_path" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."can_view_audit_logs"("workspace_id_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_view_audit_logs"("workspace_id_value" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."can_view_audit_logs"("workspace_id_value" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."can_view_billing"("workspace_id_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_view_billing"("workspace_id_value" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_billing"("workspace_id_value" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."change_calendar_event_status"("event_id_value" "uuid", "status_value" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."change_calendar_event_status"("event_id_value" "uuid", "status_value" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."change_calendar_event_status"("event_id_value" "uuid", "status_value" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."change_campaign_status"("campaign_id_value" "uuid", "status_value" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."change_campaign_status"("campaign_id_value" "uuid", "status_value" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."change_campaign_status"("campaign_id_value" "uuid", "status_value" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."change_content_status"("content_id_value" "uuid", "status_value" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."change_content_status"("content_id_value" "uuid", "status_value" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."change_content_status"("content_id_value" "uuid", "status_value" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."change_content_version_status"("content_version_id_value" "uuid", "status_value" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."change_content_version_status"("content_version_id_value" "uuid", "status_value" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."change_content_version_status"("content_version_id_value" "uuid", "status_value" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."complete_media_upload"("target_asset_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."complete_media_upload"("target_asset_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."complete_media_upload"("target_asset_id" "uuid") TO "authenticated";



GRANT ALL ON TABLE "public"."social_accounts" TO "service_role";
GRANT SELECT ON TABLE "public"."social_accounts" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."connect_social_account"("target_workspace_id" "uuid", "target_brand_id" "uuid", "actor_user_id" "uuid", "platform_value" "text", "external_account_id_value" "text", "account_name_value" "text", "access_token_value" "text", "refresh_token_value" "text", "username_value" "text", "account_type_value" "text", "profile_url_value" "text", "avatar_url_value" "text", "token_type_value" "text", "scopes_value" "text"[], "expires_at_value" timestamp with time zone, "public_metadata_value" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."connect_social_account"("target_workspace_id" "uuid", "target_brand_id" "uuid", "actor_user_id" "uuid", "platform_value" "text", "external_account_id_value" "text", "account_name_value" "text", "access_token_value" "text", "refresh_token_value" "text", "username_value" "text", "account_type_value" "text", "profile_url_value" "text", "avatar_url_value" "text", "token_type_value" "text", "scopes_value" "text"[], "expires_at_value" timestamp with time zone, "public_metadata_value" "jsonb") TO "service_role";



GRANT SELECT ON TABLE "public"."audit_logs" TO "authenticated";
GRANT SELECT,INSERT ON TABLE "public"."audit_logs" TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_audit_log"("workspace_id_value" "uuid", "action_value" "text", "actor_user_id_value" "uuid", "entity_type_value" "text", "entity_id_value" "uuid", "description_value" "text", "source_value" "text", "severity_value" "text", "old_data_value" "jsonb", "new_data_value" "jsonb", "metadata_value" "jsonb", "ip_address_value" "inet", "user_agent_value" "text", "request_id_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_audit_log"("workspace_id_value" "uuid", "action_value" "text", "actor_user_id_value" "uuid", "entity_type_value" "text", "entity_id_value" "uuid", "description_value" "text", "source_value" "text", "severity_value" "text", "old_data_value" "jsonb", "new_data_value" "jsonb", "metadata_value" "jsonb", "ip_address_value" "inet", "user_agent_value" "text", "request_id_value" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_brand"("target_workspace_id" "uuid", "brand_name" "text", "brand_description" "text", "brand_industry" "text", "brand_website_url" "text", "brand_primary_color" "text", "brand_secondary_color" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_brand"("target_workspace_id" "uuid", "brand_name" "text", "brand_description" "text", "brand_industry" "text", "brand_website_url" "text", "brand_primary_color" "text", "brand_secondary_color" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_brand"("target_workspace_id" "uuid", "brand_name" "text", "brand_description" "text", "brand_industry" "text", "brand_website_url" "text", "brand_primary_color" "text", "brand_secondary_color" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_brand"("target_workspace_id" "uuid", "brand_name" "text", "brand_description" "text", "brand_industry" "text", "brand_website_url" "text", "brand_primary_color" "text", "brand_secondary_color" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_brand"("target_workspace_id" "uuid", "brand_name" "text", "brand_description" "text", "brand_industry" "text", "brand_website_url" "text", "brand_primary_color" "text", "brand_secondary_color" "text", "brand_logo_url" "text", "brand_default_language" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_brand"("target_workspace_id" "uuid", "brand_name" "text", "brand_description" "text", "brand_industry" "text", "brand_website_url" "text", "brand_primary_color" "text", "brand_secondary_color" "text", "brand_logo_url" "text", "brand_default_language" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_brand"("target_workspace_id" "uuid", "brand_name" "text", "brand_description" "text", "brand_industry" "text", "brand_website_url" "text", "brand_primary_color" "text", "brand_secondary_color" "text", "brand_logo_url" "text", "brand_default_language" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_brand"("target_workspace_id" "uuid", "brand_name" "text", "brand_description" "text", "brand_industry" "text", "brand_website_url" "text", "brand_primary_color" "text", "brand_secondary_color" "text", "brand_logo_url" "text", "brand_default_language" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_calendar_event"("workspace_id_value" "uuid", "brand_id_value" "uuid", "title_value" "text", "event_type_value" "text", "starts_at_value" timestamp with time zone, "timezone_value" "text", "ends_at_value" timestamp with time zone, "all_day_value" boolean, "plan_item_id_value" "uuid", "assigned_to_value" "uuid", "platform_value" "text", "description_value" "text", "metadata_value" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_calendar_event"("workspace_id_value" "uuid", "brand_id_value" "uuid", "title_value" "text", "event_type_value" "text", "starts_at_value" timestamp with time zone, "timezone_value" "text", "ends_at_value" timestamp with time zone, "all_day_value" boolean, "plan_item_id_value" "uuid", "assigned_to_value" "uuid", "platform_value" "text", "description_value" "text", "metadata_value" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."create_calendar_event"("workspace_id_value" "uuid", "brand_id_value" "uuid", "title_value" "text", "event_type_value" "text", "starts_at_value" timestamp with time zone, "timezone_value" "text", "ends_at_value" timestamp with time zone, "all_day_value" boolean, "plan_item_id_value" "uuid", "assigned_to_value" "uuid", "platform_value" "text", "description_value" "text", "metadata_value" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_campaign"("workspace_id_value" "uuid", "brand_id_value" "uuid", "name_value" "text", "description_value" "text", "objective_value" "text", "client_id_value" "uuid", "assigned_to_value" "uuid", "start_date_value" "date", "end_date_value" "date", "budget_value" numeric, "currency_value" "text", "metadata_value" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_campaign"("workspace_id_value" "uuid", "brand_id_value" "uuid", "name_value" "text", "description_value" "text", "objective_value" "text", "client_id_value" "uuid", "assigned_to_value" "uuid", "start_date_value" "date", "end_date_value" "date", "budget_value" numeric, "currency_value" "text", "metadata_value" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."create_campaign"("workspace_id_value" "uuid", "brand_id_value" "uuid", "name_value" "text", "description_value" "text", "objective_value" "text", "client_id_value" "uuid", "assigned_to_value" "uuid", "start_date_value" "date", "end_date_value" "date", "budget_value" numeric, "currency_value" "text", "metadata_value" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_client"("target_workspace_id" "uuid", "client_name" "text", "client_company_name" "text", "client_email" "text", "client_phone" "text", "client_website_url" "text", "client_notes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_client"("target_workspace_id" "uuid", "client_name" "text", "client_company_name" "text", "client_email" "text", "client_phone" "text", "client_website_url" "text", "client_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_client"("target_workspace_id" "uuid", "client_name" "text", "client_company_name" "text", "client_email" "text", "client_phone" "text", "client_website_url" "text", "client_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_client"("target_workspace_id" "uuid", "client_name" "text", "client_company_name" "text", "client_email" "text", "client_phone" "text", "client_website_url" "text", "client_notes" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_content"("workspace_id_value" "uuid", "brand_id_value" "uuid", "title_value" "text", "content_type_value" "text", "source_value" "text", "plan_item_id_value" "uuid", "brief_value" "text", "main_text_value" "text", "assigned_to_value" "uuid", "metadata_value" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_content"("workspace_id_value" "uuid", "brand_id_value" "uuid", "title_value" "text", "content_type_value" "text", "source_value" "text", "plan_item_id_value" "uuid", "brief_value" "text", "main_text_value" "text", "assigned_to_value" "uuid", "metadata_value" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."create_content"("workspace_id_value" "uuid", "brand_id_value" "uuid", "title_value" "text", "content_type_value" "text", "source_value" "text", "plan_item_id_value" "uuid", "brief_value" "text", "main_text_value" "text", "assigned_to_value" "uuid", "metadata_value" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_content_from_plan_item"("plan_item_id_value" "uuid", "title_value" "text", "main_text_value" "text", "metadata_value" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_content_from_plan_item"("plan_item_id_value" "uuid", "title_value" "text", "main_text_value" "text", "metadata_value" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."create_content_from_plan_item"("plan_item_id_value" "uuid", "title_value" "text", "main_text_value" "text", "metadata_value" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_content_plan_item"("workspace_id_value" "uuid", "brand_id_value" "uuid", "title_value" "text", "brief_value" "text", "content_type_value" "text", "target_platforms_value" "text"[], "source_value" "text", "priority_value" "text", "due_date_value" "date", "assigned_to_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_content_plan_item"("workspace_id_value" "uuid", "brand_id_value" "uuid", "title_value" "text", "brief_value" "text", "content_type_value" "text", "target_platforms_value" "text"[], "source_value" "text", "priority_value" "text", "due_date_value" "date", "assigned_to_value" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."create_content_plan_item"("workspace_id_value" "uuid", "brand_id_value" "uuid", "title_value" "text", "brief_value" "text", "content_type_value" "text", "target_platforms_value" "text"[], "source_value" "text", "priority_value" "text", "due_date_value" "date", "assigned_to_value" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_content_version"("content_id_value" "uuid", "platform_value" "text", "title_value" "text", "body_value" "text", "hashtags_value" "text"[], "call_to_action_value" "text", "media_notes_value" "text", "metadata_value" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_content_version"("content_id_value" "uuid", "platform_value" "text", "title_value" "text", "body_value" "text", "hashtags_value" "text"[], "call_to_action_value" "text", "media_notes_value" "text", "metadata_value" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."create_content_version"("content_id_value" "uuid", "platform_value" "text", "title_value" "text", "body_value" "text", "hashtags_value" "text"[], "call_to_action_value" "text", "media_notes_value" "text", "metadata_value" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_default_workspace_subscription"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."create_manual_content"("workspace_id_value" "uuid", "brand_id_value" "uuid", "assigned_to_value" "uuid", "title_value" "text", "brief_value" "text", "main_text_value" "text", "content_type_value" "text", "target_platforms_value" "text"[], "metadata_value" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_manual_content"("workspace_id_value" "uuid", "brand_id_value" "uuid", "assigned_to_value" "uuid", "title_value" "text", "brief_value" "text", "main_text_value" "text", "content_type_value" "text", "target_platforms_value" "text"[], "metadata_value" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_manual_content"("workspace_id_value" "uuid", "brand_id_value" "uuid", "assigned_to_value" "uuid", "title_value" "text", "brief_value" "text", "main_text_value" "text", "content_type_value" "text", "target_platforms_value" "text"[], "metadata_value" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_manual_content"("workspace_id_value" "uuid", "brand_id_value" "uuid", "assigned_to_value" "uuid", "title_value" "text", "brief_value" "text", "main_text_value" "text", "content_type_value" "text", "target_platforms_value" "text"[], "metadata_value" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_media_folder"("target_workspace_id" "uuid", "folder_name" "text", "target_brand_id" "uuid", "target_parent_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_media_folder"("target_workspace_id" "uuid", "folder_name" "text", "target_brand_id" "uuid", "target_parent_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."create_media_folder"("target_workspace_id" "uuid", "folder_name" "text", "target_brand_id" "uuid", "target_parent_id" "uuid") TO "authenticated";



GRANT ALL ON TABLE "public"."notifications" TO "service_role";
GRANT SELECT ON TABLE "public"."notifications" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_notification"("workspace_id_value" "uuid", "user_id_value" "uuid", "type_value" "text", "title_value" "text", "message_value" "text", "actor_user_id_value" "uuid", "entity_type_value" "text", "entity_id_value" "uuid", "action_url_value" "text", "metadata_value" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_notification"("workspace_id_value" "uuid", "user_id_value" "uuid", "type_value" "text", "title_value" "text", "message_value" "text", "actor_user_id_value" "uuid", "entity_type_value" "text", "entity_id_value" "uuid", "action_url_value" "text", "metadata_value" "jsonb") TO "service_role";



GRANT ALL ON TABLE "public"."workspaces" TO "anon";
GRANT SELECT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."workspaces" TO "authenticated";
GRANT ALL ON TABLE "public"."workspaces" TO "service_role";



GRANT UPDATE("name") ON TABLE "public"."workspaces" TO "authenticated";



GRANT UPDATE("description") ON TABLE "public"."workspaces" TO "authenticated";



GRANT UPDATE("logo_url") ON TABLE "public"."workspaces" TO "authenticated";



GRANT UPDATE("language") ON TABLE "public"."workspaces" TO "authenticated";



GRANT UPDATE("timezone") ON TABLE "public"."workspaces" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_workspace"("workspace_name" "text", "workspace_description" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_workspace"("workspace_name" "text", "workspace_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_workspace"("workspace_name" "text", "workspace_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_workspace"("workspace_name" "text", "workspace_description" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."delete_content"("content_id_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_content"("content_id_value" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_content"("content_id_value" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_content"("content_id_value" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."delete_own_notification"("notification_id_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_own_notification"("notification_id_value" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."delete_own_notification"("notification_id_value" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."disconnect_social_account"("target_social_account_id" "uuid", "actor_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."disconnect_social_account"("target_social_account_id" "uuid", "actor_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."duplicate_content"("content_id_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."duplicate_content"("content_id_value" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."duplicate_content"("content_id_value" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."duplicate_content"("content_id_value" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."analytics_sync_runs" TO "service_role";
GRANT SELECT ON TABLE "public"."analytics_sync_runs" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."finish_analytics_sync"("sync_run_id_value" "uuid", "status_value" "text", "records_processed_value" bigint, "error_code_value" "text", "error_message_value" "text", "metadata_value" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."finish_analytics_sync"("sync_run_id_value" "uuid", "status_value" "text", "records_processed_value" bigint, "error_code_value" "text", "error_message_value" "text", "metadata_value" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_brand_analytics_summary"("brand_id_value" "uuid", "start_date_value" "date", "end_date_value" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_brand_analytics_summary"("brand_id_value" "uuid", "start_date_value" "date", "end_date_value" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_brand_analytics_summary"("brand_id_value" "uuid", "start_date_value" "date", "end_date_value" "date") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_unread_notifications_count"("workspace_id_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_unread_notifications_count"("workspace_id_value" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_unread_notifications_count"("workspace_id_value" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_workspace_billing_summary"("workspace_id_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_workspace_billing_summary"("workspace_id_value" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_workspace_billing_summary"("workspace_id_value" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."has_campaign_workspace_role"("workspace_id_value" "uuid", "roles_value" "text"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_campaign_workspace_role"("workspace_id_value" "uuid", "roles_value" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."has_workspace_role"("target_workspace_id" "uuid", "allowed_roles" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."has_workspace_role"("target_workspace_id" "uuid", "allowed_roles" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_workspace_role"("target_workspace_id" "uuid", "allowed_roles" "text"[]) TO "service_role";



GRANT SELECT ON TABLE "public"."workspace_usage_monthly" TO "authenticated";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."workspace_usage_monthly" TO "service_role";



REVOKE ALL ON FUNCTION "public"."increment_workspace_usage"("workspace_id_value" "uuid", "usage_month_value" "date", "ai_text_generations_delta" bigint, "ai_image_generations_delta" bigint, "published_posts_delta" bigint, "storage_bytes_delta" bigint, "metadata_value" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."increment_workspace_usage"("workspace_id_value" "uuid", "usage_month_value" "date", "ai_text_generations_delta" bigint, "ai_image_generations_delta" bigint, "published_posts_delta" bigint, "storage_bytes_delta" bigint, "metadata_value" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_workspace_member"("target_workspace_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_workspace_member"("target_workspace_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_workspace_member"("target_workspace_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_all_notifications_as_read"("workspace_id_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_read"("workspace_id_value" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_read"("workspace_id_value" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."mark_notification_as_read"("notification_id_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_notification_as_read"("notification_id_value" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."mark_notification_as_read"("notification_id_value" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."move_campaign_content"("campaign_content_id_value" "uuid", "position_value" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."move_campaign_content"("campaign_content_id_value" "uuid", "position_value" bigint) TO "service_role";
GRANT ALL ON FUNCTION "public"."move_campaign_content"("campaign_content_id_value" "uuid", "position_value" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."move_content_plan_item"("item_id_value" "uuid", "target_status_value" "text", "target_position_value" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."move_content_plan_item"("item_id_value" "uuid", "target_status_value" "text", "target_position_value" bigint) TO "service_role";
GRANT ALL ON FUNCTION "public"."move_content_plan_item"("item_id_value" "uuid", "target_status_value" "text", "target_position_value" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."move_content_version_asset"("content_version_asset_id_value" "uuid", "position_value" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."move_content_version_asset"("content_version_asset_id_value" "uuid", "position_value" bigint) TO "service_role";
GRANT ALL ON FUNCTION "public"."move_content_version_asset"("content_version_asset_id_value" "uuid", "position_value" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."normalize_client_fields"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."normalize_client_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_client_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_client_fields"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."prepare_media_upload"("target_workspace_id" "uuid", "original_file_name" "text", "mime_type_value" "text", "file_size_value" bigint, "target_brand_id" "uuid", "target_folder_id" "uuid", "display_name_value" "text", "source_value" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."prepare_media_upload"("target_workspace_id" "uuid", "original_file_name" "text", "mime_type_value" "text", "file_size_value" bigint, "target_brand_id" "uuid", "target_folder_id" "uuid", "display_name_value" "text", "source_value" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."prepare_media_upload"("target_workspace_id" "uuid", "original_file_name" "text", "mime_type_value" "text", "file_size_value" bigint, "target_brand_id" "uuid", "target_folder_id" "uuid", "display_name_value" "text", "source_value" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."remove_brand_from_client"("target_brand_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."remove_brand_from_client"("target_brand_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_brand_from_client"("target_brand_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_brand_from_client"("target_brand_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."remove_content_from_campaign"("campaign_content_id_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."remove_content_from_campaign"("campaign_content_id_value" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."remove_content_from_campaign"("campaign_content_id_value" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."remove_content_version_asset"("content_version_asset_id_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."remove_content_version_asset"("content_version_asset_id_value" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."remove_content_version_asset"("content_version_asset_id_value" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."require_content_editor"("target_workspace_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."require_content_editor"("target_workspace_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."reschedule_calendar_event"("event_id_value" "uuid", "starts_at_value" timestamp with time zone, "ends_at_value" timestamp with time zone, "timezone_value" "text", "all_day_value" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reschedule_calendar_event"("event_id_value" "uuid", "starts_at_value" timestamp with time zone, "ends_at_value" timestamp with time zone, "timezone_value" "text", "all_day_value" boolean) TO "service_role";
GRANT ALL ON FUNCTION "public"."reschedule_calendar_event"("event_id_value" "uuid", "starts_at_value" timestamp with time zone, "ends_at_value" timestamp with time zone, "timezone_value" "text", "all_day_value" boolean) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."restore_brand"("target_brand_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."restore_brand"("target_brand_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."restore_brand"("target_brand_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."restore_brand"("target_brand_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."restore_calendar_event"("event_id_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."restore_calendar_event"("event_id_value" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."restore_calendar_event"("event_id_value" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."restore_campaign"("campaign_id_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."restore_campaign"("campaign_id_value" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."restore_campaign"("campaign_id_value" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."restore_client"("target_client_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."restore_client"("target_client_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."restore_client"("target_client_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."restore_client"("target_client_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."restore_content"("content_id_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."restore_content"("content_id_value" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."restore_content"("content_id_value" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."restore_content_plan_item"("item_id_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."restore_content_plan_item"("item_id_value" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."restore_content_plan_item"("item_id_value" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."restore_content_version"("content_version_id_value" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."restore_content_version"("content_version_id_value" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."restore_content_version"("content_version_id_value" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."restore_media_asset"("target_asset_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."restore_media_asset"("target_asset_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."restore_media_asset"("target_asset_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."restore_media_folder"("target_folder_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."restore_media_folder"("target_folder_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."restore_media_folder"("target_folder_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_analytics_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_analytics_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_analytics_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_billing_updated_at"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."set_notifications_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_notifications_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_social_account_health"("target_social_account_id" "uuid", "status_value" "text", "error_code_value" "text", "synced_at_value" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_social_account_health"("target_social_account_id" "uuid", "status_value" "text", "error_code_value" "text", "synced_at_value" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT SELECT ON TABLE "public"."workspace_subscriptions" TO "authenticated";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."workspace_subscriptions" TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_workspace_subscription"("workspace_id_value" "uuid", "plan_code_value" "text", "status_value" "text", "provider_value" "text", "billing_interval_value" "text", "current_period_start_value" timestamp with time zone, "current_period_end_value" timestamp with time zone, "trial_end_value" timestamp with time zone, "cancel_at_period_end_value" boolean, "provider_customer_id_value" "text", "provider_subscription_id_value" "text", "metadata_value" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_workspace_subscription"("workspace_id_value" "uuid", "plan_code_value" "text", "status_value" "text", "provider_value" "text", "billing_interval_value" "text", "current_period_start_value" timestamp with time zone, "current_period_end_value" timestamp with time zone, "trial_end_value" timestamp with time zone, "cancel_at_period_end_value" boolean, "provider_customer_id_value" "text", "provider_subscription_id_value" "text", "metadata_value" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."slugify"("value" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."slugify"("value" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."slugify"("value" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."start_analytics_sync"("social_account_id_value" "uuid", "provider_value" "text", "sync_type_value" "text", "metadata_value" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."start_analytics_sync"("social_account_id_value" "uuid", "provider_value" "text", "sync_type_value" "text", "metadata_value" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_content_platforms_from_plan_item"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_content_platforms_from_plan_item"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_content_platforms_from_plan_item"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."sync_notification_read_state"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_notification_read_state"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_brand"("target_brand_id" "uuid", "brand_name" "text", "brand_description" "text", "brand_industry" "text", "brand_website_url" "text", "brand_primary_color" "text", "brand_secondary_color" "text", "brand_logo_url" "text", "brand_default_language" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_brand"("target_brand_id" "uuid", "brand_name" "text", "brand_description" "text", "brand_industry" "text", "brand_website_url" "text", "brand_primary_color" "text", "brand_secondary_color" "text", "brand_logo_url" "text", "brand_default_language" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_brand"("target_brand_id" "uuid", "brand_name" "text", "brand_description" "text", "brand_industry" "text", "brand_website_url" "text", "brand_primary_color" "text", "brand_secondary_color" "text", "brand_logo_url" "text", "brand_default_language" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_brand"("target_brand_id" "uuid", "brand_name" "text", "brand_description" "text", "brand_industry" "text", "brand_website_url" "text", "brand_primary_color" "text", "brand_secondary_color" "text", "brand_logo_url" "text", "brand_default_language" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_calendar_event"("event_id_value" "uuid", "title_value" "text", "description_value" "text", "event_type_value" "text", "platform_value" "text", "plan_item_id_value" "uuid", "metadata_value" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_calendar_event"("event_id_value" "uuid", "title_value" "text", "description_value" "text", "event_type_value" "text", "platform_value" "text", "plan_item_id_value" "uuid", "metadata_value" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."update_calendar_event"("event_id_value" "uuid", "title_value" "text", "description_value" "text", "event_type_value" "text", "platform_value" "text", "plan_item_id_value" "uuid", "metadata_value" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."update_campaign"("campaign_id_value" "uuid", "name_value" "text", "description_value" "text", "objective_value" "text", "client_id_value" "uuid", "assigned_to_value" "uuid", "start_date_value" "date", "end_date_value" "date", "budget_value" numeric, "currency_value" "text", "metadata_value" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_campaign"("campaign_id_value" "uuid", "name_value" "text", "description_value" "text", "objective_value" "text", "client_id_value" "uuid", "assigned_to_value" "uuid", "start_date_value" "date", "end_date_value" "date", "budget_value" numeric, "currency_value" "text", "metadata_value" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."update_campaign"("campaign_id_value" "uuid", "name_value" "text", "description_value" "text", "objective_value" "text", "client_id_value" "uuid", "assigned_to_value" "uuid", "start_date_value" "date", "end_date_value" "date", "budget_value" numeric, "currency_value" "text", "metadata_value" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."update_client"("target_client_id" "uuid", "client_name" "text", "client_company_name" "text", "client_email" "text", "client_phone" "text", "client_website_url" "text", "client_notes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_client"("target_client_id" "uuid", "client_name" "text", "client_company_name" "text", "client_email" "text", "client_phone" "text", "client_website_url" "text", "client_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_client"("target_client_id" "uuid", "client_name" "text", "client_company_name" "text", "client_email" "text", "client_phone" "text", "client_website_url" "text", "client_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_client"("target_client_id" "uuid", "client_name" "text", "client_company_name" "text", "client_email" "text", "client_phone" "text", "client_website_url" "text", "client_notes" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_content"("content_id_value" "uuid", "title_value" "text", "brief_value" "text", "main_text_value" "text", "content_type_value" "text", "target_platforms_value" "text"[], "metadata_value" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_content"("content_id_value" "uuid", "title_value" "text", "brief_value" "text", "main_text_value" "text", "content_type_value" "text", "target_platforms_value" "text"[], "metadata_value" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_content"("content_id_value" "uuid", "title_value" "text", "brief_value" "text", "main_text_value" "text", "content_type_value" "text", "target_platforms_value" "text"[], "metadata_value" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_content"("content_id_value" "uuid", "title_value" "text", "brief_value" "text", "main_text_value" "text", "content_type_value" "text", "target_platforms_value" "text"[], "metadata_value" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_content"("content_id_value" "uuid", "title_value" "text", "brief_value" "text", "main_text_value" "text", "content_type_value" "text", "assigned_to_value" "uuid", "metadata_value" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_content"("content_id_value" "uuid", "title_value" "text", "brief_value" "text", "main_text_value" "text", "content_type_value" "text", "assigned_to_value" "uuid", "metadata_value" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."update_content"("content_id_value" "uuid", "title_value" "text", "brief_value" "text", "main_text_value" "text", "content_type_value" "text", "assigned_to_value" "uuid", "metadata_value" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."update_content_plan_item"("item_id_value" "uuid", "title_value" "text", "brief_value" "text", "content_type_value" "text", "target_platforms_value" "text"[], "priority_value" "text", "due_date_value" "date", "metadata_value" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_content_plan_item"("item_id_value" "uuid", "title_value" "text", "brief_value" "text", "content_type_value" "text", "target_platforms_value" "text"[], "priority_value" "text", "due_date_value" "date", "metadata_value" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."update_content_plan_item"("item_id_value" "uuid", "title_value" "text", "brief_value" "text", "content_type_value" "text", "target_platforms_value" "text"[], "priority_value" "text", "due_date_value" "date", "metadata_value" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."update_content_version"("content_version_id_value" "uuid", "platform_value" "text", "title_value" "text", "body_value" "text", "hashtags_value" "text"[], "call_to_action_value" "text", "media_notes_value" "text", "metadata_value" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_content_version"("content_version_id_value" "uuid", "platform_value" "text", "title_value" "text", "body_value" "text", "hashtags_value" "text"[], "call_to_action_value" "text", "media_notes_value" "text", "metadata_value" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."update_content_version"("content_version_id_value" "uuid", "platform_value" "text", "title_value" "text", "body_value" "text", "hashtags_value" "text"[], "call_to_action_value" "text", "media_notes_value" "text", "metadata_value" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."update_media_asset_metadata"("target_asset_id" "uuid", "target_folder_id" "uuid", "display_name_value" "text", "alt_text_value" "text", "caption_value" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_media_asset_metadata"("target_asset_id" "uuid", "target_folder_id" "uuid", "display_name_value" "text", "alt_text_value" "text", "caption_value" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."update_media_asset_metadata"("target_asset_id" "uuid", "target_folder_id" "uuid", "display_name_value" "text", "alt_text_value" "text", "caption_value" "text") TO "authenticated";



GRANT ALL ON TABLE "public"."account_metrics" TO "service_role";
GRANT SELECT ON TABLE "public"."account_metrics" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."upsert_account_metrics"("social_account_id_value" "uuid", "metric_date_value" "date", "followers_value" bigint, "following_value" bigint, "posts_count_value" bigint, "impressions_value" bigint, "reach_value" bigint, "profile_views_value" bigint, "website_clicks_value" bigint, "engagements_value" bigint, "metadata_value" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."upsert_account_metrics"("social_account_id_value" "uuid", "metric_date_value" "date", "followers_value" bigint, "following_value" bigint, "posts_count_value" bigint, "impressions_value" bigint, "reach_value" bigint, "profile_views_value" bigint, "website_clicks_value" bigint, "engagements_value" bigint, "metadata_value" "jsonb") TO "service_role";



GRANT SELECT ON TABLE "public"."billing_invoices" TO "authenticated";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."billing_invoices" TO "service_role";



REVOKE ALL ON FUNCTION "public"."upsert_billing_invoice"("workspace_id_value" "uuid", "provider_value" "text", "status_value" "text", "currency_value" "text", "subtotal_cents_value" bigint, "tax_cents_value" bigint, "total_cents_value" bigint, "amount_paid_cents_value" bigint, "amount_due_cents_value" bigint, "subscription_id_value" "uuid", "provider_invoice_id_value" "text", "invoice_number_value" "text", "issued_at_value" timestamp with time zone, "due_at_value" timestamp with time zone, "paid_at_value" timestamp with time zone, "hosted_invoice_url_value" "text", "invoice_pdf_url_value" "text", "metadata_value" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."upsert_billing_invoice"("workspace_id_value" "uuid", "provider_value" "text", "status_value" "text", "currency_value" "text", "subtotal_cents_value" bigint, "tax_cents_value" bigint, "total_cents_value" bigint, "amount_paid_cents_value" bigint, "amount_due_cents_value" bigint, "subscription_id_value" "uuid", "provider_invoice_id_value" "text", "invoice_number_value" "text", "issued_at_value" timestamp with time zone, "due_at_value" timestamp with time zone, "paid_at_value" timestamp with time zone, "hosted_invoice_url_value" "text", "invoice_pdf_url_value" "text", "metadata_value" "jsonb") TO "service_role";



GRANT ALL ON TABLE "public"."content_metrics" TO "service_role";
GRANT SELECT ON TABLE "public"."content_metrics" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."upsert_content_metrics"("content_version_id_value" "uuid", "social_account_id_value" "uuid", "metric_date_value" "date", "impressions_value" bigint, "reach_value" bigint, "views_value" bigint, "likes_value" bigint, "comments_value" bigint, "shares_value" bigint, "saves_value" bigint, "clicks_value" bigint, "watch_time_seconds_value" numeric, "metadata_value" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."upsert_content_metrics"("content_version_id_value" "uuid", "social_account_id_value" "uuid", "metric_date_value" "date", "impressions_value" bigint, "reach_value" bigint, "views_value" bigint, "likes_value" bigint, "comments_value" bigint, "shares_value" bigint, "saves_value" bigint, "clicks_value" bigint, "watch_time_seconds_value" numeric, "metadata_value" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_analytics_scope"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_analytics_scope"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_analytics_scope"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."validate_audit_log_scope"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."validate_audit_log_scope"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."validate_billing_invoice"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."validate_billing_plan"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."validate_brand_client_workspace"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."validate_brand_client_workspace"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_brand_client_workspace"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_brand_client_workspace"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."validate_calendar_event_scope"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."validate_calendar_event_scope"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."validate_campaign_content_scope"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."validate_campaign_content_scope"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."validate_campaign_scope"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."validate_campaign_scope"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."validate_content_plan_item_scope"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."validate_content_plan_item_scope"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_content_scope"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_content_scope"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_content_scope"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_content_version_asset_scope"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_content_version_asset_scope"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_content_version_asset_scope"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_content_version_scope"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_content_version_scope"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_content_version_scope"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."validate_notification_scope"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."validate_notification_scope"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."validate_workspace_subscription"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."validate_workspace_usage_monthly"() FROM PUBLIC;



GRANT SELECT ON TABLE "public"."billing_plans" TO "authenticated";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."billing_plans" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_members" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."workspace_members" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_members" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
