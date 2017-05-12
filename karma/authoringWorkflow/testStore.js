import _ from 'lodash';
import { createStore, applyMiddleware } from 'redux';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';

import reducer from 'src/authoringWorkflow/reducers';
import vifs from 'src/authoringWorkflow/vifs';
import { defaultState as defaultMetadata } from 'src/authoringWorkflow/reducers/metadata';

export default function(stateOverrides) {
  return createStore(reducer, getInitialState(stateOverrides), applyMiddleware(thunk));
}

export function getInitialState(stateOverrides) {
  return _.merge(
    {
      vifAuthoring: {
        authoring: {
          selectedVisualizationType: vifs().columnChart.series[0].type
        },
        vifs: vifs()
      },
      metadata: _.merge(
        defaultMetadata,
        {
          domain: 'test.domain',
          datasetUid: 'xxxx-xxxx'
        }
      )
    },
    stateOverrides
  );
}
