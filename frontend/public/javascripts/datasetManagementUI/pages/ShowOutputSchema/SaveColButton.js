import PropTypes from 'prop-types';
import React from 'react';
import { ADD_COLUMN } from 'reduxStuff/actions/apiCalls';
import ApiCallButton from 'containers/ApiCallButtonContainer';

const SaveColButton = ({ handleClick, isDirty, callParams }) => (
  <div>
    <ApiCallButton
      forceDisable={!isDirty}
      onClick={handleClick}
      operation={ADD_COLUMN}
      callParams={callParams}>
      {I18n.home_pane.save_for_later}
    </ApiCallButton>
  </div>
);

SaveColButton.propTypes = {
  handleClick: PropTypes.func.isRequired,
  isDirty: PropTypes.bool.isRequired,
  callParams: PropTypes.object.isRequired
};

export default SaveColButton;
