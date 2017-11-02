import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';

import airbrake from 'common/airbrake';
import { dateLocalize } from 'common/locale';
import Approvals from './components/approvals';
import { AppContainer } from 'react-hot-loader';

if (_.get(window, 'serverConfig.environment') !== 'development') {
  airbrake.init(_.get(window, 'serverConfig.airbrakeProjectId'), _.get(window, 'serverConfig.airbrakeKey'));
}

ReactDOM.render(<Approvals />, document.querySelector('#approvals-content'));

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('common/components/AssetBrowser', () => {
    ReactDOM.render(
      <AppContainer>
        <Approvals />,
      </AppContainer>,
      document.querySelector('#approvals-content')
    );
  });
}

Array.from(document.querySelectorAll('.dateLocalize')).forEach(dateLocalize);
