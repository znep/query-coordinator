import mockView from './data/mockView';
import mockFeaturedView from './data/mockFeaturedView';

import datasetLandingPage from 'reducers';

export function getDefaultStore() {
  return redux.createStore(datasetLandingPage, {
    view: mockView,
    featuredViews: _.times(3, _.constant(mockFeaturedView))
  });
}
