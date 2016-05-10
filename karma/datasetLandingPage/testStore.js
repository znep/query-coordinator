import mockView from './data/mockView';
import mockFeaturedView from './data/mockFeaturedView';
import mockContactForm from './data/mockContactForm';

import datasetLandingPage from 'reducers';

export function getDefaultStore() {
  return redux.createStore(datasetLandingPage, {
    view: mockView,
    contactForm: mockContactForm,
    featuredViews: {
      list: _.times(3, _.constant(mockFeaturedView)),
      hasMore: false,
      hasError: false,
      isLoading: false,
      isCollapsed: false
    }
  });
}
