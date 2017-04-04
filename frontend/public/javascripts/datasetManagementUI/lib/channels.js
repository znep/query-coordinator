import _ from 'lodash';

export function joinChannel(channelName, handlers) {
  const channel = window.DSMAPI_PHOENIX_SOCKET.channel(channelName);
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
}
