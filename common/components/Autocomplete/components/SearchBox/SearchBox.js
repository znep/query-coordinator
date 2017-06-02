import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';
import { SocrataIcon } from 'common/components/SocrataIcon';
import _ from 'lodash';
import { getSearchUrl } from '../../Util';
import { queryChanged, resultsChanged, resultVisibilityChanged } from '../../actions';
import styles from './search-box.scss';

class SearchBox extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.getIconStyleName = this.getIconStyleName.bind(this);
    this.getInputStyleName = this.getInputStyleName.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    // focused starts out undefined to prevent an animation on page load
    this.state = {
      focused: undefined,

      // debounce getting results so it doesn't happen with EVERY keypress
      debouncedGetResults: _.debounce(
        props.getSearchResults,
        props.millisecondsBeforeSearch
      )
    };
  }

  componentDidMount() {
    this.domNode.addEventListener('keydown', this.handleKeyDown);

    // if we're collapsible, this component gets mounted when it expands
    if (this.props.collapsible) {
      this.domNode.focus();
    }
  }

  componentWillUnmount() {
    this.domNode.removeEventListener('keydown', this.handleKeyDown);
  }

  getIconStyleName() {
    const { collapsible, animate, mobile } = this.props;
    const { focused } = this.state;

    if (animate === false) {
      if (mobile === true) {
        return 'icon-container-static-mobile';
      } else {
        return 'icon-container-static';
      }
    } else if (_.isUndefined(focused)) {
      return 'icon-container-base';
    } else if (collapsible) {
      return 'icon-container-collapsible';
    } else if (focused === true) {
      return 'icon-container-focused';
    } else {
      return 'icon-container-unfocused';
    }
  }

  getInputStyleName() {
    const { collapsible, animate, mobile } = this.props;
    const { focused } = this.state;

    if (animate === false) {
      if (mobile === true) {
        return 'search-box-static-mobile';
      } else {
        return 'search-box-static';
      }
    } else if (_.isUndefined(focused)) {
      return 'search-box-base';
    } else if (collapsible) {
      return 'search-box-collapsible';
    } else if (focused === true) {
      return 'search-box-focused';
    } else {
      return 'search-box-unfocused';
    }
  }

  handleKeyDown(event) {
    // Show results on ArrowDown
    if (event.keyCode === 40) {
      if (this.state.focused) {
        this.props.onResultVisibilityChanged(true);
      }

      event.preventDefault();
    }
  }

  handleFormSubmit(event) {
    const { focusedResult, currentQuery } = this.props;

    event.preventDefault();

    // goto the search URL if we DON'T have a focused result
    if (_.isUndefined(focusedResult)) {
      window.location.href = getSearchUrl(currentQuery);
    }
  }

  handleChange(event) {
    const query = event.target.value;

    // update state to reflect new textbox
    this.props.onSearchBoxChanged(query);

    // call the debounce'd getResults function
    this.state.debouncedGetResults(query, this.props.onResultsReceived);
  }

  handleFocusChanged(focused) {
    const { currentQuery, onResultsReceived, getSearchResults } = this.props;

    // keep "focused" state if the current search isn't empty...
    if (!_.isEmpty(currentQuery)) {
      this.setState({ focused: true });

      // also get results if we're gaining focus and have a query
      if (focused === true) {
        getSearchResults(currentQuery, onResultsReceived);
      }
    } else {
      this.setState({ focused });
    }
  }

  render() {
    const { collapsible, currentQuery } = this.props;

    return (
      <form
        styleName={collapsible ? 'form-collapsible' : 'form'}
        onSubmit={this.handleFormSubmit}>
        <div
          styleName={this.getIconStyleName()}
          onClick={() => { this.domNode.focus(); }}>
          <SocrataIcon name="search" />
        </div>
        <label htmlFor="autocomplete-search-input" styleName="aria-not-displayed">Search:</label>
        <input
          type="search"
          ref={(domNode) => { this.domNode = domNode; }}
          styleName={this.getInputStyleName()}
          onChange={this.handleChange}
          onFocus={() => { this.handleFocusChanged(true); }}
          onBlur={() => { this.handleFocusChanged(false); }}
          value={currentQuery}
          placeholder="Search"
          id="autocomplete-search-input" />
      </form>
    );
  }
}

SearchBox.propTypes = {
  /* Redux actions */
  onSearchBoxChanged: PropTypes.func.isRequired,
  onResultsReceived: PropTypes.func.isRequired,
  onResultVisibilityChanged: PropTypes.func.isRequired,

  /* Search config*/
  millisecondsBeforeSearch: PropTypes.number.isRequired,
  getSearchResults: PropTypes.func.isRequired,

  /* State */
  currentQuery: PropTypes.string,
  collapsible: PropTypes.bool,
  animate: PropTypes.bool,
  mobile: PropTypes.bool,

  // need to know this since if it's undefined, it means on form submission and
  // we search for what's in the textbox instead of for the selected result
  focusedResult: PropTypes.number
};

const mapStateToProps = (state) => ({
  currentQuery: _.isUndefined(state.query) ? '' : state.query,
  focusedResult: state.focusedResult
});

const mapDispatchToProps = (dispatch) => ({
  onSearchBoxChanged: (text) => { dispatch(queryChanged(text)); },
  onResultsReceived: (response) => { dispatch(resultsChanged(response)); },
  onResultVisibilityChanged: (visible) => { dispatch(resultVisibilityChanged(visible)); }
});

export default connect(mapStateToProps, mapDispatchToProps)(cssModules(SearchBox, styles));
