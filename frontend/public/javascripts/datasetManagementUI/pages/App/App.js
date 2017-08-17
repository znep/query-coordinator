import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';

import AppBar from 'containers/AppBarContainer';
import NotificationList from 'containers/NotificationListContainer';
import Modal from 'containers/ModalContainer';
import { bootstrapApp } from 'reduxStuff/actions/bootstrap';
import styles from './App.scss';

class App extends Component {
  componentWillMount() {
    const { dispatch } = this.props;

    dispatch(bootstrapApp(window.initialState.view, window.initialState.customMetadataFieldsets));
  }

  render() {
    const { children } = this.props;
    const wrapperClasses = `dataset-management-ui ${styles.datasetManagementUi}`;

    return (
      <div className={wrapperClasses}>
        <AppBar />
        {children}
        <NotificationList />
        <Modal />
      </div>
    );
  }
}

App.propTypes = {
  children: PropTypes.element.isRequired,
  dispatch: PropTypes.func.isRequired
};

export default connect()(App);
