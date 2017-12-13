import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import airbrake from 'common/airbrake';
import { AppContainer } from 'react-hot-loader';

import { dateLocalize } from 'common/locale';
import { FeedbackPanel } from 'common/components/FeedbackPanel';
import reducer from 'common/components/AssetBrowser/reducers';
import InternalAssetManager from './components/internal_asset_manager';

const middleware = [thunk];

if (_.get(window, 'serverConfig.environment') === 'development') {
  middleware.push(createLogger({
    duration: true,
    timestamp: false,
    collapsed: true
  }));
} else {
  airbrake.init(_.get(window, 'serverConfig.airbrakeProjectId'), _.get(window, 'serverConfig.airbrakeKey'));
}

ReactDOM.render(<InternalAssetManager />, document.querySelector('#internal-asset-manager-asset-browser'));

const store = createStore(reducer, applyMiddleware(...middleware));

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('common/components/AssetBrowser', () => {
    ReactDOM.render(
      <AppContainer>
        <InternalAssetManager />
      </AppContainer>,
      document.querySelector('#internal-asset-manager-asset-browser')
    );
  });
}

_.defer(() => {
  const feedbackPanel = <FeedbackPanel {...window.serverConfig} buttonPosition="bottom" store={store} />;

  ReactDOM.render(feedbackPanel, document.querySelector('#feedback-panel-content'));

  // Hot Module Replacement API
  if (module.hot) {
    module.hot.accept('common/components/FeedbackPanel', () => {
      ReactDOM.render(
        <AppContainer>
          {feedbackPanel}
        </AppContainer>,
        document.querySelector('#dynamic-content')
      );
    });
  }
});

Array.from(document.querySelectorAll('.dateLocalize')).forEach(dateLocalize);
