import { parseDate } from 'lib/parseDate';
import _ from 'lodash';

// POST to dsmapLinks.sourceCreate  decoders
export function normalizeCreateSourceResponse(resource) {
  return {
    source: getNormalizedSource(resource),
    inputSchemas: getNormalizedInputSchemas(resource),
    inputColumns: getNormalizedInputColumns(resource),
    outputSchemas: getNormalizedOutputSchemas(resource),
    outputColumns: getNormalizedOutputColumns(resource),
    outputSchemaColumns: getNormalizedOutputSchemaColumns(resource),
    transforms: getNormalizedTransforms(resource)
  };
}

function getNormalizedSource(resource) {
  if (resource.type === 'fake') {
    return {};
  }

  return {
    [resource.id]: {
      ..._.omit(resource, 'schemas'),
      created_at: parseDate(resource.created_at),
      finished_at: resource.finished_at ? parseDate(resource.finished_at) : null,
      failed_at: resource.failed_at ? parseDate(resource.failed_at) : null,
      created_by: resource.created_by
    }
  };
}

function getNormalizedInputSchemas(resource) {
  return resource.schemas
    .map(schema => ({
      id: schema.id,
      name: schema.name,
      total_rows: schema.total_rows,
      source_id: resource.id,
      num_row_errors: 0
    }))
    .reduce(
      (acc, a) => ({
        [a.id]: a,
        ...acc
      }),
      {}
    );
}

function getNormalizedInputColumns(resource) {
  return _.flatMap(resource.schemas, is => is.input_columns).reduce(
    (acc, ic) => ({
      [ic.id]: ic,
      ...acc
    }),
    {}
  );
}

function getNormalizedOutputSchemas(resource) {
  // TODO: ok to grab created_by from the source? the one on the output schema
  // seems to be null on view sources

  return _.flatMap(resource.schemas, is => is.output_schemas).reduce(
    (acc, os) => ({
      [os.id]: {
        ..._.omit(os, 'output_columns'),
        created_by: resource.created_by
      }
    }),
    {}
  );
}

function getNormalizedOutputColumns(resource) {
  return _.chain(resource.schemas)
    .flatMap(is => is.output_schemas)
    .flatMap(os => os.output_columns)
    .reduce(
      (acc, oc) => ({
        [oc.id]: {
          ..._.omit(oc, 'transform'),
          transform_id: oc.transform.id
        },
        ...acc
      }),
      {}
    )
    .value();
}

function getNormalizedOutputSchemaColumns(resource) {
  return _.chain(resource.schemas)
    .flatMap(is => is.output_schemas)
    .flatMap(os =>
      os.output_columns.map(oc => ({
        ...oc,
        os_id: os.id
      }))
    )
    .reduce(
      (acc, oc) => ({
        [`${oc.os_id}-${oc.id}`]: {
          id: `${oc.os_id}-${oc.id}`,
          output_schema_id: oc.os_id,
          output_column_id: oc.id,
          is_primary_key: oc.is_primary_key
        },
        ...acc
      }),
      {}
    )
    .value();
}

function getNormalizedTransforms(resource) {
  let totalRows;

  return _.chain(resource.schemas)
    .flatMap(is => {
      totalRows = is.total_rows;
      return is.output_schemas;
    })
    .flatMap(os => os.output_columns)
    .map(oc => oc.transform)
    .reduce(
      (acc, transform) => ({
        [transform.id]: {
          ...transform,
          error_indicies: [],
          contiguous_rows_processed: transform.completed_at ? totalRows : 0
        },
        ...acc
      }),
      {}
    )
    .value();
}
