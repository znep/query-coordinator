export const QUERY_CHANGED = 'QUERY_CHANGED';
export const RESULTS_CHANGED = 'RESULTS_CHANGED';
export const RESULT_VISIBILITY_CHANGED = 'RESULT_VISIBILITY_CHANGED';
export const RESULT_FOCUS_CHANGED = 'RESULT_FOCUS_CHANGED';
export const COLLAPSE_CHANGED = 'COLLAPSE_CHANGED';
export const SEARCH_CLEARED = 'SEARCH_CLEARED';

export const queryChanged = (query) => ({ type: QUERY_CHANGED, query });
export const resultsChanged = (results) => ({ type: RESULTS_CHANGED, results });
export const resultVisibilityChanged = (visible) => ({ type: RESULT_VISIBILITY_CHANGED, visible });
export const resultFocusChanged = (focus) => ({ type: RESULT_FOCUS_CHANGED, focus });
export const searchCleared = () => ({ type: SEARCH_CLEARED, query: null });
export const collapseChanged = (collapsed) => ({ type: COLLAPSE_CHANGED, collapsed });
