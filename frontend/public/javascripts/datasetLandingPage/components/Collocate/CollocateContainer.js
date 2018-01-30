import React, { Component } from 'react';
import PropTypes from 'prop-types';

import RowPicker from './RowPicker';
import RowDetail from './RowDetail';
import classNames from 'classnames';

export default class CollocationPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sourceColumn: null,
      targetColumn: null
    };
  }
  render() {
    const { sourceDataset, targetDataset, onJoinFired, unselectTargetDataset } = this.props;
    const { sourceColumn, targetColumn } = this.state;

    const canJoin = sourceColumn != null && targetColumn != null;

    const leftSelection = (
      <RowPicker
        title={sourceDataset.title}
        columns={sourceDataset.columns}
        onSelect={
          (column) => this.setState({
            sourceColumn: column
          })} />
    );

    const rightSelection = (
      <RowPicker
        title={targetDataset.title}
        columns={targetDataset.columns}
        onSelect={
          (column) => this.setState({
            targetColumn: column
          })}
        onTitleClick={unselectTargetDataset} />
      );

    // TODO: Maybe remove this section, it doesn't add anything right now and may not be needed at all
    const selectionDetails = (
      <div className="details">
        {sourceColumn &&
          <RowDetail details={sourceColumn} />}
        {targetColumn &&
          <RowDetail details={targetColumn} rightJustify />}
      </div>
    );

    return (
      <div>
        <div className="selectors">
          {leftSelection}
          {selectionDetails}
          {rightSelection}
        </div>
        <div className="join-buttons">
          <button
            className="btn btn-default"
            onClick={() => _.noop}> {/* TODO: When route exists go back */}
            Cancel
          </button>
          <button
            className={classNames('btn btn-primary', { 'btn-disabled': !canJoin })}
            onClick={() => {
              if (canJoin) {
                onJoinFired({
                  sourceColumn: sourceColumn.title,
                  targetColumn: targetColumn.title });
              }
            }
            }>
            Join
          </button>
        </div>
      </div>
    );
  }
}

CollocationPage.propTypes = {
  sourceDataset: PropTypes.object.isRequired,
  targetDataset: PropTypes.object.isRequired,
  unselectTargetDataset: PropTypes.func,
  onJoinFired: PropTypes.func.isRequired
};
