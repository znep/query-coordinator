# Custom reporting with Storyteller DB and MetaDB

A guide to reports that require queries across two databases.

> **TIP:** Results can be saved to a file by inserting the SELECT statement
> (without the final semicolon) in place of `<query>` in this template:
> `COPY (<query>) TO ~/some-filename.csv (format csv, delimiter ',');`.

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
