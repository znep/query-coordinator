const join = () => ({
  receive: (msg, cb) => {
    cb({});
    return join();
  }
});

const channel = broadcasts => name => ({
  join: join,
  on: (evt, callback) => {
    const broadcast = broadcasts.find(b => b.evt === evt && b.channel === name);
    if (broadcast) {
      return callback(broadcast.msg);
    }
  }
});

const mockSocket = broadcasts => ({
  connect: () => {},
  channel: channel(broadcasts)
});

export default mockSocket;
