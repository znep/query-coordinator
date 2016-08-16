import _ from 'lodash';
import regionMapVif from './regionMapVif';
import columnChartVif from './columnChartVif';
import featureMapVif from './featureMapVif';
import histogramVif from './histogramVif';
import tableVif from './tableVif';
import timelineChartVif from './timelineChartVif';

export default () => _.cloneDeep({
  regionMap: regionMapVif,
  columnChart: columnChartVif,
  featureMap: featureMapVif,
  histogram: histogramVif,
  table: tableVif,
  timelineChart: timelineChartVif
});
