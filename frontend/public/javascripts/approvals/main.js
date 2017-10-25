import _ from 'lodash';
import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import airbrake from 'common/airbrake';
import { dateLocalize } from 'common/locale';
import AssetBrowser from 'common/components/AssetBrowser';
import { ApprovalActionButtons } from 'common/components/AssetBrowser/components';

if (_.get(window, 'serverConfig.environment') !== 'development') {
  airbrake.init(_.get(window, 'serverConfig.airbrakeProjectId'), _.get(window, 'serverConfig.airbrakeKey'));
}

const assetBrowser = (
  <AssetBrowser
    actionElement={ApprovalActionButtons}
    showFilters
    showSearchField />
);

ReactDOM.render(assetBrowser, document.querySelector('#approvals-content'));

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('common/components/AssetBrowser', () => {
    ReactDOM.render(
      <AppContainer>
        {assetBrowser}
      </AppContainer>,
      document.querySelector('#approvals-content')
    );
  });
}

Array.from(document.querySelectorAll('.dateLocalize')).forEach(dateLocalize);
