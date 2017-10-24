import _ from 'lodash';
import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import { AppContainer } from 'react-hot-loader';

import airbrake from 'common/airbrake';
import { AssetBrowser } from 'common/components';
import { dateLocalize } from 'common/locale';
import Localization from 'common/i18n/components/Localization';
import { getCurrentUserFilter } from 'common/components/AssetBrowser/lib/cetera_helpers';
import { ALL_ASSETS_TAB } from 'common/components/AssetBrowser/lib/constants';

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

const components = (
  <Localization locale={serverConfig.locale || 'en'}>
    <AssetBrowser
      baseFilters={getCurrentUserFilter()}
      enableAssetInventoryLink={false}
      pageSize={5}
      showAssetCounts={false}
      showFilters={false}
      showHeader
      showManageAssets
      showPager={false}
      showSearchField
      tabsToHide={[ALL_ASSETS_TAB]} />
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
