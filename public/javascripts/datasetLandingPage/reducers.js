import mixpanel from './lib/mixpanelTracking';
import { EMIT_MIXPANEL_EVENT } from './actions';

function datasetLandingPage(state, action) {
  // TODO: Decide how we want to structure our reducers. How we decide to modify state will
  // help determine how to structure this switch.
  switch (action.type) {
    case EMIT_MIXPANEL_EVENT:
      mixpanel.sendPayload(
        action.data.name,
        action.data.properties
      );
      return state;
    default:
      return state;
  }
}

export default datasetLandingPage;
