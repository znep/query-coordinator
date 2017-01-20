import { dataProviders as DataProviders } from 'socrata-visualizations';

export const ADD_VISUALIZATION = 'ADD_VISUALIZATION';
export const addVisualization = () => ({
  type: ADD_VISUALIZATION
});

export const EDIT_VISUALIZATION = 'EDIT_VISUALIZATION';
export const editVisualization = (data) => ({
  type: EDIT_VISUALIZATION,
  data
});

export const CANCEL_EDITING_VISUALIZATION = 'CANCEL_EDITING_VISUALIZATION';
export const cancelEditingVisualization = () => ({
  type: CANCEL_EDITING_VISUALIZATION
});

export const UPDATE_VISUALIZATION = 'UPDATE_VISUALIZATION';
export const updateVisualization = (data) => ({
  type: UPDATE_VISUALIZATION,
  data
});

export const ENTER_PREVIEW_MODE = 'ENTER_PREVIEW_MODE';
export const enterPreviewMode = () => ({
  type: ENTER_PREVIEW_MODE
});

export const ENTER_EDIT_MODE = 'ENTER_EDIT_MODE';
export const enterEditMode = () => ({
  type: ENTER_EDIT_MODE
});

export const OPEN_EDIT_MENU = 'OPEN_EDIT_MENU';
export const openEditMenu = () => ({
  type: OPEN_EDIT_MENU
});

export const CLOSE_EDIT_MENU = 'CLOSE_EDIT_MENU';
export const closeEditMenu = () => ({
  type: CLOSE_EDIT_MENU
});

export const UPDATE_NAME_AND_DESCRIPTION = 'UPDATE_NAME_AND_DESCRIPTION';
export const updateNameAndDescription = (data) => ({
  type: UPDATE_NAME_AND_DESCRIPTION,
  data
});

export const SET_FILTERS = 'SET_FILTERS';
export const setFilters = (filters) => ({
  type: SET_FILTERS,
  filters
});

export const RECEIVED_COLUMN_STATS = 'RECEIVED_COLUMN_STATS';
export const receivedColumnStats = (stats) => ({
  type: RECEIVED_COLUMN_STATS,
  stats
});

export const FETCH_COLUMN_STATS = 'FETCH_COLUMN_STATS';
export const fetchColumnStats = () =>
  (dispatch, getState) => {
    const state = getState();
    const dataProviderConfig = {
      domain: serverConfig.domain,
      datasetUid: state.parentView.id
    };

    const soqlDataProvider = new DataProviders.SoqlDataProvider(dataProviderConfig);

    soqlDataProvider.getColumnStats(state.view.columns).
      then((stats) => {
        dispatch(receivedColumnStats(stats));
      });
  };
