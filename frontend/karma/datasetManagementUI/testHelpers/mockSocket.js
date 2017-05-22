import { SocketIO, Server} from 'mock-socket';

// TODO: refine to be able to actually do channels
function wsmock() {
  const mockServer = new Server('/api/publishing/v1/socket');

  mockServer.on('connection', server => {
    mockServer.emit('ok', 'connected fine');
    mockServer.emit('errors', {count: 0});
    mockServer.emit('max_ptr', {
      "seq_num":0,
      "row_offset":0,
      "end_row_offset":4999
    });
    mockServer.emit('updated', {error_count: 3});
  });

  window.DSMAPI_PHOENIX_SOCKET = {
    channel: function(name){
      const chan = new SocketIO('/api/publishing/v1/socket');
      chan.join = function() { return this }
      chan.receive = function() { return this }
      return chan;
    }
  };

  return mockServer;
}

export default wsmock;
