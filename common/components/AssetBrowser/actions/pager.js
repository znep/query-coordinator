import { fetchResults } from 'common/components/AssetBrowser/lib/cetera_helpers';
import { updateQueryString } from 'common/components/AssetBrowser/lib/query_string';

export const changePage = (pageNumber) => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: 'CHANGE_PAGE', pageNumber });
    updateQueryString({ getState });
  };

  return fetchResults(dispatch, getState, { action: 'CHANGE_PAGE', pageNumber }, onSuccess);
};

export const clearPage = (dispatch) => {
  dispatch({ type: 'CHANGE_PAGE', pageNumber: 1 });
};
