// Vendor Imports
const _ = require('lodash');
// Project Imports
const GroupedCategoricalDataManager = require('./GroupedCategoricalDataManager');
const UngroupedCategoricalDataManager = require('./UngroupedCategoricalDataManager');
// Constants
const MAX_ROW_COUNT = 1000;
const MAX_GROUP_COUNT = GroupedCategoricalDataManager.MAX_GROUP_COUNT;

function getData(vif) {
  const isPieChart = _.some(
    vif.series,
    (series) => _.get(series, 'type', null) === 'pieChart'
  );
  const isGrouping = !_.isNull(
    _.get(
      vif,
      'series[0].dataSource.dimension.grouping.columnName',
      null
    )
  );
  const options = {
    MAX_ROW_COUNT
  };

  // Pie charts explicitly do not support grouping. We do this check here in
  // order to allow Bar, Column and Pie charts to all call this method and rely
  // on the right behavior in all cases.
  if (!isPieChart && isGrouping) {
    return GroupedCategoricalDataManager.getData(vif, options);
  } else {
    return UngroupedCategoricalDataManager.getData(vif, options);
  }
}

module.exports = {
  MAX_ROW_COUNT,
  MAX_GROUP_COUNT,
  getData
};
