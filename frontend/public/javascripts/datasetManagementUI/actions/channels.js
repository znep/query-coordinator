import _ from 'lodash';

export const CHANNEL_JOIN_STARTED = 'CHANNEL_JOIN_STARTED';
export const channelJoinStarted = (channelName, channel) => ({
  type: CHANNEL_JOIN_STARTED,
  channelName,
  channel
});

export function joinChannel(channelName, handlers) {
  return (dispatch, getState) => {
    const joinedChannels = getState().channels;
    if (joinedChannels[channelName]) {
      return;
    }
    const channel = window.DSMAPI_PHOENIX_SOCKET.channel(channelName);
    dispatch(channelJoinStarted(channelName, channel));
    _.forEach(handlers, (handler, eventName) => {
      channel.on(eventName, handler);
    });
    channel.join().
      receive('ok', (response) => {
        console.log(`successfully joined ${channelName}:`, response);
      }).
      receive('error', (error) => {
        console.log(`failed to join ${channelName}:`, error);
      });
  };
}
