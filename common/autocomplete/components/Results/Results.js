import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import cssModules from 'react-css-modules';
import { resultFocusChanged, resultVisibilityChanged, queryChanged } from '../../actions';
import Result from './Result';
import styles from './results.scss';

class Results extends React.Component {
  constructor(props) {
    super(props);

    this.renderResults = this.renderResults.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown(event) {
    const {
      visible,
      focusedResult,
      results,
      onResultFocusChanged,
      onChooseResult,
      onQueryChanged,
      onResultsVisibilityChanged
    } = this.props;


    // return if results aren't even visible...
    if (!visible) {
      return;
    }

    const hasFocusedResult = !_.isUndefined(focusedResult);

    // ArrowDown scrolls down
    if (event.keyCode === 40) {
      // either focus on the first result, or increment the focused result
      onResultFocusChanged(!hasFocusedResult ? 0 : focusedResult + 1);
      event.preventDefault();
    }

    // ArrowUp scrolls up
    if (event.keyCode === 38 && hasFocusedResult) {
      // decrement the focused result; reducer handles making sure it doesn't go past the list
      onResultFocusChanged(focusedResult - 1);
      event.preventDefault();
    }

    // Enter searches for selected result
    if (event.keyCode === 13 && hasFocusedResult) {
      if (_.isEmpty(results)) {
        return;
      }

      // goto search if we have a result
      const result = results[focusedResult];
      if (!_.isUndefined(result)) {
        // set the textbox to be what was clicked and close the results
        onQueryChanged(result.title);
        onResultsVisibilityChanged(false);
        onChooseResult(result.title);
      }
    }
  }

  renderResults() {
    const { results, focusedResult, onChooseResult } = this.props;

    return results.map((result, index) =>
      <Result
        key={result.title}
        matchOffsets={result.match_offsets}
        name={result.title}
        index={index}
        focused={index === focusedResult}
        onChooseResult={onChooseResult} />
    );
  }

  render() {
    const { visible, results, collapsible } = this.props;

    if (!visible || results.length === 0) {
      return null;
    }

    return (
      <div
        className="autocomplete-results-container"
        styleName={collapsible ? 'results-container-collapsible' : 'results-container'} >
        {this.renderResults()}
      </div>
    );
  }
}

Results.propTypes = {
  onResultsVisibilityChanged: PropTypes.func.isRequired,
  onResultFocusChanged: PropTypes.func.isRequired,
  onQueryChanged: PropTypes.func.isRequired,
  results: PropTypes.array,
  visible: PropTypes.bool,
  focusedResult: PropTypes.number,
  collapsible: PropTypes.bool
};

Results.defaultProps = {
  results: []
};

const mapStateToProps = (state) => {
  const { focusedResult, resultsVisible, searchResults } = state.autocomplete;

  return {
    results: _.isEmpty(searchResults) ? [] : searchResults.results,
    visible: resultsVisible,
    focusedResult: focusedResult
  };
};

const mapDispatchToProps = (dispatch) => ({
  onResultFocusChanged: (newFocus) => { dispatch(resultFocusChanged(newFocus)); },
  onResultsVisibilityChanged: (visible) => { dispatch(resultVisibilityChanged(visible)); },
  onQueryChanged: (query) => { dispatch(queryChanged(query)); }
});

export default connect(mapStateToProps, mapDispatchToProps)(cssModules(Results, styles));

/** For testing purposes */
export const ResultsClass = cssModules(Results, styles);
