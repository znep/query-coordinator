import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import cssModules from 'react-css-modules';
import { DOWN, UP, ENTER } from 'socrata-components/common/keycodes';
import { getSearchUrl } from '../../Util';
import { resultFocusChanged, resultVisibilityChanged } from '../../actions';
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
      onResultFocusChanged
    } = this.props;


    // return if results aren't even visible...
    if (!visible) {
      return;
    }

    const hasFocusedResult = !_.isUndefined(focusedResult);

    // ArrowDown scrolls down
    if (event.keyCode === DOWN) {
      // either focus on the first result, or increment the focused result
      onResultFocusChanged(!hasFocusedResult ? 0 : focusedResult + 1);
      event.preventDefault();
    }

    // ArrowUp scrolls up
    if (event.keyCode === UP && hasFocusedResult) {
      // decrement the focused result; reducer handles making sure it doesn't go past the list
      onResultFocusChanged(focusedResult - 1);
      event.preventDefault();
    }

    // Enter searches for selected result or what's in the input
    if (event.keyCode === ENTER && hasFocusedResult) {
      if (_.isEmpty(results)) {
        return;
      }

      // goto search if we have a result
      const result = results[focusedResult];
      if (!_.isUndefined(result)) {
        window.location.href = getSearchUrl(result.title);
      }
    }
  }

  renderResults() {
    const { results, focusedResult } = this.props;

    return results.map((result, index) =>
      <Result
        key={result.title}
        name={result.title}
        displayTitle={result.display_title}
        index={index}
        focused={index === focusedResult} />
    );
  }

  render() {
    const { visible, results, collapsible } = this.props;

    if (!visible || results.length === 0) {
      return null;
    }

    return (
      <div
        styleName={collapsible ? 'results-container-collapsible' : 'results-container'} >
        {this.renderResults()}
      </div>
    );
  }
}

Results.propTypes = {
  onResultVisibilityChanged: PropTypes.func.isRequired,
  onResultFocusChanged: PropTypes.func.isRequired,
  results: PropTypes.array,
  visible: PropTypes.bool,
  focusedResult: PropTypes.number,
  collapsible: PropTypes.bool
};

Results.defaultProps = {
  results: []
};

const mapStateToProps = (state) => ({
  results: _.isEmpty(state.searchResults) ? [] : state.searchResults.results,
  visible: state.resultsVisible,
  focusedResult: state.focusedResult
});

const mapDispatchToProps = (dispatch) => ({
  onResultFocusChanged: (newFocus) => { dispatch(resultFocusChanged(newFocus)); },
  onResultVisibilityChanged: (visible) => { dispatch(resultVisibilityChanged(visible)); }
});

export default connect(mapStateToProps, mapDispatchToProps)(cssModules(Results, styles));

/** For testing purposes */
export const ResultsClass = cssModules(Results, styles);
