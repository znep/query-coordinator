import _ from 'lodash';
import {
  ADD_VISUALIZATION,
  EDIT_VISUALIZATION,
  CANCEL_EDITING_VISUALIZATION,
  UPDATE_VISUALIZATION,
  ENTER_PREVIEW_MODE,
  ENTER_EDIT_MODE,
  SET_FILTERS,
  RECEIVED_COLUMN_STATS
} from 'actions';

const initialState = () => (
  {
    parentView: _.get(window.initialState, 'parentView'),
    view: _.get(window.initialState, 'view'),
    vifs: _.get(window.initialState, 'vifs', []),
    filters: _.get(window.initialState, 'filters', []),
    authoringWorkflow: {
      isActive: false
    },
    mode: 'edit',
    columnStats: null
  }
);

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
        filters: action.data.filters
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

    case SET_FILTERS:
      return {
        ...state,
        filters: action.filters,
        vifs: filterVifs(state.vifs, action.filters)
      };

    case RECEIVED_COLUMN_STATS:
      return {
        ...state,
        view: {
          ...state.view,
          columns: _.merge([], action.stats, state.view.columns)
        }
      };

    default:
      return state;
  }
};
