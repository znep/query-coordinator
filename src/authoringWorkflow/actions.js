var MetadataProvider = require('../dataProviders/MetadataProvider');

export var REQUEST_DATASET_METADATA = 'REQUEST_DATASET_METADATA';
export var RECEIVE_DATASET_METADATA = 'RECEIVE_DATASET_METADATA';
export var HANDLE_DATASET_METADATA_ERROR = 'HANDLE_DATASET_METADATA_ERROR';
export var SET_DIMENSION = 'SET_DIMENSION';

// Dispatches REQUEST_DATASET_METADATA when request begins and either RECEIVE_DATASET_METADATA or
// HANDLE_DATASET_METADATA_ERROR when request completes.
export function setDatasetUid(datasetUid) {
  return function(dispatch) {
    if (!/\w{4}\-\w{4}/.test(datasetUid)) {
      return;
    }

    var datasetMetadataProvider = new MetadataProvider({
      domain: 'localhost',
      datasetUid: datasetUid
    });

    dispatch(requestDatasetMetadata(datasetUid));

    return datasetMetadataProvider.getDatasetMetadata().
      then(function(datasetMetadata) {
        dispatch(receiveDatasetMetadata(datasetMetadata, null));
      }).
      catch(function(error) {
        dispatch(handleDatasetMetadataError(null, error));
      });
  };
}

export function requestDatasetMetadata(datasetUid) {
  return {
    type: REQUEST_DATASET_METADATA,
    datasetUid: datasetUid
  };
}

export function receiveDatasetMetadata(datasetMetadata) {
  return {
    type: RECEIVE_DATASET_METADATA,
    datasetMetadata: datasetMetadata
  };
}

export function handleDatasetMetadataError(error) {
  return {
    type: HANDLE_DATASET_METADATA_ERROR,
    error: error
  };
}

export function setDimension(dimension) {
  return {
    type: SET_DIMENSION,
    dimension: dimension
  };
}
