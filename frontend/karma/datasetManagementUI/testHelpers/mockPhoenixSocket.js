export default function mockPhoenixSocket(serverEvents, done) {
  var neverJoinedChannels = Object.keys(serverEvents);

  setTimeout(() => {
    if(neverJoinedChannels.length > 0) {
      done(new Error(`Never joined channels ${neverJoinedChannels.join(', ')}`));
    }
  }, 1000);

  const nextIndexToSend = {};
  _.keys(serverEvents).forEach((channelName) => {
    const indicesPerEventForChannel = {};
    nextIndexToSend[channelName] = indicesPerEventForChannel;
    serverEvents[channelName].forEach((message) => {
      indicesPerEventForChannel[message.event] = 0;
    });
  });

  let alreadyDone = false;

  window.DSMAPI_PHOENIX_SOCKET = {
    channel: (channelName, joinPayload) => {
      if (!serverEvents[channelName]) {
        done(new Error(`no such mock channel: ${channelName}`));
      }
      const callbacks = {};
      const joinCallbacks = {};
      function sendMessages(idx = 0) {
        setTimeout(() => {
          const messages = serverEvents[channelName];
          if (idx < messages.length) {
            const message = messages[idx];
            const callback = callbacks[message.event];
            callback(message.payload);
            nextIndexToSend[channelName][message.event]++;
            sendMessages(idx + 1);
          } else {
            function allMessagesSent([channelName, messages]) {
              return messages.length === _.sum(_.values(nextIndexToSend[channelName]));
            }
            if (_.toPairs(serverEvents).every(allMessagesSent)) {
              if (!alreadyDone) {
                done();
                alreadyDone = true;
              }
            }
          }
        }, 0);
      }
      const joinedChannel = {
        receive: (joinEvent, callback) => {
          joinCallbacks[joinEvent] = callback;
          return joinedChannel;
        }
      };
      return {
        on: (eventName, callback) => {
          callbacks[eventName] = callback;
        },
        join: () => {
          neverJoinedChannels = _.without(neverJoinedChannels, channelName);
          sendMessages();
          return joinedChannel;
        }
      };
    }
  };

  return () => {
    delete window.DSMAPI_PHOENIX_SOCKET;
  }
}
