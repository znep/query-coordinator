import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import FeedbackPanel from '../../../common/components/FeedbackPanel';
import AppBar from 'containers/AppBarContainer';
import NotificationList from 'containers/NotificationListContainer';
import Modal from 'containers/ModalContainer';
import { loadRevision } from 'reduxStuff/actions/loadRevision';
import styles from './Home.module.scss';

class Home extends Component {
  constructor() {
    super();
    this.state = {
      loaded: false
    };
  }

  componentWillMount() {
    const { dispatch, params } = this.props;

    // loadRevision puts revisions and sources into the store and also subscribes
    // to the revision websocket channel
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

      const { serverConfig } = window;

      const FeedbackPanelProps = {
        currentUser: serverConfig.currentUser,
        locale: serverConfig.localePrefix,
        usersnapProjectID: serverConfig.usersnapProjectID,
        buttonPosition: 'right'
      };

      return (
        <div className={wrapperClasses}>
          <AppBar />
          {children}
          <NotificationList />
          <Modal />
          <FeedbackPanel {...FeedbackPanelProps} />
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

Home.propTypes = {
  children: PropTypes.element.isRequired,
  dispatch: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired
};

export default connect()(Home);
