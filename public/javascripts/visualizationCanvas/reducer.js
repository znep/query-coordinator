import _ from 'lodash';
import {
  ADD_VISUALIZATION,
  CANCEL_EDITING_VISUALIZATION,
  UPDATE_VISUALIZATION,
  ENTER_PREVIEW_MODE,
  ENTER_EDIT_MODE
} from 'actions';

const initialState = () => (
  {
    parentView: _.get(window.initialState, 'parentView'),
    view: _.get(window.initialState, 'view'),
    vifs: _.get(window.initialState, 'vifs', []),
    authoringWorkflow: {
      isActive: false
    },
    mode: 'edit'
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

const updateVifs = (state, newVif) => {
  const updatedVifs = _.clone(state.vifs);
  updatedVifs[state.authoringWorkflow.position] = newVif;

  return updatedVifs;
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
          position: state.vifs.length,
          vif: defaultVif()
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
        vifs: updateVifs(state, action.data.vif)
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

    default:
      return state;
  }
};
