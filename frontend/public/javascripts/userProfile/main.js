import _ from 'lodash';
import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import { AppContainer } from 'react-hot-loader';

import airbrake from 'common/airbrake';
import { AssetBrowser } from 'common/components';
import { ResultsAndFilters } from 'common/components/AssetBrowser/components';
import { dateLocalize } from 'common/locale';
import Localization from 'common/i18n/components/Localization';
import { getCurrentUserId } from 'common/components/AssetBrowser/lib/helpers/cetera';
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
    component: ResultsAndFilters,
    props: {
      baseFilters: {
        forUser: getCurrentUserId()
      }
    }
  },
  [constants.SHARED_TO_ME_TAB]: {
    component: ResultsAndFilters,
    props: {
      baseFilters: {
        sharedTo: getCurrentUserId()
      }
    }
  }
};

const showManageAssets = _.includes(serverConfig.currentUser.flags, 'admin') ||
  !_.isEmpty(window.serverConfig.currentUser.roleName);

const components = (
  <Localization locale={serverConfig.locale || 'en'}>
    <AssetBrowser
      enableAssetInventoryLink={false}
      pageSize={5}
      showAssetCounts={false}
      showFilters={false}
      showHeader
      showManageAssets={showManageAssets}
      showResultCount
      showSearchField
      tabs={tabs} />
  </Localization>
);

ReactDOM.render(components, document.querySelector('#user-profile-asset-browser'));

if (module.hot) {
  module.hot.accept('common/components/AssetBrowser', () => {
    ReactDOM.render(
      <AppContainer>
        {components}
      </AppContainer>,
      document.querySelector('#user-profile-asset-browser')
    );
  });
}

Array.from(document.querySelectorAll('.dateLocalize')).forEach(dateLocalize);
