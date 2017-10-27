import PropTypes from 'prop-types';
import React from 'react';
import { SAVE_CURRENT_OUTPUT_SCHEMA } from 'reduxStuff/actions/apiCalls';
import ApiCallButton from 'containers/ApiCallButtonContainer';

const SaveOutputSchemaButton = ({
  revision,
  outputSchema,
  params,
  saveCurrentOutputSchema
}) => (
  <div>
    <ApiCallButton
      onClick={() => saveCurrentOutputSchema(revision, outputSchema.id, params)}
      operation={SAVE_CURRENT_OUTPUT_SCHEMA}
      callParams={{ outputSchemaId: outputSchema.id, blobId: null }} >
      {I18n.home_pane.save_for_later}
    </ApiCallButton>
  </div>
);

SaveOutputSchemaButton.propTypes = {
  revision: PropTypes.object.isRequired,
  outputSchema: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  saveCurrentOutputSchema: PropTypes.func.isRequired
};

export default SaveOutputSchemaButton;
