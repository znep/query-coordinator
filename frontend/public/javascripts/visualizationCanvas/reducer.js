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

  return _.extend(
    {},
    vif,
    { origin }
  );
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

  const nextState = {
    ...state
  };

  switch (action.type) {
    case actions.ADD_VISUALIZATION:
      _.set(nextState, 'authoringWorkflow', {
        isActive: true,
        vifIndex: state.vifs.length,
        // Default starter VIF
        vif: {
          format: {
            type: 'visualization_interchange_format',
            version: 2
          },
          series: [
            {
              dataSource: {
                domain: _.get(window.serverConfig, 'domain'),
                datasetUid: state.parentView.id
              }
            }
          ]
        }
      });
      break;

    case actions.EDIT_VISUALIZATION:
      _.set(nextState, 'authoringWorkflow', {
        isActive: true,
        vifIndex: action.data.vifIndex,
        vif: state.vifs[action.data.vifIndex]
      });
      break;

    case actions.CANCEL_EDITING_VISUALIZATION:
      _.set(nextState, 'authoringWorkflow', AUTHORING_WORKFLOW_INITIAL_STATE);
      break;

    case actions.UPDATE_VISUALIZATION:
      _.set(nextState, 'isDirty', true);
      _.set(nextState, `vifs[${state.authoringWorkflow.vifIndex}]`, applyVifOrigin(state, action.data.vif));
      _.set(nextState, 'authoringWorkflow', AUTHORING_WORKFLOW_INITIAL_STATE);
      _.set(nextState, 'filters', action.data.filters);
      break;

    case actions.ENTER_EDIT_MODE:
      _.set(nextState, 'mode', ModeStates.EDIT);
      break;

    case actions.ENTER_PREVIEW_MODE:
      _.set(nextState, 'mode', ModeStates.PREVIEW);
      break;

    case actions.OPEN_EDIT_MENU:
      _.set(nextState, 'isEditMenuActive', true);
      break;

    case actions.CLOSE_EDIT_MENU:
      _.set(nextState, 'isEditMenuActive', false);
      break;

    case actions.UPDATE_NAME_AND_DESCRIPTION:
      _.set(nextState, 'isDirty', true);
      _.set(nextState, 'view.name', action.data.name);
      _.set(nextState, 'view.description', action.data.description);
      _.set(nextState, 'isEditMenuActive', false);
      break;

    case actions.SET_FILTERS:
      _.set(nextState, 'isDirty', true);
      // Set top level filters
      _.set(nextState, 'filters', action.filters);
      // Set filters in each series of each VIF
      _.each(state.vifs, (vif) => {
        _.each(vif.series, (series) => {
          _.set(series, 'dataSource.filters', action.filters);
        });
      });
      break;

    case actions.SET_MAP_CENTER_AND_ZOOM:
      _.set(nextState, 'isDirty', true);
      _.set(
        nextState,
        `vifs[${action.data.vifIndex}].configuration.mapCenterAndZoom`,
        action.data.centerAndZoom
      );
      break;

    case actions.SET_MAP_NOTIFICATION_DISMISSED:
      _.set(nextState, `mapNotificationDismissed[${action.data.vifIndex}]`, true);
      break;

    case actions.RECEIVED_COLUMN_STATS:
      _.set(nextState, 'columnStats', action.stats);
      break;

    case actions.REQUESTED_SAVE:
      _.set(nextState, 'saveState', SaveStates.SAVING);
      break;

    case actions.HANDLE_SAVE_SUCCESS:
      // Redirect if we're saving for the first time
      if (state.isEphemeral) {
        window.onbeforeunload = null;
        window.location = `/d/${action.response.id}`;
        return state;
      }

      _.set(nextState, 'isDirty', false);
      _.set(nextState, 'saveState', SaveStates.SAVED);
      break;

    case actions.HANDLE_SAVE_ERROR:
      _.set(nextState, 'saveState', SaveStates.ERRORED);
      break;

    case actions.CLEAR_SAVE_STATE:
      _.set(nextState, 'saveState', SaveStates.IDLE);
      break;

    case actions.OPEN_SHARE_MODAL:
      _.set(nextState, 'shareModal', {
        isActive: true,
        vifIndex: action.data.vifIndex,
        vif: state.vifs[action.data.vifIndex],
        embedSize: 'large'
      });
      break;

    case actions.CLOSE_SHARE_MODAL:
      _.set(nextState, 'shareModal', SHARE_MODAL_INITIAL_STATE);
      break;

    case actions.SET_EMBED_SIZE:
      _.set(nextState, 'shareModal.embedSize', action.size);
      break;

    default:
      break;
  }

  return nextState;
};
