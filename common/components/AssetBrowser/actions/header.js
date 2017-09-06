import { fetchResults } from 'common/components/AssetBrowser/lib/cetera_helpers';
import { updateQueryString } from 'common/components/AssetBrowser/lib/query_string';
import { clearAllFilters } from 'common/components/AssetBrowser/actions/filters';
import { getUnfilteredState } from 'common/components/AssetBrowser/reducers/filters';

export const changeTab = (newTab) => (dispatch, getState) => {
  dispatch({ type: 'CHANGE_TAB', newTab });

  const onSuccess = () => {
    updateQueryString({ getState });
  };

  return fetchResults(
    dispatch,
    getState,
    {
      pageNumber: 1,
      action: 'CHANGE_TAB',
      activeTab: newTab
    },
    onSuccess
  );
};

export const updateAssetCounts = (value) => () => {
  return {
    type: 'UPDATE_ASEST_COUNTS', assetCounts: value
  };
};
