import React from 'react';
import SCButton from './SCButton';

/**
 * Used for changed form fields to inform user.
 * It turns into revert button when the mouse hovering.
 */
export default class SCChangeIndicator extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="sc-check-indicator">
        <SCButton extraSmall onClick={ this.props.onRevert }>
          <span className="sc-check-indicator-check icon-checkmark3" />
          <span className="sc-check-indicator-revert icon-undo" />
        </SCButton>
      </div>
    );
  }
}

SCChangeIndicator.propTypes = {
  onRevert: React.PropTypes.func.isRequired
};
