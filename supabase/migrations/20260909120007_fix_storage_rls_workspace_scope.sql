-- Review #2: polityki storage sprawdzały tylko auth.uid() is not null, nie
-- faktyczne członkostwo w workspace_members. Naprawiono bezpośrednio w
-- 20260909120002_rls.sql (dla świeżych instalacji); ta migracja odzwierciedla
-- tę samą poprawkę zastosowaną na już istniejącej bazie.
drop policy if exists "workspace members read storage" on storage.objects;
drop policy if exists "workspace members write storage" on storage.objects;
drop policy if exists "workspace members update storage" on storage.objects;
drop policy if exists "workspace members delete storage" on storage.objects;

create policy "oak oats members read storage" on storage.objects for select
  using (bucket_id = 'oakoats' and exists (select 1 from workspace_members m where m.user_id = auth.uid()));
create policy "oak oats members write storage" on storage.objects for insert
  with check (bucket_id = 'oakoats' and exists (select 1 from workspace_members m where m.user_id = auth.uid()));
create policy "oak oats members update storage" on storage.objects for update
  using (bucket_id = 'oakoats' and exists (select 1 from workspace_members m where m.user_id = auth.uid()));
create policy "oak oats members delete storage" on storage.objects for delete
  using (bucket_id = 'oakoats' and exists (select 1 from workspace_members m where m.user_id = auth.uid()));
