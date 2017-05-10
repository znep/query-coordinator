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

  state = _.cloneDeep(state);

  switch (action.type) {
    case actions.ADD_VISUALIZATION:
      _.set(state, 'authoringWorkflow', {
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
      _.set(state, 'authoringWorkflow', {
        isActive: true,
        vifIndex: action.data.vifIndex,
        vif: state.vifs[action.data.vifIndex]
      });
      break;

    case actions.CANCEL_EDITING_VISUALIZATION:
      _.set(state, 'authoringWorkflow', AUTHORING_WORKFLOW_INITIAL_STATE);
      break;

    case actions.UPDATE_VISUALIZATION:
      _.set(state, 'isDirty', true);
      _.set(state, `vifs[${state.authoringWorkflow.vifIndex}]`, applyVifOrigin(state, action.data.vif));
      _.set(state, 'authoringWorkflow', AUTHORING_WORKFLOW_INITIAL_STATE);
      _.set(state, 'filters', action.data.filters);
      break;

    case actions.ENTER_EDIT_MODE:
      _.set(state, 'mode', ModeStates.EDIT);
      break;

    case actions.ENTER_PREVIEW_MODE:
      _.set(state, 'mode', ModeStates.PREVIEW);
      break;

    case actions.OPEN_EDIT_MENU:
      _.set(state, 'isEditMenuActive', true);
      break;

    case actions.CLOSE_EDIT_MENU:
      _.set(state, 'isEditMenuActive', false);
      break;

    case actions.UPDATE_NAME_AND_DESCRIPTION:
      _.set(state, 'isDirty', true);
      _.set(state, 'view.name', action.data.name);
      _.set(state, 'view.description', action.data.description);
      _.set(state, 'isEditMenuActive', false);
      break;

    case actions.SET_FILTERS:
      _.set(state, 'isDirty', true);
      // Set top level filters
      _.set(state, 'filters', action.filters);
      // Set filters in each series of each VIF
      _.each(state.vifs, (vif) => {
        _.each(vif.series, (series) => {
          _.set(series, 'dataSource.filters', action.filters);
        });
      });
      break;

    case actions.SET_MAP_CENTER_AND_ZOOM:
      _.set(state, 'isDirty', true);
      _.set(state, `vifs[${action.data.vifIndex}].configuration.mapCenterAndZoom`, action.data.centerAndZoom);
      break;

    case actions.SET_MAP_NOTIFICATION_DISMISSED:
      _.set(state, `mapNotificationDismissed[${action.data.vifIndex}]`, true);
      break;

    case actions.RECEIVED_COLUMN_STATS:
      _.set(state, 'columnStats', action.stats);
      break;

    case actions.REQUESTED_SAVE:
      _.set(state, 'saveState', SaveStates.SAVING);
      break;

    case actions.HANDLE_SAVE_SUCCESS:
      // Redirect if we're saving for the first time
      if (state.isEphemeral) {
        window.onbeforeunload = null;
        window.location = `/d/${action.response.id}`;
        return state;
      }

      _.set(state, 'isDirty', false);
      _.set(state, 'saveState', SaveStates.SAVED);
      break;

    case actions.HANDLE_SAVE_ERROR:
      _.set(state, 'saveState', SaveStates.ERRORED);
      break;

    case actions.CLEAR_SAVE_STATE:
      _.set(state, 'saveState', SaveStates.IDLE);
      break;

    case actions.OPEN_SHARE_MODAL:
      _.set(state, 'shareModal', {
        isActive: true,
        vifIndex: action.data.vifIndex,
        vif: state.vifs[action.data.vifIndex],
        embedSize: 'large'
      });
      break;

    case actions.CLOSE_SHARE_MODAL:
      _.set(state, 'shareModal', SHARE_MODAL_INITIAL_STATE);
      break;

    case actions.SET_EMBED_SIZE:
      _.set(state, 'shareModal.embedSize', action.size);
      break;

    default:
      break;
  }

  return state;
};
