import * as Immutable from 'immutable';
import * as ReduxImmutable  from 'redux-immutablejs';
import * as Sections from '../sections';
import notification from './notification';

export default ReduxImmutable.combineReducers({
  translations: state => state || Immutable.fromJS(window.translations || {}),
  notification,
  goals: Sections.Goals.rootReducer,
  shared: Sections.Shared.rootReducer
});
