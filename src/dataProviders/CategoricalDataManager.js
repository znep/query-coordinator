// Vendor Imports
const _ = require('lodash');
// Project Imports
const GroupedDataManager = require('./GroupedDataManager');
const UngroupedDataManager = require('./UngroupedDataManager');
// Constants
const MAX_ROW_COUNT = 1000;
const MAX_GROUP_COUNT = GroupedDataManager.MAX_GROUP_COUNT;

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

  // Pie charts explicitly do not support grouping. We do this check here in
  // order to allow Bar, Column and Pie charts to all call this method and rely
  // on the right behavior in all cases.
  if (!isPieChart && isGrouping) {
    return GroupedDataManager.getData(vif, MAX_ROW_COUNT);
  } else {
    return UngroupedDataManager.getData(vif, MAX_ROW_COUNT);
  }
}

module.exports = {
  MAX_ROW_COUNT: MAX_ROW_COUNT,
  MAX_GROUP_COUNT: MAX_GROUP_COUNT,
  getData: getData
};
