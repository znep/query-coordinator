import { EMIT_MIXPANEL_EVENT } from '../actionTypes';

export function emitMixpanelEvent(data) {
  return {
    type: EMIT_MIXPANEL_EVENT,
    data: data
  };
}

