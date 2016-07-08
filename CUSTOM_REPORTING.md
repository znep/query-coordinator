# Custom reporting with Storyteller DB and MetaDB

A guide to reports that require queries across two databases.

> **TIP:** Results can be saved to a file by inserting the SELECT statement (without the final semicolon) in place of `<query>` in this template: `COPY (<query>) TO ~/some-filename.csv WITH CSV DELIMITER ',';`.

## How many stories have been published on each domain?

First, get a comma-separated list of quoted UIDs corresponding to each published story:

```
-- in storyteller db
SELECT string_agg(DISTINCT quote_literal(ps.uid), ',')
FROM published_stories ps
WHERE ps.deleted_at IS NULL;
```

Then, insert the results of that query in place of `<uids>` in this template:

```
-- in metadb
SELECT d.cname, count(l.uid)
FROM domains d, blists b, lenses l
WHERE l.blist_id = b.id
  AND b.domain_id = d.id
  AND l.deleted_at IS NULL
  AND l.uid IN (<uids>)
GROUP BY d.cname;
```

## How many stories with at least one visualization have been published on each domain?

First, get a comma-separated list of quoted UIDs corresponding to each published story with a block containing a visualization:

```
-- in storyteller db
SELECT string_agg(DISTINCT quote_literal(ps.uid), ',')
FROM (
  SELECT DISTINCT ON (uid) uid, block_ids
  FROM published_stories
  WHERE deleted_at IS NULL
  ORDER BY uid, created_at DESC
) ps, (
  SELECT id, jsonb_array_elements(components) AS components
  FROM blocks
  WHERE deleted_at IS NULL
) block_comps
WHERE block_comps.components->>'type' LIKE 'socrata.visualization.%'
  AND block_comps.id = ANY(ps.block_ids);
```

Then, insert the results of that query in place of `<uids>` in this template:

```
-- in metadb
SELECT d.cname, count(l.uid)
FROM domains d, blists b, lenses l
WHERE l.blist_id = b.id
  AND b.domain_id = d.id
  AND l.deleted_at IS NULL
  AND l.uid IN (<uids>)
GROUP BY d.cname;
```

## Which users have created stories in a given timeframe?

First, get a comma-separated list of quoted UIDs corresponding to each draft or published story, providing the range of dates with `<start>` and `<end>`:

```
-- in storyteller db
SELECT string_agg(DISTINCT quote_literal(uid), ',')
FROM (
  SELECT DISTINCT ON (uid) uid, created_at
  FROM published_stories
  WHERE deleted_at IS NULL
    AND created_at BETWEEN '<start>' AND '<end>'
  UNION
  SELECT DISTINCT ON (uid) uid, created_at
  FROM draft_stories
  WHERE deleted_at IS NULL
    AND created_at BETWEEN '<start>' AND '<end>'
  ORDER BY uid, created_at DESC
) stories_in_timeframe;
```

> Dates will default to midnight unless a time is provided, e.g. `'2001-01-01T12:34:56`. An end value of `NOW()` is also acceptable.
>
> For filtering to published stories only, use only the first half of the above inner query (i.e. remove the section `UNION ... BETWEEN '<start>' AND '<end>'`).

Then insert the results of that query in place of `<uids>` in this template:

```
-- in metadb
SELECT DISTINCT u.email, u.screen_name, d.cname, string_agg(l.uid, ',')
FROM domains d, blists b, lenses l, users u
WHERE l.blist_id = b.id
  AND b.domain_id = d.id
  AND b.user_id = u.id
  AND l.deleted_at IS NULL
  AND l.uid IN (<uids>)
GROUP BY u.email, u.screen_name, d.cname;
```
