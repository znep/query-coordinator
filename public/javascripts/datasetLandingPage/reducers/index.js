import { combineReducers } from 'redux';

import view from './view';
import featuredViews from './featuredViews';
import contactForm from './contactForm';
import mixpanel from './mixpanel';

export default combineReducers({
  view,
  featuredViews,
  contactForm,
  mixpanel
});
