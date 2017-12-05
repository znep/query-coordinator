import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import DataLoader from './components/DataLoader';
import { LocalizedCSVExportButton as CSVExportButton } from './users/components/CSVExportButton';
import Localization from 'common/i18n/components/Localization';
import { LocalizedNotification as Notification } from './components/Notification';
import TabbedView from './components/TabbedView';

export const App = ({ store }) => (
  <Localization locale={serverConfig.locale || 'en'}>
    <Provider store={store}>
      <DataLoader>
        <Notification />
        <div className="admin-users-app">
          <div className="header-button-bar">
            <CSVExportButton />
          </div>
          <TabbedView />
        </div>
      </DataLoader>
    </Provider>
  </Localization>
);

App.propTypes = {
  store: PropTypes.object.isRequired
};

export default App;
