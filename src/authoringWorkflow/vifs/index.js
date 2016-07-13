import _ from 'lodash';
import choroplethMapVif from './choroplethMapVif';
import columnChartVif from './columnChartVif';
import featureMapVif from './featureMapVif';
import timelineChartVif from './timelineChartVif';

export default () => _.cloneDeep({
  choroplethMap: choroplethMapVif,
  columnChart: columnChartVif,
  featureMap: featureMapVif,
  timelineChart: timelineChartVif
});
