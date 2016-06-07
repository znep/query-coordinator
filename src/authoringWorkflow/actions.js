var MetadataProvider = require('../dataProviders/MetadataProvider');

// Dispatches REQUEST_DATASET_METADATA when request begins and either RECEIVE_DATASET_METADATA or
// HANDLE_DATASET_METADATA_ERROR when request completes.
export function setDataSource(dataSource) {
  return function(dispatch) {
    if (!/\w{4}\-\w{4}/.test(dataSource.datasetUid)) {
      return;
    }

    var datasetMetadataProvider = new MetadataProvider({
      domain: dataSource.domain,
      datasetUid: dataSource.datasetUid
    });

    dispatch(requestMetadata());

    return Promise.all([
      datasetMetadataProvider.getDatasetMetadata(),
      datasetMetadataProvider.getPhidippidiesMetadata(),
      datasetMetadataProvider.getCuratedRegions()
    ]).then(function(resolutions) {
      dispatch(receiveMetadata(resolutions));
    }).catch(function(error) {
      console.error(error);
      dispatch(handleMetadataError());
    });
  };
}

export var REQUEST_METADATA = 'REQUEST_METADATA';
export function requestMetadata() {
  return {
    type: REQUEST_METADATA
  };
}

export var RECEIVE_METADATA = 'RECEIVE_METADATA';
export function receiveMetadata() {
  return {
    type: RECEIVE_METADATA
  };
}

export var RECEIVE_METADATA = 'RECEIVE_METADATA';
export function receiveMetadata(resolutions) {
  return {
    type: RECEIVE_METADATA,
    datasetMetadata: resolutions[0],
    phidippidiesMetadata: resolutions[1],
    curatedRegions: resolutions[2]
  };
}

export var HANDLE_METADATA_ERROR = 'HANDLE_METADATA_ERROR';
export function handleMetadataError(error) {
  return {
    type: HANDLE_METADATA_ERROR,
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

export var SET_MEASURE_AGGREGATION = 'SET_MEASURE_AGGREGATION';
export function setMeasureAggregation(measureAggregation) {
  return {
    type: SET_MEASURE_AGGREGATION,
    measureAggregation: measureAggregation
  };
}

export var SET_CHART_TYPE = 'SET_CHART_TYPE';
export function setChartType(chartType) {
  return {
    type: SET_CHART_TYPE,
    chartType: chartType
  };
}

export var SET_COMPUTED_COLUMN = 'SET_COMPUTED_COLUMN';
export function setComputedColumn(computedColumnUid, computedColumnName) {
  return {
    type: SET_COMPUTED_COLUMN,
    computedColumnUid: computedColumnUid,
    computedColumnName: computedColumnName
  };
}

export var SET_TITLE = 'SET_TITLE';
export function setTitle(title) {
  return {
    type: SET_TITLE,
    title: title
  };
}

export var SET_DESCRIPTION = 'SET_DESCRIPTION';
export function setDescription(description) {
  return {
    type: SET_DESCRIPTION,
    description: description
  };
}

export var SET_PRIMARY_COLOR = 'SET_PRIMARY_COLOR';
export function setPrimaryColor(primaryColor) {
  return {
    type: SET_PRIMARY_COLOR,
    primaryColor: primaryColor
  };
}

export var SET_SECONDARY_COLOR = 'SET_SECONDARY_COLOR';
export function setSecondaryColor(secondaryColor) {
  return {
    type: SET_SECONDARY_COLOR,
    secondaryColor: secondaryColor
  };
}

export var SET_HIGHLIGHT_COLOR = 'SET_HIGHLIGHT_COLOR';
export function setHighlightColor(highlightColor) {
  return {
    type: SET_HIGHLIGHT_COLOR,
    highlightColor: highlightColor
  };
}
