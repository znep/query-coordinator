import _ from 'lodash';
import moment from 'moment';
import * as actions from '../actions';
import { DATE_FORMAT } from '../constants';

const initialState = {
  activeTab: 'all',
  date: {
    baseFilter: true,
    start: moment().subtract(3, 'month').format(DATE_FORMAT),
    end: moment().format(DATE_FORMAT)
  },
  event: null,
  assetType: null,
  affectedItemSearch: null,
  activeFilterCount: 0
};

const activeFilterCount = (state) => {
  // Dropdown filters
  let filterCount =
    _(state).
      omit(['activeTab', 'date', 'activeFilterCount']).
      omitBy(_.isNull).
      keys().
      value().
      length;

  // Special cases
  state.date && !state.date.baseFilter && filterCount++; //eslint-disable-line

  return filterCount;
};

export default function filters(state, action) {
  if (typeof state === 'undefined') {
    return initialState;
  }

  let stateDiff;
  switch (action.type) {
    case actions.filters.types.CHANGE_TAB:
      stateDiff = { activeTab: action.tab };

      if (action.tab === 'failure') {
        stateDiff.event = 'DataUpdate.Failure';
      } else if (action.tab === 'deleted') {
        stateDiff.event = 'AssetDeleted';
      } else {
        stateDiff.event = null;
      }
      break;

    case actions.filters.types.CHANGE_ASSET_TYPE:
      stateDiff = { assetType: action.assetType };
      break;

    case actions.filters.types.CHANGE_EVENT:
      stateDiff = { event: action.event };

      if (action.event === 'DataUpdate.Failure') {
        stateDiff.activeTab = 'failure';
      } else if (action.event === 'AssetDeleted') {
        stateDiff.activeTab = 'deleted';
      }
      break;

    case actions.filters.types.CHANGE_DATE_RANGE:
      stateDiff = { date: action.date };
      break;

    case actions.filters.types.CHANGE_AFFECTED_ITEM_SEARCH:
      stateDiff = { affectedItemSearch: action.value };
      break;

    case actions.filters.types.CLEAR_ALL_FILTERS:
      stateDiff = initialState;
      break;

    default:
  }

  const newState = Object.assign({}, state, stateDiff);

  return Object.assign(
    newState,
    { activeFilterCount: activeFilterCount(newState) }
  );
}
