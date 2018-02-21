import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import Localization, { DEFAULT_LOCALE } from 'common/i18n/components/Localization';
import Notification from './components/Notification';
import TabbedView from './components/TabbedView';

export const App = ({ store, locale }) => (
  <Localization locale={locale}>
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
  locale: PropTypes.string,
  store: PropTypes.object.isRequired
};

App.defaultProps = {
  locale: DEFAULT_LOCALE
};

export default App;
