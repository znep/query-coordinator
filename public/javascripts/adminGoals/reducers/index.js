import Immutable from 'immutable';
import { combineReducers } from 'redux-immutablejs';
import * as Goals from '../sections/goals';
import notification from './notification';

export default combineReducers({
  notification,
  goals: Goals.rootReducer,
  translations: state => state || Immutable.fromJS(window.translations || {})
});
