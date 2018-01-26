import { combineReducers } from 'redux';
import { combineSelectors } from 'combine-selectors-redux';
import omit from 'lodash/fp/omit';

import teams, * as teamsSelectors from './reducers/teamsReducer';
import ui, * as uiSelectors from './reducers/uiReducer';

const omitIntialState = omit('initialState');
export const selectors = combineSelectors({
  ui: omitIntialState(uiSelectors),
  teams: omitIntialState(teamsSelectors)
});

export default combineReducers({
  teams,
  ui
});
