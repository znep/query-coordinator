import _ from 'lodash';
import barChartVif from './barChartVif';
import mapVif from './mapVif';
import regionMapVif from './regionMapVif';
import columnChartVif from './columnChartVif';
import comboChartVif from './comboChartVif';
import pieChartVif from './pieChartVif';
import featureMapVif from './featureMapVif';
import histogramVif from './histogramVif';
import tableVif from './tableVif';
import timelineChartVif from './timelineChartVif';

export default () => _.cloneDeep({
  barChart: barChartVif,
  map: mapVif,
  regionMap: regionMapVif,
  columnChart: columnChartVif,
  comboChart: comboChartVif,
  pieChart: pieChartVif,
  featureMap: featureMapVif,
  histogram: histogramVif,
  table: tableVif,
  timelineChart: timelineChartVif
});
