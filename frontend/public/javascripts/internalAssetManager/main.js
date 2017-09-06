import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import airbrake from 'common/airbrake';
import { AppContainer } from 'react-hot-loader';

import { dateLocalize } from 'common/locale';
import AssetBrowser from 'common/components/AssetBrowser';
import FeedbackPanel from 'common/components/AssetBrowser/components/feedback_panel';
import reducer from 'common/components/AssetBrowser/reducers';

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

const assetBrowser = <AssetBrowser showFilters showSearchField />;

ReactDOM.render(assetBrowser, document.querySelector('#internal-asset-manager-content'));

const store = createStore(reducer, applyMiddleware(...middleware));

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('common/components/AssetBrowser', () => {
    ReactDOM.render(
      <AppContainer>
        {assetBrowser}
      </AppContainer>,
      document.querySelector('#internal-asset-manager-content')
    );
  });
}

_.defer(() => {
  const feedbackPanel = <FeedbackPanel {...window.serverConfig} buttonPosition="bottom" store={store} />;

  ReactDOM.render(feedbackPanel, document.querySelector('#feedback-panel-content'));

  // Hot Module Replacement API
  if (module.hot) {
    module.hot.accept('common/components/AssetBrowser/components/feedback_panel', () => {
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
