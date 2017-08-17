import dotProp from 'dot-prop-immutable';
import { BOOTSTRAP_APP } from 'actions/bootstrap';

const bootstrapApp = (state, action) => {
  switch (action.type) {
    case BOOTSTRAP_APP: {
      return dotProp.set(state, 'entities.views', {
        [action.initialView.id]: action.initialView
      });
    }

    default:
      return state;
  }
};

export default bootstrapApp;
