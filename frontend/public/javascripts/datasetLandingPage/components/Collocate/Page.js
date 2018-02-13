import React, { Component } from 'react';
import JoinEditPage from './JoinEditPage';
import MetadataProvider, { getDisplayableColumns }
  from 'common/visualizations/dataProviders/MetadataProvider';

import { getIconForDataType } from 'common/icons';
import { SocrataIcon, Modal } from 'common/components';
import AssetSelector from 'common/components/AssetSelector';

import CollocateContainer from './CollocateContainer';
import { validateCollocate, executeCollocate } from './CollocateAPI';

export default class Page extends Component {
  constructor(props) {
    super(props);

    // TODO: Probably move this into Redux if it grows much more
    this.state = {
      showNbeOnlyError: false,
      showPicker: true,
      showCollocate: false,
      showJoinEdit: false,
      sourceDataset: {
        title: null,
        id: window.sessionData.viewId,
        columns: [],
        joinedColumn: null
      },
      targetDataset: {
        title: null,
        id: null,
        columns: [],
        joinedColumn: null
      },
      joinColumnMapping: [] // Array of objects {sourceDatset, sourceColumnName, newName}
    };
  }

  componentDidMount() {
    // Load the primary dataset immediately as there is no way the user can change it
    getPickColumns(window.sessionData.viewId).then(
      ({ title, columns, isNbe }) => {
        this.setState((prevState) => ({
          showNbeOnlyError: !isNbe,
          sourceDataset: {
            ...prevState.sourceDataset,
            title,
            columns
          }
        }));
      }
    );
  }

  render() {
    var state = this.state;

    const assetSelectorProps = {
      onAssetSelected: (assetData) => {
        this.setState((prevState) => ({
          ...prevState,
          showPicker: false,
          showCollocate: true
        }));
        getPickColumns(assetData.id).then(
          ({ title, columns, isNbe }) => {
            this.setState((prevState) => ({
              showNbeOnlyError: !isNbe, // TODO: It would be better to prevent the user from even selecting an OBE dataset
              targetDataset: {
                ...prevState.targetDataset,
                id: assetData.id,
                title,
                columns
              }
            }));
          });
      },
      resultsPerPage: 6,
      title: 'Select dataset to collocate with',
      baseFilters: {
        assetTypes: 'datasets'
      }
    };

    const collocateContainerProps = {
      onJoinFired: ({ sourceColumn, targetColumn }) => {
        validateCollocate(state.sourceDataset.id, state.targetDataset.id).then(
          (valid) => {
            if (valid) {
              this.setState((prevState) => ({
                showCollocate: false,
                showJoinEdit: true,
                sourceDataset: {
                  ...prevState.sourceDataset,
                  joinedColumn: sourceColumn
                },
                targetDataset: {
                  ...prevState.targetDataset,
                  joinedColumn: targetColumn
                }
              }));
            } else {
              // TODO: Raise an error
            } });
      },
      sourceDataset: state.sourceDataset,
      targetDataset: state.targetDataset
    };

    const header = (
      <div className="header">
        <div>
          <span className="socrata-icon-external" />
          <h2>Join Datasets</h2>
        </div>
        <span className="socrata-icon-close-2" /> {/* TODO: Hook this up once we have a route here */}
      </div>
    );

    const columnMapping = getMapping(state.sourceDataset).concat(getMapping(state.targetDataset));

    const showSpinner = !state.sourceDataset.title || !state.targetDataset.title;

    const currentPane = (function() {
      if (state.showNbeOnlyError) {
        return (
          <Modal onDismiss={_.noop}>
            <div>ERROR: Can not collocate datasets on OBE</div>
          </Modal>);
      } else if (state.showPicker) {
        return <AssetSelector {...assetSelectorProps} />;
      } else if (showSpinner) {
        return <div className="spinner-default" />;
      } else if (state.showCollocate) {
        return <CollocateContainer {...collocateContainerProps} />;
      } else if (state.showJoinEdit) {
        return (<JoinEditPage
          columnMapping={columnMapping}
          onComplete={(newColumnMap) => {
            executeCollocate(state.sourceDataset, state.targetDataset, newColumnMap);
          }} />);
      } else {
        return null;
      }
    }());

    return (
      <div className="collocate">
        {header}
        {currentPane}
      </div>
    );
  }
}

// Get the list of column objects for a given 4x4
async function getPickColumns(uid) {
  var metadataProvider = new MetadataProvider({
    domain: window.location.hostname,
    datasetUid: uid
  });

  const metadata = (await metadataProvider.getDatasetMetadata());
  const columns = getDisplayableColumns(metadata);
  const title = metadata.name;

  return {
    title: title,
    isNbe: metadata.newBackend,
    columns: columns.map((c) => ({
      title: c.name,
      value: c.name,
      icon: <SocrataIcon name={getIconForDataType(c.dataTypeName)} />
    }))
  };
}

// Transform the dataset information into a form that can be used to generate a column mapping
function getMapping(dataset) {
  return dataset.columns.map((column) => ({
    datasetId: dataset.id,
    dataset: dataset.title,
    name: column.title,
    newName: `${dataset.title}.${column.title}`,
    icon: column.icon
  }));
}
