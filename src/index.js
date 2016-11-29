import views from './views';
import dataProviders from './dataProviders';
import helpers from './helpers';
import components from './components';
import AuthoringWorkflow from './authoringWorkflow';
import VisualizationRenderer from './VisualizationRenderer';
import I18n from './I18n';

// vv these requires have the side effect of registering jQuery plugins vv
import ChoroplethMap from './ChoroplethMap';
import SvgRegionMap from './SvgRegionMap';
import ColumnChart from './ColumnChart';
import SvgColumnChart from './SvgColumnChart';
import SvgPieChart from './SvgPieChart';
import DistributionChart from './DistributionChart';
import FeatureMap from './FeatureMap';
import SvgFeatureMap from './SvgFeatureMap';
import Table from './Table';
import TimelineChart from './TimelineChart';
import SvgTimelineChart from './SvgTimelineChart';
import SvgHistogram from './SvgHistogram';
import SampleChart from './SampleChart';
import SvgBarChart from './SvgBarChart';

module.exports = {
  AuthoringWorkflow,
  views,
  dataProviders,
  helpers,
  components,
  VisualizationRenderer,
  ChoroplethMap,
  ColumnChart,
  SvgRegionMap,
  SvgPieChart,
  SvgColumnChart,
  DistributionChart,
  FeatureMap,
  SvgFeatureMap,
  Table,
  TimelineChart,
  SvgTimelineChart,
  SvgHistogram,
  SampleChart,
  SvgBarChart
};
