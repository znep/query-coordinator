import { combineReducers } from 'redux';
import search from './search';
import mixpanel from './mixpanel';
import header from './header';
import categoryStats from './categoryStats';
import featuredContent from './featuredContent';

export default combineReducers({
  search,
  mixpanel,
  header,
  categoryStats,
  featuredContent
});
