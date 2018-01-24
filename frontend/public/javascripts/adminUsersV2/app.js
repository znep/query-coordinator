import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import Localization from 'common/i18n/components/Localization';
import Notification from './components/Notification';
import TabbedView from './components/TabbedView';

export const App = ({ store }) => (
  <Localization locale={serverConfig.locale || 'en'}>
    <Provider store={store}>
      <div className="admin-users-app">
        <Notification />
        <div className="header-button-bar" />
        <TabbedView />
      </div>
    </Provider>
  </Localization>
);

App.propTypes = {
  store: PropTypes.object.isRequired
};

export default App;
