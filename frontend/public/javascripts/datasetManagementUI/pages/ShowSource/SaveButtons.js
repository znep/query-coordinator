import React from 'react';
import PropTypes from 'prop-types';
import ApiCallButton from 'containers/ApiCallButtonContainer';
import { UPDATE_REVISION } from 'reduxStuff/actions/apiCalls';

const SaveButtons = ({ handleSave, handleSaveAndExit, callParams, isDirty }) => (
  <div>
    <ApiCallButton
      forceDisable={!isDirty}
      onClick={handleSave}
      operation={UPDATE_REVISION}
      callParams={callParams} />
    <ApiCallButton
      forceDisable={!isDirty}
      onClick={handleSaveAndExit}
      operation={UPDATE_REVISION}
      callParams={callParams}>
      Save and Exit
    </ApiCallButton>
  </div>
);

SaveButtons.propTypes = {
  handleSave: PropTypes.func.isRequired,
  handleSaveAndExit: PropTypes.func.isRequired,
  callParams: PropTypes.object.isRequired,
  isDirty: PropTypes.bool.isRequired
};

export default SaveButtons;
