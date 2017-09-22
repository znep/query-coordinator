import * as React  from 'react';
import PropTypes from 'prop-types';
import * as ReactRedux from 'react-redux';
import * as Goals from '../../sections/goals';
import * as Components from '../../components';

import './App.scss';

function App({store}) {
  return (
    <ReactRedux.Provider store={store}>
      <div className="app-container admin-goals-page">
        <Components.PreviewBar />
        <div className="main-section" role="main">
          <Components.HeaderBar />
          <Goals.Page />
        </div>
      </div>
    </ReactRedux.Provider>
  );
}

App.propTypes = {
  store: PropTypes.object.isRequired
};

export default App;
