create or replace function public.search_workspace_chunks(
  target_workspace_id uuid,
  query_text text,
  query_embedding text default null,
  search_mode public.search_mode default 'hybrid',
  match_count integer default 10,
  filter_document_id uuid default null,
  filter_tag_id uuid default null,
  filter_created_from date default null,
  filter_created_to date default null
)
returns table (
  chunk_id uuid,
  document_id uuid,
  document_title text,
  document_description text,
  document_summary text,
  document_created_at timestamptz,
  document_updated_at timestamptz,
  chunk_index integer,
  heading text,
  page_number integer,
  snippet text,
  keyword_rank double precision,
  semantic_score double precision,
  hybrid_score double precision,
  matched_keyword boolean,
  matched_semantic boolean,
  tag_names text[]
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with search_input as (
    select
      nullif(trim(query_text), '') as normalized_query,
      case
        when query_embedding is null or trim(query_embedding) = '' then null
        else query_embedding::extensions.vector
      end as vector_query,
      greatest(1, least(match_count, 20)) as result_limit,
      least(greatest(match_count * 6, 24), 240) as candidate_limit
  ),
  prepared_query as (
    select
      normalized_query,
      vector_query,
      case
        when normalized_query is null then null
        else websearch_to_tsquery('english', normalized_query)
      end as ts_query,
      result_limit,
      candidate_limit
    from search_input
  ),
  eligible_documents as (
    select
      d.id,
      d.workspace_id,
      d.title,
      d.description,
      d.summary,
      d.created_at,
      d.updated_at
    from public.documents d
    where d.workspace_id = target_workspace_id
      and d.status = 'indexed'
      and (filter_document_id is null or d.id = filter_document_id)
      and (
        filter_created_from is null
        or d.created_at >= filter_created_from::timestamptz
      )
      and (
        filter_created_to is null
        or d.created_at < (filter_created_to + 1)::timestamptz
      )
      and (
        filter_tag_id is null
        or exists (
          select 1
          from public.document_tag_links dtl
          where dtl.workspace_id = d.workspace_id
            and dtl.document_id = d.id
            and dtl.tag_id = filter_tag_id
        )
      )
  ),
  semantic_matches as (
    select
      c.id as chunk_id,
      row_number() over (
        order by c.embedding <=> pq.vector_query, c.document_id, c.chunk_index
      ) as semantic_rank_position,
      1.0 / (1.0 + (c.embedding <=> pq.vector_query)) as semantic_score
    from public.document_chunks c
    join eligible_documents d
      on d.workspace_id = c.workspace_id
     and d.id = c.document_id
    cross join prepared_query pq
    where search_mode in ('semantic', 'hybrid')
      and pq.vector_query is not null
      and c.embedding is not null
    order by c.embedding <=> pq.vector_query, c.document_id, c.chunk_index
    limit (select candidate_limit from prepared_query)
  ),
  keyword_matches as (
    select
      c.id as chunk_id,
      row_number() over (
        order by
          ts_rank_cd(c.fts, pq.ts_query, 32) desc,
          c.document_id,
          c.chunk_index
      ) as keyword_rank_position,
      ts_rank_cd(c.fts, pq.ts_query, 32) as keyword_rank,
      ts_headline(
        'english',
        c.content,
        pq.ts_query,
        'MaxFragments=2, MaxWords=22, MinWords=10, StartSel=, StopSel='
      ) as snippet
    from public.document_chunks c
    join eligible_documents d
      on d.workspace_id = c.workspace_id
     and d.id = c.document_id
    cross join prepared_query pq
    where search_mode in ('keyword', 'hybrid')
      and pq.ts_query is not null
      and c.fts @@ pq.ts_query
    order by
      ts_rank_cd(c.fts, pq.ts_query, 32) desc,
      c.document_id,
      c.chunk_index
    limit (select candidate_limit from prepared_query)
  ),
  combined_matches as (
    select
      coalesce(k.chunk_id, s.chunk_id) as chunk_id,
      k.keyword_rank,
      s.semantic_score,
      coalesce(1.0 / (60 + k.keyword_rank_position), 0.0)
        + coalesce(1.0 / (60 + s.semantic_rank_position), 0.0) as hybrid_score,
      k.snippet as keyword_snippet,
      k.chunk_id is not null as matched_keyword,
      s.chunk_id is not null as matched_semantic
    from keyword_matches k
    full outer join semantic_matches s
      on s.chunk_id = k.chunk_id
  ),
  ranked_matches as (
    select
      c.id as chunk_id,
      c.document_id,
      d.title as document_title,
      d.description as document_description,
      d.summary as document_summary,
      d.created_at as document_created_at,
      d.updated_at as document_updated_at,
      c.chunk_index,
      c.heading,
      c.page_number,
      case
        when cm.keyword_snippet is not null and char_length(trim(cm.keyword_snippet)) > 0
          then cm.keyword_snippet
        when char_length(c.content) > 320
          then left(c.content, 317) || '...'
        else c.content
      end as snippet,
      cm.keyword_rank,
      cm.semantic_score,
      cm.hybrid_score,
      cm.matched_keyword,
      cm.matched_semantic,
      row_number() over (
        order by
          case
            when search_mode = 'keyword' then coalesce(cm.keyword_rank, 0.0)
            when search_mode = 'semantic' then coalesce(cm.semantic_score, 0.0)
            else cm.hybrid_score
          end desc,
          coalesce(cm.keyword_rank, 0.0) desc,
          coalesce(cm.semantic_score, 0.0) desc,
          d.updated_at desc,
          c.chunk_index
      ) as result_rank
    from combined_matches cm
    join public.document_chunks c
      on c.id = cm.chunk_id
    join eligible_documents d
      on d.workspace_id = c.workspace_id
     and d.id = c.document_id
  )
  select
    rm.chunk_id,
    rm.document_id,
    rm.document_title,
    rm.document_description,
    rm.document_summary,
    rm.document_created_at,
    rm.document_updated_at,
    rm.chunk_index,
    rm.heading,
    rm.page_number,
    rm.snippet,
    rm.keyword_rank,
    rm.semantic_score,
    rm.hybrid_score,
    rm.matched_keyword,
    rm.matched_semantic,
    coalesce(tags.tag_names, array[]::text[]) as tag_names
  from ranked_matches rm
  left join lateral (
    select array_agg(t.name order by t.name) as tag_names
    from public.document_tag_links dtl
    join public.document_tags t
      on t.workspace_id = dtl.workspace_id
     and t.id = dtl.tag_id
    where dtl.workspace_id = target_workspace_id
      and dtl.document_id = rm.document_id
  ) tags on true
  where rm.result_rank <= (select result_limit from prepared_query)
  order by rm.result_rank;
$$;

revoke all on function public.search_workspace_chunks(
  uuid,
  text,
  text,
  public.search_mode,
  integer,
  uuid,
  uuid,
  date,
  date
) from public;

grant execute on function public.search_workspace_chunks(
  uuid,
  text,
  text,
  public.search_mode,
  integer,
  uuid,
  uuid,
  date,
  date
) to authenticated;

grant execute on function public.search_workspace_chunks(
  uuid,
  text,
  text,
  public.search_mode,
  integer,
  uuid,
  uuid,
  date,
  date
) to service_role;
