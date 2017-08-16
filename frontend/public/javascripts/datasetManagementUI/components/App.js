import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';

import AppBar from './AppBar';
import NotificationList from 'components/Notifications/NotificationList';
import Modal from 'components/Modals/Modal';
import { bootstrapApp } from 'actions/bootstrap';
import styles from 'styles/App.scss';

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
