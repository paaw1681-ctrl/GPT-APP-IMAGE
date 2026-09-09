-- Row Level Security: dostęp tylko dla członków workspace'u (Paweł + Wiktoria).
-- Wszystkie zapytania z przeglądarki idą przez klienta Supabase związanego z sesją
-- użytkownika, więc te polityki są rzeczywistą granicą bezpieczeństwa.

create or replace function is_workspace_member(ws uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from workspace_members m
    where m.workspace_id = ws and m.user_id = auth.uid()
  );
$$;

create or replace function workspace_of_product(p uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select workspace_id from products where id = p;
$$;

alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table brand_profiles enable row level security;
alter table product_types enable row level security;
alter table audience_contexts enable row level security;
alter table product_rule_packs enable row level security;
alter table product_families enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_references enable row level security;
alter table product_profiles enable row level security;
alter table sessions enable row level security;
alter table prompt_modules enable row level security;
alter table prompt_versions enable row level security;
alter table model_catalog enable row level security;
alter table routing_policies enable row level security;
alter table concepts enable row level security;
alter table generation_jobs enable row level security;
alter table generated_assets enable row level security;
alter table generation_metadata enable row level security;
alter table quality_reviews enable row level security;
alter table feedback enable row level security;
alter table verified_facts enable row level security;
alter table cost_ledger enable row level security;
alter table budgets enable row level security;
alter table trend_briefs enable row level security;
alter table trend_sources enable row level security;
alter table content_assets enable row level security;
alter table system_suggestions enable row level security;
alter table test_lab_runs enable row level security;
alter table currency_rates enable row level security;

create policy "member read workspace" on workspaces for select using (is_workspace_member(id));
create policy "member read members" on workspace_members for select using (is_workspace_member(workspace_id));

create policy "member all brand_profiles" on brand_profiles for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "member all product_types" on product_types for all using (workspace_id is null or is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "member all audience_contexts" on audience_contexts for all using (workspace_id is null or is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "member all product_rule_packs" on product_rule_packs for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "member all product_families" on product_families for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "member all products" on products for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));

create policy "member all product_variants" on product_variants for all
  using (is_workspace_member(workspace_of_product(product_id)))
  with check (is_workspace_member(workspace_of_product(product_id)));

create policy "member all product_references" on product_references for all
  using (is_workspace_member(workspace_of_product(product_id)))
  with check (is_workspace_member(workspace_of_product(product_id)));

create policy "member all product_profiles" on product_profiles for all
  using (is_workspace_member(workspace_of_product(product_id)))
  with check (is_workspace_member(workspace_of_product(product_id)));

create policy "member all sessions" on sessions for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "member all prompt_modules" on prompt_modules for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "member all prompt_versions" on prompt_versions for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));

create policy "member read model_catalog" on model_catalog for select using (auth.uid() is not null);
create policy "member all routing_policies" on routing_policies for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));

create policy "member all concepts" on concepts for all
  using (is_workspace_member(workspace_of_product(product_id)))
  with check (is_workspace_member(workspace_of_product(product_id)));

create policy "member all generation_jobs" on generation_jobs for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));

create policy "member all generated_assets" on generated_assets for all
  using (is_workspace_member(workspace_of_product(product_id)))
  with check (is_workspace_member(workspace_of_product(product_id)));

create policy "member read generation_metadata" on generation_metadata for select
  using (exists (select 1 from generation_jobs j where j.id = job_id and is_workspace_member(j.workspace_id)));
create policy "member write generation_metadata" on generation_metadata for insert
  with check (exists (select 1 from generation_jobs j where j.id = job_id and is_workspace_member(j.workspace_id)));

create policy "member all quality_reviews" on quality_reviews for all
  using (exists (select 1 from generated_assets a where a.id = asset_id and is_workspace_member(workspace_of_product(a.product_id))))
  with check (exists (select 1 from generated_assets a where a.id = asset_id and is_workspace_member(workspace_of_product(a.product_id))));

create policy "member all feedback" on feedback for all
  using (exists (select 1 from generated_assets a where a.id = asset_id and is_workspace_member(workspace_of_product(a.product_id))))
  with check (exists (select 1 from generated_assets a where a.id = asset_id and is_workspace_member(workspace_of_product(a.product_id))));

create policy "member all verified_facts" on verified_facts for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "member all cost_ledger" on cost_ledger for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "member all budgets" on budgets for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "member all trend_briefs" on trend_briefs for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));

create policy "member all trend_sources" on trend_sources for all
  using (exists (select 1 from trend_briefs b where b.id = trend_brief_id and is_workspace_member(b.workspace_id)))
  with check (exists (select 1 from trend_briefs b where b.id = trend_brief_id and is_workspace_member(b.workspace_id)));

create policy "member all content_assets" on content_assets for all
  using (exists (select 1 from generated_assets a where a.id = asset_id and is_workspace_member(workspace_of_product(a.product_id))))
  with check (exists (select 1 from generated_assets a where a.id = asset_id and is_workspace_member(workspace_of_product(a.product_id))));

create policy "member all system_suggestions" on system_suggestions for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "member all test_lab_runs" on test_lab_runs for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));

create policy "member read currency_rates" on currency_rates for select using (auth.uid() is not null);

-- Storage: prywatny bucket, dostęp tylko dla zalogowanych członków workspace'u.
insert into storage.buckets (id, name, public)
values ('oakoats', 'oakoats', false)
on conflict (id) do nothing;

-- UWAGA: dostęp musi być ograniczony do faktycznych członków workspace'u, nie
-- tylko "zalogowany" — Supabase Auth domyślnie pozwala na samodzielną
-- rejestrację, więc sam auth.uid() is not null nie chroni przed obcym kontem.
create policy "oak oats members read storage" on storage.objects for select
  using (bucket_id = 'oakoats' and exists (select 1 from workspace_members m where m.user_id = auth.uid()));
create policy "oak oats members write storage" on storage.objects for insert
  with check (bucket_id = 'oakoats' and exists (select 1 from workspace_members m where m.user_id = auth.uid()));
create policy "oak oats members update storage" on storage.objects for update
  using (bucket_id = 'oakoats' and exists (select 1 from workspace_members m where m.user_id = auth.uid()));
create policy "oak oats members delete storage" on storage.objects for delete
  using (bucket_id = 'oakoats' and exists (select 1 from workspace_members m where m.user_id = auth.uid()));
