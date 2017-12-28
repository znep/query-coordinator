import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import LocalizedText from 'common/i18n/components/LocalizedText';
import FeedbackPanel from '../../common/components/FeedbackPanel';
import Table from './Table';
import Footer from './Footer';
import Tabs from './Tabs';
import Topbar from './Topbar';
import FilterPanel from './FilterPanel';
import RestoreModal from './RestoreModal';

export class App extends Component {
  renderError() {
    const { apiError } = this.props;

    if (apiError) {
      if (_.isString(apiError) || _.isObject(apiError)) {
        console.error('activityLog:renderError: ', apiError);
      }

      return (
        <div className="alert error">
          <LocalizedText localeKey="screens.admin.activity_feed.api_error" />
        </div>
      );
    }
  }

  renderSuccess() {
    const { successMessage } = this.props;

    if (!successMessage) {
      return null;
    }

    return (
      <div className="alert success">
        <span>
          {successMessage}
        </span>
      </div>
    );
  }

  render() {
    const { isMobile } = this.props;

    const headerClassnames = classNames('header', { 'mobile': isMobile });

    const resultsClassnames = classNames('catalog-results', {
      'mobile': isMobile
    });

    return (
      <div>
        <div className={headerClassnames}>
          <Tabs />
        </div>
        <div className="results-and-filters">
          <div className={resultsClassnames}>
            <Topbar />
            {this.renderError()}
            {this.renderSuccess()}
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
