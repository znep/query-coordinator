import fetchMock from 'fetch-mock';
import xhrMock from 'xhr-mock';
import * as dsmapiLinks from 'links/dsmapiLinks';
import * as responses from './responses';
import _ from 'lodash';

const STATUS_TEXT = {
  OK: 'OK',
  CREATED: 'Created'
};

fetchMock.configure({
  sendAsJson: false,
  headers: { 'Content-Type': 'application/json' }
});

export const sourceCreate = () =>
  fetchMock.post(
    'express:/api/publishing/v1/revision/:viewId/:revisionSeq/source',
    {
      body: JSON.stringify(responses.sourceCreate),
      status: 201,
      statusText: STATUS_TEXT.CREATED
    }
  );

export const sourceBytes = () =>
  fetchMock.post('express:/api/publishing/v1/source/:sourceId', {
    body: JSON.stringify(responses.sourceBytes),
    status: 200,
    statusText: STATUS_TEXT.OK
  });

export const sourceShow = () =>
  fetchMock.get('express:/api/publishing/v1/source/:sourceId', {
    body: JSON.stringify(responses.sourceShow),
    status: 200,
    statusText: STATUS_TEXT.OK
  });

export const sourceIndex = () =>
  fetchMock.get('express:/api/publishing/v1/revision/:viewId/:revisionSeq/source', {
    body: JSON.stringify(responses.sourceIndex),
    status: 200,
    statusText: STATUS_TEXT.OK
  });

export const newOutputSchema = () =>
  fetchMock.post(
    'express:/api/publishing/v1/source/:sourceId/schema/:inputSchemaId',
    (url, options) => {
      const requestColumns = JSON.parse(options.body).output_columns || [];
      const existingColumns =
        responses.sourceShow.resource.schemas[0].output_schemas[0]
          .output_columns;

      const response = {
        body: JSON.stringify(responses.newOutputSchemaFromTypeChange),
        status: 201,
        statusText: STATUS_TEXT.CREATED
      };

      // TODO: distinguish between type change and setting primary key
      if (requestColumns.length > existingColumns.length) {
        return {
          ...response,
          body: JSON.stringify(responses.newOutputSchemaFromAdd)
        };
      } else if (requestColumns.length < existingColumns.length) {
        return {
          ...response,
          body: JSON.stringify(responses.newOutputSchemaFromDrop)
        };
      } else {
        return response;
      }
    }
  );

export const rows = () =>
  fetchMock.get(
    'express:/api/publishing/v1/source/:sourceId/schema/:inputSchemaId/rows/:outputSchemaId',
    {
      body: JSON.stringify(responses.rows),
      status: 200,
      statusText: STATUS_TEXT.OK
    }
  );

// TODO: distinguish from errorExport route by params
export const columnErrors = () =>
  fetchMock.get(
    'express:/api/publishing/v1/source/:sourceId/schema/:inputSchemaId/errors/:outputSchemaId',
    {
      body: JSON.stringify(responses.columnErrors),
      status: 200,
      statusText: STATUS_TEXT.OK
    }
  );

export const errorExport = () =>
  fetchMock.get(
    'express:/api/publishing/v1/source/:sourceId/schema/:inputSchemaId/errors/:outputSchemaId',
    {
      body: JSON.stringify(responses.errorExport),
      status: 200,
      statusText: STATUS_TEXT.OK
    }
  );

export const rowErrors = () =>
  fetchMock.get(
    'express:/api/publishing/v1/source/:sourceId/schema/:inputSchemaId/errors',
    {
      body: JSON.stringify(responses.rowErrors),
      status: 200,
      statusText: STATUS_TEXT.OK
    }
  );

export const validateRowIdentifier = () =>
  fetchMock.get(
    'express:/api/publishing/v1/source/:sourceId/transform/:transformId/validate_row_identifier',
    {
      body: JSON.stringify(responses.validateRowIdentifier),
      status: 200,
      statusText: STATUS_TEXT.OK
    }
  );

export const applyRevision = () =>
  fetchMock.put(
    'express:/api/publishing/v1/revision/ww72-hpm3/0/apply',
    {
      body: JSON.stringify(responses.applyRevision),
      status: 200,
      statusText: STATUS_TEXT.OK
    }
  );

export const updateRevision = () =>
  fetchMock.put(
    'express:/api/publishing/v1/revision/:fourfour/:revisionSeq',
    (url, options) => {
      let permission;
      let metadata;

      try {
        permission = JSON.parse(options.body).permission || 'public';
        metadata = JSON.parse(options.body).metadata
      } catch (err) {
        permission = 'public';
      }

      return {
        body: JSON.stringify(responses.updateRevision(permission, metadata)),
        status: 200,
        statusText: STATUS_TEXT.OK
      };
    }
  );

export const getRevision = () =>
  fetchMock.get(
    'express:/api/publishing/v1/revision/:fourfour/:revisionSeq',
    {
      body: JSON.stringify(responses.getRevision),
      status: 200,
      statusText: STATUS_TEXT.OK
    }
  );

export const sourceBytesXHR = () => {
  xhrMock.setup();
  xhrMock.post(/\/api\/publishing\/v1\/source\/\d+\/?/, (req, res) =>
    res.status(200).body(JSON.stringify(responses.sourceBytes))
  );
};

export const saveMetadata = () =>
  fetchMock.put('express:/api/views/:fourfour', (url, options) => {
    const metadata = JSON.parse(options.body);
    const fourfour = url.split('/').pop();
    const response = {
      ...metadata,
      id: fourfour
    };

    return {
      body: JSON.stringify(response),
      status: 200,
      statusText: STATUS_TEXT.OK
    };
  });

const mockAPI = () => {
  sourceBytesXHR();
  sourceCreate();
  sourceBytes();
  sourceShow();
  sourceIndex();
  newOutputSchema();
  rows();
  columnErrors();
  rowErrors();
  validateRowIdentifier();
  errorExport();
  saveMetadata();
  applyRevision();
  updateRevision();
  getRevision();

  return () => {
    fetchMock.restore();
    xhrMock.teardown();
  };
};

export default mockAPI;
