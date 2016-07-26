import { combineReducers } from 'redux';

import metadata from './metadata';
import authoring from './authoring';

import choroplethMap from './vifs/choroplethMap';
import columnChart from './vifs/columnChart';
import featureMap from './vifs/featureMap';
import histogram from './vifs/histogram';
import timelineChart from './vifs/timelineChart';

module.exports = combineReducers({
  metadata,
  vifAuthoring: combineReducers({
    authoring,
    vifs: combineReducers({
      choroplethMap,
      columnChart,
      featureMap,
      histogram,
      timelineChart
    })
  })
});
