import fetchMock from 'fetch-mock';
import xhrMock from 'xhr-mock';
import * as dsmapiLinks from 'dsmapiLinks';
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

export const uploadCreate = () =>
  fetchMock.post(
    'express:/api/publishing/v1/revision/:viewId/:revisionSeq/upload',
    {
      body: JSON.stringify(responses.uploadCreate),
      status: 201,
      statusText: STATUS_TEXT.CREATED
    }
  );

export const uploadBytes = () =>
  fetchMock.post('express:/api/publishing/v1/upload/:uploadId', {
    body: JSON.stringify(responses.uploadBytes),
    status: 200,
    statusText: STATUS_TEXT.OK
  });

export const uploadShow = () =>
  fetchMock.get('express:/api/publishing/v1/upload/:uploadId', {
    body: JSON.stringify(responses.uploadShow),
    status: 200,
    statusText: STATUS_TEXT.OK
  });

export const newOutputSchema = () =>
  fetchMock.post(
    'express:/api/publishing/v1/upload/:uploadId/schema/:inputSchemaId',
    (url, options) => {
      const requestColumns = JSON.parse(options.body).output_columns || [];
      const existingColumns =
        responses.uploadShow.resource.schemas[0].output_schemas[0]
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
    'express:/api/publishing/v1/upload/:uploadId/schema/:inputSchemaId/rows/:outputSchemaId',
    {
      body: JSON.stringify(responses.rows),
      status: 200,
      statusText: STATUS_TEXT.OK
    }
  );

// TODO: distinguish from errorExport route by params
export const columnErrors = () =>
  fetchMock.get(
    'express:/api/publishing/v1/upload/:uploadId/schema/:inputSchemaId/errors/:outputSchemaId',
    {
      body: JSON.stringify(responses.columnErrors),
      status: 200,
      statusText: STATUS_TEXT.OK
    }
  );

export const errorExport = () =>
  fetchMock.get(
    'express:/api/publishing/v1/upload/:uploadId/schema/:inputSchemaId/errors/:outputSchemaId',
    {
      body: JSON.stringify(responses.errorExport),
      status: 200,
      statusText: STATUS_TEXT.OK
    }
  );

export const rowErrors = () =>
  fetchMock.get(
    'express:/api/publishing/v1/upload/:uploadId/schema/:inputSchemaId/errors',
    {
      body: JSON.stringify(responses.rowErrors),
      status: 200,
      statusText: STATUS_TEXT.OK
    }
  );

export const validateRowIdentifier = () =>
  fetchMock.get(
    'express:/api/publishing/v1/upload/:uploadId/transform/:transformId/validate_row_identifier',
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

      try {
        permission = JSON.parse(options.body).permission || 'public';
      } catch (err) {
        permission = 'public';
      }

      return {
        body: JSON.stringify(responses.updateRevision(permission)),
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

export const uploadBytesXHR = () => {
  xhrMock.setup();
  xhrMock.post(/\/api\/publishing\/v1\/upload\/\d+\/?/, (req, res) =>
    res.status(200).body(JSON.stringify(responses.uploadBytes))
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
  uploadBytesXHR();
  uploadCreate();
  uploadBytes();
  uploadShow();
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
