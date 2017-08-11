import _ from 'lodash';

import vifs from 'common/authoring_workflow/vifs';
import { defaultState as defaultAuthoring } from 'common/authoring_workflow/reducers/authoring';
import { defaultState as defaultMetadata } from 'common/authoring_workflow/reducers/metadata';

export default function(overrides) {
  const authoring = _.merge({}, defaultAuthoring, {
    selectedVisualizationType: 'columnChart'
  });

  const metadata = _.merge({}, defaultMetadata, {
    domain: 'domain',
    datasetUid: 'xxxx-xxxx',
    data: {columns: [{fieldName: 'test', name: 'Testing', renderTypeName: 'text'}]},
    curatedRegions: [{name: 'Region', uid: 'four-four'}]
  });

  return _.merge({}, {
    vifAuthoring: {
      authoring,
      vifs: vifs()
    },
    metadata
  }, overrides);
}
