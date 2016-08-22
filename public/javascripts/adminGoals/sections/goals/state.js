export const getData = state => state.getIn(['goals', 'data']);
export const getPagination = state => state.getIn(['goals', 'ui', 'pagination']);
export const getSorting = state => state.getIn(['goals', 'ui', 'sorting']);
export const getSelectedIds = state => state.getIn(['goals', 'ui', 'selectedGoalIds']);
export const getQuickEdit = state => state.getIn(['goals', 'quickEdit']);
export const getBulkEdit = state => state.getIn(['goals', 'bulkEdit']);
