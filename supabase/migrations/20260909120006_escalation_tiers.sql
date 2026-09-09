-- Druga eskalacja (sekcja 36/62): dodaje mocniejszy model OpenAI dla ról
-- quality_gate i product_analysis, żeby Model Router miał realny "silniejszy"
-- wariant do wyboru przy niskiej pewności / wyniku blisko progu, a nie tylko
-- ten sam model uruchamiany po raz drugi.
insert into model_catalog (provider, model_id, purpose, input_token_price, output_token_price, image_input_price, image_output_price, price_unit, quality, currency, source_url, last_verified_at, active)
values
  ('openai', 'gpt-5.5', 'quality_gate', 0.0025, 0.01, null, null, 'per_1k_tokens', 'eskalacja: niska pewność lub wynik blisko progu w pierwszym przebiegu', 'USD', 'https://platform.openai.com/docs/models', now(), true),
  ('openai', 'gpt-5.5', 'product_analysis', 0.0025, 0.01, null, null, 'per_1k_tokens', 'druga eskalacja: bardzo złożony/personalizowany produkt', 'USD', 'https://platform.openai.com/docs/models', now(), true)
on conflict do nothing;
