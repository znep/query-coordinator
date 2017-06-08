import { fetchResults } from './cetera';

export const changePage = (pageNumber) => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: 'CHANGE_PAGE', pageNumber });
  };

  return fetchResults(dispatch, getState, { pageNumber }, onSuccess);
};

export const clearPage = (dispatch) => {
  dispatch({ type: 'CHANGE_PAGE', pageNumber: 1 });
};
