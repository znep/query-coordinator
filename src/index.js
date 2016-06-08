var views = require('./views');
var dataProviders = require('./dataProviders');
var helpers = require('./helpers');
var AuthoringWorkflow = require('./authoringWorkflow');
// vv these requires have the side effect of registering jQuery plugins vv
var ChoroplethMap = require('./ChoroplethMap');
var ColumnChart = require('./ColumnChart');
var SvgColumnChart = require('./SvgColumnChart');
var DistributionChart = require('./DistributionChart');
var FeatureMap = require('./FeatureMap');
var Table = require('./Table');
var TimelineChart = require('./TimelineChart');
var SvgTimelineChart = require('./SvgTimelineChart');

// TODO: add exported function here called `init` which takes a VIF and instantiates the
// appropriate visualization based on the VIF's `type` field

module.exports = {
  AuthoringWorkflow: AuthoringWorkflow,
  views: views,
  dataProviders: dataProviders,
  helpers: helpers,
  ChoroplethMap: ChoroplethMap,
  ColumnChart: ColumnChart,
  SvgColumnChart: SvgColumnChart,
  DistributionChart: DistributionChart,
  FeatureMap: FeatureMap,
  Table: Table,
  TimelineChart: TimelineChart,
  SvgTimelineChart: SvgTimelineChart
};