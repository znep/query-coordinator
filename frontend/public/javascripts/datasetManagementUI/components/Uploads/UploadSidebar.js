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

export const UploadSidebar = ({ currentUpload, otherUploads }) => {
  const items = otherUploads.map(upload => <UploadItem key={upload.id} upload={upload} />);

  return (
    <section className={styles.sidebar}>
      <h2>Current Upload</h2>
      <ul>
        <UploadItem upload={currentUpload} />
      </ul>
      <h2>Other Uploads</h2>
      <ul>
        {items}
      </ul>
    </section>
  );
};

UploadSidebar.propTypes = {
  currentUpload: PropTypes.shape({
    id: PropTypes.number.isRequired,
    inputSchemaId: PropTypes.number.isRequired,
    outputSchemaId: PropTypes.number.isRequired,
    filename: PropTypes.string.isRequired,
    finished_at: PropTypes.object.isRequired
  }),
  otherUploads: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      inputSchemaId: PropTypes.number.isRequired,
      outputSchemaId: PropTypes.number.isRequired,
      filename: PropTypes.string.isRequired,
      finished_at: PropTypes.object.isRequired
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

  const { input_schema_id: inputSchemaId, id: outputSchemaId } = outputSchema;

  const { upload_id: uploadId } = entities.input_schemas[inputSchemaId];
  // old
  const noncurrentUploads = _.omit(entities.uploads, uploadId);

  // filter is necessary because if upload failed, we won't have an IS or OS
  // for it, so it can't link to data preview page. Maybe we want to show the
  // failed upload and have it do something else?
  const noncurrentUploadsList = Object.keys(noncurrentUploads)
    .map(id => entities.uploads[id])
    .filter(upload => upload.finished_at);

  const inputSchemaList = Object.keys(entities.input_schemas).map(isid => entities.input_schemas[isid]);

  const addLinkInfo = getLinkInfo(inputSchemaList)(entities.output_schemas);

  const currentUpload = {
    ...entities.uploads[uploadId],
    inputSchemaId,
    outputSchemaId
  };

  const otherUploads = noncurrentUploadsList.map(addLinkInfo);

  return {
    currentUpload,
    otherUploads
  };
};

export default connect(mapStateToProps)(UploadSidebar);
