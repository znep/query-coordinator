import _ from 'lodash';
import {
  ADD_VISUALIZATION,
  EDIT_VISUALIZATION,
  CANCEL_EDITING_VISUALIZATION,
  UPDATE_VISUALIZATION,
  ENTER_PREVIEW_MODE,
  ENTER_EDIT_MODE,
  OPEN_EDIT_MENU,
  CLOSE_EDIT_MENU,
  UPDATE_NAME_AND_DESCRIPTION,
  SET_FILTERS,
  RECEIVED_COLUMN_STATS,
  REQUESTED_SAVE,
  HANDLE_SAVE_SUCCESS,
  HANDLE_SAVE_ERROR,
  CLEAR_SAVE_STATE
} from 'actions';
import { SaveStates } from './lib/constants';

const initialState = () => {
  const isEphemeral = _.isNil(window.initialState.view.id);

  return _.assign(window.initialState, {
    authoringWorkflow: {
      isActive: false
    },
    mode: 'edit',
    isEditMenuActive: false,
    isEphemeral,
    isDirty: isEphemeral,
    saveState: SaveStates.IDLE,
    columnStats: null
  });
};

const defaultVif = () => (
  {
    format: {
      type: 'visualization_interchange_format',
      version: 2
    },
    series: [
      {
        dataSource: {
          domain: _.get(window.serverConfig, 'domain'),
          datasetUid: _.get(window.initialState, 'parentView.id')
        }
      }
    ]
  }
);

// Update the vif at the position currently being edited.
const updateVifs = (state, newVif) => {
  const updatedVifs = _.clone(state.vifs);
  updatedVifs[state.authoringWorkflow.vifIndex] = newVif;

  return updatedVifs;
};

const getVif = (state, vifIndex) => {
  if (vifIndex > state.vifs.length || vifIndex < 0) {
    throw new Error(`invalid vifIndex: ${vifIndex}`);
  }

  return state.vifs[vifIndex];
};

// Apply a set of filters to each series of each vif in an array.
const filterVifs = (vifs, filters) => {
  return _.map(vifs, (vif) => ({
    ...vif,
    series: _.map(vif.series, (series) => {
      return _.merge(series, {
        dataSource: {
          filters
        }
      });
    })
  }));
};

export default (state = initialState(), action) => {
  if (_.isUndefined(action)) {
    return state;
  }

  switch (action.type) {
    case ADD_VISUALIZATION:
      return {
        ...state,
        authoringWorkflow: {
          isActive: true,
          vifIndex: state.vifs.length,
          vif: defaultVif()
        }
      };

    case EDIT_VISUALIZATION:
      return {
        ...state,
        authoringWorkflow: {
          isActive: true,
          vifIndex: action.data.vifIndex,
          vif: getVif(state, action.data.vifIndex)
        }
      };

    case CANCEL_EDITING_VISUALIZATION:
      return {
        ...state,
        authoringWorkflow: {
          isActive: false
        }
      };

    case UPDATE_VISUALIZATION:
      return {
        ...state,
        authoringWorkflow: {
          isActive: false
        },
        vifs: updateVifs(state, action.data.vif),
        filters: action.data.filters,
        isDirty: true
      };

    case ENTER_EDIT_MODE:
      return {
        ...state,
        mode: 'edit'
      };

    case ENTER_PREVIEW_MODE:
      return {
        ...state,
        mode: 'preview'
      };

    case OPEN_EDIT_MENU:
      return {
        ...state,
        isEditMenuActive: true
      };

    case CLOSE_EDIT_MENU:
      return {
        ...state,
        isEditMenuActive: false
      };

    case UPDATE_NAME_AND_DESCRIPTION:
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

    case SET_FILTERS:
      return {
        ...state,
        filters: action.filters,
        vifs: filterVifs(state.vifs, action.filters),
        isDirty: true
      };

    case RECEIVED_COLUMN_STATS:
      return {
        ...state,
        columnStats: action.stats
      };

    case REQUESTED_SAVE:
      return {
        ...state,
        saveState: SaveStates.SAVING
      };

    // Redirect if we're saving for the first time
    case HANDLE_SAVE_SUCCESS:
      if (state.isEphemeral) {
        window.location = `/d/${action.response.id}`;
        return state;
      }

      return {
        ...state,
        isDirty: false,
        saveState: SaveStates.SAVED
      };

    case HANDLE_SAVE_ERROR:
      return {
        ...state,
        saveState: SaveStates.ERRORED
      };

    case CLEAR_SAVE_STATE:
      return {
        ...state,
        saveState: SaveStates.IDLE
      };

    default:
      return state;
  }
};
