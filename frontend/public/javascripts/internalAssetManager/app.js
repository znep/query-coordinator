import PropTypes from 'prop-types';
import React from 'react';
import { Provider } from 'react-redux';
import AlertWrapper from './components/alert_wrapper';
import Header from './components/header';
import ResultsAndFilters from './components/results_and_filters';
import WindowDimensions from './components/window_dimensions';
import Localization from 'common/i18n/components/Localization';

const App = ({ store, page }) => {
  return (
    <Localization locale={window.serverConfig.locale || 'en'}>
      <Provider store={store}>
        <div>
          <Header page={page} />
          <ResultsAndFilters page={page} />
          <AlertWrapper />
          <WindowDimensions />
        </div>
      </Provider>
    </Localization>
  );
};

App.propTypes = {
  store: PropTypes.object.isRequired,
  page: PropTypes.string
};

export default App;
