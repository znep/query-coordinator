import PropTypes from 'prop-types';
import React from 'react';
import RevisionSchemaPreview from 'datasetManagementUI/containers/RevisionSchemaPreviewContainer';
import ViewSchemaPreview from 'datasetManagementUI/containers/ViewSchemaPreviewContainer';

// Does the same thing as RowDetails component. See comment there.
const SchemaPreview = ({ readFromCore }) => {
  return readFromCore ? <ViewSchemaPreview /> : <RevisionSchemaPreview />;
};

SchemaPreview.propTypes = {
  readFromCore: PropTypes.bool.isRequired
};

export default SchemaPreview;
