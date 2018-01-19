import PropTypes from 'prop-types';
import React from 'react';
import { UPDATE_SOURCE } from 'datasetManagementUI/reduxStuff/actions/createSource';
import ApiCallButton from 'datasetManagementUI/containers/ApiCallButtonContainer';

const SaveParseOptionsButton = ({
  source,
  params,
  saveCurrentParseOptions,
  parseOptionsForm
}) => {
  const isDisabled = !parseOptionsForm.isDirty;
  const parseOptions = parseOptionsForm.state.parseOptions || source.parse_options;
  return (
    <div>
      <ApiCallButton
        forceDisable={isDisabled}
        onClick={() => saveCurrentParseOptions(params, source, parseOptions)}
        operation={UPDATE_SOURCE}
        callParams={{ sourceId: source.id }}>
          {I18n.home_pane.save_for_later}
      </ApiCallButton>
    </div>
  );
};

SaveParseOptionsButton.propTypes = {
  source: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  saveCurrentParseOptions: PropTypes.func.isRequired,
  parseOptionsForm: PropTypes.object.isRequired
};


export default SaveParseOptionsButton;
