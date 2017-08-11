import _ from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import * as Selectors from 'selectors';
import UploadSidebar from 'components/Uploads/UploadSidebar';

export const mapStateToProps = ({ entities }) => {
  let currentUpload;
  let otherUploads;

  const pendingOrSuccessfulSources = _.chain(entities.sources)
    .values()
    .filter(source => !source.failed_at)
    .value();

  const currentOutputSchema = Selectors.currentOutputSchema(entities);

  if (currentOutputSchema) {
    const { input_schema_id: inputSchemaId } = currentOutputSchema;
    const { source_id: sourceId } = entities.input_schemas[inputSchemaId];

    currentUpload = entities.sources[sourceId];
    otherUploads = pendingOrSuccessfulSources.filter(source => source.id !== sourceId);
  } else {
    // rare case where you have uploads but not a current upload
    currentUpload = null;
    otherUploads = pendingOrSuccessfulSources;
  }

  return {
    currentUpload,
    otherUploads,
    entities
  };
};

export default withRouter(connect(mapStateToProps)(UploadSidebar));
