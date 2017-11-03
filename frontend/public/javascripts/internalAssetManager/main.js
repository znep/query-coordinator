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
import { FeedbackPanel } from 'common/components/FeedbackPanel';
import { ResultsAndFilters } from 'common/components/AssetBrowser/components';
import reducer from 'common/components/AssetBrowser/reducers';
import * as constants from 'common/components/AssetBrowser/lib/constants';

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

const tabs = {
  [constants.MY_ASSETS_TAB]: {
    component: ResultsAndFilters
  },
  [constants.SHARED_TO_ME_TAB]: {
    component: ResultsAndFilters
  },
  [constants.ALL_ASSETS_TAB]: {
    component: ResultsAndFilters
  }
};

const assetBrowser = (
  <AssetBrowser
    showFilters
    showSearchField
    tabs={tabs} />
);

ReactDOM.render(assetBrowser, document.querySelector('#internal-asset-manager-asset-browser'));

const store = createStore(reducer, applyMiddleware(...middleware));

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('common/components/AssetBrowser', () => {
    ReactDOM.render(
      <AppContainer>
        {assetBrowser}
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
