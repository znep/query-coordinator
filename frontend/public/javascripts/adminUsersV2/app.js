import React, { PropTypes } from 'react';
import { Provider } from 'react-redux';
import { ConnectedUsersTable } from './components/users_table';
import Localization from 'common/i18n/components/Localization';

export const App = ({ store }) => {
  return (
    <Localization locale={serverConfig.locale || 'en'}>
      <Provider store={store}>
        <div className="admin-users-app">
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
