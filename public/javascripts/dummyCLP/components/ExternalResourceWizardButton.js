import React, { PropTypes } from 'react';
import _ from 'lodash';

export const ExternalResourceWizardButton = (props) => {
  return (
    <button
      className="btn btn-default btn-sm external-resource-wizard-button"
      onClick={() => {
        props.onClick();
      }}>
      {_.get(I18n, 'external_resource_wizard.open_wizard_button', 'Feature an External Resource')}
    </button>
  );
};

ExternalResourceWizardButton.propTypes = {
  onClick: PropTypes.func.isRequired
};

ExternalResourceWizardButton.defaultProps = {
  onClick: _.noop
};

export default ExternalResourceWizardButton;
