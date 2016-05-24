import { combineReducers } from 'redux';

import view from './view';
import popularViews from './popularViews';
import contactForm from './contactForm';
import mixpanel from './mixpanel';

export default combineReducers({
  view,
  popularViews,
  contactForm,
  mixpanel
});
