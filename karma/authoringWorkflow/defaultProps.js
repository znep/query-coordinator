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
      data: {},
      phidippidesMetadata: {columns: []}
    }),
  }, overrides);
}
