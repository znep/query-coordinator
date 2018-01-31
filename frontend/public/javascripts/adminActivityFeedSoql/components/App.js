import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { spring } from 'react-motion';

import { FeedbackPanel } from 'common/components';
import LocalizedText from 'common/i18n/components/LocalizedText';
import Table from './Table';
import Footer from './Footer';
import Tabs from './Tabs';
import Topbar from './Topbar';
import FilterPanel from './FilterPanel';
import RestoreModal from './RestoreModal';
import ToastNotification, { types } from 'common/components/ToastNotification';

export class App extends Component {
  showToast(message, type) {
    const initialRightValue = -16;
    const finalRightValue = 16;
    const initialOpacity = 0;
    const finalOpacity = 1;

    const customTransition = {
      willEnter: () => ({ opacity: initialOpacity, right: initialRightValue }),
      willLeave: () => ({ opacity: spring(initialOpacity), right: spring(initialRightValue) }),
      style: { opacity: spring(finalOpacity), right: spring(finalRightValue) }
    };

    const toastProps = {
      children: message,
      customTransition,
      showNotification: true,
      type
    };

    return (
      <ToastNotification {...toastProps} />
    );
  }

  renderError() {
    const { apiError } = this.props;

    if (!apiError) {
      return null;
    }

    if (_.isString(apiError) || _.isObject(apiError)) {
      console.error('activityLog:renderError: ', apiError);
    }

    const errorMessage = <LocalizedText localeKey="screens.admin.activity_feed.api_error" />;

    return this.showToast(errorMessage, types.ERROR);
  }

  renderSuccess() {
    const { successMessage } = this.props;

    if (!successMessage) {
      return null;
    }

    return this.showToast(successMessage, types.SUCCESS);
  }

  render() {
    const { isMobile } = this.props;

    const headerClassnames = classNames('header', { 'mobile': isMobile });

    const resultsClassnames = classNames('catalog-results', {
      'mobile': isMobile
    });

    return (
      <div>
        <div className="toast-notifications">
          {this.renderError()}
          {this.renderSuccess()}
        </div>
        <div className={headerClassnames}>
          <Tabs />
        </div>
        <div className="results-and-filters">
          <div className={resultsClassnames}>
            <Topbar />
            <Table />
            <Footer />
          </div>
          <FilterPanel />
          <RestoreModal />
        </div>
        <FeedbackPanel {...window.serverConfig} buttonPosition="bottom" />
      </div>
    );
  }
}

App.propTypes = {
  isMobile: PropTypes.bool.isRequired,
  apiError: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
    PropTypes.bool
  ]),
  successMessage: PropTypes.string
};

const mapStateToProps = (state) => ({
  isMobile: state.windowDimensions.isMobile,
  apiError: state.common.apiError,
  successMessage: state.common.successMessage
});

export default connect(mapStateToProps)(App);
