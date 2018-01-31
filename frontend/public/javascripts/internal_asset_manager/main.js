import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import airbrake from 'common/airbrake';
import { AppContainer } from 'react-hot-loader';

import { FeedbackPanel } from 'common/components';

import { dateLocalize } from 'common/locale';
import InternalAssetManager from './components/internal_asset_manager';

if (_.get(window, 'serverConfig.environment') !== 'development') {
  airbrake.init(_.get(window, 'serverConfig.airbrakeProjectId'), _.get(window, 'serverConfig.airbrakeKey'));
}

ReactDOM.render(<InternalAssetManager />, document.querySelector('#internal-asset-manager-asset-browser'));

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
  // Note: This will never render anything because we don't pass the current user in serverConfig.
  // Is this expected?
  const feedbackPanel = <FeedbackPanel {...window.serverConfig} buttonPosition="bottom" />;

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
