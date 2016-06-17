import { createStore, applyMiddleware } from 'redux';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';

import reducer from 'src/authoringWorkflow/reducers';
import vifs from 'src/authoringWorkflow/vifs';
import defaultMetadata from 'src/authoringWorkflow/defaultMetadata';

export default function(stateOverrides) {
  var logger = createLogger();
  var initialState = _.merge(
    {
      vifAuthoring: {
        authoring: {
          selectedVisualizationType: vifs().columnChart.series[0].type
        },
        vifs: vifs()
      },
      metadata: defaultMetadata
    },
    stateOverrides
  );

  return createStore(reducer, initialState, applyMiddleware(thunk, logger));
}
