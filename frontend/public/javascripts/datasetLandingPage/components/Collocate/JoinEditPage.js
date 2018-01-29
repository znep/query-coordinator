import React, { Component } from 'react';
import PropTypes from 'prop-types';

import JoinEditRow from './JoinEditRow';

export default class JoinEditPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      columnMapping: props.columnMapping.map((column) => ({
        ...column,
        enabled: true
      }))
    };
  }
  render() {
    const { onComplete } = this.props;
    const { columnMapping } = this.state;

    const joinEditProps = (column, idx) => {
      return {
        key: idx.toString(),
        enabled: column.enabled,
        dataset: column.dataset,
        columnName: column.name,
        newName: column.newName,
        onNameChanged: (e) => {
          const newName = e.target.value;
          this.setState(prevState => {
          // NOTE: Is there a better way of doing a mutation of an array?
            const newState = prevState.columnMapping;
            newState[idx].newName = newName;
            return {
              columnMapping: newState
            };
          });
        },
        onEnableChanged: (e) => {
          const checkState = e.target.checked;
          this.setState(prevState => {
          // NOTE: Is there a better way of doing a mutation of an array?
            const newState = prevState.columnMapping;
            newState[idx].enabled = checkState;
            return {
              columnMapping: newState
            };
          });
        }
      };
    };

    return (
      <div>
        <div>
          {columnMapping.map((column, idx) => (
            <JoinEditRow {...joinEditProps(column, idx)} />
          ))}
        </div>
        <button
          className="btn btn-default"
          onClick={() => onComplete(cleanMapping(columnMapping))}>
          Join
        </button>
      </div>
    );
  }
}

JoinEditPage.propTypes = {
  columnMapping: PropTypes.array.isRequired,

  onComplete: PropTypes.func.isRequired
};

// Just cleans up for output
function cleanMapping(mapping) {
  return mapping.filter(column => { return column.enabled; }).map(column => (
    {
      datasetId: column.datasetId,
      oldColumnName: column.name,
      newColumnName: column.newName
    }
  ));
}
