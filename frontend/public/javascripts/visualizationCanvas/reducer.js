import _ from 'lodash';
import * as actions from 'actions';
import { ModeStates, SaveStates } from './lib/constants';

const AUTHORING_WORKFLOW_INITIAL_STATE = {
  isActive: false
};

const SHARE_MODAL_INITIAL_STATE = {
  isActive: false
};

const applyVifOrigin = (state, vif) => {
  const origin = {
    type: 'visualization_canvas'
  };

  if (state && state.visualizationUrl) {
    origin.url = state.visualizationUrl;
  }

  return _.extend({}, vif, { origin });
};

// Update the vif at the position currently being edited.
const updateVifs = (state, newVif, index = state.authoringWorkflow.vifIndex) => {
  const updatedVifs = _.clone(state.vifs);
  updatedVifs[index] = applyVifOrigin(state, newVif);

  return updatedVifs;
};

// Apply a set of filters to each series of each vif in an array.
const filterVifs = (vifs, filters) => {
  return _.map(vifs, (vif) => ({
    ...vif,
    series: _.map(vif.series, (series) => ({
      ...series,
      dataSource: {
        ...series.dataSource,
        filters
      }
    }))
  }));
};

const setMapNotification = (state, index) => {
  const updatedNotifications = _.clone(state.mapNotificationDismissed);
  updatedNotifications[index] = true;

  return updatedNotifications;
};

const initialState = () => {
  const state = window.initialState;
  const isEphemeral = _.isNil(state.view.id);

  _.assign(state, {
    authoringWorkflow: AUTHORING_WORKFLOW_INITIAL_STATE,
    shareModal: SHARE_MODAL_INITIAL_STATE,
    mode: isEphemeral ? ModeStates.EDIT : ModeStates.VIEW,
    isEditMenuActive: false,
    isEphemeral,
    isDirty: isEphemeral,
    saveState: SaveStates.IDLE,
    mapNotificationDismissed: [],
    columnStats: null,
    visualizationUrl: isEphemeral ? null : `https://${window.location.host}/d/${state.view.id}`,
    dataSourceUrl: `https://${window.location.host}${state.parentView.path}`
  });

  // If this view was just saved, its vifs won't contain the origin
  // URL (because those vifs were created while the view was ephemeral).
  // So, refresh the origin.
  state.vifs = _.map(state.vifs, (vif) => applyVifOrigin(state, vif));

  return state;
};

export default (state = initialState(), action) => {
  if (_.isUndefined(action)) {
    return state;
  }

  switch (action.type) {
    case actions.ADD_VISUALIZATION:
      return {
        ...state,
        authoringWorkflow: {
          isActive: true,
          vifIndex: state.vifs.length,
          // Default starter VIF
          vif: {
            format: {
              type: 'visualization_interchange_format',
              version: 2
            },
            series: [{
              dataSource: {
                domain: _.get(window.serverConfig, 'domain'),
                datasetUid: state.parentView.id
              }
            }]
          }
        }
      };

    case actions.EDIT_VISUALIZATION:
      return {
        ...state,
        authoringWorkflow: {
          isActive: true,
          vifIndex: action.data.vifIndex,
          vif: state.vifs[action.data.vifIndex]
        }
      };

    case actions.CANCEL_EDITING_VISUALIZATION:
      return {
        ...state,
        authoringWorkflow: AUTHORING_WORKFLOW_INITIAL_STATE
      };

    case actions.UPDATE_VISUALIZATION:
      return {
        ...state,
        authoringWorkflow: AUTHORING_WORKFLOW_INITIAL_STATE,
        vifs: updateVifs(state, action.data.vif),
        filters: action.data.filters,
        isDirty: true
      };

    case actions.ENTER_EDIT_MODE:
      return {
        ...state,
        mode: ModeStates.EDIT
      };

    case actions.ENTER_PREVIEW_MODE:
      return {
        ...state,
        mode: ModeStates.PREVIEW
      };

    case actions.OPEN_EDIT_MENU:
      return {
        ...state,
        isEditMenuActive: true
      };

    case actions.CLOSE_EDIT_MENU:
      return {
        ...state,
        isEditMenuActive: false
      };

    case actions.UPDATE_NAME_AND_DESCRIPTION:
      return {
        ...state,
        view: {
          ...state.view,
          name: action.data.name,
          description: action.data.description
        },
        isDirty: true,
        isEditMenuActive: false
      };

    case actions.SET_FILTERS:
      return {
        ...state,
        filters: action.filters,
        vifs: filterVifs(state.vifs, action.filters),
        isDirty: true
      };

    case actions.SET_MAP_CENTER_AND_ZOOM:
      return {
        ...state,
        isDirty: true,
        vifs: updateVifs(
          state,
          _.set(
            state.vifs[action.data.vifIndex],
            'configuration.mapCenterAndZoom',
            action.data.centerAndZoom
          ),
          action.data.vifIndex
        )
      };

    case actions.SET_MAP_NOTIFICATION_DISMISSED:
      return {
        ...state,
        mapNotificationDismissed: setMapNotification(state, action.data.vifIndex)
      };

    case actions.RECEIVED_COLUMN_STATS:
      return {
        ...state,
        columnStats: action.stats
      };

    case actions.REQUESTED_SAVE:
      return {
        ...state,
        saveState: SaveStates.SAVING
      };

    case actions.HANDLE_SAVE_SUCCESS:
      // Redirect if we're saving for the first time
      if (state.isEphemeral) {
        window.onbeforeunload = null;
        window.location = `/d/${action.response.id}`;
        return state;
      }

      return {
        ...state,
        isDirty: false,
        saveState: SaveStates.SAVED
      };

    case actions.HANDLE_SAVE_ERROR:
      return {
        ...state,
        saveState: SaveStates.ERRORED
      };

    case actions.CLEAR_SAVE_STATE:
      return {
        ...state,
        saveState: SaveStates.IDLE
      };

    case actions.OPEN_SHARE_MODAL:
      return {
        ...state,
        shareModal: {
          isActive: true,
          vifIndex: action.data.vifIndex,
          vif: state.vifs[action.data.vifIndex],
          embedSize: 'large'
        }
      };

    case actions.CLOSE_SHARE_MODAL:
      return {
        ...state,
        shareModal: SHARE_MODAL_INITIAL_STATE
      };

    case actions.SET_EMBED_SIZE:
      return {
        ...state,
        shareModal: {
          ...state.shareModal,
          embedSize: action.size
        }
      };

    default:
      return state;
  }
};
