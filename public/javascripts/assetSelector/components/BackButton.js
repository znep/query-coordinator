import React, { PropTypes } from 'react';
import _ from 'lodash';

export const BackButton = (props) => (
  <button className="btn btn-default btn-sm close-modal back-button" onClick={props.onClick}>
    <span className="socrata-icon-arrow-prev"></span>
    {` ${_.get(I18n, 'asset_selector.action_buttons.back', 'Back')}`}
  </button>
);

BackButton.propTypes = {
  onClick: PropTypes.func.isRequired
};

BackButton.defaultProps = {
  onClick: _.noop
};

export default BackButton;
