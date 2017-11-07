import { combineReducers } from 'redux';

import metadata from './metadata';
import authoring from './authoring';

import barChart from './vifs/barChart';
import regionMap from './vifs/regionMap';
import columnChart from './vifs/columnChart';
import comboChart from './vifs/comboChart';
import pieChart from './vifs/pieChart';
import featureMap from './vifs/featureMap';
import histogram from './vifs/histogram';
import table from './vifs/table';
import timelineChart from './vifs/timelineChart';

// Placeholder reducer for initialVif
const initialVif = state => state || {};

module.exports = combineReducers({
  metadata,
  vifAuthoring: combineReducers({
    authoring,
    vifs: combineReducers({
      initialVif,
      barChart,
      regionMap,
      columnChart,
      comboChart,
      pieChart,
      featureMap,
      histogram,
      table,
      timelineChart
    })
  })
});
