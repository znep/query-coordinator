import PropTypes from 'prop-types';
import React from 'react';
import { SAVE_CURRENT_BLOB } from 'reduxStuff/actions/apiCalls';
import ApiCallButton from 'containers/ApiCallButtonContainer';

const SaveBlobButton = ({
  revision,
  source,
  saveCurrentBlob
}) => (
  <div>
    <ApiCallButton
      onClick={() => saveCurrentBlob(revision, source.id)}
      operation={SAVE_CURRENT_BLOB}
      callParams={{ outputSchemaId: null, blobId: source.id }} >
      {I18n.home_pane.save_for_later}
    </ApiCallButton>
  </div>
);

SaveBlobButton.propTypes = {
  revision: PropTypes.object.isRequired,
  source: PropTypes.object.isRequired,
  saveCurrentBlob: PropTypes.func.isRequired
};

export default SaveBlobButton;
