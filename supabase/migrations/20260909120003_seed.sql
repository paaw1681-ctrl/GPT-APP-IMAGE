-- Seed: workspace Oak & Oats, kategorie, rule packi, brand profile, katalog modeli,
-- routing, moduły promptu i pierwsza opublikowana wersja promptu.
-- Członkostwo (workspace_members) jest tworzone automatycznie przy pierwszym logowaniu
-- allowlistowanego użytkownika (patrz app/(auth)/auth/callback), nie tutaj.

insert into workspaces (id, name, slug)
values ('00000000-0000-0000-0000-000000000001', 'Oak & Oats', 'oak-oats')
on conflict (id) do nothing;

insert into brand_profiles (workspace_id, name, tone_of_voice, positioning, content_voice, language, global_visual_rules, forbidden_cliches, verified_brand_facts)
values (
  '00000000-0000-0000-0000-000000000001',
  'Oak & Oats',
  'ciepły, ale rzeczowy; mówimy jak doświadczona rzemieślniczka do świadomej mamy, bez zdrobnień i przesłodzenia',
  'polska manufaktura akcesoriów dla niemowląt: gryzaki drewniano-silikonowe, zawieszki do smoczka, personalizacja IMIENNE, biżuteria sensoryczna dla mam. Slow, naturalne, premium, polskie rękodzieło.',
  'pierwsza osoba liczby mnogiej ("robimy", "u nas"), konkretne fakty zamiast ogólników, brak emoji w opisach sklepowych',
  'pl',
  '{"materials_default": "silikon spożywczy LFGB + drewno bukowe bez lakieru, podwójne nawlekanie", "avoid_default_palette": true, "note": "Nie sprowadzaj każdej sceny do beżu, lnu i suszonych kwiatów - dobieraj świat do konkretnego zdjęcia."}'::jsonb,
  '["beżowa kanapa z lnianym pledem", "wystudiowana skandynawska sypialnia", "suszone kwiaty w tle", "permanentny ciepły golden-hour grading", "generyczna influencerka AI o idealnej skórze"]'::jsonb,
  '["silikon spożywczy klasy LFGB", "drewno bukowe bez lakieru", "podwójne nawlekanie elementów", "produkcja ręczna w Polsce"]'::jsonb
)
on conflict do nothing;

insert into product_types (workspace_id, key, label_pl, is_default, sort_order)
values
  ('00000000-0000-0000-0000-000000000001', 'naszyjnik_sensoryczny', 'Naszyjnik sensoryczny', true, 1),
  ('00000000-0000-0000-0000-000000000001', 'gryzak', 'Gryzak', true, 2),
  ('00000000-0000-0000-0000-000000000001', 'zawieszka_smoczka', 'Zawieszka do smoczka', true, 3),
  ('00000000-0000-0000-0000-000000000001', 'brelok_wristlet', 'Brelok / wristlet', true, 4),
  ('00000000-0000-0000-0000-000000000001', 'bag_charm', 'Bag charm', true, 5),
  ('00000000-0000-0000-0000-000000000001', 'zestaw', 'Zestaw', true, 6),
  ('00000000-0000-0000-0000-000000000001', 'inny', 'Inny', true, 99)
on conflict do nothing;

insert into audience_contexts (workspace_id, key, label_pl, sort_order)
values
  ('00000000-0000-0000-0000-000000000001', 'dziecko', 'Dziecko', 1),
  ('00000000-0000-0000-0000-000000000001', 'mama_dziecko', 'Mama + dziecko', 2),
  ('00000000-0000-0000-0000-000000000001', 'kobieta', 'Kobieta', 3),
  ('00000000-0000-0000-0000-000000000001', 'dorosly_unisex', 'Dorosły / unisex', 4),
  ('00000000-0000-0000-0000-000000000001', 'uniwersalny', 'Uniwersalny', 5)
on conflict do nothing;

-- Product Rule Packs (v1, published)
insert into product_rule_packs (workspace_id, product_type_id, version, status, rules, published_at)
select '00000000-0000-0000-0000-000000000001', pt.id, 1, 'published', rules_json, now()
from product_types pt
join (values
  ('gryzak', '{
    "typical_usage": "gryzienie przez niemowlę w okresie ząbkowania, trzymany w dłoni lub zawieszony na wstążce/klipsie",
    "correct_attachment": "trzymany bezpośrednio przez dziecko lub zapięty na klipsie do ubranka/wózka",
    "relevant_subjects": ["niemowlę", "dziecko w wieku ząbkowania", "dłoń dorosłego podającego zabawkę"],
    "lifestyle_rules": "kontekst adekwatny do wieku dziecka, naturalna sytuacja domowa lub spacerowa",
    "child_context_rules": "produkt dziecięcy - zawsze pokazywany w bezpiecznym, wiarygodnym kontekście użycia przez niemowlę",
    "adult_context_rules": "dorosły może się pojawić jako opiekun podający/trzymający produkt, nigdy jako główny użytkownik",
    "critical_product_features": ["dokładna liczba i kolejność elementów", "kształt części drewnianych i silikonowych", "typ sznurka/wstążki"],
    "forbidden_transformations": ["nie zmieniaj liczby elementów", "nie zamieniaj drewna na plastik", "nie dodawaj ostrych krawędzi"],
    "forbidden_usage": ["nie prezentuj jako biżuterii dla dorosłych", "nie prezentuj jako breloka do torebki"],
    "prompt_additions": "Pokaż realistyczne ślady użycia adekwatne do zabawki niemowlęcej (delikatne zaśliniennie jest dopuszczalne), nigdy nie jak nowy produkt na sterylnym tle reklamowym."
  }'::jsonb),
  ('naszyjnik_sensoryczny', '{
    "typical_usage": "noszony przez dorosłą kobietę (mamę) jako biżuteria sensoryczna, dziecko może go dotykać/pociągać podczas noszenia na sobie",
    "correct_attachment": "zawieszony na szyi dorosłej osoby, zapięcie z tyłu karku",
    "relevant_subjects": ["dorosła kobieta", "mama z dzieckiem w ramionach lub blisko"],
    "lifestyle_rules": "może wyglądać jak atrakcyjna, świadoma biżuteria - nie tylko funkcjonalny gadżet",
    "child_context_rules": "dziecko może sięgać/dotykać naszyjnika na mamie, ale to NIE jest zabawka dziecięca sama w sobie",
    "adult_context_rules": "pełnoprawna biżuteria dorosłej kobiety - dopuszczalne stylizacje modowe, editorial",
    "critical_product_features": ["kolejność i kolor koralików", "typ i kolor zapięcia", "długość sznurka"],
    "forbidden_transformations": ["nie zmieniaj kolejności koralików", "nie zmieniaj typu zapięcia", "nie zmieniaj długości"],
    "forbidden_usage": ["nie sprowadzaj automatycznie do zabawki dziecięcej leżącej w kojcu"],
    "prompt_additions": "Naszyjnik ma naturalnie leżeć na dekolcie/szyi zgodnie z fizyką - może być lekko przekrzywiony, częściowo zasłonięty włosami."
  }'::jsonb),
  ('zawieszka_smoczka', '{
    "typical_usage": "klips przypięty do ubranka niemowlęcia, smoczek zawieszony na klipsie",
    "correct_attachment": "metalowy/plastikowy klips zapięty na tkaninie ubranka lub szelkach wózka, drugi koniec trzyma smoczek",
    "relevant_subjects": ["niemowlę w ubranku", "wózek dziecięcy", "dłoń opiekuna"],
    "lifestyle_rules": "codzienna scena - spacer, dom, samochód, wizyta",
    "child_context_rules": "zawsze w kontekście realnego niemowlęcia noszącego ubranko z klipsem",
    "adult_context_rules": "dorosły tylko jako opiekun w tle, nie jako użytkownik produktu",
    "critical_product_features": ["typ i kolor klipsu", "długość taśmy", "wzór/personalizacja na taśmie"],
    "forbidden_transformations": ["nie zmieniaj typu klipsu", "nie zmieniaj długości taśmy", "nie zmieniaj napisu personalizacji"],
    "forbidden_usage": ["nie pokazuj jako breloka do torebki dorosłej osoby"],
    "prompt_additions": "Klips musi być realistycznie zapięty na materiale, taśma naturalnie zwisająca zgodnie z grawitacją."
  }'::jsonb),
  ('brelok_wristlet', '{
    "typical_usage": "brelok noszony na nadgarstku lub przypięty do kluczy/torby jako akcesorium dorosłej osoby",
    "correct_attachment": "pętla wristlet na nadgarstku lub karabińczyk/kółko przy kluczach",
    "relevant_subjects": ["dorosła kobieta", "dłoń trzymająca klucze lub torebkę"],
    "lifestyle_rules": "codzienne wyjście z domu - klucze, zakupy, spacer",
    "child_context_rules": "nie dotyczy - to produkt dla dorosłego, dziecko może być w tle sceny rodzinnej ale nie używa breloka",
    "adult_context_rules": "naturalny dodatek stylizacji dorosłej kobiety",
    "critical_product_features": ["typ zapięcia/karabińczyka", "liczba i układ elementów", "kolorystyka"],
    "forbidden_transformations": ["nie zmieniaj typu zapięcia", "nie zmieniaj liczby elementów"],
    "forbidden_usage": ["nie traktuj automatycznie jako bag charm przy torebce - to osobny kontekst noszenia"],
    "prompt_additions": "Naturalne zawieszenie zgodne z grawitacją przy nadgarstku lub kluczach, realistyczne odbicia światła na metalowych elementach."
  }'::jsonb),
  ('bag_charm', '{
    "typical_usage": "zawieszony na torebce lub plecaku jako ozdobny akcesorium",
    "correct_attachment": "karabińczyk zapięty na uchwycie torebki/plecaka",
    "relevant_subjects": ["dorosła kobieta z torebką", "torebka lub plecak w kadrze"],
    "lifestyle_rules": "miejska scena, wyjście, spacer, kawiarnia - torebka jest naturalnym elementem kadru",
    "child_context_rules": "nie dotyczy bezpośrednio, dziecko może być obecne w scenie rodzinnej",
    "adult_context_rules": "dodatek modowy dorosłej kobiety",
    "critical_product_features": ["typ karabińczyka", "liczba i układ zawieszek", "kolorystyka"],
    "forbidden_transformations": ["nie zmieniaj typu karabińczyka", "nie zmieniaj liczby zawieszek"],
    "forbidden_usage": ["nie traktuj automatycznie jako wristlet na nadgarstku - naturalne miejsce to torebka/plecak"],
    "prompt_additions": "Bag charm musi wisieć swobodnie przy uchwycie torby, z realistycznym cieniem kontaktowym na materiale torby."
  }'::jsonb),
  ('zestaw', '{
    "typical_usage": "kilka produktów prezentowanych razem, np. w opakowaniu prezentowym lub jako komplet",
    "correct_attachment": "zależnie od poszczególnych elementów zestawu",
    "relevant_subjects": ["mama i dziecko", "opakowanie prezentowe"],
    "lifestyle_rules": "scena prezentowa/flat lay lub użycie kilku elementów naraz",
    "child_context_rules": "elementy dziecięce w zestawie pokazywane w kontekście dziecięcym",
    "adult_context_rules": "elementy dla dorosłych pokazywane w kontekście dorosłego użytkownika",
    "critical_product_features": ["liczba elementów w zestawie", "zgodność każdego elementu z osobna"],
    "forbidden_transformations": ["nie pomijaj żadnego elementu zestawu", "nie zmieniaj proporcji między elementami"],
    "forbidden_usage": [],
    "prompt_additions": "Każdy element zestawu musi zachować własną tożsamość wizualną 1:1."
  }'::jsonb),
  ('inny', '{
    "typical_usage": "do ustalenia na podstawie analizy referencji",
    "correct_attachment": "do ustalenia na podstawie analizy referencji",
    "relevant_subjects": [],
    "lifestyle_rules": "dobierz świat sceny na podstawie faktycznego charakteru produktu",
    "child_context_rules": "",
    "adult_context_rules": "",
    "critical_product_features": [],
    "forbidden_transformations": [],
    "forbidden_usage": [],
    "prompt_additions": ""
  }'::jsonb)
) as v(key, rules_json) on v.key = pt.key
where pt.workspace_id = '00000000-0000-0000-0000-000000000001'
on conflict do nothing;

-- Prompt modules v1 (published) — moduły A..J silnika promptu.
insert into prompt_modules (workspace_id, module_key, version, title, content, status, published_at)
values
('00000000-0000-0000-0000-000000000001', 'A', 1, 'Hard Product Identity Lock',
 'PRAWDA WIZUALNA: dołączone zdjęcia referencyjne przedstawiają prawdziwy, istniejący produkt i są jedynym źródłem prawdy o jego wyglądzie. Nigdy nie: przeprojektowuj, upraszczaj, reinterpretuj, nie usuwaj ani nie dodawaj elementów, nie zmieniaj ich kolejności, kolorów, liczby koralików, kształtów, rozmiarów względnych, drewna, silikonu, zapięcia, sznurka, okuć, liternictwa, graweru ani personalizacji, nie zmieniaj proporcji. Nie uogólniaj konkretnego produktu do generycznego produktu tej samej kategorii. Piękny obraz z nieprawidłowym produktem to obraz nieudany.',
 'published', now()),
('00000000-0000-0000-0000-000000000001', 'B', 1, 'Product Rule Pack', '{{RULE_PACK}}', 'published', now()),
('00000000-0000-0000-0000-000000000001', 'C', 1, 'Photo Type Rules', '{{PHOTO_TYPE_RULES}}', 'published', now()),
('00000000-0000-0000-0000-000000000001', 'D', 1, 'Audience / Usage Context', '{{AUDIENCE_CONTEXT}}', 'published', now()),
('00000000-0000-0000-0000-000000000001', 'E', 1, 'Photographic Realism',
 'Zdjęcie ma wyglądać jak prawdziwa fotografia wykonana aparatem, nie jak wygenerowana grafika reklamowa. Prawdziwa skóra z naturalnymi niedoskonałościami, naturalne włosy, realne fałdy ubrania, prawdziwe dłonie o poprawnej anatomii, naturalna postawa ciała. Unikaj: plastikowej skóry, sztucznie symetrycznych twarzy, nienaturalnie idealnego oświetlenia studyjnego wszędzie, efektu "generycznej AI modelki". Dopuszczalne subtelne niedoskonałości i asymetrie zgodne z fizyką rzeczywistego świata.',
 'published', now()),
('00000000-0000-0000-0000-000000000001', 'F', 1, 'Selected Scenario', '{{SCENARIO}}', 'published', now()),
('00000000-0000-0000-0000-000000000001', 'G', 1, 'Anti-Repetition', '{{ANTI_REPETITION}}', 'published', now()),
('00000000-0000-0000-0000-000000000001', 'H', 1, 'Purpose / Aspect Rules', '{{PURPOSE_ASPECT}}', 'published', now()),
('00000000-0000-0000-0000-000000000001', 'I', 1, 'User Optional Note', '{{USER_NOTE}}', 'published', now()),
('00000000-0000-0000-0000-000000000001', 'J', 1, 'Final Validation Reminder',
 'Przed oddaniem wyniku sprawdź w myślach: czy liczba, kolejność, kolory i kształty elementów produktu dokładnie odpowiadają zdjęciom referencyjnym; czy widoczny tekst/personalizacja jest identyczny co do liter i kolejności; czy zapięcie i sznurek/taśma są tego samego typu co w referencji; czy scena wygląda jak prawdziwe zdjęcie, a nie reklama AI. Jeśli którykolwiek warunek nie jest spełniony, priorytetem jest zgodność produktu, nie efektowność sceny.',
 'published', now())
on conflict do nothing;

insert into prompt_versions (workspace_id, name, module_versions, status, published_at)
select '00000000-0000-0000-0000-000000000001', 'v1 — baseline', jsonb_object_agg(module_key, version), 'published', now()
from prompt_modules
where workspace_id = '00000000-0000-0000-0000-000000000001' and version = 1
group by workspace_id
on conflict do nothing;

-- Model catalog: providery mock (darmowe, do developmentu) oraz realne modele OpenAI
-- (zweryfikowane w bieżącym SDK openai@7.x — sekcja 41/62/63 zadania).
insert into model_catalog (provider, model_id, purpose, input_token_price, output_token_price, image_input_price, image_output_price, price_unit, quality, currency, source_url, last_verified_at, active)
values
  ('mock', 'mock-text', 'product_analysis', 0, 0, 0, 0, 'per_1k_tokens', 'mock', 'USD', null, now(), true),
  ('mock', 'mock-text', 'scenario', 0, 0, 0, 0, 'per_1k_tokens', 'mock', 'USD', null, now(), true),
  ('mock', 'mock-text', 'prompt_builder', 0, 0, 0, 0, 'per_1k_tokens', 'mock', 'USD', null, now(), true),
  ('mock', 'mock-image', 'prototype_image', 0, 0, 0, 0, 'per_image', 'mock', 'USD', null, now(), true),
  ('mock', 'mock-image', 'final_image', 0, 0, 0, 0, 'per_image', 'mock', 'USD', null, now(), true),
  ('mock', 'mock-vision', 'quality_gate', 0, 0, 0, 0, 'per_1k_tokens', 'mock', 'USD', null, now(), true),
  ('mock', 'mock-text', 'trend_research', 0, 0, 0, 0, 'per_1k_tokens', 'mock', 'USD', null, now(), true),
  ('mock', 'mock-text', 'content', 0, 0, 0, 0, 'per_1k_tokens', 'mock', 'USD', null, now(), true),
  ('openai', 'gpt-5.4-mini', 'product_analysis', 0.00025, 0.002, null, null, 'per_1k_tokens', 'tani, wystarczający przy wysokim confidence', 'USD', 'https://platform.openai.com/docs/models', now(), true),
  ('openai', 'gpt-5.2', 'product_analysis', 0.0011, 0.0044, null, null, 'per_1k_tokens', 'eskalacja: niskie confidence / personalizacja / skomplikowany produkt', 'USD', 'https://platform.openai.com/docs/models', now(), true),
  ('openai', 'gpt-5.4-mini', 'scenario', 0.00025, 0.002, null, null, 'per_1k_tokens', 'tani model tekstowy', 'USD', 'https://platform.openai.com/docs/models', now(), true),
  ('openai', 'gpt-5.4-mini', 'prompt_builder', 0.00025, 0.002, null, null, 'per_1k_tokens', 'deterministyczne składanie promptu', 'USD', 'https://platform.openai.com/docs/models', now(), true),
  ('openai', 'gpt-image-2.5-flare', 'prototype_image', null, null, null, null, 'per_image', 'szybszy, ekonomiczny prototyp', 'USD', 'https://platform.openai.com/docs/guides/image-generation', now(), true),
  ('openai', 'gpt-image-2.5-sunburst', 'final_image', null, null, null, null, 'per_image', 'maksymalna precyzja, wersja finalna', 'USD', 'https://platform.openai.com/docs/guides/image-generation', now(), true),
  ('openai', 'gpt-5.2', 'quality_gate', 0.0011, 0.0044, null, null, 'per_1k_tokens', 'vision review porównujący referencje z finałem', 'USD', 'https://platform.openai.com/docs/models', now(), true),
  ('openai', 'gpt-5.2', 'trend_research', 0.0011, 0.0044, null, null, 'per_1k_tokens', 'z narzędziem web_search', 'USD', 'https://platform.openai.com/docs/models', now(), true),
  ('openai', 'gpt-5.4-mini', 'content', 0.00025, 0.002, null, null, 'per_1k_tokens', 'copywriting sklep/social', 'USD', 'https://platform.openai.com/docs/models', now(), true)
on conflict do nothing;

insert into routing_policies (workspace_id, role_key, model_catalog_id, fallback_model_catalog_id, escalation_rule, status, published_at)
select '00000000-0000-0000-0000-000000000001', r.role_key, m.id, fb.id, r.escalation_rule, 'published', now()
from (values
  ('product_analysis', 'mock', 'mock-text', 'gdy confidence niskie, personalizacja lub złożony produkt -> eskaluj do mocniejszego modelu tej samej roli'),
  ('scenario', 'mock', 'mock-text', null),
  ('prompt_builder', 'mock', 'mock-text', null),
  ('prototype_image', 'mock', 'mock-image', null),
  ('final_image', 'mock', 'mock-image', null),
  ('quality_gate', 'mock', 'mock-vision', 'gdy wynik blisko progu lub sprzeczne sygnały -> drugi przebieg'),
  ('trend_research', 'mock', 'mock-text', null),
  ('content', 'mock', 'mock-text', null)
) as r(role_key, provider, model_id, escalation_rule)
join model_catalog m on m.provider = r.provider and m.model_id = r.model_id and m.purpose = r.role_key
left join model_catalog fb on fb.purpose = r.role_key and fb.provider = 'openai' and fb.model_id = (
  case r.role_key
    when 'product_analysis' then 'gpt-5.4-mini'
    when 'scenario' then 'gpt-5.4-mini'
    when 'prompt_builder' then 'gpt-5.4-mini'
    when 'prototype_image' then 'gpt-image-2.5-flare'
    when 'final_image' then 'gpt-image-2.5-sunburst'
    when 'quality_gate' then 'gpt-5.2'
    when 'trend_research' then 'gpt-5.2'
    when 'content' then 'gpt-5.4-mini'
  end
)
on conflict do nothing;

insert into budgets (workspace_id, month, monthly_limit_pln_cents, hard_limit_enabled)
values ('00000000-0000-0000-0000-000000000001', date_trunc('month', current_date)::date, 10000, false)
on conflict do nothing;
