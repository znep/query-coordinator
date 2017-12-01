import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import Table from './Table';
import Footer from './Footer';
import Tabs from './Tabs';
import Topbar from './Topbar';
import FilterPanel from './FilterPanel';

export class App extends Component {

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
            <Table />
            <Footer />
          </div>
          <FilterPanel />
        </div>
      </div>
    );
  }
}

App.propTypes = {
  isMobile: PropTypes.bool.isRequired
};

const mapStateToProps = (state) => ({
  isMobile: state.windowDimensions.isMobile
});

export default connect(mapStateToProps)(App);
