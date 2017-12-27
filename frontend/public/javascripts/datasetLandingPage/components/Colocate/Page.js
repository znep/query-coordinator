import React, { Component } from 'react';

import RowPicker from './RowPicker';
import RowDetail from './RowDetail';
import AssetSelector from 'common/components/AssetSelector';
import classNames from 'classnames';

export default class Page extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show_picker: true,
      target_dataset: null,
      source_column: null,
      target_column: null
    };
  }

  render() {

    // TODO: Maybe add filters to displayed assets
    const assetSelectorProps = {
      onAssetSelected: (assetData) => {
        this.setState({
          target_dataset: assetData,
          show_picker: false
        });
      },
      resultsPerPage: 6,
      title: 'Select dataset to collocate with'
    };

    const state = this.state;
    const header = (
      <div className="header">
        <div>
          <span className="socrata-icon-external" />
          <h2>Join Datasets</h2>
        </div>
        <span className="socrata-icon-close-2" /> {/* TODO: Hook this up once we have a route here */}
      </div>
    );

    const leftSelection = (
      <RowPicker
        targetData={window.sessionData.viewId}
        onSelect={
          (column) => this.setState({
            source_column: column
          })} />
    );

    const rightSelection = (
      state.target_dataset != null ?
        <RowPicker
          targetData={state.target_dataset.id}
          onSelect={
            (column) => this.setState({
              target_column: column
            })}
          onTitleClick={() => this.setState(
            {
              target_dataset: null,
              show_picker: true,
              target_column: null
            })
          } /> : null
    );

    // TODO: Maybe remove this section, it doesn't add anything right now and may not be needed at all
    const selectionDetails = (
      <div className="details">
        {state.source_column != null &&
          <RowDetail
            details={state.source_column} />}
        {state.target_column != null &&
          <RowDetail
            details={state.target_column}
            rightJustify />}
      </div>
    );

    return (
      <div>
        {state.show_picker && <AssetSelector {...assetSelectorProps} />}
        <div className="colocate">
          {header}
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
              className={classNames('btn btn-primary', { 'btn-disabled': state.target_dataset == null })}
              onClick={() => {
                if (state.target_dataset != null) {
                  doColocate(window.sessionData.viewId, state.target_dataset.id);
                }
              }
              }>
              Join
            </button>
          </div>
        </div>
      </div>
    );
  }
}

function doColocate(source, dest) {
  const url = 'https://localhost/api/collocate';
  const body = JSON.stringify(
    { collocations: [[source, dest]] }
  );

  const fetchOptions = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    body: body
  };

  fetch(url, fetchOptions).
    then(response => response.json()).
    then(response => console.log(response));
}
