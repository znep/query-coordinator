import { createStore, applyMiddleware } from 'redux';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';

import reducer from 'src/authoringWorkflow/reducers';
import defaultVif from 'src/authoringWorkflow/defaultVif';
import defaultDatasetMetadata from 'src/authoringWorkflow/defaultDatasetMetadata';

export default function(stateOverrides) {
  var initialState = _.merge({vif: defaultVif, datasetMetadata: defaultDatasetMetadata}, stateOverrides);
  var logger = createLogger();

  return createStore(reducer, initialState, applyMiddleware(thunk, logger));
}
