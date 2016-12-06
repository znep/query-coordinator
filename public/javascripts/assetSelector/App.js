import React from 'react';
import { connect } from 'react-redux';
import ResultsContainer from './components/ResultsContainer';

export const App = React.createClass({
  resultsContainer(results) {
    return (
      <div>
        <ResultsContainer results={results} />
      </div>
    );
  },

  render() {
    return this.resultsContainer(window.assetSelectorContent.results);
  }
});

function mapStateToProps(state) {
  return state;
}

export default connect(mapStateToProps)(App);
