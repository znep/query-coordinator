import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Router } from 'react-router';
import rootRoute from 'routes';
import { Provider } from 'react-redux';

// The reason this is a class-component rather than a functional one as well as
// the if (!this.routes) hack below, is because of HMR jankiness. See:
// https://github.com/ReactTraining/react-router/issues/2704
// and also:
// https://github.com/gaearon/react-hot-loader/issues/298
class App extends Component {
  render() {
    const { store, history } = this.props;

    if (!this.routes) {
      this.routes = rootRoute(store);
    }

    return (
      <Provider store={store}>
        <Router history={history}>{this.routes}</Router>
      </Provider>
    );
  }
}

App.propTypes = {
  store: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired
};

export default App;
