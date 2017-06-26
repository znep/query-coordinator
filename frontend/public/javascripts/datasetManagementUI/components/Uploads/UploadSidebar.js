import React, { PropTypes } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import moment from 'moment';
import { Link } from 'react-router';
import * as Links from 'links';
import * as Selectors from 'selectors';
import styles from 'styles/Uploads/UploadSidebar.scss';

const UploadItem = ({ upload }) =>
  <li>
    <Link to={Links.showOutputSchema(upload.id, upload.inputSchemaId, upload.outputSchemaId)}>
      {upload.filename}
    </Link>
    <div className={styles.timestamp}>{moment.utc(upload.finished_at).fromNow()}</div>
  </li>;

UploadItem.propTypes = {
  upload: PropTypes.object.isRequired
};

export const UploadSidebar = ({ currentUpload, otherUploads }) =>
  <section className={styles.sidebar}>
    <h2>{I18n.show_uploads.current}</h2>
    <ul>
      {currentUpload ? <UploadItem upload={currentUpload} /> : <span>{I18n.show_uploads.no_uploads}</span>}
    </ul>
    {!!otherUploads.length && <h2>{I18n.show_uploads.noncurrent}</h2>}
    <ul>
      {otherUploads.map(upload => <UploadItem key={upload.id} upload={upload} />)}
    </ul>
  </section>;

UploadSidebar.propTypes = {
  currentUpload: PropTypes.shape({
    id: PropTypes.number,
    inputSchemaId: PropTypes.number,
    outputSchemaId: PropTypes.number,
    filename: PropTypes.string,
    finished_at: PropTypes.object
  }),
  otherUploads: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      inputSchemaId: PropTypes.number,
      outputSchemaId: PropTypes.number,
      filename: PropTypes.string,
      finished_at: PropTypes.object
    })
  )
};

const getLinkInfo = inputSchemas => outputSchemas => upload => {
  if (!inputSchemas || !inputSchemas.length || !Object.keys(outputSchemas).length) {
    return upload;
  }
  const currentInputSchema = inputSchemas.find(is => is.upload_id === upload.id);

  const outputSchemasForCurrentInputSchema = currentInputSchema
    ? _.pickBy(outputSchemas, os => os.input_schema_id === currentInputSchema.id)
    : null;

  const currentOutputSchema = outputSchemasForCurrentInputSchema
    ? Selectors.latestOutputSchema({ output_schemas: outputSchemasForCurrentInputSchema })
    : { id: null };

  return {
    ...upload,
    inputSchemaId: currentInputSchema ? currentInputSchema.id : null,
    outputSchemaId: currentOutputSchema.id
  };
};

export const mapStateToProps = ({ entities }) => {
  const outputSchema = Selectors.latestOutputSchema(entities);
  let currentUpload = null;
  let otherUploads = [];

  if (outputSchema) {
    const { input_schema_id: inputSchemaId, id: outputSchemaId } = outputSchema;

    const { upload_id: uploadId } = entities.input_schemas[inputSchemaId];

    const noncurrentUploads = _.omit(entities.uploads, uploadId);

    const noncurrentUploadsList = Object.keys(noncurrentUploads).map(id => entities.uploads[id]);

    // TODO: Not doing anything with failed uploats atm. Maybe we should. Need UX input.
    // eslint-disable-next-line no-unused-vars
    const [failedUploads, pendingOrSuccessfulUploads] = _.partition(
      noncurrentUploadsList,
      upload => upload.failed_at
    );

    const inputSchemaList = Object.keys(entities.input_schemas).map(isid => entities.input_schemas[isid]);

    const addLinkInfo = getLinkInfo(inputSchemaList)(entities.output_schemas);

    currentUpload = {
      ...entities.uploads[uploadId],
      inputSchemaId,
      outputSchemaId
    };

    otherUploads = pendingOrSuccessfulUploads.map(addLinkInfo);
  }

  return {
    currentUpload,
    otherUploads
  };
};

export default connect(mapStateToProps)(UploadSidebar);
