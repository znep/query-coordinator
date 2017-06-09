import _ from 'lodash';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import reducer from 'common/authoring_workflow/reducers';
import vifs from 'common/authoring_workflow/vifs';
import { defaultState as defaultMetadata } from 'common/authoring_workflow/reducers/metadata';

export default function(stateOverrides) {
  return createStore(reducer, getInitialState(stateOverrides), applyMiddleware(thunk));
}

export function getInitialState(stateOverrides) {
  return _.merge(
    {},
    {
      vifAuthoring: {
        authoring: {
          selectedVisualizationType: vifs().columnChart.series[0].type
        },
        vifs: vifs()
      },
      metadata: _.merge(
        {},
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
