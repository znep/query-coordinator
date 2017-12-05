import _ from 'lodash';
import 'whatwg-fetch';
import { dataProviders as DataProviders } from 'common/visualizations';
import { checkStatus, defaultHeaders } from 'common/http';

// NOTE: In a future refactor, it might be good to separate the Mixpanel action
// into its own module, similar to how DSLP does it. See also reducer.
export const EMIT_MIXPANEL_EVENT = 'EMIT_MIXPANEL_EVENT';
export const emitMixpanelEvent = (data) => ({
  type: EMIT_MIXPANEL_EVENT,
  data
});

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

export const SET_MAP_CENTER_AND_ZOOM = 'SET_MAP_CENTER_AND_ZOOM';
export const setMapCenterAndZoom = (data) => ({
  type: SET_MAP_CENTER_AND_ZOOM,
  data
});

export const SET_MAP_NOTIFICATION_DISMISSED = 'SET_MAP_NOTIFICATION_DISMISSED';
export const setMapNotificationDismissed = (data) => ({
  type: SET_MAP_NOTIFICATION_DISMISSED,
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

export const UPDATE_NAME = 'UPDATE_NAME';
export const updateName = (data) => ({
  type: UPDATE_NAME,
  data
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

export const CLEAR_SAVE_STATE = 'CLEAR_SAVE_STATE';
export const clearSaveState = (debounce) => ({
  type: CLEAR_SAVE_STATE,
  meta: { debounce }
});

export const REQUESTED_SAVE = 'REQUESTED_SAVE';
export const requestedSave = () => ({
  type: REQUESTED_SAVE
});

export const HANDLE_SAVE_SUCCESS = 'HANDLE_SAVE_SUCCESS';
export const handleSaveSuccess = (response) => ({
  type: HANDLE_SAVE_SUCCESS,
  response
});

export const HANDLE_SAVE_ERROR = 'HANDLE_SAVE_ERROR';
export const handleSaveError = () => ({
  type: HANDLE_SAVE_ERROR
});

/*
 * Opens the share modal.
 *
 * Expected payload:
 * {
 *   vifIndex (int): Index of viz being shared.
 * }
 */
export const OPEN_SHARE_MODAL = 'OPEN_SHARE_MODAL';
export const openShareModal = (data) => ({
  type: OPEN_SHARE_MODAL,
  data
});

/**
 * Closes the share modal.
 */
export const CLOSE_SHARE_MODAL = 'CLOSE_SHARE_MODAL';
export const closeShareModal = () => ({
  type: CLOSE_SHARE_MODAL
});

/**
 * Sets embed size of the visualization being shared.
 *
 * Expected parameter:
 * size (String): Size name. See ShareVisualizationModal for set of sizes allowed.
 */
export const SET_EMBED_SIZE = 'SET_EMBED_SIZE';
export const setEmbedSize = (size) => ({
  type: SET_EMBED_SIZE,
  size
});

export const save = () => {
  return (dispatch, getState) => {
    const state = getState();
    const { isEphemeral } = state;
    const payload = _.pick(state, 'view', 'parentView', 'vifs', 'filters');

    const path = isEphemeral ? '' : `/${state.view.id}`;
    const url = `/visualization_canvas${path}`;
    const fetchOptions = {
      method: isEphemeral ? 'POST' : 'PUT',
      headers: defaultHeaders,
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    };

    const parseJSON = response => response.json();

    const onSuccess = _.flowRight(dispatch, handleSaveSuccess);
    const onError = _.flowRight(dispatch, handleSaveError);
    const clearSave = _.flowRight(dispatch, clearSaveState);

    // Cancel any existing clear save timer and show the spinner
    dispatch(clearSaveState({ cancel: true }));
    dispatch(requestedSave());

    // Save the page, update the store, clear the save status after a timer
    fetch(url, fetchOptions).
      then(checkStatus).
      then(parseJSON).
      then(onSuccess).
      catch(onError).
      then(_.partial(clearSave, { time: 3000 }));
  };
};
