import _ from 'lodash';

import vifs from 'src/authoringWorkflow/vifs';
import { defaultState as defaultAuthoring } from 'src/authoringWorkflow/reducers/authoring';
import { defaultState as defaultMetadata } from 'src/authoringWorkflow/reducers/metadata';

export default function(overrides) {
  var authoring = _.merge({}, defaultAuthoring, {
    selectedVisualizationType: 'columnChart'
  });

  var metadata = _.merge({}, defaultMetadata, {
    data: {columns: [{fieldName: 'test', name: 'Testing'}]},
    phidippidesMetadata: {columns: {'test': {renderTypeName: 'text', name: 'Testing'}}},
    curatedRegions: [{name: 'Region', uid: 'four-four'}]
  });

  return _.merge({
    vifAuthoring: {
      authoring,
      vifs: vifs()
    },
    metadata,
  }, overrides);
}
