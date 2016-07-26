import { combineReducers } from 'redux';

import view from './view';
import featuredContent from './featuredContent';
import relatedViews from './relatedViews';
import contactForm from './contactForm';
import mixpanel from './mixpanel';

export default combineReducers({
  view,
  featuredContent,
  relatedViews,
  contactForm,
  mixpanel
});
