import mixpanel from '../../common/mixpanelTracking';

import { EMIT_MIXPANEL_EVENT } from '../actionTypes';

// This reducer does not manage any state but intercepts actions and logs events to mixpanel.
// It should be refactored into middleware.
export default (state, action) => {
  if (action.type === EMIT_MIXPANEL_EVENT) {
    mixpanel.sendPayload(action.data.name, action.data.properties);
  }

  return state || {};
};
