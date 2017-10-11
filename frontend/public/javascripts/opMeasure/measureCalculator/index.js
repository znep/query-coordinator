// Calculates measures via direct SoQL calls.
// TODO: Assumes only "count" measures exist. This will change in our next ticket.

import _ from 'lodash';
import { SoqlDataProvider } from 'common/visualizations/dataProviders';
import { CalculationTypeNames } from '../lib/constants';
import { assertIsOneOfTypes } from 'common/js_utils';

export const calculateCountMeasure = (measure) => {
  const dataProviderConfig = {
    domain: window.location.hostname,
    datasetUid: _.get(measure, 'metric.dataSource.uid')
  };

  const dataProvider = new SoqlDataProvider(dataProviderConfig);

  return dataProvider.getRowCount();
};

export const calculateSumMeasure = (measure) => {
  const dataProviderConfig = {
    domain: window.location.hostname,
    datasetUid: _.get(measure, 'metric.dataSource.uid')
  };

  const fieldName = _.get(measure, 'metric.arguments.column');
  const dataProvider = new SoqlDataProvider(dataProviderConfig);
  const sumAlias = '__measure_sum_alias__';

  return dataProvider.rawQuery(`select sum(${fieldName}) as ${sumAlias}`).then((data) => {
    return data[0][sumAlias];
  });
};

export const calculateRecentValueMeasure = (measure) => {
  const dataProviderConfig = {
    domain: window.location.hostname,
    datasetUid: _.get(measure, 'metric.dataSource.uid')
  };
  const dataProvider = new SoqlDataProvider(dataProviderConfig);

  const valueColumnFieldName = _.get(measure, 'metric.arguments.valueColumn');
  const dateColumnFieldName = _.get(measure, 'metric.arguments.dateColumn');

  return dataProvider.rawQuery(`select ${valueColumnFieldName} order by ${dateColumnFieldName} DESC limit 1`).
    then((data) => {
      return _.values(data[0])[0];
    });
};

export const calculateMeasure = (measure) => {
  assertIsOneOfTypes(measure, 'object');

  const calculationType = _.get(measure, 'metric.type');

  assertIsOneOfTypes(calculationType, 'string');

  switch (calculationType) {
    case CalculationTypeNames.COUNT:
      return calculateCountMeasure(measure);
    case CalculationTypeNames.SUM:
      return calculateSumMeasure(measure);
    case CalculationTypeNames.RECENT_VALUE:
      return calculateRecentValueMeasure(measure);
    default:
      throw new Error(`Unknown calculation type: ${calculationType}`);
  }
};
