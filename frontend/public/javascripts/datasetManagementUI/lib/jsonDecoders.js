import { parseDate } from 'datasetManagementUI/lib/parseDate';
import _ from 'lodash';

// DSMUI's client-side db requires a lot of client-side parsing and normalizing of
// json responses. This module is intended as a central place to do this parsing/normalizing.
// Eventually we may be able to standardize that and / or substitute a library like Normalizr
// for the functions here

// EXTRACTORS
// TODO: actually use the num_row_errors response from server when it gets added
function extractInputSchemas(source) {
  return source.schemas.map(schema => ({
    id: schema.id,
    name: schema.name,
    total_rows: schema.total_rows,
    source_id: source.id,
    num_row_errors: schema.num_row_errors || 0
  }));
}

function extractInputColumns(source) {
  return _.flatMap(source.schemas, is => is.input_columns);
}

function extractOutputSchemas(source) {
  // TODO: ok to grab created_by from the source? the one on the output schema
  // seems to be null on view sources

  return _.flatMap(source.schemas, is =>
    is.output_schemas.map(os => ({
      ...os,
      created_by: source.created_by
    }))
  );
}

function extractOutputColumns(resource) {
  return _.chain(resource.schemas)
    .flatMap(is => is.output_schemas)
    .flatMap(os => os.output_columns)
    .value();
}

function extractOutputSchemaColumns(resource) {
  return _.chain(resource.schemas)
    .flatMap(is => is.output_schemas)
    .flatMap(os =>
      os.output_columns.map(oc => ({
        ...oc,
        os_id: os.id
      }))
    )
    .value();
}

// NORMALIZERS
function normalizeInputSchemas(iss) {
  return iss.reduce(
    (acc, a) => ({
      [a.id]: a,
      ...acc
    }),
    {}
  );
}

function normalizeInputColumns(ics) {
  return ics.reduce(
    (acc, ic) => ({
      [ic.id]: ic,
      ...acc
    }),
    {}
  );
}

function normalizeOutputSchemas(oss) {
  return oss.reduce(
    (acc, os) => ({
      [os.id]: {
        ..._.omit(os, 'output_columns'),
        created_at: os.created_at ? parseDate(os.created_at) : null,
        finished_at: os.finished_at ? parseDate(os.finished_at) : null
      },
      ...acc
    }),
    {}
  );
}

function normalizeOutputColumns(ocs) {
  return ocs.reduce(
    (acc, oc) => ({
      [oc.id]: {
        ..._.omit(oc, 'transform'),
        transform_id: oc.transform.id
      },
      ...acc
    }),
    {}
  );
}

function normalizeOutputSchemaColumns(ocs) {
  return ocs.reduce(
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
  );
}

function normalizeTransforms(os, totalRows) {
  return os.output_columns.map(oc => oc.transform).reduce(
    (acc, transform) => ({
      [transform.id]: {
        ...transform,
        error_indices: [],
        finished_at: transform.finished_at || os.finished_at,
        contiguous_rows_processed: transform.finished_at ? totalRows : 0
      },
      ...acc
    }),
    {}
  );
}

// createdBy?
function normalizeOutputSchema(os) {
  return {
    [os.id]: {
      ..._.omit(os, 'output_columns'),
      created_at: os.created_at ? parseDate(os.created_at) : null
    }
  };
}

function normalizeSource(resource) {
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
          error_indices: [],
          contiguous_rows_processed: transform.finished_at ? totalRows : 0
        },
        ...acc
      }),
      {}
    )
    .value();
}

const getNormalizedOutputColumns = _.flowRight(normalizeOutputColumns, extractOutputColumns);
const getNormalizedInputSchemas = _.flowRight(normalizeInputSchemas, extractInputSchemas);
const getNormalizedInputColumns = _.flowRight(normalizeInputColumns, extractInputColumns);
const getNormalizedOutputSchemas = _.flowRight(normalizeOutputSchemas, extractOutputSchemas);
const getNormalizedOutputSchemaColumns = _.flowRight(
  normalizeOutputSchemaColumns,
  extractOutputSchemaColumns
);

// PARSERS
// POST to dsmapLinks.sourceCreate
export function normalizeCreateSourceResponse(resource) {
  return {
    source: normalizeSource(resource),
    inputSchemas: getNormalizedInputSchemas(resource),
    inputColumns: getNormalizedInputColumns(resource),
    outputSchemas: getNormalizedOutputSchemas(resource),
    outputColumns: getNormalizedOutputColumns(resource),
    outputSchemaColumns: getNormalizedOutputSchemaColumns(resource),
    transforms: getNormalizedTransforms(resource)
  };
}

// insert_input_schema event on source<id> channel
export function normalizeInsertInputSchemaEvent(is, sourceId) {
  // A little janky, but just mimicking the structure of the create source
  // http response from dsmapi so we can use all the same json parsing functions
  // and the same reducer action. The 'schemas' part of that response is an
  // array of objects with the exact same structure as the payload of this
  // channel message. We don't want to update the source in the redux store though
  // so we just give it an empty object here.
  const resource = {
    id: sourceId,
    created_by: is.created_by,
    schemas: [is]
  };

  return {
    source: {},
    inputSchemas: getNormalizedInputSchemas(resource),
    inputColumns: getNormalizedInputColumns(resource),
    outputSchemas: getNormalizedOutputSchemas(resource),
    outputColumns: getNormalizedOutputColumns(resource),
    outputSchemaColumns: getNormalizedOutputSchemaColumns(resource),
    transforms: getNormalizedTransforms(resource)
  };
}

// POST to dsmapiLinks.newOutputSchema
export function makeNormalizedCreateOutputSchemaResponse(os, totalRows) {
  // have to add output schema id to the output col for normalizeOutputSchemaColumns
  // to work
  const ocs = os.output_columns.map(oc => ({ ...oc, os_id: os.id }));
  return {
    outputSchema: normalizeOutputSchema(os),
    outputColumns: normalizeOutputColumns(os.output_columns),
    transforms: normalizeTransforms(os, totalRows),
    outputSchemaColumns: normalizeOutputSchemaColumns(ocs)
  };
}
