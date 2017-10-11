import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';

import Localization from 'common/i18n/components/Localization';

import Header from './components/header';

require('./styles/main.scss');

const App = ({ store }) => {
  return (
    <Localization locale={window.serverConfig.locale || 'en'}>
      <Provider store={store}>
        <div>
          <Header />
        </div>
      </Provider>
    </Localization>
  );
};

App.propTypes = {
  store: PropTypes.object.isRequired
};

export default App;
