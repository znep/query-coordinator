// Calculates measures via direct SoQL calls.
// TODO: Assumes only "count" measures exist. This will change in our next ticket.

import _ from 'lodash';
import { SoqlDataProvider } from 'common/visualizations/dataProviders';

export const calculateCountMeasure = (measure) => {
  const dataProviderConfig = {
    domain: window.location.hostname,
    datasetUid: _.get(measure, 'metric.dataSource.uid')
  };

  const dataProvider = new SoqlDataProvider(dataProviderConfig);

  return dataProvider.getRowCount();
};
