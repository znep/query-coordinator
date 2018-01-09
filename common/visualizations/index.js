import views from './views';
import dataProviders from './dataProviders';
import helpers from './helpers';
import components from './components';
import VisualizationRenderer from './VisualizationRenderer';
import I18n from 'common/i18n';

// vv these requires have the side effect of registering jQuery plugins vv
import ChoroplethMap from './ChoroplethMap';
import SvgRegionMap from './SvgRegionMap';
import ColumnChart from './ColumnChart';
import SvgColumnChart from './SvgColumnChart';
import SvgPieChart from './SvgPieChart';
import DistributionChart from './DistributionChart';
import FeatureMap from './FeatureMap';
import SvgFeatureMap from './SvgFeatureMap';
import UnifiedMap from './UnifiedMap';
import Table from './Table';
import TimelineChart from './TimelineChart';
import SvgTimelineChart from './SvgTimelineChart';
import SvgHistogram from './SvgHistogram';
import SampleChart from './SampleChart';
import SvgBarChart from './SvgBarChart';
import SvgComboChart from './SvgComboChart';

module.exports = {
  ChoroplethMap,
  ColumnChart,
  DistributionChart,
  FeatureMap,
  I18n,
  SampleChart,
  SvgBarChart,
  SvgColumnChart,
  SvgComboChart,
  SvgFeatureMap,
  UnifiedMap,
  SvgHistogram,
  SvgPieChart,
  SvgRegionMap,
  SvgTimelineChart,
  Table,
  TimelineChart,
  VisualizationRenderer,
  components,
  dataProviders,
  helpers,
  views
};
