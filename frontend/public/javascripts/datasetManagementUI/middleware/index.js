import { applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { Socket } from 'phoenix';
import loggerMiddleware from 'redux-logger';
import { browserHistory } from 'react-router';
import { routerMiddleware } from 'react-router-redux';
import entitiesMiddleware from 'middleware/entities';

const socket = new Socket('/api/publishing/v1/socket', {
  params: {
    fourfour: window.initialState.view.id,
    token: window.serverConfig.websocketToken
  }
});

socket.connect();

const middleware = [thunkMiddleware.withExtraArgument(socket), routerMiddleware(browserHistory)];

if (window.serverConfig.environment === 'development') {
  middleware.push(
    loggerMiddleware({
      duration: true,
      timestamp: false,
      collapsed: true,
      logErrors: false
    })
  );

  middleware.push(entitiesMiddleware);

  console.log(
    'for convenience, try e.g. `console.table(ENTITIES.sources)` (only works when RAILS_ENV==development)'
  );
}

export default applyMiddleware(...middleware);
