import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import AppBar from 'containers/AppBarContainer';
import NotificationList from 'containers/NotificationListContainer';
import Modal from 'containers/ModalContainer';
import { bootstrapApp } from 'reduxStuff/actions/bootstrap';
import { loadRevision } from 'reduxStuff/actions/loadRevision';
import styles from './App.scss';

class App extends Component {
  constructor() {
    super();
    this.state = {
      loaded: false
    };
  }

  componentWillMount() {
    const { dispatch, params } = this.props;

    dispatch(bootstrapApp(window.initialState.view, window.initialState.customMetadataFieldsets));

    dispatch(loadRevision(params)).then(() =>
      this.setState({
        loaded: true
      })
    );
  }

  render() {
    if (this.state.loaded) {
      const wrapperClasses = `dataset-management-ui ${styles.datasetManagementUi}`;
      const { children } = this.props;

      return (
        <div className={wrapperClasses}>
          <AppBar />
          {children}
          <NotificationList />
          <Modal />
        </div>
      );
    } else {
      return (
        <div id="initial-spinner-container">
          <span className="spinner-default spinner-large" />
        </div>
      );
    }
  }
}

App.propTypes = {
  children: PropTypes.element.isRequired,
  dispatch: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired
};

export default connect()(App);
