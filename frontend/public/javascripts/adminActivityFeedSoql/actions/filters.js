import * as paginationActions from './pagination';
import * as tableActions from './table';

const types = {
  CHANGE_TAB: 'CHANGE_TAB'
};

const storeActiveTab = (tab) => ({
  type: types.CHANGE_TAB,
  tab
});

const changeTab = (tab) => (dispatch) => {
  dispatch(storeActiveTab(tab));
  dispatch(paginationActions.resetPage());
  dispatch(paginationActions.fetchRowCount());
  dispatch(tableActions.fetchData());
};

export {
  types,
  changeTab
};
