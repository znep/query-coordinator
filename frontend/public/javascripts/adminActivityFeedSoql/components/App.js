import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import LocalizedText from 'common/i18n/components/LocalizedText';
import FeedbackPanel from 'common/components/FeedbackPanel';
import Table from './Table';
import Footer from './Footer';
import Tabs from './Tabs';
import Topbar from './Topbar';
import FilterPanel from './FilterPanel';

export class App extends Component {
  renderError() {
    const { fetchTableError } = this.props;

    if (fetchTableError) {
      if (_.isString(fetchTableError) || _.isObject(fetchTableError)) {
        console.error('activityLog:renderError: ', fetchTableError);
      }

      return (
        <div className="alert error">
          <LocalizedText localeKey="screens.admin.activity_feed.table_fetch_error" />
        </div>
      );
    }
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
            <Table />
            <Footer />
          </div>
          <FilterPanel />
        </div>
        <FeedbackPanel {...window.serverConfig} />
      </div>
    );
  }
}

App.propTypes = {
  isMobile: PropTypes.bool.isRequired,
  fetchTableError: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
    PropTypes.bool
  ])
};

const mapStateToProps = (state) => ({
  isMobile: state.windowDimensions.isMobile,
  fetchingTable: state.table.fetchingTable,
  fetchTableError: state.table.fetchTableError
});

export default connect(mapStateToProps)(App);
