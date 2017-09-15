import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';
import classNames from 'classnames';
import _ from 'lodash';

import { SocrataIcon } from 'common/components/SocrataIcon';
import connectLocalization from 'common/i18n/components/connectLocalization';

import { getSearchUrl } from '../../Util';
import { queryChanged, resultsChanged, resultVisibilityChanged } from '../../actions';
import styles from './search-box.scss';

class SearchBox extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this,
      'getIconStyleName',
      'getInputStyleName',
      'handleChange',
      'handleFormSubmit',
      'handleKeyDown'
    );

    // focused starts out undefined to prevent an animation on page load
    this.state = {
      autocomplete: {
        focused: undefined
      }
    };

    // debounce getting results so it doesn't happen with EVERY keypress
    this.debouncedGetResults = _.debounce(this.props.getSearchResults, this.props.millisecondsBeforeSearch);
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
    const { focusedResult, onChooseResult, query } = this.props;

    event.preventDefault();

    // goto the search URL if we DON'T have a focused result
    if (_.isUndefined(focusedResult)) {
      onChooseResult(query);

      // Collapse any search results that might be there.
      this.domNode.blur();
      this.setState({ focused: false });
    }
  }

  handleChange(event) {
    const { onClearSearch, onSearchBoxChanged, onResultsReceived, anonymous } = this.props;
    const query = event.target.value;

    if (query.length <= 0) {
      onSearchBoxChanged('');
      onClearSearch();
    } else {
      onSearchBoxChanged(query);
    }

    // update state to reflect new textbox
    onSearchBoxChanged(query);

    // call the debounce'd getResults function
    this.debouncedGetResults(query, onResultsReceived, undefined, anonymous);
  }

  handleFocusChanged(focused) {
    const { onResultsReceived, getSearchResults, anonymous, query } = this.props;
    const originalQuery = query || '';

    if (originalQuery !== this.props.query) {
      this.props.onSearchBoxChanged(originalQuery);
    }

    // keep "focused" state if the current search isn't empty...
    if (!_.isEmpty(query)) {
      this.setState({ focused: true });

      // also get results if we're gaining focus and have a query
      if (focused === true) {
        getSearchResults(query, onResultsReceived, undefined, anonymous);
      }
    } else {
      onResultsReceived({ results: [] });
      this.setState({ focused });
    }
  }

  render() {
    const { collapsible, query, adminHeaderClasses } = this.props;
    const { I18n } = this.props;
    const autocompleteSearchInputId = `autocomplete-search-input-${_.random(32768)}`

    return (
      <form
        styleName={collapsible ? 'form-collapsible' : 'form'}
        onSubmit={this.handleFormSubmit}>
        <div
          styleName={classNames(this.getIconStyleName(), adminHeaderClasses)}
          onClick={() => this.domNode.focus()}>
          <SocrataIcon name="search" />
        </div>
        <label htmlFor={autocompleteSearchInputId} styleName="aria-not-displayed">
          {I18n.t('shared.site_chrome.header.search')}
        </label>
        <input
          autoComplete="off"
          className="autocomplete-input"
          id={autocompleteSearchInputId}
          onBlur={() => this.handleFocusChanged(false)}
          onChange={this.handleChange}
          onFocus={() => this.handleFocusChanged(true)}
          placeholder={I18n.t('shared.site_chrome.header.search')}
          ref={(domNode) => this.domNode = domNode}
          styleName={classNames(this.getInputStyleName(), adminHeaderClasses)}
          type="search"
          value={query || ''} />
      </form>
    );
  }
}

SearchBox.propTypes = {
  /* Redux actions */
  onClearSearch: PropTypes.func,
  onSearchBoxChanged: PropTypes.func.isRequired,
  onResultsReceived: PropTypes.func.isRequired,
  onResultVisibilityChanged: PropTypes.func.isRequired,

  /* Search config*/
  millisecondsBeforeSearch: PropTypes.number.isRequired,
  getSearchResults: PropTypes.func.isRequired,
  onChooseResult: PropTypes.func.isRequired,
  anonymous: PropTypes.bool,

  /* State */
  collapsible: PropTypes.bool,
  animate: PropTypes.bool,
  mobile: PropTypes.bool,
  adminHeaderClasses: PropTypes.array,

  // need to know this since if it's undefined, it means on form submission and
  // we search for what's in the textbox instead of for the selected result
  focusedResult: PropTypes.number,
};

SearchBox.defaultProps = {
  onClearSearch: _.noop
};

const mapStateToProps = (state) => ({
  focusedResult: state.autocomplete.focusedResult,
  query: state.autocomplete.query
});

const mapDispatchToProps = (dispatch) => ({
  onSearchBoxChanged: (text) => dispatch(queryChanged(text)),
  onResultsReceived: (response) => dispatch(resultsChanged(response)),
  onResultVisibilityChanged: (visible) => dispatch(resultVisibilityChanged(visible))
});

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(cssModules(SearchBox, styles, { allowMultiple: true })));
