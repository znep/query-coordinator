import { combineReducers } from 'redux';

import associateCollections from './associateCollections';
import view from './view';
import featuredContent from './featuredContent';
import relatedViews from './relatedViews';
import contactForm from './contactForm';
import mixpanel from './mixpanel';

export default combineReducers({
  associateCollections,
  view,
  featuredContent,
  relatedViews,
  contactForm,
  mixpanel
});
