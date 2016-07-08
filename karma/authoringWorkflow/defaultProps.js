import _ from 'lodash';
import vifs from 'src/authoringWorkflow/vifs';
import defaultMetadata from 'src/authoringWorkflow/defaultMetadata';

export default function(overrides) {
  return _.merge({
    vifAuthoring: {
      authoring: {
        selectedVisualizationType: 'columnChart'
      },
      vifs: vifs()
    },
    metadata: _.merge({}, defaultMetadata, {
      data: {columns: [{fieldName: 'test', name: 'Testing'}]},
      phidippidesMetadata: {columns: {'test': {renderTypeName: 'text', name: 'Testing'}}},
      curatedRegions: [{name: 'Region', uid: 'four-four'}]
    }),
  }, overrides);
}
