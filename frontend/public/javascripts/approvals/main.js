import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import _ from 'lodash';
import airbrake from 'common/airbrake';
import { dateLocalize } from 'common/locale';
import { Settings } from 'common/components/AssetBrowser/components/approvals/settings';
import { AppContainer } from 'react-hot-loader';

import AssetBrowser from 'common/components/AssetBrowser';
import { ApprovalActionButtons } from 'common/components/AssetBrowser/components';
import { ResultsAndFilters } from 'common/components/AssetBrowser/components';
import * as constants from 'common/components/AssetBrowser/lib/constants';

if (_.get(window, 'serverConfig.environment') !== 'development') {
  airbrake.init(_.get(window, 'serverConfig.airbrakeProjectId'), _.get(window, 'serverConfig.airbrakeKey'));
}

const tabs = {
  [constants.MY_QUEUE_TAB]: {
    component: ResultsAndFilters,
    props: {
      actionElement: ApprovalActionButtons
    }
  },
  [constants.HISTORY_TAB]: {
    component: () => <div>History! todo</div>
  },
  [constants.SETTINGS_TAB]: {
    component: Settings
  }
};

const assetBrowser = (
  <AssetBrowser
    showAssetCounts={false}
    showFilters
    showSearchField
    tabs={tabs} />
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
