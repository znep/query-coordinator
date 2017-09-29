import uuid from 'uuid';
import _ from 'lodash';
import { apiCallStarted, apiCallSucceeded, apiCallFailed } from 'reduxStuff/actions/apiCalls';
import * as dsmapiLinks from 'dsmapiLinks';
import { socrataFetch, checkStatus, getJson } from 'lib/http';
import { parseDate } from 'lib/parseDate';
import {
  createUploadSuccess,
  uploadFile,
  subscribeToRowErrors,
  subscribeToInputColumns,
  subscribeToTotalRows,
  subscribeToOutputSchema,
  subscribeToTransforms
} from 'reduxStuff/actions/manageUploads';
import { browserHistory } from 'react-router';
import * as Links from 'links';

export const CREATE_SOURCE = 'CREATE_SOURCE';
export const CREATE_SOURCE_SUCCESS = 'CREATE_SOURCE_SUCCESS';

function createSource(sourceType, params, callParams) {
  return dispatch => {
    const callId = uuid();

    const call = {
      operation: CREATE_SOURCE,
      callParams
    };

    dispatch(apiCallStarted(callId, call));

    return socrataFetch(dsmapiLinks.sourceCreate(params), {
      method: 'POST',
      body: JSON.stringify(callParams)
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
  const callParams = {
    source_type: { type: 'view' }
  };
  // TODO: handle error
  return dispatch => {
    dispatch(createSource('view', params, callParams))
      .then(normalizeCreateSourceResponse)
      .then(resp => dispatch(createSourceSuccess(resp)));
  };
}

export function createUploadSource(file, params) {
  const callParams = {
    source_type: { type: 'upload', filename: file.name }
  };
  return dispatch => {
    dispatch(createSource('upload', params, callParams)).then(resource => {
      // put source in store
      dispatch(
        createUploadSuccess(resource.id, resource.created_by, resource.created_at, resource.source_type)
      );

      // listen on source channel, which puts other stuff into store
      dispatch(listenForOutputSchema(resource.id, params));

      // send bytes to created upload
      return dispatch(uploadFile(resource.id, file));
    });
  };
}

function listenForOutputSchema(sourceId, params) {
  return (dispatch, getState, socket) => {
    const channel = socket.channel(`source:${sourceId}`);

    channel.on('insert_input_schema', is => {
      const [os] = is.output_schemas;

      const resource = {
        id: sourceId,
        type: 'fake',
        created_by: is.created_by,
        schemas: [is]
      };

      const payload = normalizeCreateSourceResponse(resource);

      dispatch(createSourceSuccess(payload));

      dispatch(subscribeToAllTheThings(is));

      browserHistory.push(Links.showOutputSchema(params, sourceId, is.id, os.id));
    });

    channel.join();
  };
}

function createSourceSuccess(payload) {
  return {
    type: CREATE_SOURCE_SUCCESS,
    ...payload
  };
}

function subscribeToAllTheThings(is) {
  return dispatch => {
    const [os] = is.output_schemas;
    dispatch(subscribeToRowErrors(is));
    dispatch(subscribeToInputColumns(is));
    dispatch(subscribeToTotalRows(is));
    dispatch(subscribeToOutputSchema(os));
    dispatch(subscribeToTransforms(os));
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
