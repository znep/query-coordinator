import React, { PropTypes } from 'react';
import _ from 'lodash';

export class BackButton extends React.PureComponent {
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
