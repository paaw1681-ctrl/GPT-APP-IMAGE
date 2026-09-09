-- Oak & Oats Image Studio — core schema
-- Konwencja: wszystkie tabele danych mają created_by/updated_by (auth.users), created_at/updated_at.

create extension if not exists "pgcrypto";

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  display_name text,
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists brand_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  tone_of_voice text,
  positioning text,
  content_voice text,
  language text not null default 'pl',
  global_visual_rules jsonb not null default '{}'::jsonb,
  forbidden_cliches jsonb not null default '[]'::jsonb,
  verified_brand_facts jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_types (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  key text not null,
  label_pl text not null,
  is_default boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (workspace_id, key)
);

create table if not exists audience_contexts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  key text not null,
  label_pl text not null,
  active boolean not null default true,
  sort_order int not null default 0,
  unique (workspace_id, key)
);

create table if not exists product_rule_packs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  product_type_id uuid not null references product_types(id) on delete cascade,
  version int not null default 1,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  rules jsonb not null default '{}'::jsonb,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists product_families (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  product_type_id uuid references product_types(id),
  base_construction jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  family_id uuid references product_families(id) on delete set null,
  name text not null,
  product_type_id uuid references product_types(id),
  product_type_label text,
  product_type_confidence text check (product_type_confidence in ('low', 'medium', 'high')),
  audience_context_id uuid references audience_contexts(id),
  variant_name text,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  family_id uuid references product_families(id) on delete set null,
  inherits_from_product_id uuid references products(id) on delete set null,
  inherited_fields jsonb not null default '[]'::jsonb,
  overridden_fields jsonb not null default '{}'::jsonb,
  approved_by_user boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (product_id)
);

create table if not exists product_references (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  storage_path_original text not null,
  storage_path_working text not null,
  storage_path_preview text not null,
  role text not null default 'supporting' check (role in ('master', 'supporting')),
  mime_type text not null,
  width int,
  height int,
  exif_stripped boolean not null default true,
  sort_order int not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists product_profiles (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  version int not null default 1,
  status text not null default 'draft' check (status in ('draft', 'confirmed')),
  product_name text,
  product_family text,
  variant_name text,
  materials jsonb not null default '[]'::jsonb,
  main_colors jsonb not null default '[]'::jsonb,
  secondary_colors jsonb not null default '[]'::jsonb,
  element_count int,
  element_sequence jsonb not null default '[]'::jsonb,
  shapes jsonb not null default '[]'::jsonb,
  relative_sizes jsonb not null default '{}'::jsonb,
  wooden_elements jsonb not null default '[]'::jsonb,
  silicone_elements jsonb not null default '[]'::jsonb,
  cord jsonb not null default '{}'::jsonb,
  clasp jsonb not null default '{}'::jsonb,
  hardware jsonb not null default '[]'::jsonb,
  text_elements jsonb not null default '[]'::jsonb,
  letters text,
  engraving text,
  personalization jsonb not null default '{}'::jsonb,
  critical_features jsonb not null default '[]'::jsonb,
  usage text,
  forbidden_transformations jsonb not null default '[]'::jsonb,
  safety_context text,
  notes text,
  uncertain_fields jsonb not null default '[]'::jsonb,
  analysis_confidence text check (analysis_confidence in ('low', 'medium', 'high')),
  analyzer_model text,
  raw jsonb not null default '{}'::jsonb,
  reference_quality_status text check (reference_quality_status in ('sufficient', 'can_improve')),
  reference_quality_notes jsonb not null default '[]'::jsonb,
  master_reference_id uuid references product_references(id),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  title text,
  status text not null default 'active' check (status in ('active', 'closed')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists prompt_modules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  module_key text not null check (module_key in ('A','B','C','D','E','F','G','H','I','J')),
  version int not null default 1,
  title text not null,
  content text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists prompt_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  module_versions jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists model_catalog (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  model_id text not null,
  purpose text not null,
  input_token_price numeric(12,6),
  cached_input_price numeric(12,6),
  output_token_price numeric(12,6),
  image_input_price numeric(12,6),
  image_output_price numeric(12,6),
  price_unit text not null default 'per_1k_tokens',
  quality text,
  currency text not null default 'USD',
  effective_from date not null default current_date,
  source_url text,
  last_verified_at timestamptz,
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists routing_policies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  role_key text not null,
  model_catalog_id uuid not null references model_catalog(id),
  fallback_model_catalog_id uuid references model_catalog(id),
  escalation_rule text,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists concepts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  photo_type text not null,
  purpose text,
  aspect_ratio text,
  featured_subject text,
  idea_text text not null,
  scenario_metadata jsonb not null default '{}'::jsonb,
  prompt_version_id uuid references prompt_versions(id),
  model text,
  is_selected boolean not null default false,
  cost_estimated_cents int,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists generation_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  session_id uuid references sessions(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  concept_id uuid references concepts(id) on delete set null,
  parent_asset_id uuid,
  kind text not null check (kind in ('prototype', 'final', 'content', 'analysis', 'quality_gate', 'trend', 'test_lab')),
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed')),
  idempotency_key text not null,
  request_params jsonb not null default '{}'::jsonb,
  prompt_snapshot jsonb not null default '{}'::jsonb,
  model_catalog_id uuid references model_catalog(id),
  routing_policy_id uuid references routing_policies(id),
  prompt_version_id uuid references prompt_versions(id),
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key)
);

create table if not exists generated_assets (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references generation_jobs(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  session_id uuid references sessions(id) on delete cascade,
  kind text not null check (kind in ('prototype', 'final')),
  storage_path text not null,
  preview_path text,
  format text not null default 'png',
  aspect_ratio text,
  is_favorite boolean not null default false,
  is_kept boolean not null default false,
  scenario_metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

alter table generation_jobs
  add constraint generation_jobs_parent_asset_fk foreign key (parent_asset_id) references generated_assets(id) on delete set null;

create table if not exists generation_metadata (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references generation_jobs(id) on delete cascade,
  asset_id uuid references generated_assets(id) on delete cascade,
  model text,
  model_params jsonb not null default '{}'::jsonb,
  provider_usage jsonb not null default '{}'::jsonb,
  cost_estimated_cents int,
  cost_actual_cents int,
  currency text not null default 'PLN',
  created_at timestamptz not null default now()
);

create table if not exists quality_reviews (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references generated_assets(id) on delete cascade,
  job_id uuid references generation_jobs(id) on delete set null,
  product_fidelity text check (product_fidelity in ('high', 'medium', 'low')),
  realism text check (realism in ('high', 'medium', 'low')),
  status text not null check (status in ('ready', 'check', 'improve')),
  issues jsonb not null default '[]'::jsonb,
  numerical_score numeric(5,2),
  confidence text check (confidence in ('low', 'medium', 'high')),
  second_pass boolean not null default false,
  model text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references generated_assets(id) on delete cascade,
  user_id uuid references auth.users(id),
  sentiment text not null check (sentiment in ('liked', 'disliked')),
  reasons jsonb not null default '[]'::jsonb,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists verified_facts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  scope text not null default 'product' check (scope in ('product', 'brand')),
  fact_key text not null,
  value_pl text not null,
  source text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists cost_ledger (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  job_id uuid references generation_jobs(id) on delete set null,
  category text not null check (category in ('text_input', 'text_output', 'image_input', 'image_output', 'vision', 'web_search', 'other')),
  provider text not null,
  model text not null,
  usage jsonb not null default '{}'::jsonb,
  amount_usd_cents numeric(12,4) not null default 0,
  amount_pln_cents numeric(12,4) not null default 0,
  fx_rate numeric(12,6),
  estimated boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  month date not null,
  monthly_limit_pln_cents int not null default 10000,
  hard_limit_enabled boolean not null default false,
  threshold_50_notified_at timestamptz,
  threshold_80_notified_at timestamptz,
  threshold_100_notified_at timestamptz,
  overridden_by uuid references auth.users(id),
  overridden_at timestamptz,
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  unique (workspace_id, month)
);

create table if not exists trend_briefs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  week_of date not null,
  summary_points jsonb not null default '[]'::jsonb,
  status text not null default 'completed' check (status in ('running', 'completed', 'failed')),
  model text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists trend_sources (
  id uuid primary key default gen_random_uuid(),
  trend_brief_id uuid not null references trend_briefs(id) on delete cascade,
  title text not null,
  url text,
  published_at date,
  relevance text,
  confidence text check (confidence in ('low', 'medium', 'high')),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists content_assets (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references generated_assets(id) on delete cascade,
  channel text not null check (channel in ('instagram', 'meta_ads', 'sklep', 'pinterest')),
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists system_suggestions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null,
  body text not null,
  kind text not null default 'rule_pack',
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'proposed' check (status in ('proposed', 'applied', 'rejected')),
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists test_lab_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  photo_type text not null,
  prompt_version_a_id uuid references prompt_versions(id),
  prompt_version_b_id uuid references prompt_versions(id),
  model_a text,
  model_b text,
  estimated_cost_cents int,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed')),
  result text check (result in ('a_better', 'b_better', 'tie')),
  asset_a_id uuid references generated_assets(id),
  asset_b_id uuid references generated_assets(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists currency_rates (
  id uuid primary key default gen_random_uuid(),
  rate_date date not null unique,
  usd_pln numeric(12,6) not null,
  source text not null default 'nbp',
  fetched_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_products_workspace on products(workspace_id);
create index if not exists idx_products_family on products(family_id);
create index if not exists idx_product_references_product on product_references(product_id);
create index if not exists idx_product_profiles_product on product_profiles(product_id);
create index if not exists idx_sessions_product on sessions(product_id);
create index if not exists idx_concepts_session on concepts(session_id);
create index if not exists idx_generation_jobs_session on generation_jobs(session_id);
create index if not exists idx_generation_jobs_product on generation_jobs(product_id);
create index if not exists idx_generation_jobs_status on generation_jobs(status);
create index if not exists idx_generated_assets_job on generated_assets(job_id);
create index if not exists idx_generated_assets_product on generated_assets(product_id);
create index if not exists idx_quality_reviews_asset on quality_reviews(asset_id);
create index if not exists idx_feedback_asset on feedback(asset_id);
create index if not exists idx_cost_ledger_workspace_created on cost_ledger(workspace_id, created_at);
create index if not exists idx_content_assets_asset on content_assets(asset_id);
create index if not exists idx_trend_sources_brief on trend_sources(trend_brief_id);
create index if not exists idx_prompt_modules_workspace_key on prompt_modules(workspace_id, module_key, status);
create index if not exists idx_model_catalog_purpose on model_catalog(purpose, active);
create index if not exists idx_routing_policies_role on routing_policies(workspace_id, role_key, status);

-- updated_at trigger helper
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array['brand_profiles','product_families','products','product_profiles','sessions']
  loop
    execute format('drop trigger if exists trg_set_updated_at on %I;', t);
    execute format('create trigger trg_set_updated_at before update on %I for each row execute function set_updated_at();', t);
  end loop;
end $$;
