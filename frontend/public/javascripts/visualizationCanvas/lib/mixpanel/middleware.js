import _ from 'lodash';

import {
  SET_FILTERS,
  EMIT_MIXPANEL_EVENT,
  emitMixpanelEvent
} from '../../actions';
import { generateFilterEvents } from './eventGenerators/filters';

/**
 * Emits events to Mixpanel when a state transition occurs. When reacting to
 * state transitions, may emit either a single event (recording a user action
 * immediately) or multiple events (recording several details about updates
 * since the last "pristine" state upon saving).
 */

const isPristine = (state) => !_.get(state, 'isDirty', true);

export const middleware = ({ dispatch, getState }) => {
  // Last known pristine state. In the case of a newly bootstrapped viz canvas,
  // there will never be a pristine state, so this will remain empty.
  let lastPristineState = {};

  return (next) => (action) => {
    const preState = getState();
    const continuation = next(action);
    const postState = getState();

    if (action.type === EMIT_MIXPANEL_EVENT) {
      // Ignore Mixpanel actions, since they were likely generated here!
      return continuation;
    }

    if (isPristine(preState)) {
      // Whenever the outgoing state is pristine, update our local reference.
      lastPristineState = preState;
    }

    if (!isPristine(preState) && isPristine(postState)) {
      // Whenever the outgoing state is dirty and the incoming state isn't,
      // emit Mixpanel events depending on changes since the old pristine state.
      dispatch(emitMixpanelEvent([].concat(
        generateFilterEvents(lastPristineState, postState, 'pristine')
      )));
    } else {
      // Whenever an action that makes the state dirty occurs, emit a Mixpanel
      // event relevant to that action.
      switch (action.type) {
        case SET_FILTERS:
          dispatch(emitMixpanelEvent(
            generateFilterEvents(preState, postState, 'transient')
          ));
          break;

        default:
          break;
      }
    }

    return continuation;
  };
};
