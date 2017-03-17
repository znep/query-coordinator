import React, { PropTypes } from 'react';
import SocrataIcon from '../SocrataIcon';

export default function FilterHeader({ children, isReadOnly, name, onClickConfig }) {
  const configIcon = isReadOnly ?
    null :
    <button className="btn btn-transparent config-btn" onClick={onClickConfig}>
      <SocrataIcon name="settings" />
    </button>;

  return (
    <div className="filter-control-title">
      <h3>{name}</h3>
      {configIcon}
      {children}
    </div>
  );
}

FilterHeader.propTypes = {
  children: PropTypes.node,
  isReadOnly: PropTypes.bool,
  name: PropTypes.string,
  onClickConfig: PropTypes.func.isRequired
};
