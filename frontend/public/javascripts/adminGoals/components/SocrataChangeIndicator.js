import PropTypes from 'prop-types';
import React from 'react';
import { Button } from 'common/components';

/**
 * Used for changed form fields to inform user.
 * It turns into revert button when the mouse hovering.
 */
export default class SocrataChangeIndicator extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="sc-check-indicator">
        <Button size="xs" onClick={ this.props.onRevert }>
          <span className="sc-check-indicator-check icon-checkmark3" />
          <span className="sc-check-indicator-revert icon-undo" />
        </Button>
      </div>
    );
  }
}

SocrataChangeIndicator.propTypes = {
  onRevert: PropTypes.func.isRequired
};
