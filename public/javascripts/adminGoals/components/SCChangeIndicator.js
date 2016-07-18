import React from 'react';
import SCButton from './SCButton';

export default function (props) {
  return (
    <div className="sc-check-indicator">
      <SCButton extraSmall onClick={ props.onRevert }>
        <span className="sc-check-indicator-check icon-checkmark3" />
        <span className="sc-check-indicator-revert icon-undo" />
      </SCButton>
    </div>
  );
}
