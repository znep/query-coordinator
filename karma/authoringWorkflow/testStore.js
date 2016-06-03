import { createStore, applyMiddleware } from 'redux';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';

import reducer from 'src/authoringWorkflow/reducers';
import vifs from 'src/authoringWorkflow/vifs';
import defaultDatasetMetadata from 'src/authoringWorkflow/defaultDatasetMetadata';

export default function(stateOverrides) {
  var initialState = _.merge(
    {
      vifAuthoring: {
        vifs: vifs(),
        selectedVisualizationType: vifs().columnChart.series[0].type
      },
      datasetMetadata: defaultDatasetMetadata
    },
    stateOverrides
  );
  var logger = createLogger();

  return createStore(reducer, initialState, applyMiddleware(thunk, logger));
}
