-- Migracja 20260909120001 tworzyła dwa klucze obce product_references.product_id -> products.id
-- (jeden inline, jeden przez ALTER TABLE), co powodowało niejednoznaczność relacji w PostgREST
-- ("more than one relationship was found"). Usuwamy zbędny duplikat.
alter table product_references drop constraint if exists product_references_product_fk;
