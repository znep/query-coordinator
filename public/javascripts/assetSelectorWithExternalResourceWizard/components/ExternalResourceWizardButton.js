import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { openExternalResourceWizard } from '../../externalResourceWizard/actions/modal';

export const ExternalResourceWizardButton = (props) => {
  return (
    <button
      className="btn btn-default btn-sm external-resource-wizard-button"
      onClick={() => {
        props.onClick();
        props.dispatchOpenExternalResourceWizard();
      }}>
      Feature an External Resource{/* TODO: Localization */}
    </button>
  );
};

ExternalResourceWizardButton.propTypes = {
  dispatchOpenExternalResourceWizard: PropTypes.func.isRequired,
  onClick: PropTypes.func
};

ExternalResourceWizardButton.defaultProps = {
  dispatchOpenExternalResourceWizard: _.noop,
  onClick: _.noop
};

function mapDispatchToProps(dispatch) {
  return {
    dispatchOpenExternalResourceWizard: function() {
      dispatch(openExternalResourceWizard());
    }
  };
}

export default connect(null, mapDispatchToProps)(ExternalResourceWizardButton);
