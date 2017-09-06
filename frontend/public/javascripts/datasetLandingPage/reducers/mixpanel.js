import mixpanel from 'common/mixpanel';

import { EMIT_MIXPANEL_EVENT } from '../actionTypes';

// This reducer does not manage any state but intercepts actions and logs events to mixpanel.
// Perhaps it could be middleware instead.
export default function(state, action) {
  switch (action.type) {
    case EMIT_MIXPANEL_EVENT:
      mixpanel.sendPayload(
        action.data.name,
        action.data.properties
      );
      return null;

    default:
      return null;
  }
}
