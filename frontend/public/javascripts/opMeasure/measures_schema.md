## OP Measures Schema

The Measure object in metadb has the following schema:

```
        Column        |           Type           |                       Modifiers
----------------------+--------------------------+-------------------------------------------------------
 id                   | integer                  | not null default nextval('measures_id_seq'::regclass)
 lens_id              | integer                  | not null
 data_source_lens_uid | character(9)             |
 metadata             | jsonb                    |
 metric_config        | jsonb                    |
 created_at           | timestamp with time zone |
 created_meta         | character varying(255)   |
 created_meta_type    | character varying(255)   |
 updated_at           | timestamp with time zone |
 updated_meta         | character varying(255)   |
 updated_meta_type    | character varying(255)   |
 deleted_at           | timestamp with time zone |
 deleted_meta         | character varying(255)   |
 deleted_meta_type    | character varying(255)   |
Indexes:
    "pk_measures" PRIMARY KEY, btree (id)
    "measures_lens_id_key" UNIQUE CONSTRAINT, btree (lens_id)
    "measures_data_source_lens_idx" btree (data_source_lens_uid)
    "measures_lens_idx" btree (lens_id)
Foreign-key constraints:
    "measures_lens_id_fkey" FOREIGN KEY (lens_id) REFERENCES lenses(id)
```

When working with the measure in the Frontend, the JSON will look like:

```
{
  lensId: Integer,
  dataSourceLensUid: String,
  metadata: {
    methods: String,
    analysis: String
  },
  metricConfig: {
    type: String,
    arguments: {
      # See 'arguments' section
    },
    display: {
      decimalPlaces: Integer,
      asPercent: Boolean
    }
  }
}
```

## Arguments

The set of arguments can change based on the type of calculation (`metricConfig.type`) that is being performed.

### For COUNT
```
{
  arguments: {
    column: String,
    includeNullValues: Boolean
  }
}
```

### For SUM
```
{
  arguments: {
    column: String
  }
}
```

### For RECENT VALUE
```
{
  arguments: {
    valueColumn: String,
    dateColumn: String
  }
}
```

### For RATE
```
{
  arguments: {
    aggregationType: String, // ['count' or 'sum']
    numeratorColumn: String,
    denominatorColumn: String, // [not provided if `fixedDenominator`is set]
    fixedDenominator: String,  // should be parsable number
    numeratorColumnCondition: Filter Object // See https://github.com/socrata/platform-ui/blob/master/common/visualizations/VIF.md#appendix-soql-filter-objects
    numeratorExcludeNullValues: Boolean,    // only relevant if aggregationType == 'count'
    denominatorExcludeNullValues: Boolean    // only relevant if aggregationType == 'count' && denominatorColumn is set
  }
}
```
