var MetadataProvider = require('../dataProviders/MetadataProvider');

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

export var REQUEST_DATASET_METADATA = 'REQUEST_DATASET_METADATA';
export function requestDatasetMetadata(datasetUid) {
  return {
    type: REQUEST_DATASET_METADATA,
    datasetUid: datasetUid
  };
}

export var RECEIVE_DATASET_METADATA = 'RECEIVE_DATASET_METADATA';
export function receiveDatasetMetadata(datasetMetadata) {
  return {
    type: RECEIVE_DATASET_METADATA,
    datasetMetadata: datasetMetadata
  };
}

export var HANDLE_DATASET_METADATA_ERROR = 'HANDLE_DATASET_METADATA_ERROR';
export function handleDatasetMetadataError(error) {
  return {
    type: HANDLE_DATASET_METADATA_ERROR,
    error: error
  };
}

export var SET_DIMENSION = 'SET_DIMENSION';
export function setDimension(dimension) {
  return {
    type: SET_DIMENSION,
    dimension: dimension
  };
}

export var SET_MEASURE = 'SET_MEASURE';
export function setMeasure(measure) {
  return {
    type: SET_MEASURE,
    measure: measure
  };
}
