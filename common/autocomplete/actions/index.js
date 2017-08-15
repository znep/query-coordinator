export const QUERY_CHANGED = 'QUERY_CHANGED';
export const RESULTS_CHANGED = 'RESULTS_CHANGED';
export const RESULT_VISIBILITY_CHANGED = 'RESULT_VISIBILITY_CHANGED';
export const RESULT_FOCUS_CHANGED = 'RESULT_FOCUS_CHANGED';
export const COLLAPSE_CHANGED = 'COLLAPSE_CHANGED';
export const CLEAR_SEARCH = 'CLEAR_SEARCH';

export const queryChanged = (query) => ({ type: QUERY_CHANGED, query });
export const resultsChanged = (response) => ({ type: RESULTS_CHANGED, response });
export const resultVisibilityChanged = (visible) => ({ type: RESULT_VISIBILITY_CHANGED, visible });
export const resultFocusChanged = (focus) => ({ type: RESULT_FOCUS_CHANGED, focus });
export const clearSearch = () => ({ type: CLEAR_SEARCH });
export const collapseChanged = (collapsed) => ({ type: COLLAPSE_CHANGED, collapsed });
