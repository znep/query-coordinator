import uuid from 'uuid';
import _ from 'lodash';
import { apiCallStarted, apiCallSucceeded, apiCallFailed } from 'reduxStuff/actions/apiCalls';
import * as dsmapiLinks from 'dsmapiLinks';
import { socrataFetch, checkStatus, getJson } from 'lib/http';
import { parseDate } from 'lib/parseDate';

export const CREATE_SOURCE = 'CREATE_SOURCE';
export const CREATE_SOURCE_SUCCESS = 'CREATE_SOURCE_SUCCESS';

function createSource(sourceType, params) {
  return dispatch => {
    const callId = uuid();

    const call = {
      operation: CREATE_SOURCE,
      callParams: {
        source_type: sourceType
      }
    };

    dispatch(apiCallStarted(callId, call));

    return socrataFetch(dsmapiLinks.sourceCreate(params), {
      method: 'POST',
      body: JSON.stringify({
        source_type: { type: sourceType }
      })
    })
      .then(checkStatus)
      .then(getJson)
      .then(resp => {
        const { resource } = resp;

        dispatch(apiCallSucceeded(callId));

        return resource;
      })
      .catch(err => {
        dispatch(apiCallFailed(callId, err));
        throw err;
      });
  };
}

export function createViewSource(params) {
  // TODO: handle error
  return dispatch => {
    dispatch(createSource('view', params))
      .then(normalizeCreateSourceResponse)
      .then(resp => dispatch(createSourceSuccess(resp)));
  };
}

function createSourceSuccess(payload) {
  return {
    type: CREATE_SOURCE_SUCCESS,
    ...payload
  };
}

function normalizeCreateSourceResponse(resource) {
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
  // TODO: ok to grab created_by from the input schema? the one on the output schema
  // always seems to be null

  return _.flatMap(resource.schemas, is => is.input_columns).reduce(
    (acc, os) => ({
      [os.id]: {
        ...os,
        created_by: resource.schemas.created_by
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
          ...oc,
          transform: oc.transform.id
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
  return _.chain(resource.schemas)
    .flatMap(is => is.output_schemas)
    .flatMap(os => os.output_columns)
    .map(oc => oc.transform)
    .reduce(
      (acc, transform) => ({
        [transform.id]: transform,
        ...acc
      }),
      {}
    )
    .value();
}
