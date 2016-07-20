import React from 'react';
import SCButton from './SCButton';

/**
 * Used for changed form fields to inform user.
 * It turns into revert button when the mouse hovering.
 *
 * @param {Object} props
 * @param {Function} props.onRevert It's called when user clicked
 */
export default function SCChangeIndicator(props) {
  return (
    <div className="sc-check-indicator">
      <SCButton extraSmall onClick={ props.onRevert }>
        <span className="sc-check-indicator-check icon-checkmark3" />
        <span className="sc-check-indicator-revert icon-undo" />
      </SCButton>
    </div>
  );
}
