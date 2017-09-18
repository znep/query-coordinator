import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import Header from './components/header';
import ResultsAndFilters from './components/results_and_filters';
import WindowDimensions from './components/window_dimensions';

export class App extends React.Component {
  render() {
    const { page } = this.props;

    return (
      <div>
        <Header page={page} />
        <ResultsAndFilters page={page} />
        <WindowDimensions />
      </div>
    );
  }
}

App.propTypes = {
  page: PropTypes.string
};

export default connect(state => state)(App);
