import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';

export class BackButton extends React.Component {
  render() {
    return (
      <button className="btn btn-default btn-sm close-modal back-button" onClick={this.props.onClick}>
        <span className="socrata-icon-arrow-prev"></span>
        {` ${_.get(I18n, 'common.action_buttons.back')}`}
      </button>
    );
  }
}

BackButton.propTypes = {
  onClick: PropTypes.func.isRequired
};

BackButton.defaultProps = {
  onClick: _.noop
};

export default BackButton;
