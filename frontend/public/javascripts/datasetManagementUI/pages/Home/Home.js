import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { FeedbackPanel } from 'common/components';
import AppBar from 'datasetManagementUI/containers/AppBarContainer';
import NotificationList from 'datasetManagementUI/containers/NotificationListContainer';
import Modal from 'datasetManagementUI/containers/ModalContainer';
import { loadRevision } from 'datasetManagementUI/reduxStuff/actions/loadRevision';
import styles from './Home.module.scss';

import { FeatureFlags } from 'common/feature_flags';

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

      // The only time we show the A2B on DSMUI is if both flags are true.
      // If either flag is false, then we show the DSMUI header.
      const showHeaderBar = !(FeatureFlags.value('enable_new_dataset_sharing_ux') &&
        FeatureFlags.value('enable_asset_action_bar_on_dsmui'));

      return (
        <div className={wrapperClasses}>
          {showHeaderBar && <AppBar />}
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
