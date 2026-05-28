-- ────────────────────────────────────────────────────────────────────
--  HEXA — Seed reference data
--  GCSE specification anchors for Phase 1 hardcoded routing
-- ────────────────────────────────────────────────────────────────────

insert into public.subject_domains (academic_domain, national_spec_reference) values
  ('mathematics', 'Pearson Edexcel 1MA1'),
  ('english', 'AQA 8700 / 8702'),
  ('science', 'AQA Combined Science Trilogy 8464');

-- A handful of seed topics per subject (not exhaustive — full spec coverage in Phase 2)
with maths as (select id from public.subject_domains where academic_domain = 'mathematics' limit 1),
     english as (select id from public.subject_domains where academic_domain = 'english' limit 1),
     science as (select id from public.subject_domains where academic_domain = 'science' limit 1)
insert into public.topics (subject_id, topic_tag, formal_description, difficulty_tier)
select id, 'number_basics', 'Place value, ordering, rounding, estimating', 1 from maths
union all
select id, 'algebra_linear', 'Linear equations, expressions, identities', 2 from maths
union all
select id, 'geometry_shapes', 'Properties of 2D and 3D shapes, angles', 2 from maths
union all
select id, 'statistics_probability', 'Data handling, probability fundamentals', 3 from maths
union all
select id, 'reading_comprehension', 'Inference, analysis of language and structure', 2 from english
union all
select id, 'writing_creative', 'Narrative and descriptive writing techniques', 2 from english
union all
select id, 'writing_transactional', 'Persuasive and argumentative writing', 3 from english
union all
select id, 'biology_cells', 'Cell structure, transport, division', 2 from science
union all
select id, 'chemistry_atomic', 'Atomic structure and the periodic table', 2 from science
union all
select id, 'physics_forces', 'Forces, motion, Newton''s laws', 3 from science;
