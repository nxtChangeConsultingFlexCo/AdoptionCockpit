-- Serverseitige, anonyme Benchmark-Berechnung: nie einzelne Zeilen an
-- den Client, nur aggregierte Mediane. security definer umgeht dafür
-- bewusst die sonst strikte RLS auf assessments (Nutzer sehen normal nur
-- eigene Zeilen) - diese Funktion liefert ausschließlich Aggregate.
-- Nur registrierte, abgeschlossene Assessments desselben Templates
-- fließen ein (user_id is not null); Gast-Einreichungen nicht.
create function public.get_template_benchmark(p_template_id uuid)
returns table (
  sample_size bigint,
  median_total_score numeric,
  median_datenqualitaet numeric,
  median_prozessklarheit numeric,
  median_kulturelle_akzeptanz numeric,
  median_governance_compliance numeric
)
language sql
security definer
stable
set search_path = public
as $$
  select
    count(*) as sample_size,
    percentile_cont(0.5) within group (order by total_score) as median_total_score,
    percentile_cont(0.5) within group (order by (scores ->> 'datenqualitaet')::numeric) as median_datenqualitaet,
    percentile_cont(0.5) within group (order by (scores ->> 'prozessklarheit')::numeric) as median_prozessklarheit,
    percentile_cont(0.5) within group (order by (scores ->> 'kulturelle_akzeptanz')::numeric) as median_kulturelle_akzeptanz,
    percentile_cont(0.5) within group (order by (scores ->> 'governance_compliance')::numeric) as median_governance_compliance
  from public.assessments
  where template_id = p_template_id
    and status = 'completed'
    and user_id is not null;
$$;

comment on function public.get_template_benchmark(uuid) is
  'Aggregierter, anonymer Median-Vergleich je Template. Nur registrierte, abgeschlossene Assessments zählen.';

-- Nur für angemeldete Nutzer aufrufbar (Vergleich ist ein Vorteil für
-- registrierte User, siehe Ziel-Beschreibung).
grant execute on function public.get_template_benchmark(uuid) to authenticated;
