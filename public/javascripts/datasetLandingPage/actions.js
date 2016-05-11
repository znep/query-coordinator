export const EMIT_MIXPANEL_EVENT = 'EMIT_MIXPANEL_EVENT';

export function emitMixpanelEvent(data) {
  return {
    type: EMIT_MIXPANEL_EVENT,
    data: data
  };
}
