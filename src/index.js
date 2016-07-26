const views = require('./views');
const dataProviders = require('./dataProviders');
const helpers = require('./helpers');
const AuthoringWorkflow = require('./authoringWorkflow');
const I18n = require('./I18n');
// vv these requires have the side effect of registering jQuery plugins vv
const ChoroplethMap = require('./ChoroplethMap');
const SvgRegionMap = require('./SvgRegionMap');
const ColumnChart = require('./ColumnChart');
const SvgColumnChart = require('./SvgColumnChart');
const DistributionChart = require('./DistributionChart');
const FeatureMap = require('./FeatureMap');
const SvgFeatureMap = require('./SvgFeatureMap');
const Table = require('./Table');
const TimelineChart = require('./TimelineChart');
const SvgTimelineChart = require('./SvgTimelineChart');
const SvgHistogram = require('./SvgHistogram');

// TODO: add exported function here called `init` which takes a VIF and instantiates the
// appropriate visualization based on the VIF's `type` field

module.exports = {
  AuthoringWorkflow: AuthoringWorkflow,
  views: views,
  dataProviders: dataProviders,
  helpers: helpers,
  ChoroplethMap: ChoroplethMap,
  ColumnChart: ColumnChart,
  svgRegionMap: SvgRegionMap,
  SvgColumnChart: SvgColumnChart,
  DistributionChart: DistributionChart,
  FeatureMap: FeatureMap,
  SvgFeatureMap: SvgFeatureMap,
  Table: Table,
  TimelineChart: TimelineChart,
  SvgTimelineChart: SvgTimelineChart,
  SvgHistogram: SvgHistogram
};
