import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { ConnectedUsersTable } from './components/UsersTable';
import UserSearchBar from './components/UserSearchBar';
import { ConnectedFutureUsersTable } from './components/FutureUsersTable';
import { Tabs } from '../common/components/Tabs';
import { DataLoader } from './components/DataLoader';
import Localization from 'common/i18n/components/Localization';

export const App = ({ store }) => {
  return (
    <Localization locale={serverConfig.locale || 'en'}>
      <Provider store={store}>
        <DataLoader>
          <div className="admin-users-app">
            <Tabs>
              <div name="Users">
                <UserSearchBar />
                <ConnectedUsersTable />
              </div>
              <div name="Pending Users">
                <ConnectedFutureUsersTable />
              </div>
            </Tabs>
          </div>
        </DataLoader>
      </Provider>
    </Localization>
  );
};

App.propTypes = {
  store: PropTypes.object.isRequired
};

export default App;
