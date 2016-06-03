import { combineReducers } from 'redux';

import view from './view';
import featuredContent from './featuredContent';
import popularViews from './popularViews';
import contactForm from './contactForm';
import mixpanel from './mixpanel';

export default combineReducers({
  view,
  featuredContent,
  popularViews,
  contactForm,
  mixpanel
});
