import { combineReducers } from 'redux';

import metadata from './metadata';
import authoring from './authoring';

import regionMap from './vifs/regionMap';
import columnChart from './vifs/columnChart';
import featureMap from './vifs/featureMap';
import histogram from './vifs/histogram';
import timelineChart from './vifs/timelineChart';

module.exports = combineReducers({
  metadata,
  vifAuthoring: combineReducers({
    authoring,
    vifs: combineReducers({
      regionMap,
      columnChart,
      featureMap,
      histogram,
      timelineChart
    })
  })
});
