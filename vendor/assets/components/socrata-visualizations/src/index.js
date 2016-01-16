var views = require('./views');
var dataProviders = require('./dataProviders');
// vv these requires have the side effect of registering jQuery plugins vv
var ChoroplethMap = require('./ChoroplethMap');
var ColumnChart = require('./ColumnChart');
var FeatureMap = require('./FeatureMap');
var Table = require('./Table');
var TimelineChart = require('./TimelineChart');

// TODO: add exported function here called `init` which takes a VIF and instantiates the
// appropriate visualization based on the VIF's `type` field

module.exports = {
  views: views,
  dataProviders: dataProviders,
  ChoroplethMap: ChoroplethMap,
  ColumnChart: ColumnChart,
  FeatureMap: FeatureMap,
  Table: Table,
  TimelineChart: TimelineChart
};
