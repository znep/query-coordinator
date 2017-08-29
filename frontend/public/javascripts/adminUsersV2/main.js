import React from 'react';
import ReactDOM from 'react-dom';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import App from './app';
import reducer from './reducers';
import Localization from 'common/i18n/components/Localization';


const middleware = [thunk];
middleware.push(createLogger({
  duration: true,
  timestamp: false,
  collapsed: true
}));

const store = createStore(reducer, applyMiddleware(...middleware));

ReactDOM.render(
  <Localization locale={serverConfig.locale || 'en'}>
    <Provider store={store}>
      <App />
    </Provider>
  </Localization>,
  document.querySelector('#app')
);
