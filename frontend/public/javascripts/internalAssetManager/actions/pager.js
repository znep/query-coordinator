import { fetchResults } from './cetera';

export const changePage = (pageNumber) => (dispatch, getState) => {
  const onSuccess = () => {
    dispatch({ type: 'CHANGE_PAGE', pageNumber });
  };

  return fetchResults(dispatch, getState, { currentPage: pageNumber }, onSuccess);
};
