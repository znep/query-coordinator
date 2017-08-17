import { fetchResults } from './cetera';
import { clearPage } from './pager';
import { updateQueryString } from './query_string';
import { getUnfilteredState } from '../reducers/filters';

export const changeTab = (newTab) => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: 'CHANGE_TAB', newTab });
    dispatch({ type: 'CLEAR_ALL_FILTERS' });
    clearPage(dispatch);
    updateQueryString({ getState });
  };

  const initialState = { ...getUnfilteredState(), pageNumber: 1 };

  return fetchResults(
    dispatch,
    getState,
    {
      ...initialState,
      action: 'CHANGE_TAB',
      activeTab: newTab
    },
    onSuccess
  );
};
