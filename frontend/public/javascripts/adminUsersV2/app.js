import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { ConnectedUsersTable } from './components/UsersTable';
import UserSearchBar from './components/UserSearchBar';
import Localization from 'common/i18n/components/Localization';

export const App = ({ store }) => {
  return (
    <Localization locale={serverConfig.locale || 'en'}>
      <Provider store={store}>
        <div className="admin-users-app">
          <UserSearchBar />
          <ConnectedUsersTable />
        </div>
      </Provider>
    </Localization>
  );
};

App.propTypes = {
  store: PropTypes.object.isRequired
};

export default App;
