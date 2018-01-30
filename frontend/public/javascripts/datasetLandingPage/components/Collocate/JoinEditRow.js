import React, { Component } from 'react';
import PropTypes from 'prop-types';


export default class JoinEditRow extends Component {
  static propTypes = {
    dataset: PropTypes.string.isRequired,
    columnName: PropTypes.string.isRequired,
    newName: PropTypes.string.isRequired,
    enabled: PropTypes.bool.isRequired,

    onNameChanged: PropTypes.func.isRequired,
    onEnableChanged: PropTypes.func.isRequired
  }

  render() {
    const {
      dataset,
      columnName,
      newName,
      enabled,
      onEnableChanged,
      onNameChanged
    } = this.props;

    return (
      <div className="join-row">
        <span>{dataset}</span>
        <span>{columnName}</span>
        <input value={newName} onChange={onNameChanged} />
        <input type="checkbox" checked={enabled} onChange={onEnableChanged} />
      </div>
    );
  }
}

