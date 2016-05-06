// TODO when this file grows, create a reducers directory with multiple files
var _ = require('lodash');
var redux = require('redux');
var combineReducers = redux.combineReducers;

var initialState = {
  vifs: {
    columnChart: {}
  },
  datasetMetadata: null
};

function columnChartReducer(state, action) {
  if (_.isUndefined(state)) {
    return {}; // TODO return default vif
  }

  state = _.cloneDeep(state);

  switch (action.type) {
    case 'SET_DATASET_UID':
      state.vif.datasetUid = action.datasetUid;
  }

  return state;
}

function datasetMetadataReducer(state, action) {
  if (_.isUndefined(state)) {
    return null;
  }

  state = _.cloneDeep(state);

  return state;
}

module.exports = combineReducers({
  vifs: combineReducers({
    columnChart: columnChartReducer
  }),
  datasetMetadata: datasetMetadataReducer
});
